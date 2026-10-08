import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, User as UserIcon, Users, Ticket, Settings2, Hourglass, CheckCircle2, Star, MessageCircle } from 'lucide-react';
import EventArt from '../components/EventArt';
import RegisterModal from '../components/RegisterModal';
import { Button, CategoryBadge, Confetti, ConfirmModal, ErrorState, Skeleton, StatusBadge, Stars } from '../components/ui';
import { api, errMsg } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { useAsync, useDocTitle } from '../lib/hooks';
import { fmtLong, fmtTime, fmtStamp, seatsLeft, isPast } from '../lib/format';

function Meta({ icon: Icon, label, children }) {
  return (
    <div className="meta"><span className="ico"><Icon size={19} /></span><div><small>{label}</small><b>{children}</b></div></div>
  );
}

function FeedbackBox({ event, onSaved }) {
  const toast = useToast();
  const { data: mine } = useAsync(() => api.get(`/events/${event.id}/feedback/mine`).then((r) => r.data || null), [event.id]);
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (mine) { setRating(mine.rating); setComments(mine.comments || ''); } }, [mine]);

  const save = async () => {
    if (!rating) return toast('Pick a star rating first', 'error');
    setBusy(true);
    try { await api.post(`/events/${event.id}/feedback`, { rating, comments }); toast('Thanks for the feedback'); onSaved(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="panel stack">
      <h3>How was it?</h3>
      <Stars value={rating} onChange={setRating} />
      <textarea className="textarea" placeholder="What worked, what didn't? (optional)" value={comments} onChange={(e) => setComments(e.target.value)} maxLength={2000} />
      <Button onClick={save} loading={busy}>{mine ? 'Update feedback' : 'Send feedback'}</Button>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const { data: ev, loading, error, reload } = useAsync(() => api.get(`/events/${id}`).then((r) => r.data), [id]);
  const isStudent = user?.role === 'STUDENT';
  const { data: regs, reload: reloadRegs } = useAsync(
    () => (isStudent ? api.get('/students/my-registrations').then((r) => r.data) : Promise.resolve([])), [isStudent, id]);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [boom, setBoom] = useState(false);
  useDocTitle(ev?.title);

  const mine = regs?.find((r) => String(r.event.id) === String(id));
  const refresh = () => { reload(); reloadRegs(); };

  const openRegister = () => {
    if (!user) return nav('/login', { state: { from: `/events/${id}` } });
    setRegisterOpen(true);
  };

  const register = async (payload) => {
    setBusy(true);
    try {
      const { data } = await api.post(`/events/${id}/register`, payload);
      setRegisterOpen(false);
      if (data.status === 'CONFIRMED') { setBoom(true); setTimeout(() => setBoom(false), 1800); toast("You're in! Your QR ticket is ready."); }
      else toast(`You're on the waiting list (#${data.waitlistPosition})`);
      refresh();
    } catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };

  const cancel = async () => {
    setBusy(true);
    try { await api.delete(`/registrations/${mine.id}`); toast('Registration cancelled'); setConfirmCancel(false); refresh(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };

  if (loading && !ev) return <div className="container page stack"><Skeleton h={320} r={28} /><Skeleton h={200} r={20} /></div>;
  if (error) return <div className="container page"><ErrorState message={error} onRetry={reload} /></div>;

  const left = seatsLeft(ev);
  const pct = Math.round((ev.confirmedCount / ev.capacity) * 100);
  const deadlinePassed = new Date(ev.registrationDeadline) < new Date();
  const closed = ev.status !== 'PUBLISHED' || deadlinePassed || isPast(ev);
  const canManage = user?.role === 'ADMIN';

  return (
    <div className="container page">
      <Confetti show={boom} />
      <motion.div className="detail-hero" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <EventArt event={ev} />
        <div className="inner">
          <div className="row"><CategoryBadge category={ev.category} />{ev.status !== 'PUBLISHED' && <StatusBadge status={ev.status} />}{ev.teamEvent && <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>Team event · up to {ev.maxTeamSize} members</span>}{ev.pointsEligible && <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>+{ev.attendPoints} activity points</span>}</div>
          <h1>{ev.title}</h1>
        </div>
      </motion.div>

      <div className="detail-grid">
        <div className="stack" style={{ gap: 22 }}>
          <div className="panel stack">
            <div className="meta-grid">
              <Meta icon={CalendarDays} label="Date">{fmtLong(ev.eventDate)}</Meta>
              <Meta icon={Clock} label="Time">{fmtTime(ev.startTime)} to {fmtTime(ev.endTime)}</Meta>
              <Meta icon={MapPin} label="Venue">{ev.venue}</Meta>
              <Meta icon={UserIcon} label="Organised by">iTech Broadcast</Meta>
            </div>
            <hr className="divider" />
            <h3>About this event</h3>
            <p className="muted" style={{ whiteSpace: 'pre-line', maxWidth: '68ch' }}>{ev.description || 'The organisers have not added a description yet.'}</p>
            <p className="faint">Registration closes {fmtStamp(ev.registrationDeadline)}</p>
                      </div>
          {mine?.attended && <FeedbackBox event={ev} onSaved={reload} />}
          {ev.feedbackCount > 0 && (
            <div className="panel row"><Star size={22} color="var(--marigold)" fill="var(--marigold)" /><b style={{ fontSize: '1.2rem' }}>{ev.averageRating}</b><span className="muted">average from {ev.feedbackCount} rating{ev.feedbackCount > 1 ? 's' : ''}</span></div>
          )}
        </div>

        <aside className="sticky">
          <div className="panel stack">
            <div>
              <div className="row spread" style={{ marginBottom: 8 }}><b>{ev.confirmedCount} of {ev.capacity} seats taken</b><span className="faint">{left ? `${left} left` : 'Full'}</span></div>
              <div className={`big-meter ${pct > 80 ? 'hot' : ''}`}><motion.i initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} /></div>
              {ev.waitlistCount > 0 && <p className="faint" style={{ marginTop: 8 }}>{ev.waitlistCount} on the waiting list</p>}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={mine?.status || (closed ? 'closed' : 'open')} className="stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                {canManage ? (
                  <Link className="btn btn-primary btn-block" to={`/admin/events/${ev.id}`}><Settings2 size={18} />Manage this event</Link>
                ) : user && !isStudent ? (
                  <p className="muted">Organiser and admin accounts can't register for events.</p>
                ) : mine ? (
                  mine.status === 'CONFIRMED' ? (
                    <>
                      <div className="result-flash ok"><CheckCircle2 size={22} />{mine.attended ? 'You attended this event' : "You're registered"}</div>
                      {mine.teamName && <p className="faint">Team: <b>{mine.teamName}</b> · {mine.teamMembers.length} member{mine.teamMembers.length > 1 ? 's' : ''}</p>}
                      <Link className="btn btn-primary btn-block" to="/tickets"><Ticket size={18} />Open my QR ticket</Link>
                      {ev.whatsappLink && <a className="btn btn-accent btn-block" href={ev.whatsappLink} target="_blank" rel="noreferrer"><MessageCircle size={18} />Join the WhatsApp group</a>}
                      {!mine.attended && !closed && <Button variant="danger-ghost" block onClick={() => setConfirmCancel(true)}>Cancel registration</Button>}
                    </>
                  ) : (
                    <>
                      <div className="result-flash" style={{ background: 'var(--marigold-l)', color: '#8a5a00' }}><Hourglass size={22} />Waiting list, position #{mine.waitlistPosition}</div>
                      <p className="faint">We'll confirm your seat automatically if someone cancels.</p>
                      <Button variant="danger-ghost" block onClick={() => setConfirmCancel(true)}>Leave the waiting list</Button>
                    </>
                  )
                ) : closed ? (
                  <p className="muted">{ev.status === 'CANCELLED' ? 'This event was cancelled.' : 'Registration for this event is closed.'}</p>
                ) : (
                  <Button size="lg" block variant={left ? 'accent' : 'primary'} onClick={openRegister}>
                    {!user ? 'Sign in to register' : left ? 'Register now' : 'Join the waiting list'}
                  </Button>
                )}
              </motion.div>
            </AnimatePresence>
            <p className="faint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Users size={14} />One seat per student. You can cancel until the event starts.</p>
          </div>
        </aside>
      </div>

      <ConfirmModal open={confirmCancel} onClose={() => setConfirmCancel(false)} loading={busy} danger confirmLabel="Cancel registration"
        title="Cancel your registration?" text="Your seat goes to the next person on the waiting list. You can register again if seats are still open." onConfirm={cancel} />
      {registerOpen && <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} event={ev} onSubmit={register} busy={busy} />}
    </div>
  );
}
