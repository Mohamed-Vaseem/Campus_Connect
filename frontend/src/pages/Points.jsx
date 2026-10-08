import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ExternalLink, Info, Target } from 'lucide-react';
import { CountUp, Empty, ErrorState, Skeleton } from '../components/ui';
import { api } from '../lib/api';
import { useAsync, useDocTitle } from '../lib/hooks';
import { fmtStamp } from '../lib/format';

function Ring({ value, target }) {
  const r = 70, c = 2 * Math.PI * r;
  const pct = Math.min(1, value / target);
  return (
    <div style={{ position: 'relative', width: 184, height: 184 }}>
      <svg viewBox="0 0 170 170" width="184" height="184" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="85" cy="85" r={r} fill="none" stroke="#e8e9f5" strokeWidth="15" />
        <motion.circle cx="85" cy="85" r={r} fill="none" stroke={value >= target ? 'var(--teal)' : 'var(--iris)'} strokeWidth="15" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div><b style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', lineHeight: 1 }}><CountUp value={value} /></b><div className="faint">of {target} points</div></div>
      </div>
    </div>
  );
}

export default function Points() {
  useDocTitle('Activity points');
  const { data, loading, error, reload } = useAsync(() => api.get('/points/mine').then((r) => r.data), []);
  const rules = useAsync(() => api.get('/points/rules').then((r) => r.data), []);

  if (error) return <div className="container page"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading && !data) return <div className="container page stack"><Skeleton h={220} r={20} /><Skeleton h={260} r={20} /></div>;

  const left = Math.max(0, data.target - data.semesterTotal);
  const current = data.items.filter((i) => i.semester === data.semester);
  return (
    <div className="container page">
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Activity points</h1><p>Semester {data.semester}. Every UG student needs {data.target} points each semester.</p></div>
        <a className="btn btn-ghost" href="/activity-point-circular.pdf" target="_blank" rel="noreferrer"><ExternalLink size={16} />Official circular</a></div>

      <div className="two-col" style={{ gridTemplateColumns: 'minmax(0,340px) minmax(0,1fr)', alignItems: 'stretch' }}>
        <div className="panel stack" style={{ justifyItems: 'center', textAlign: 'center' }}>
          <Ring value={data.semesterTotal} target={data.target} />
          {left === 0 ? <span className="badge teal"><Target size={14} />Target reached this semester</span> : <p className="muted"><b>{left}</b> more point{left > 1 ? 's' : ''} to reach {data.target}. <Link to="/events" style={{ color: 'var(--iris)', fontWeight: 600 }}>Find an event</Link></p>}
          <p className="faint">{data.lifetimeTotal} points earned in total</p>
        </div>
        <div className="panel stack">
          <h3>This semester</h3>
          {data.byType.length === 0 ? <p className="muted">No points yet. Attend an event and 2 points are added automatically once you're checked in.</p> : data.byType.map((t, i) => (
            <motion.div key={t.type} className="row spread" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <span><b>{t.label}</b> <span className="faint">× {t.count}</span></span><span className="badge">{t.points} pts</span>
            </motion.div>
          ))}
          <hr className="divider" />
          <h3>History</h3>
          {current.length === 0 ? <p className="faint">Nothing recorded for this semester yet.</p> : current.map((p) => (
            <div key={p.id} className="row spread" style={{ flexWrap: 'nowrap' }}>
              <div><b>{p.eventTitle || p.label}</b><div className="faint">{p.label}{p.auto ? ' · automatic' : ''} · {fmtStamp(p.awardedAt)}</div></div>
              <span className="badge teal">+{p.points}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel stack" style={{ marginTop: 26 }}>
        <h3>How points are earned</h3>
        {rules.data ? (
          <div className="table-wrap"><table className="table" style={{ minWidth: 520 }}>
            <thead><tr><th>Activity</th><th>Points</th><th>Notes</th></tr></thead>
            <tbody>{rules.data.map((r) => <tr key={r.type}><td><b>{r.label}</b></td><td>{r.points}</td><td className="muted">{r.note}</td></tr>)}</tbody>
          </table></div>
        ) : <Skeleton h={160} />}
        <p className="faint" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><Info size={16} style={{ flex: 'none', marginTop: 3 }} />Points for these club activities are recorded here by the club team. Remember to upload your certificates in Laudea. Tutors log the final points list at the end of the semester.</p>
      </div>
    </div>
  );
}
