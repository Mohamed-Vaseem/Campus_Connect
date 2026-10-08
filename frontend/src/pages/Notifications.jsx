import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, Empty, ErrorState, Skeleton } from '../components/ui';
import { NOTIF_ICON } from '../components/Navbar';
import { api } from '../lib/api';
import { useAsync, useDocTitle } from '../lib/hooks';
import { timeAgo } from '../lib/format';

export default function Notifications() {
  useDocTitle('Notifications');
  const nav = useNavigate();
  const { data, loading, error, reload, setData } = useAsync(() => api.get('/notifications').then((r) => r.data), []);
  const unread = (data || []).filter((n) => !n.seen).length;

  const open = async (n) => {
    if (!n.seen) { await api.post(`/notifications/${n.id}/read`); setData(data.map((x) => (x.id === n.id ? { ...x, seen: true } : x))); }
    if (n.link) nav(n.link);
  };
  const readAll = async () => { await api.post('/notifications/read-all'); reload(); };

  return (
    <div className="container page" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Notifications</h1><p>{unread ? `${unread} unread` : 'Nothing new'}</p></div>
        <Button variant="ghost" onClick={readAll} disabled={!unread}><CheckCheck size={17} />Mark all read</Button>
      </div>
      {loading && !data ? <div className="stack">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={64} />)}</div> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
        <Empty icon={Bell} title="No notifications yet">Registration confirmations, reminders and announcements will show up here.</Empty>
      ) : (
        <motion.div className="panel" style={{ padding: 0, overflow: 'hidden' }} initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.03 } } }}>
          {data.map((n) => {
            const Icon = NOTIF_ICON[n.type] || Bell;
            return (
              <motion.button key={n.id} className={`notif ${n.seen ? '' : 'unread'}`} onClick={() => open(n)} variants={{ h: { opacity: 0, x: -14 }, s: { opacity: 1, x: 0 } }}>
                <span className="ico"><Icon size={18} /></span>
                <span style={{ flex: 1 }}><b style={{ display: 'block' }}>{n.title}</b><span className="muted" style={{ fontSize: '0.92rem' }}>{n.message}</span><span className="faint" style={{ display: 'block' }}>{timeAgo(n.createdAt)}</span></span>
                {!n.seen && <i className="unread-dot" />}
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
