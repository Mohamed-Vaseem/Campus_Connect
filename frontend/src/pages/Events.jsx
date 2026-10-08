import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, CalendarX } from 'lucide-react';
import EventCard from '../components/EventCard';
import { CardSkeletons, Empty, ErrorState } from '../components/ui';
import { api } from '../lib/api';
import { useAsync, useDebounced, useDocTitle } from '../lib/hooks';
import { CATEGORIES } from '../lib/format';

export default function Events() {
  useDocTitle('Events');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [past, setPast] = useState(false);
  const dq = useDebounced(q);
  const { data, loading, error, reload } = useAsync(
    () => api.get('/events', { params: { q: dq || undefined, category: category || undefined, includePast: past } }).then((r) => r.data),
    [dq, category, past]
  );
  const events = useMemo(() => data || [], [data]);

  return (
    <div className="container page">
      <div className="page-head">
        <div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>Events</h1><p>Everything happening around campus. Filter by type or search by name, venue or club.</p></div>
        <div className="search" style={{ width: 'min(340px,100%)' }}>
          <Search size={18} />
          <input className="input" placeholder="Search events" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
        </div>
      </div>

      <div className="row" style={{ marginBottom: 28, gap: 8 }}>
        {[['', 'All'], ...Object.entries(CATEGORIES).map(([k, v]) => [k, v.label])].map(([key, label]) => (
          <button key={key} className={`chip ${category === key ? 'active' : ''}`} onClick={() => setCategory(key)} aria-pressed={category === key}>
            {category === key && <motion.i layoutId="chip-pill" className="pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
            <span className="t">{label}</span>
          </button>
        ))}
        <label className="row faint" style={{ marginLeft: 'auto', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={past} onChange={(e) => setPast(e.target.checked)} /> Include past events
        </label>
      </div>

      {loading && !data ? <CardSkeletons /> : error ? <ErrorState message={error} onRetry={reload} /> : events.length === 0 ? (
        <Empty icon={CalendarX} title="Nothing matches yet"
          action={<button className="btn btn-ghost" onClick={() => { setQ(''); setCategory(''); }}>Clear filters</button>}>
          Try a different word or category. New events appear here as soon as they're approved.
        </Empty>
      ) : (
        <motion.div layout className="grid-events">
          <AnimatePresence mode="popLayout">
            {events.map((e) => <EventCard key={e.id} event={e} As={Link} />)}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
