import { CalendarCheck, Ticket, Sparkles } from 'lucide-react';
import { CountUp, Skeleton } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useAsync, useDocTitle } from '../lib/hooks';
import { CATEGORIES, initials } from '../lib/format';

export default function Profile() {
  useDocTitle('Profile');
  const { user } = useAuth();
  const { data: stats, loading } = useAsync(() => (user.role === 'STUDENT' ? api.get('/students/stats').then((r) => r.data) : Promise.resolve(null)), [user.role]);
  const fav = stats?.favouriteCategory && CATEGORIES[stats.favouriteCategory];
  return (
    <div className="container page" style={{ maxWidth: 860 }}>
      <div className="panel row" style={{ gap: 22, marginBottom: 24 }}>
        <div className="avatar" style={{ width: 76, height: 76, fontSize: '1.7rem' }}>{initials(user.name)}</div>
        <div>
          <h2 style={{ fontSize: '1.9rem' }}>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <div className="row" style={{ marginTop: 8, gap: 8 }}>
            <span className="badge">{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</span>
            {user.rollNumber && <span className="badge grey">{user.rollNumber}</span>}
            {user.department && <span className="badge grey">{user.department}{user.yearOfStudy ? ` · Year ${user.yearOfStudy}` : ''}</span>}
          </div>
        </div>
      </div>
      {user.role === 'STUDENT' && (loading ? <Skeleton h={130} r={18} /> : stats && (
        <div className="stat-grid">
          <div className="stat"><span className="ico" style={{ background: 'var(--iris-l)', color: 'var(--iris)' }}><Ticket size={19} /></span><b><CountUp value={stats.registered} /></b><span>Events registered</span></div>
          <div className="stat"><span className="ico" style={{ background: 'var(--teal-l)', color: 'var(--teal)' }}><CalendarCheck size={19} /></span><b><CountUp value={stats.attended} /></b><span>Events attended</span></div>
          <div className="stat"><span className="ico" style={{ background: 'var(--hibiscus-l)', color: 'var(--hibiscus)' }}><Sparkles size={19} /></span><b style={{ fontSize: '1.5rem', paddingTop: 8 }}>{fav ? fav.label : 'None yet'}</b><span>Most joined category</span></div>
        </div>
      ))}
    </div>
  );
}
