import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileSpreadsheet, Search, UserPlus } from 'lucide-react';
import { Button, ConfirmModal, Empty, ErrorState, Field, Modal, Skeleton } from '../components/ui';
import { Trash2 } from 'lucide-react';
import { api, errMsg } from '../lib/api';
import { useToast } from '../lib/toast';
import { useAsync, useDocTitle } from '../lib/hooks';
import { fmtDateTime } from '../lib/format';
import { exportWorkbook, historyRows, ledgerRows, pointsReportRows, registrationRows, studentRows } from '../lib/exportSheets';

const TABS = [['registrations', 'Registrations'], ['points', 'Activity points'], ['students', 'Students'], ['history', 'History']];
const STATUS_CLS = { CONFIRMED: 'teal', WAITLISTED: 'gold', CANCELLED: 'grey' };

function SearchBox({ value, onChange, placeholder }) {
  return <div className="search" style={{ width: 'min(340px,100%)' }}><Search size={18} /><input className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}

function Registrations({ rows, onExport, reload }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [event, setEvent] = useState('');
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const events = useMemo(() => [...new Set(rows.map((r) => r.eventTitle))], [rows]);
  const shown = rows.filter((r) => (!event || r.eventTitle === event) && `${r.studentName} ${r.rollNumber || ''} ${r.department || ''} ${r.teamName || ''}`.toLowerCase().includes(q.toLowerCase()));
  const remove = async () => {
    setDeleting(true);
    try { await api.delete(`/admin/registrations/${target.registrationId}`); toast('Registration deleted'); setTarget(null); reload(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setDeleting(false); }
  };
  return (
    <div className="stack">
      <div className="row">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, roll number, department, team" />
        <select className="select" style={{ width: 240 }} value={event} onChange={(e) => setEvent(e.target.value)} aria-label="Filter by event"><option value="">All events</option>{events.map((e) => <option key={e}>{e}</option>)}</select>
        <span className="faint">{shown.length} record{shown.length === 1 ? '' : 's'}</span>
        <Button variant="ghost" size="sm" style={{ marginLeft: 'auto' }} onClick={() => onExport(shown)}><Download size={15} />Export this view</Button>
      </div>
      {shown.length === 0 ? <Empty icon={FileSpreadsheet} title="No registrations yet">Every registration, including cancelled ones, is kept here permanently.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Event</th><th>Student</th><th>Roll no.</th><th>Mobile</th><th>Team</th><th>Registered</th><th>Status</th><th>Checked in</th><th></th></tr></thead>
          <tbody>{shown.map((r) => (
            <tr key={r.registrationId}><td><b>{r.eventTitle}</b><div className="faint">{r.eventDate}</div></td><td>{r.studentName}<div className="faint">{r.email}</div></td><td>{r.rollNumber || '–'}</td>
              <td>{r.mobileNumber || '–'}</td>
              <td>{r.teamName ? <span title={r.teamMembers}><b>{r.teamName}</b><div className="faint">{r.teamMembers}</div></span> : <span className="faint">–</span>}</td>
              <td className="faint">{fmtDateTime(r.registeredAt)}</td><td><span className={`badge ${STATUS_CLS[r.status]}`}>{r.status.toLowerCase()}</span></td><td>{r.attended ? <span className="badge teal">{fmtDateTime(r.attendedAt)}</span> : <span className="faint">–</span>}</td>
              <td><Button size="sm" variant="danger-ghost" onClick={() => setTarget(r)} aria-label="Delete registration"><Trash2 size={14} /></Button></td></tr>
          ))}</tbody>
        </table></div>
      )}
      <ConfirmModal open={!!target} onClose={() => setTarget(null)} loading={deleting} danger confirmLabel="Delete permanently"
        title="Delete this registration?" text={target ? `This permanently removes ${target.studentName}'s registration for ${target.eventTitle} from the database. This can't be undone.` : ''} onConfirm={remove} />
    </div>
  );
}

function SemesterAward({ open, onClose, students, semester, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ studentId: '', type: 'CLUB_MEMBER' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post('/admin/points/semester', { studentId: Number(f.studentId), type: f.type, semester }); toast('Points recorded'); onDone(); onClose(); }
    catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Semester points · ${semester}`}>
      <form className="stack" onSubmit={submit}>
        <Field label="Student"><select className="select" required value={f.studentId} onChange={(e) => setF({ ...f, studentId: e.target.value })}><option value="">Select a student</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}{s.rollNumber ? ` (${s.rollNumber})` : ''}</option>)}</select></Field>
        <Field label="For"><select className="select" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="CLUB_MEMBER">Club membership (2 points)</option><option value="OFFICE_BEARER">Office bearer of the club (3 points)</option></select></Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" loading={busy}>Record points</Button></div>
      </form>
    </Modal>
  );
}

function Points({ students }) {
  const [semester, setSemester] = useState('');
  const { data: report, loading, error, reload } = useAsync(() => api.get('/admin/points/report', { params: { semester: semester || undefined } }).then((r) => r.data), [semester]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !report) return <Skeleton h={260} r={16} />;
  const shown = report.rows.filter((r) => `${r.name} ${r.rollNumber || ''} ${r.department || ''}`.toLowerCase().includes(q.toLowerCase()));
  const met = report.rows.filter((r) => r.meetsTarget).length;
  const exportReport = async () => {
    const ledger = (await api.get('/admin/points/ledger', { params: { semester: report.semester } })).data;
    await exportWorkbook(`activity-points-${report.semester.replace(/\s+/g, '-')}`, [{ name: 'Semester report', rows: pointsReportRows(report) }, { name: 'Ledger', rows: ledgerRows(ledger) }]);
  };
  return (
    <div className="stack">
      <div className="row">
        <select className="select" style={{ width: 190 }} value={report.semester} onChange={(e) => setSemester(e.target.value)} aria-label="Semester">{report.semesters.map((s) => <option key={s}>{s}</option>)}</select>
        <SearchBox value={q} onChange={setQ} placeholder="Search students" />
        <span className="faint">{met} of {report.rows.length} students have reached {report.target}</span>
        <div className="row" style={{ marginLeft: 'auto' }}>
          <Button variant="ghost" size="sm" onClick={() => setModal(true)}><UserPlus size={15} />Membership / office bearer</Button>
          <Button variant="ghost" size="sm" onClick={exportReport}><Download size={15} />Export semester sheet</Button>
        </div>
      </div>
      {shown.length === 0 ? <Empty icon={FileSpreadsheet} title="No students yet">Students appear here after they create an account.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Student</th><th>Roll no.</th><th>Dept / Year</th><th style={{ width: 220 }}>Points</th><th>Breakdown</th></tr></thead>
          <tbody>{shown.map((r) => (
            <tr key={r.studentId}><td><b>{r.name}</b></td><td>{r.rollNumber || '–'}</td><td>{r.department || '–'}{r.yearOfStudy ? ` · Y${r.yearOfStudy}` : ''}</td>
              <td><div className="row" style={{ gap: 10, flexWrap: 'nowrap' }}><b style={{ width: 28 }}>{r.total}</b><div className={`big-meter ${r.meetsTarget ? '' : ''}`} style={{ flex: 1, height: 8 }}><motion.i initial={{ width: 0 }} animate={{ width: `${Math.min(100, (r.total / report.target) * 100)}%` }} transition={{ duration: 0.8 }} style={r.meetsTarget ? undefined : { background: 'var(--marigold)' }} /></div>{r.meetsTarget && <span className="badge teal">Met</span>}</div></td>
              <td className="faint">{r.breakdown.map((b) => `${b.label} ${b.points}`).join(' · ') || '–'}</td></tr>
          ))}</tbody>
        </table></div>
      )}
      <SemesterAward open={modal} onClose={() => setModal(false)} students={students} semester={report.semester} onDone={reload} />
    </div>
  );
}

function Students({ students, onExport, reload }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const shown = students.filter((s) => `${s.name} ${s.email} ${s.rollNumber || ''} ${s.department || ''}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = async (s, active) => {
    try { await api.patch(`/admin/students/${s.id}/active`, { active }); toast(active ? 'Account reactivated' : 'Account deactivated'); reload(); }
    catch (e) { toast(errMsg(e), 'error'); }
  };
  const remove = async () => {
    setDeleting(true);
    try { await api.delete(`/admin/students/${target.id}`); toast('Account deleted'); setTarget(null); reload(); }
    catch (e) { toast(errMsg(e), 'error'); } finally { setDeleting(false); }
  };
  return (
    <div className="stack">
      <div className="row"><SearchBox value={q} onChange={setQ} placeholder="Search students" /><span className="faint">{shown.length} student{shown.length === 1 ? '' : 's'} · account holders, newest first</span>
        <Button variant="ghost" size="sm" style={{ marginLeft: 'auto' }} onClick={() => onExport(shown)}><Download size={15} />Export</Button></div>
      {shown.length === 0 ? <Empty icon={FileSpreadsheet} title="No students yet">They're added automatically the first time they create an account.</Empty> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Roll no.</th><th>Department</th><th>Year</th><th>Joined</th><th>Active</th><th></th></tr></thead>
          <tbody>{shown.map((s) => (
            <motion.tr key={s.id} layout><td><b>{s.name}</b></td><td>{s.email}</td><td>{s.rollNumber || <span className="faint">not added</span>}</td><td>{s.department || '–'}</td><td>{s.yearOfStudy || '–'}</td>
              <td className="faint">{fmtDateTime(s.createdAt)}</td>
              <td><input type="checkbox" checked={s.active} onChange={(e) => toggle(s, e.target.checked)} aria-label={`${s.name} active`} /></td>
              <td><Button size="sm" variant="danger-ghost" onClick={() => setTarget(s)} aria-label="Delete account"><Trash2 size={14} /></Button></td></motion.tr>
          ))}</tbody>
        </table></div>
      )}
      <ConfirmModal open={!!target} onClose={() => setTarget(null)} loading={deleting} danger confirmLabel="Delete permanently"
        title="Delete this account?" text={target ? `This permanently removes ${target.name}'s account and every registration, attendance record and activity point tied to it. This can't be undone - deactivating (the checkbox) is usually safer.` : ''} onConfirm={remove} />
    </div>
  );
}

function History({ rows }) {
  const [q, setQ] = useState('');
  const shown = rows.filter((a) => `${a.actorName || ''} ${a.action} ${a.details || ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="stack">
      <div className="row"><SearchBox value={q} onChange={setQ} placeholder="Search history" /><span className="faint">Latest {rows.length} actions. Nothing here is ever deleted.</span></div>
      {shown.length === 0 ? <Empty icon={FileSpreadsheet} title="No history yet" /> : (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>{shown.map((a) => (
            <tr key={a.id}><td className="faint" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(a.createdAt)}</td><td>{a.actorName || <span className="faint">unknown</span>}</td><td><span className="badge grey">{a.action.replace(/_/g, ' ').toLowerCase()}</span></td><td className="muted">{a.details}</td></tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

export default function Records() {
  useDocTitle('Records');
  const toast = useToast();
  const [tab, setTab] = useState('registrations');
  const regs = useAsync(() => api.get('/admin/registrations').then((r) => r.data), []);
  const students = useAsync(() => api.get('/admin/students').then((r) => r.data), []);
  const history = useAsync(() => api.get('/admin/history', { params: { limit: 1000 } }).then((r) => r.data), [tab]);
  const [busy, setBusy] = useState(false);

  const downloadAll = async () => {
    setBusy(true);
    try {
      const [ledger, report, events] = await Promise.all([
        api.get('/admin/points/ledger').then((r) => r.data),
        api.get('/admin/points/report').then((r) => r.data),
        api.get('/events/mine').then((r) => r.data),
      ]);
      await exportWorkbook('itech-broadcast-records', [
        { name: 'Registrations', rows: registrationRows(regs.data || []) },
        { name: 'Events', rows: events.map((e) => ({ Title: e.title, Category: e.category, Date: e.eventDate, Venue: e.venue, Capacity: e.capacity, Registered: e.confirmedCount, Waitlist: e.waitlistCount, Status: e.status, 'Average rating': e.averageRating ?? '' })) },
        { name: 'Students', rows: studentRows(students.data || []) },
        { name: 'Points this semester', rows: pointsReportRows(report) },
        { name: 'Points ledger', rows: ledgerRows(ledger) },
        { name: 'History', rows: historyRows((await api.get('/admin/history', { params: { limit: 2000 } })).data) },
      ]);
    } catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); }
  };

  const err = regs.error || students.error;
  return (
    <div className="container page">
      <div className="page-head">
        <div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Records</h1><p>Every registration, student, activity point and action is stored in the database and can be exported as a spreadsheet.</p></div>
        <Button variant="accent" size="lg" loading={busy} onClick={downloadAll}><FileSpreadsheet size={18} />Download full workbook</Button>
      </div>
      <div className="tabs" role="tablist">{TABS.map(([k, label]) => (
        <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{label}{tab === k && <motion.i layoutId="rec-tab" className="tab-line" />}</button>))}</div>
      {err ? <ErrorState message={err} onRetry={() => { regs.reload(); students.reload(); }} /> : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
            {tab === 'registrations' && (regs.loading && !regs.data ? <Skeleton h={260} r={16} /> : <Registrations rows={regs.data || []} reload={regs.reload} onExport={(rows) => exportWorkbook('registrations', [{ name: 'Registrations', rows: registrationRows(rows) }])} />)}
            {tab === 'points' && <Points students={(students.data || []).filter((s) => s.active)} />}
            {tab === 'students' && (students.loading && !students.data ? <Skeleton h={260} r={16} /> : <Students students={students.data || []} reload={students.reload} onExport={(rows) => exportWorkbook('students', [{ name: 'Students', rows: studentRows(rows) }])} />)}
            {tab === 'history' && (history.loading && !history.data ? <Skeleton h={260} r={16} /> : <History rows={history.data || []} />)}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
