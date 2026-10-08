import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarDays, Clock, MapPin, RotateCw, Ticket, Hourglass, BadgeCheck } from 'lucide-react';
import { Button, ConfirmModal, Empty, ErrorState, Skeleton } from '../components/ui';
import { api, errMsg } from '../lib/api';
import { useToast } from '../lib/toast';
import { useAsync, useDocTitle } from '../lib/hooks';
import { CATEGORIES, fmtDay, fmtTime, isPast } from '../lib/format';

function TicketCard({ reg, onCancel }) {
  const [flipped, setFlipped] = useState(false);
  const ev = reg.event;
  const cat = CATEGORIES[ev.category];
  const waiting = reg.status === 'WAITLISTED';
  const past = isPast(ev);
  return (
    <div className="flip">
      <motion.div className="flip-inner" animate={{ rotateY: flipped ? 180 : 0 }} transition={{ type: 'spring', stiffness: 170, damping: 22 }}>
        <div className="flip-face ecard-wrap" style={{ pointerEvents: flipped ? 'none' : 'auto' }}>
          <div className="ticket-h">
            <div className="ticket-main">
              <div>
                <div className="row spread" style={{ marginBottom: 8 }}>
                  <span className="badge" style={{ background: '#fff', boxShadow: `inset 0 0 0 1.5px ${cat.color}`, color: cat.dark }}>{cat.label}</span>
                  {reg.attended ? <span className="badge teal"><BadgeCheck size={14} />Checked in</span> : waiting ? <span className="badge gold"><Hourglass size={13} />Waitlist #{reg.waitlistPosition}</span> : past ? <span className="badge grey">Past</span> : <span className="badge teal">Confirmed</span>}
                </div>
                <Link to={`/events/${ev.id}`}><h3 style={{ marginBottom: 8 }}>{ev.title}</h3></Link>
                {reg.teamName && <p className="faint" style={{ marginBottom: 6 }}>Team <b>{reg.teamName}</b> · {reg.teamMembers.length} member{reg.teamMembers.length > 1 ? 's' : ''}</p>}
                <div className="stack" style={{ gap: 4, color: 'var(--ink-2)', fontSize: '0.9rem' }}>
                  <span className="row" style={{ gap: 6 }}><CalendarDays size={14} />{fmtDay(ev.eventDate)}</span>
                  <span className="row" style={{ gap: 6 }}><Clock size={14} />{fmtTime(ev.startTime)}</span>
                  <span className="row" style={{ gap: 6 }}><MapPin size={14} />{ev.venue}</span>
                </div>
              </div>
              {!reg.attended && !past && <button className="faint" style={{ background: 'none', border: 0, textAlign: 'left', padding: 0, textDecoration: 'underline' }} onClick={() => onCancel(reg)}>{waiting ? 'Leave waitlist' : 'Cancel registration'}</button>}
              {reg.attended && <Link to={`/events/${ev.id}`} className="faint" style={{ textDecoration: 'underline' }}>Rate this event</Link>}
            </div>
            <div className="ticket-stub">
              {waiting ? <Hourglass size={34} color="var(--marigold)" /> : (
                <button onClick={() => setFlipped(true)} aria-label="Show large QR code" style={{ background: 'none', border: 0, display: 'grid', gap: 6, justifyItems: 'center' }}>
                  <div className="qr-frame"><QRCodeSVG value={reg.qrToken} size={84} /></div>
                  <span className="faint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RotateCw size={12} />Enlarge</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flip-face flip-back" style={{ pointerEvents: flipped ? 'auto' : 'none' }}>
          <div className="ticket-back">
            <div className="qr-frame" style={{ padding: 12 }}><QRCodeSVG value={reg.qrToken} size={150} level="M" /></div>
            <b>{ev.title}</b>
            <span style={{ color: '#b9bcdf', fontSize: '0.85rem' }}>Hold this up at the entrance</span>
            <Button variant="accent" size="sm" onClick={() => setFlipped(false)}>Flip back</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function MyTickets() {
  useDocTitle('My tickets');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.get('/students/my-registrations').then((r) => r.data), []);
  const [tab, setTab] = useState('upcoming');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const list = (data || []).filter((r) => (tab === 'upcoming' ? !isPast(r.event) : isPast(r.event)));

  const cancel = async () => {
    setBusy(true);
    try { await api.delete(`/registrations/${target.id}`); toast('Registration cancelled'); setTarget(null); reload(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>My tickets</h1><p>Tap a QR code to enlarge it. Coordinators scan it at the entrance.</p></div>
        <div className="row">{['upcoming', 'past'].map((t) => (
          <button key={t} className={`chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {tab === t && <motion.i layoutId="ticket-tab" className="pill" />}<span className="t">{t === 'upcoming' ? 'Upcoming' : 'Past'}</span>
          </button>))}</div>
      </div>
      {loading && !data ? <div className="tickets">{[0, 1, 2].map((i) => <Skeleton key={i} h={190} r={20} />)}</div> : error ? <ErrorState message={error} onRetry={reload} /> : list.length === 0 ? (
        <Empty icon={Ticket} title={tab === 'upcoming' ? 'No tickets yet' : 'No past events yet'} action={<Link to="/events" className="btn btn-primary">Find an event</Link>}>
          {tab === 'upcoming' ? 'Register for an event and your QR ticket will appear here.' : 'Events you attend will be kept here.'}
        </Empty>
      ) : (
        <motion.div className="tickets" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.08 } } }}>
          {list.map((r) => (
            <motion.div key={r.id} variants={{ h: { opacity: 0, y: 30, rotate: -2 }, s: { opacity: 1, y: 0, rotate: 0 } }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
              <TicketCard reg={r} onCancel={setTarget} />
            </motion.div>
          ))}
        </motion.div>
      )}
      <ConfirmModal open={!!target} onClose={() => setTarget(null)} loading={busy} danger confirmLabel="Cancel registration"
        title="Cancel this registration?" text={target ? `You'll give up your ${target.status === 'WAITLISTED' ? 'place on the waiting list' : 'seat'} for ${target.event.title}.` : ''} onConfirm={cancel} />
    </div>
  );
}
