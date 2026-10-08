import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, QrCode, ScanLine, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import EventCard from '../components/EventCard';
import EventArt from '../components/EventArt';
import { CardSkeletons } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useDocTitle } from '../lib/hooks';
import { CATEGORIES } from '../lib/format';

// The three tickets on the first page are placeholders on purpose: names fixed, dates hidden.
const HERO_TICKETS = [
  { id: 'w', title: 'Weekly Event', category: 'WEEKLY' },
  { id: 'p', title: 'Pongal Event', category: 'FESTIVAL' },
  { id: 'o', title: 'Onam Event', category: 'FESTIVAL' },
];

function HeroTicket({ ev, i, mx, my }) {
  const cat = CATEGORIES[ev.category];
  const rot = [-11, 2, 12][i];
  const x = [-92, 0, 92][i];
  const y = [30, -6, 46][i];
  const depth = [0.6, 1, 0.8][i];
  const px = useTransform(mx, (v) => v * 22 * depth);
  const py = useTransform(my, (v) => v * 16 * depth);
  return (
    <motion.div className="hero-ticket" style={{ x: px, y: py, zIndex: i === 1 ? 3 : 1 + i }}>
      <motion.div
        initial={{ opacity: 0, y: -420, rotate: rot - 40, x: x * 2 }}
        animate={{ opacity: 1, y, rotate: rot, x }}
        transition={{ type: 'spring', stiffness: 130, damping: 15, delay: 0.25 + i * 0.16 }}
        whileHover={{ y: y - 26, rotate: rot / 3, scale: 1.05, zIndex: 9 }}>
        <div className="ecard-wrap">
          <div className="ecard">
            <div className="ecard-art" style={{ aspectRatio: '16 / 9' }}>
              <EventArt event={ev} />
              <div className="ecard-date"><b>xx</b><small>xxxx</small></div>
            </div>
            <div className="ecard-body" style={{ paddingBottom: 8 }}>
              <span className="badge" style={{ width: 'fit-content', background: '#fff', boxShadow: `inset 0 0 0 1.5px ${cat.color}`, color: cat.dark }}>{cat.label}</span>
              <h3>{ev.title}</h3>
              <span className="faint">Date: xxxx</span>
            </div>
            <div className="ecard-stub hero-qr">
              <div><strong>Admit one</strong><div className="faint">iTech Broadcast</div></div>
              <div className="qr-frame" style={{ padding: 5 }}><QRCodeSVG value={`campusconnect-${ev.title}-${ev.id}`} size={56} /></div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Landing() {
  useDocTitle();
  const { user } = useAuth();
  const [events, setEvents] = useState(null);
  const mx = useSpring(useMotionValue(0), { stiffness: 90, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 90, damping: 18 });

  useEffect(() => { api.get('/events').then((r) => setEvents(r.data)).catch(() => setEvents([])); }, []);

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  
  return (
    <>
      <div className="container hero">
        <div>
          <motion.div className="row" style={{ gap: 12, marginBottom: 22 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <img src="/college-logo.png" alt="PSG iTech" height="46" style={{ width: 'auto' }} />
            <span className="divider-v" style={{ height: 34 }} />
            <span className="faint" style={{ maxWidth: 220, lineHeight: 1.3 }}>PSG Institute of Technology and Applied Research</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            iTech Broadcast events, <span className="hl">one ticket</span> away.
          </motion.h1>
          <motion.p className="hero-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            Register in a tap, walk in with a QR code, and watch your activity points add up without chasing anyone.
          </motion.p>
          <motion.div className="row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Link to="/events" className="btn btn-primary btn-lg">Browse events <ArrowRight size={18} /></Link>
            {user ? (
              <Link to={user.role === 'STUDENT' ? '/tickets' : '/admin'} className="btn btn-ghost btn-lg">{user.role === 'STUDENT' ? 'My tickets' : 'Manage events'}</Link>
            ) : (
              <Link to="/login" className="btn btn-ghost btn-lg">Sign in</Link>
            )}
          </motion.div>
        </div>
        <div className="hero-stage" onMouseMove={onMove} onMouseLeave={() => { mx.set(0); my.set(0); }}>
          {HERO_TICKETS.map((ev, i) => <HeroTicket key={ev.id} ev={ev} i={i} mx={mx} my={my} />)}
        </div>
      </div>

      <section className="container section" style={{ paddingTop: 20 }}>
        <div className="page-head">
          <div><h2>Coming up</h2><p>Events open for registration right now.</p></div>
          <Link to="/events" className="btn btn-ghost">See all events</Link>
        </div>
        {events === null ? <CardSkeletons n={3} /> : events.length === 0 ? (
          <div className="panel center"><h3>No events yet</h3><p className="muted" style={{ marginTop: 6 }}>The first iTech Broadcast event will show up here as soon as it's announced.</p></div>
        ) : (
          <div className="grid-events">{events.slice(0, 3).map((e) => <EventCard key={e.id} event={e} />)}</div>
        )}
      </section>

      <section className="container section">
        <h2 style={{ maxWidth: '18ch' }}>From sign-up to check-in</h2>
        <div className="steps">
          <svg className="steps-line" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
            <motion.line x1="0" y1="2" x2="100" y2="2" stroke="var(--marigold)" strokeWidth="4" strokeLinecap="round" strokeDasharray="1 6"
              initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 1.4, ease: 'easeOut' }} />
          </svg>
          {[
            [UserPlus, 'Register', 'Pick an event and take a seat. If it is full, join the waiting list and we move you up automatically.'],
            [QrCode, 'Get your ticket', 'A personal QR code appears in My tickets the moment your seat is confirmed.'],
            [ScanLine, 'Walk in', 'The club team scans your code at the entrance. No paper sheets.'],
            [Award, 'Collect activity points', 'Attending adds activity points automatically, logged against your register number.'],
          ].map(([Icon, title, text], i) => (
            <motion.div className="step" key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: i * 0.12 }}>
              <div className="step-dot"><Icon size={24} /></div>
              <h3>{title}</h3><p className="muted">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container section" style={{ paddingTop: 20 }}>
        <div className="band split" style={{ alignItems: 'center' }}>
          <div>
            <h2>20 activity points a semester, tracked for you.</h2>
            <p className="muted" style={{ marginTop: 14, maxWidth: '44ch' }}>Every UG student needs 20 points each semester. Attend, volunteer, coordinate or organise iTech Broadcast events and each one is logged against your roll number.</p>
            <Link to={user ? (user.role === 'STUDENT' ? '/points' : '/admin/records') : '/login'} className="btn btn-accent btn-lg" style={{ marginTop: 26 }}>{user?.role === 'STUDENT' ? 'See my points' : user ? 'Open records' : 'Sign in to start'}</Link>
          </div>
          <ul className="feature-list">
            {['Attending an event: 2 points (up to 3 events)', 'Student volunteer: 2 points (up to 3 events)', 'Coordinating an event: 3 points', 'Organising an event: 5 points', 'Prize winner in a contest: 5 points'].map((t) => (
              <li key={t}><CheckCircle2 size={20} style={{ color: '#5ee0c2' }} /><span>{t}</span></li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
