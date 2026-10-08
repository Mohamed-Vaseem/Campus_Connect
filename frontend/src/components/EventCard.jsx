import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, ArrowUpRight } from 'lucide-react';
import EventArt from './EventArt';
import { CategoryBadge } from './ui';
import { dayNum, monthShort, fmtTime, seatsLeft } from '../lib/format';

const EventCard = forwardRef(function EventCard({ event, to, As = Link, preview }, ref) {
  const left = seatsLeft(event);
  const pct = Math.min(100, Math.round((event.confirmedCount / event.capacity) * 100));
  const cancelled = event.status === 'CANCELLED';
  const inner = (
    <div className="ecard-wrap" style={{ height: '100%' }}>
      <div className="ecard">
        <div className="ecard-art">
          <EventArt event={event} />
          <div className="ecard-date"><b>{dayNum(event.eventDate)}</b><small>{monthShort(event.eventDate)}</small></div>
          <div className="ecard-tag row" style={{ gap: 4 }}>{event.teamEvent && <span className="badge grey">Team</span>}<CategoryBadge category={event.category} /></div>
        </div>
        <div className="ecard-body">
          <h3>{event.title || 'Untitled event'}</h3>
          <div className="ecard-meta">
            <span><Clock size={14} />{fmtTime(event.startTime)}</span>
            <span><MapPin size={14} />{event.venue || 'Venue'}</span>
          </div>
        </div>
        <div className="ecard-stub">
          {cancelled ? <span className="badge grey">Cancelled</span> : (
            <div>
              <div className="seat-bar" style={{ marginBottom: 5 }}><i style={{ width: `${pct}%` }} /></div>
              <span className="faint">{left === 0 ? 'Full · waitlist open' : `${left} seat${left > 1 ? 's' : ''} left`}</span>
            </div>
          )}
          <ArrowUpRight size={20} color="var(--iris)" />
        </div>
      </div>
    </div>
  );
  if (preview) return inner;
  return (
    <motion.div ref={ref} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
      <As to={to || `/events/${event.id}`} style={{ display: 'block', height: '100%' }}>{inner}</As>
    </motion.div>
  );
});

export default EventCard;
