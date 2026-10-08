# iTech Broadcast Events

Event platform for the **iTech Broadcast** club at PSG Institute of Technology and Applied Research: events (solo
or team), registrations with a waiting list, QR attendance, activity points (per the institute's Activity Point
circular), notifications, feedback, analytics, exportable records, and a permanent history log.

Two roles only, one login form:
- **Students** create an account (name, email, register number, password) or sign back in with email + password.
- **Club coordinator** signs in on the **same form**. Entering the coordinator's configured username and password
  opens the admin portal instead of the student pages — there's no separate admin URL to remember or leak. The
  credentials are set via `ADMIN_USERNAME` / `ADMIN_PASSWORD` (see `.env.example`), never written in this file.

- **Backend:** Java 17, Spring Boot 3.3, Spring Security + JWT, Spring Data JPA (Hibernate), MySQL (H2 for local dev),
  ZXing (QR), Swagger/OpenAPI, JavaMail
- **Frontend:** React 18 + Vite, Framer Motion, Recharts, html5-qrcode, qrcode.react, SheetJS (xlsx exports)

## Run it locally (no database setup)

```bash
# terminal 1: API on :8080 (dev profile = file-based H2, survives restarts)
cd backend
mvn spring-boot:run

# terminal 2: web app on :5173 (proxies /api to :8080)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

- **Create a student account** from the Sign in page → "Create an account" (name, email, register number, password).
- **Coordinator:** on the same Sign in page, sign in with whatever `ADMIN_USERNAME` / `ADMIN_PASSWORD` you've set
  (see `.env.example` for the local-dev defaults, and change them before you deploy for real).

Swagger UI: http://localhost:8080/swagger-ui.html

## Configuration (`.env`, see `.env.example`)

| Variable | What it does |
|---|---|
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | The credentials that open the coordinator portal from the normal login form. Change the password before going live — the app updates the stored (BCrypt-hashed) credential automatically on the next restart when this changes. |
| `ALLOWED_EMAIL_DOMAIN` | Restricts student sign-ups to one email domain, e.g. your college's. Blank = any email. |
| `JWT_SECRET` | Signs session tokens. Use a long random string. |

## Run with Docker (MySQL + API + web)

```bash
cp .env.example .env          # edit passwords, JWT_SECRET, ADMIN_USERNAME/PASSWORD
docker compose up --build
```

Web app: http://localhost:3000

## Logos and the front page

- `frontend/public/college-logo.png` — PSG iTech logo (header of the hero and the footer).
- `frontend/public/broadcast-logo.png` — iTech Broadcast club logo (navbar, footer, auth pages).
- `frontend/public/activity-point-circular.pdf` — the institute's Activity Point circular, linked from the footer and
  the student Activity points page.
- The three tickets on the landing page are fixed placeholders — **Weekly Event**, **Pongal Event**, **Onam Event**
  — with the date shown as `xxxx`. They're purely decorative; the "Coming up" section below them shows real
  published events.
- Footer credit: *Developed by VASEEM and Broadcast Team*.

To swap a logo, replace the PNG file at the same path and rebuild/redeploy the frontend.

## Team events

Each event is set to **Individual** or **Team** when it's created (`EventForm`, or `teamEvent` in the API). A team
event also sets a **maximum team size** — the roster form won't let a student add more members than that.

- **Individual event:** registering only asks for a mobile number.
- **Team event:** registering asks for a **team name**, a **mobile number**, and a **roster** — each member's name
  and year of study, up to the coordinator's set limit ("Add member" is disabled once the cap is reached).

Both are stored on the registration (`mobileNumber`, `teamName`, `teamMembers`) and show up in the coordinator's
People tab (with a "N members ▾" expander for the full roster), the exported spreadsheets, and on the student's
own ticket.

## What is where

| Feature | Backend | Frontend |
|---|---|---|
| Sign up / unified sign-in | `AuthService.register` / `.login`, `AdminBootstrap` | `Register`, `Login` |
| First-time profile (department / year) | `AuthService.updateProfile` | `Welcome` |
| Create/edit/cancel events, posters, team-vs-individual | `EventService`, `FileStorageService` | `EventForm`, `AdminDashboard`, `Events`, `EventDetail` |
| Register (with team roster / mobile number) / cancel / waiting list | `RegistrationService` | `EventDetail`, `RegisterModal`, `MyTickets` |
| QR attendance (time window, duplicate checks) | `AttendanceService`, `QrService` | `QRScanner`, `ManageEvent` (Check-in) |
| **Activity points** (circular rules, auto + manual awards, 20/semester target) | `ActivityPointService`, `model/ActivityType.java` | `Points` (student), `ManageEvent` (Points tab), `Records` (Points tab) |
| Feedback and ratings | `FeedbackService` | `EventDetail`, `ManageEvent` (Feedback) |
| Analytics dashboard | `AnalyticsService` | `Analytics` |
| **Records + history + spreadsheet export** | `AdminController`, `AuditService` | `Records` (uses `lib/exportSheets.js`, SheetJS) |
| Notifications, reminders | `NotificationService`, `MailService`, `ScheduledJobs` | Navbar bell, `Notifications` |

## Records, history and exports

- **Records** (coordinator only, `/admin/records`): every registration ever made (cancelled ones included, with
  mobile number / team name / roster), every student account (with a **Joined** date so you can see who created an
  account and when), the semester activity-points report, and the full history log — each searchable, with a
  **Download full workbook** button that exports everything as a multi-sheet `.xlsx`.
- Every meaningful action (registering, cancelling, marking attendance, awarding points, creating/editing/cancelling
  an event, coordinator sign-ins, deletions) is written to a permanent `audit_log` table — the log itself is
  never deleted from.
- The database (H2 file in dev, MySQL in the Docker setup) is the source of truth; the spreadsheet is a point-in-time
  export, not the storage.

### Deleting records

Two levels are available to the coordinator:

- **Deactivate** a student (the checkbox in Records → Students, or on a per-event registrant) keeps their history but
  blocks sign-in. This is the routine option and what "cancel" does for a single registration.
- **Delete** (the trash icon, in Records → Registrations/Students and in an event's People tab) permanently removes
  the row from the database:
  - Deleting a **registration** also removes its attendance record and frees the seat for the waiting list.
  - Deleting a **student account** cascades to all of that student's registrations, attendance, activity points,
    feedback and notifications, then removes the account itself.
  Both ask for confirmation and cannot be undone, though the deletion itself is recorded in the history log.

## Activity points

Implements the institute's Activity Point circular (20 points/semester per UG student): attending, volunteering,
coordinating, organising, delivering a talk, presenting a paper, prize winner, office bearer and club membership,
each with the circular's point value and per-event/per-semester limits (see `model/ActivityType.java`). Attendance
points are added automatically the moment a student is checked in at an event; the rest are awarded by the
coordinator from the event's **Points** tab or from **Records → Activity points**. Students track their own progress
on `/points`, which links to the circular PDF. (Certificates are generated separately by the college and are not
part of this app.)

## Security notes

- Passwords are hashed with BCrypt; the coordinator credential is never sent to the browser.
- The login endpoint is rate-limited: 5 wrong attempts from the same client locks it out for 15 minutes.
- A failed login gives the same generic error regardless of whether the username exists, so the login form can't be
  used to discover which accounts (including the coordinator's) are registered.

## Tests

```bash
cd backend && mvn test
```

## Deploying for free (Vercel + Render + Neon/Supabase)

This puts the frontend on **Vercel**, the backend on **Render**'s free web service, and the database on a free,
permanently-free Postgres provider (**Neon** or **Supabase** - either works identically here). None of these need a
credit card for this setup. The trade-off: Render's free tier sleeps after 15 minutes of no traffic and takes
30-60 seconds to wake up on the next visit - fine for a college club site, not for something needing an instant
response at all hours.

### 0. Put the code on GitHub

If it isn't already:

```bash
cd itech-broadcast-events        # the folder from this zip
git init
git add .
git commit -m "Initial commit"
```

Create a new empty repository on [github.com](https://github.com/new) (don't add a README there), then:

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

### 1. Create the free database (Neon)

1. Sign up at [neon.tech](https://neon.tech) (or [supabase.com](https://supabase.com) - steps are equivalent) with
   GitHub or Google.
2. Create a new project. It gives you a connection string that looks like:
   ```
   postgres://alex:AbC123xyz@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Turn that into the three values the backend needs:
   - `DB_URL` = `jdbc:postgresql://ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require`
     (same host/database/`sslmode=require`, just with `jdbc:` in front and `postgresql` instead of `postgres`)
   - `DB_USERNAME` = `alex`
   - `DB_PASSWORD` = `AbC123xyz`
   Keep this tab open - you'll paste these into Render next.

### 2. Deploy the backend (Render)

1. Sign up at [render.com](https://render.com) with GitHub.
2. **New +** → **Blueprint** → pick your repository. Render reads `render.yaml` at the repo root automatically and
   proposes one web service, `itech-broadcast-api`.
3. It will prompt you to fill in the secret values (everything marked `sync: false`):
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` - from step 1
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` - choose a real coordinator username and password (don't reuse anything
     from `.env.example` or any example in this README)
   - `APP_PUBLIC_URL` and `CORS_ALLOWED_ORIGINS` - put in a placeholder for now (e.g. `https://placeholder.vercel.app`);
     you'll come back and fix this in step 4 once you know your real Vercel URL
   - `JWT_SECRET` is generated for you automatically
4. Click **Apply**. First deploy takes a few minutes. When it's done, note the service's URL, something like
   `https://itech-broadcast-api.onrender.com`.
5. Check it's alive: open `https://itech-broadcast-api.onrender.com/actuator/health` - it should show `{"status":"UP"}`.

### 3. Deploy the frontend (Vercel)

1. Sign up at [vercel.com](https://vercel.com) with GitHub.
2. **Add New** → **Project** → pick your repository.
3. Under **Root Directory**, click **Edit** and choose `frontend` (this repo holds both frontend and backend, so
   Vercel needs to be told which folder is the site).
4. Vercel auto-detects Vite; leave the build settings as they are.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://itech-broadcast-api.onrender.com/api` (your Render URL from step 2, plus `/api`)
6. Click **Deploy**. You'll get a URL like `https://itech-broadcast-events.vercel.app`.

### 4. Connect the two (fix CORS)

Go back to Render → your service → **Environment**, and update:
- `APP_PUBLIC_URL` = `https://itech-broadcast-events.vercel.app` (your real Vercel URL)
- `CORS_ALLOWED_ORIGINS` = the same URL

Save - Render redeploys automatically. Your site is now live at the Vercel URL, reachable from anywhere, with no
laptop involved. Sign in as the coordinator with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set in step 2.

### Updating the live site later

Every `git push` to `main` automatically redeploys both Vercel and Render - no manual steps.

### Two honest limitations of this free setup

- **Cold starts:** the backend sleeps after 15 minutes idle. The first visit after that takes up to a minute to
  respond while it wakes up; after that it's normal speed until it sleeps again.
- **Uploaded posters aren't permanent:** event posters uploaded via "New event" are saved to the backend's local
  disk, which Render's free tier doesn't persist across restarts/redeploys - an uploaded poster can disappear later.
  This doesn't break anything (events without a poster already get generated artwork automatically), but don't rely
  on a custom uploaded image staying forever unless you add a paid disk or switch storage to something like
  Cloudinary. Everything else (accounts, registrations, points, history) lives in the Postgres database and is
  unaffected by this.

## Ideas for next steps

- SMS/WhatsApp reminders, refresh tokens, Flyway migrations.
- A password-reset flow (currently the coordinator would reset a student's account by hand if needed).
