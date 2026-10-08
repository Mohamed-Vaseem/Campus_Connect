import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarPlus, Pencil, XCircle, CalendarX, ScanLine } from 'lucide-react';
import { Button, CategoryBadge, ConfirmModal, Empty, ErrorState, Skeleton, StatusBadge } from '../components/ui';
import { api, errMsg } from '../lib/api';
import { useToast } from '../lib/toast';
import { useAsync, useDocTitle } from '../lib/hooks';
import { fmtDay, fmtTime } from '../lib/format';

export default function AdminDashboard() {
  useDocTitle('Manage events');
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.get('/events/mine').then((r) => r.data), []);
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    try { await api.delete(`/events/${target.id}`); toast('Event cancelled and registrants notified'); setTarget(null); reload(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };

  return (
    <div className="container page">
      <div className="page-head">
        <div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Manage events</h1><p>Create events, watch registrations fill up, run check-in and award activity points.</p></div>
        <Link to="/admin/events/new" className="btn btn-accent btn-lg"><CalendarPlus size={19} />New event</Link>
      </div>

      {loading && !data ? <div className="stack">{[0, 1, 2].map((i) => <Skeleton key={i} h={96} r={18} />)}</div> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
        <Empty icon={CalendarX} title="No events yet" action={<Link to="/admin/events/new" className="btn btn-primary">Create the first event</Link>}>Once you publish an event, students see it straight away.</Empty>
      ) : (
        <motion.div className="stack" layout>
          <AnimatePresence initial={false}>
            {data.map((e) => {
              const pct = Math.min(100, Math.round((e.confirmedCount / e.capacity) * 100));
              return (
                <motion.div key={e.id} layout className="panel" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }} whileHover={{ y: -2 }}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(140px,1fr) auto', gap: 20, alignItems: 'center', padding: 20 }}>
                  <div>
                    <div className="row" style={{ gap: 8, marginBottom: 6 }}><StatusBadge status={e.status} /><CategoryBadge category={e.category} />{e.pointsEligible && <span className="badge gold">+{e.attendPoints} pts</span>}</div>
                    <Link to={`/admin/events/${e.id}`}><h3>{e.title}</h3></Link>
                    <span className="faint">{fmtDay(e.eventDate)} · {fmtTime(e.startTime)} · {e.venue}</span>
                  </div>
                  <div>
                    <div className="row spread"><b>{e.confirmedCount}/{e.capacity}</b><span className="faint">{e.waitlistCount ? `+${e.waitlistCount} waiting` : 'registered'}</span></div>
                    <div className="big-meter" style={{ marginTop: 6 }}><motion.i initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} /></div>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <Link to={`/admin/events/${e.id}`} className="btn btn-primary btn-sm"><ScanLine size={15} />Manage</Link>
                    {e.status !== 'CANCELLED' && e.status !== 'COMPLETED' && <Link to={`/admin/events/${e.id}/edit`} className="btn btn-ghost btn-sm" aria-label="Edit event"><Pencil size={15} /></Link>}
                    {e.status === 'PUBLISHED' && <Button size="sm" variant="danger-ghost" onClick={() => setTarget(e)} aria-label="Cancel event"><XCircle size={15} /></Button>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
      <ConfirmModal open={!!target} onClose={() => setTarget(null)} loading={busy} danger confirmLabel="Cancel event"
        title="Cancel this event?" text={target ? `Everyone registered for ${target.title} will be told it's cancelled. The record stays in Records.` : ''} onConfirm={cancel} />
    </div>
  );
}
