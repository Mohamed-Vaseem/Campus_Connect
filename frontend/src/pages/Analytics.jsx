import { motion } from 'framer-motion';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarDays, Ticket, Users, Star, Sparkles } from 'lucide-react';
import { CountUp, ErrorState, Skeleton } from '../components/ui';
import { api } from '../lib/api';
import { useAsync, useDocTitle } from '../lib/hooks';
import { CATEGORIES } from '../lib/format';

function Ring({ value }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg viewBox="0 0 120 120" width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e8e9f5" strokeWidth="12" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke="var(--teal)" strokeWidth="12" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(100, value) / 100) }} transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.7rem' }}><CountUp value={value} decimals={1} suffix="%" /></div>
    </div>
  );
}

const tip = { borderRadius: 12, border: '1px solid #e3e5f2', boxShadow: '0 8px 24px rgba(50,40,140,.14)' };

export default function Analytics() {
  useDocTitle('Analytics');
  const { data: a, loading, error, reload } = useAsync(() => api.get('/analytics').then((r) => r.data), []);
  if (error) return <div className="container page"><ErrorState message={error} onRetry={reload} /></div>;
  if (loading && !a) return <div className="container page stack"><Skeleton h={130} r={18} /><Skeleton h={300} r={18} /></div>;

  const cats = a.categories.map((c) => ({ ...c, name: CATEGORIES[c.category].label }));
  const kpis = [
    [CalendarDays, 'Events', a.totalEvents, 'var(--iris-l)', 'var(--iris)'],
    [Ticket, 'Registrations', a.totalRegistrations, 'var(--marigold-l)', '#8a5a00'],
    [Users, 'Students on the platform', a.totalStudents, 'var(--hibiscus-l)', 'var(--hibiscus)'],
    [Sparkles, 'Activity points awarded', a.pointsAwarded, 'var(--iris-l)', 'var(--iris)'],
  ];

  return (
    <div className="container page">
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Analytics</h1><p>Across all iTech Broadcast events.</p></div></div>

      <div className="stat-grid" style={{ marginBottom: 22 }}>
        {kpis.map(([Icon, label, value, bg, fg], i) => (
          <motion.div key={label} className="stat" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <span className="ico" style={{ background: bg, color: fg }}><Icon size={18} /></span><b><CountUp value={value} /></b><span>{label}</span>
          </motion.div>
        ))}
      </div>

      <div className="two-col" style={{ marginBottom: 22, gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)' }}>
        <div className="panel stack" style={{ justifyItems: 'center', textAlign: 'center' }}>
          <h3>Attendance rate</h3>
          <Ring value={a.attendanceRate} />
          <p className="muted">{a.totalAttendance} checked in from confirmed registrations on events that have started.</p>
          {a.averageRating != null && <span className="badge gold"><Star size={13} fill="currentColor" />{a.averageRating} average rating</span>}
        </div>
        <div className="panel">
          <h3 style={{ marginBottom: 14 }}>Registrations and attendance by month</h3>
          <div className="chart-box">
            <ResponsiveContainer>
              <AreaChart data={a.monthly} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#35447a" stopOpacity={0.35} /><stop offset="1" stopColor="#35447a" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gAtt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f8b8d" stopOpacity={0.35} /><stop offset="1" stopColor="#0f8b8d" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#e3e5f2" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tip} /><Legend iconType="circle" />
                <Area type="monotone" dataKey="registrations" name="Registered" stroke="#35447a" strokeWidth={3} fill="url(#gReg)" animationDuration={1200} />
                <Area type="monotone" dataKey="attendance" name="Attended" stroke="#0f8b8d" strokeWidth={3} fill="url(#gAtt)" animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3 style={{ marginBottom: 14 }}>Which categories draw students</h3>
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={cats} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#e3e5f2" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tip} cursor={{ fill: 'rgba(53,68,122,.06)' }} /><Legend iconType="circle" />
                <Bar dataKey="registrations" name="Registered" fill="#35447a" radius={[8, 8, 0, 0]} animationDuration={1000} />
                <Bar dataKey="attendance" name="Attended" fill="#e0871a" radius={[8, 8, 0, 0]} animationDuration={1300} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="stack" style={{ gap: 22 }}>
          <div className="panel stack">
            <h3>Most popular events</h3>
            {a.topEvents.length === 0 && <p className="muted">No registrations yet.</p>}
            {a.topEvents.map((e, i) => (
              <motion.div key={e.id} className="row" style={{ flexWrap: 'nowrap' }} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                <span className="rank">{i + 1}</span><b style={{ flex: 1 }}>{e.title}</b><span className="faint">{e.registrations} registered · {e.attendance} attended</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
