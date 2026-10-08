import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Check, CheckCircle2, Download, Megaphone, Pencil, Plus, Search, ScanLine, XCircle, Send, Users, UserCheck, Hourglass, Star, Trash2 } from 'lucide-react';
import QRScanner from '../components/QRScanner';
import { Button, CategoryBadge, ConfirmModal, CountUp, Empty, ErrorState, Field, Skeleton, StatusBadge, Stars } from '../components/ui';
import { api, errMsg } from '../lib/api';
import { useToast } from '../lib/toast';
import { useAsync, useDocTitle } from '../lib/hooks';
import { fmtDay, fmtStamp, fmtTime } from '../lib/format';
import { exportWorkbook, eventRegistrantRows } from '../lib/exportSheets';

const TABS = [['overview', 'Overview'], ['people', 'People'], ['scan', 'Check-in'], ['points', 'Activity points'], ['feedback', 'Feedback']];

function Overview({ ev, people, onChanged }) {
  const toast = useToast();
  const [ann, setAnn] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);
  const confirmed = people.filter((p) => p.status === 'CONFIRMED').length;
  const present = people.filter((p) => p.attended).length;

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try { await api.post(`/events/${ev.id}/announcements`, ann); toast('Announcement sent to everyone registered'); setAnn({ title: '', message: '' }); }
    catch (err) { toast(errMsg(err), 'error'); } finally { setSending(false); }
  };

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="stat-grid">
        <div className="stat"><span className="ico" style={{ background: 'var(--iris-l)', color: 'var(--iris)' }}><Users size={18} /></span><b><CountUp value={confirmed} /></b><span>Confirmed of {ev.capacity}</span></div>
        <div className="stat"><span className="ico" style={{ background: 'var(--marigold-l)', color: '#8a5a00' }}><Hourglass size={18} /></span><b><CountUp value={ev.waitlistCount} /></b><span>On the waiting list</span></div>
        <div className="stat"><span className="ico" style={{ background: 'var(--teal-l)', color: 'var(--teal)' }}><UserCheck size={18} /></span><b><CountUp value={present} /></b><span>Checked in</span></div>
        <div className="stat"><span className="ico" style={{ background: 'var(--hibiscus-l)', color: 'var(--hibiscus)' }}><Star size={18} /></span><b>{ev.averageRating ?? '–'}</b><span>{ev.feedbackCount} rating{ev.feedbackCount === 1 ? '' : 's'}</span></div>
      </div>
      <form className="panel stack" style={{ maxWidth: 560 }} onSubmit={send}>
        <h3 className="row" style={{ gap: 8 }}><Megaphone size={20} color="var(--iris)" />Announce to registrants</h3>
        <Field label="Headline"><input className="input" required value={ann.title} onChange={(e) => setAnn({ ...ann, title: e.target.value })} maxLength={100} /></Field>
        <Field label="Message"><textarea className="textarea" required value={ann.message} onChange={(e) => setAnn({ ...ann, message: e.target.value })} maxLength={800} /></Field>
        <Button type="submit" loading={sending} disabled={ev.status !== 'PUBLISHED'}><Send size={16} />Send announcement</Button>
      </form>
    </div>
  );
}

function TeamRoster({ teamName, members }) {
  const [open, setOpen] = useState(false);
  if (!teamName) return <span className="faint">–</span>;
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer' }}>
        <b>{teamName}</b><div className="faint" style={{ textDecoration: 'underline' }}>{members.length} member{members.length === 1 ? '' : 's'} {open ? '▲' : '▼'}</div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: '0.85rem' }}>
              {members.map((m, i) => <li key={i}>{m.name} <span className="faint">(Year {m.yearOfStudy})</span></li>)}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function People({ ev, people, loading, reload }) {
  const rows = people;
  const toast = useToast();
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const shown = useMemo(() => people.filter((p) => `${p.student.name} ${p.student.rollNumber || ''} ${p.student.department || ''} ${p.teamName || ''}`.toLowerCase().includes(q.toLowerCase())), [people, q]);
  const mark = async (p) => {
    setBusyId(p.registrationId);
    try { await api.post(`/attendance/mark-manual/${p.registrationId}`); toast(`${p.student.name} marked present`); reload(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setBusyId(null); }
  };
  const remove = async () => {
    setDeleting(true);
    try { await api.delete(`/admin/registrations/${target.registrationId}`); toast('Registration deleted'); setTarget(null); reload(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setDeleting(false); }
  };
  if (loading && !people.length) return <Skeleton h={240} r={16} />;
  return (
    <div className="stack">
      <div className="row"><div className="search" style={{ maxWidth: 360 }}><Search size={18} /><input className="input" placeholder="Search name, roll number, department, team" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <span className="faint">{shown.length} record{shown.length === 1 ? '' : 's'}</span>
        <Button size="sm" variant="ghost" style={{ marginLeft: 'auto' }} onClick={() => exportWorkbook(`${ev.title}-registrants`.toLowerCase().replace(/\s+/g, '-'), [{ name: 'Registrants', rows: eventRegistrantRows(ev, rows) }])}><Download size={15} />Export</Button></div>
      {shown.length === 0 ? <Empty icon={Users} title="No one here yet">{people.length ? 'Nobody matches that search.' : 'Registrations appear here as students sign up.'}</Empty> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Student</th><th>Roll no.</th><th>Mobile</th><th>Team</th><th>Registered</th><th>Status</th><th>Check-in</th><th></th></tr></thead>
            <tbody>
              {shown.map((p) => (
                <motion.tr key={p.registrationId} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td><b>{p.student.name}</b><div className="faint">{p.student.department || ''}</div></td><td>{p.student.rollNumber || '–'}</td>
                  <td>{p.mobileNumber || '–'}</td>
                  <td><TeamRoster teamName={p.teamName} members={p.teamMembers} /></td>
                  <td className="faint">{fmtStamp(p.registrationDate)}</td>
                  <td><span className={`badge ${p.status === 'CONFIRMED' ? 'teal' : 'gold'}`}>{p.status === 'CONFIRMED' ? 'Confirmed' : 'Waitlist'}</span></td>
                  <td>{p.attended ? <span className="badge teal"><Check size={13} />{fmtStamp(p.attendedAt)}</span> : p.status === 'CONFIRMED' ? <Button size="sm" variant="ghost" loading={busyId === p.registrationId} onClick={() => mark(p)}>Mark present</Button> : <span className="faint">–</span>}</td>
                  <td><Button size="sm" variant="danger-ghost" onClick={() => setTarget(p)} aria-label="Delete registration"><Trash2 size={14} /></Button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmModal open={!!target} onClose={() => setTarget(null)} loading={deleting} danger confirmLabel="Delete permanently"
        title="Delete this registration?" text={target ? `This permanently removes ${target.student.name}'s registration${target.teamName ? ` (team "${target.teamName}")` : ''} from the database. This can't be undone.` : ''} onConfirm={remove} />
    </div>
  );
}

function Scan({ ev, reload }) {
  const [feed, setFeed] = useState([]);
  const [code, setCode] = useState('');
  const submit = async (token) => {
    try {
      const { data } = await api.post('/attendance/mark', { qrToken: token });
      setFeed((f) => [{ id: Date.now(), ok: true, title: data.studentName, sub: `${data.rollNumber || 'No roll number'} · ${data.department || ''}` }, ...f].slice(0, 6));
      reload();
    } catch (e) {
      setFeed((f) => [{ id: Date.now(), ok: false, title: errMsg(e), sub: 'Nothing was recorded' }, ...f].slice(0, 6));
    }
  };
  return (
    <div className="two-col" style={{ alignItems: 'start' }}>
      <div className="stack">
        <QRScanner onScan={submit} />
        <form className="row" style={{ flexWrap: 'nowrap' }} onSubmit={(e) => { e.preventDefault(); if (code.trim()) { submit(code.trim()); setCode(''); } }}>
          <input className="input" placeholder="Or paste a ticket code" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Ticket code" />
          <Button type="submit" variant="ghost">Check in</Button>
        </form>
        <p className="faint">Check-in opens an hour before the event starts and closes 30 minutes after it ends.</p>
      </div>
      <div className="stack">
        <h3 className="row" style={{ gap: 8 }}><ScanLine size={20} color="var(--iris)" />Recent scans</h3>
        {feed.length === 0 && <p className="muted">Scan a ticket and the result shows up here.</p>}
        <AnimatePresence initial={false}>
          {feed.map((r) => (
            <motion.div key={r.id} layout className={`result-flash ${r.ok ? 'ok' : 'bad'}`} initial={{ opacity: 0, x: 40, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
              {r.ok ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
              <div><div>{r.title}</div><div style={{ fontWeight: 500, fontSize: '0.85rem', opacity: 0.85 }}>{r.sub}</div></div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Feedback({ ev }) {
  const { data, loading, error, reload } = useAsync(() => api.get(`/events/${ev.id}/feedback`).then((r) => r.data), [ev.id]);
  if (loading && !data) return <Skeleton h={200} r={16} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data.count) return <Empty icon={Star} title="No feedback yet">Students who attend can rate the event once it's over.</Empty>;
  const dist = [5, 4, 3, 2, 1].map((n) => [n, data.items.filter((i) => i.rating === n).length]);
  return (
    <div className="two-col" style={{ alignItems: 'start' }}>
      <div className="panel stack">
        <div className="row" style={{ gap: 14 }}><b style={{ fontFamily: 'var(--font-display)', fontSize: '3rem' }}>{data.average}</b><div><Stars value={Math.round(data.average)} readOnly size={22} /><span className="faint">{data.count} rating{data.count > 1 ? 's' : ''}</span></div></div>
        {dist.map(([n, c]) => (
          <div key={n} className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><span style={{ width: 14 }}>{n}</span><div className="big-meter" style={{ flex: 1, height: 8 }}><motion.i initial={{ width: 0 }} animate={{ width: `${(c / data.count) * 100}%` }} transition={{ duration: 0.8 }} style={{ background: 'var(--marigold)' }} /></div><span className="faint" style={{ width: 20 }}>{c}</span></div>
        ))}
      </div>
      <div className="stack">
        {data.items.map((i) => (
          <div key={i.id} className="panel-flat stack" style={{ gap: 6 }}>
            <div className="row spread"><b>{i.studentName}</b><Stars value={i.rating} readOnly size={16} /></div>
            {i.comments && <p className="muted">{i.comments}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

const RULE_LABELS = { ORGANISING: 'Organising (5 pts)', COORDINATING: 'Coordinating (3 pts)', TALK: "Delivering a talk (3 pts)", PAPER: 'Presenting a paper (3 pts)', PRIZE: 'Prize winner (5 pts)', VOLUNTEER: 'Student volunteer (2 pts)' };

function Points({ ev, people }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.get(`/events/${ev.id}/points`).then((r) => r.data), [ev.id]);
  const [form, setForm] = useState({ studentId: '', type: 'VOLUNTEER' });
  const [busy, setBusy] = useState(false);
  const attendees = people.filter((p) => p.attended);

  const award = async (e) => {
    e.preventDefault();
    if (!form.studentId) return toast('Pick a student', 'error');
    setBusy(true);
    try { await api.post(`/events/${ev.id}/points`, { studentId: Number(form.studentId), type: form.type }); toast('Points recorded'); setForm({ ...form, studentId: '' }); reload(); }
    catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };
  const remove = async (p) => {
    try { await api.delete(`/points/${p.id}`); toast('Removed'); reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };

  return (
    <div className="two-col" style={{ alignItems: 'start' }}>
      <form className="panel stack" onSubmit={award}>
        <h3 className="row" style={{ gap: 8 }}><Award size={20} color="var(--iris)" />Award points for this event</h3>
        <p className="faint">Attendance points (2, up to 3 events) are added automatically at check-in. Use this for the extra roles below.</p>
        <Field label="Student"><select className="select" required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
          <option value="">Select a checked-in student</option>{attendees.map((p) => <option key={p.registrationId} value={p.student.id}>{p.student.name}{p.student.rollNumber ? ` (${p.student.rollNumber})` : ''}</option>)}
        </select></Field>
        <Field label="Role"><select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {Object.entries(RULE_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select></Field>
        <Button type="submit" loading={busy}><Plus size={16} />Add points</Button>
      </form>
      <div className="stack">
        <h3>Recorded for this event</h3>
        {loading && !data ? <Skeleton h={160} r={16} /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? <Empty icon={Award} title="Nothing recorded yet">Points you award here show up on the student's Activity points page.</Empty> : (
          <div className="stack">{data.map((p) => (
            <div key={p.id} className="panel-flat row spread">
              <div><b>{p.studentName}</b><div className="faint">{p.label}{p.auto ? ' · automatic' : ''}</div></div>
              <div className="row"><span className="badge teal">+{p.points}</span>{!p.auto && <Button size="sm" variant="danger-ghost" onClick={() => remove(p)} aria-label="Remove"><Trash2 size={14} /></Button>}</div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

export default function ManageEvent() {
  const { id } = useParams();
  const [tab, setTab] = useState('overview');
  const { data: ev, loading, error, reload: reloadEv } = useAsync(() => api.get(`/events/${id}`).then((r) => r.data), [id]);
  const { data: people, loading: pl, reload: reloadPeople } = useAsync(() => api.get(`/events/${id}/registrations`).then((r) => r.data), [id]);
  useDocTitle(ev ? `Manage: ${ev.title}` : 'Manage event');
  const reloadAll = () => { reloadEv(); reloadPeople(); };

  if (loading && !ev) return <div className="container page"><Skeleton h={140} r={20} /></div>;
  if (error) return <div className="container page"><ErrorState message={error} onRetry={reloadEv} /></div>;

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <div className="row" style={{ gap: 8, marginBottom: 10 }}><StatusBadge status={ev.status} /><CategoryBadge category={ev.category} /></div>
          <h1 style={{ fontSize: 'clamp(1.9rem,4vw,2.8rem)' }}>{ev.title}</h1>
          <p>{fmtDay(ev.eventDate)} · {fmtTime(ev.startTime)} to {fmtTime(ev.endTime)} · {ev.venue}</p>
          {ev.status === 'REJECTED' && <p className="error-text">Changes requested: {ev.rejectionReason}</p>}
        </div>
        <div className="row">
          <Link to={`/events/${ev.id}`} className="btn btn-ghost">Public page</Link>
          {!['CANCELLED', 'COMPLETED'].includes(ev.status) && <Link to={`/admin/events/${ev.id}/edit`} className="btn btn-ghost"><Pencil size={16} />Edit</Link>}
        </div>
      </div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            {label}{tab === k && <motion.i layoutId="tab-line" className="tab-line" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          {tab === 'overview' && <Overview ev={ev} people={people || []} onChanged={reloadAll} />}
          {tab === 'people' && <People ev={ev} people={people || []} loading={pl} reload={reloadAll} />}
          {tab === 'points' && <Points ev={ev} people={people || []} />}
          {tab === 'scan' && <Scan ev={ev} reload={reloadAll} />}
          {tab === 'feedback' && <Feedback ev={ev} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
