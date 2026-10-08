import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, LogOut, Menu, Ticket, User, X, CalendarPlus, Award, Megaphone, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth, roleLabel } from '../lib/auth';
import { api } from '../lib/api';
import { initials, timeAgo } from '../lib/format';

function linksFor(user) {
  if (!user) return [['/events', 'Events']];
  if (user.role === 'STUDENT') return [['/events', 'Events'], ['/tickets', 'My tickets'], ['/points', 'Activity points']];
  return [['/events', 'Events'], ['/admin', 'Manage events'], ['/admin/records', 'Records'], ['/analytics', 'Analytics']];
}

export const NOTIF_ICON = { EVENT: Sparkles, REGISTRATION: Ticket, REMINDER: Bell, VENUE_CHANGE: RefreshCw, DEADLINE: CalendarPlus, CERTIFICATE: Award, ANNOUNCEMENT: Megaphone, SYSTEM: Bell };

function useOutside(ref, cb) {
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && cb();
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

function Bell_({ user }) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  const nav = useNavigate();
  useOutside(ref, () => setOpen(false));

  const loadCount = () => api.get('/notifications/unread-count').then((r) => setCount(r.data.count)).catch(() => {});
  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 30000);
    return () => clearInterval(t);
  }, [user.id]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) setItems((await api.get('/notifications')).data.slice(0, 6));
  };
  const openItem = async (n) => {
    setOpen(false);
    if (!n.seen) { api.post(`/notifications/${n.id}/read`).then(loadCount); }
    if (n.link) nav(n.link);
  };
  const readAll = async () => {
    await api.post('/notifications/read-all');
    setItems((l) => l.map((n) => ({ ...n, seen: true })));
    setCount(0);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn" onClick={toggle} aria-label={`Notifications${count ? `, ${count} unread` : ''}`}>
        <motion.span key={count} animate={count ? { rotate: [0, -16, 14, -8, 0] } : {}} transition={{ duration: 0.6 }} style={{ display: 'grid' }}>
          <Bell size={21} />
        </motion.span>
        <AnimatePresence>
          {count > 0 && <motion.span className="dot-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>{count > 9 ? '9+' : count}</motion.span>}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="popover" initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
            <div className="row spread" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <b>Notifications</b>
              <button className="btn btn-ghost btn-sm" onClick={readAll}><CheckCheck size={15} />Mark all read</button>
            </div>
            {items.length === 0 && <p className="faint center" style={{ padding: 28 }}>You're all caught up.</p>}
            {items.map((n) => {
              const Icon = NOTIF_ICON[n.type] || Bell;
              return (
                <button key={n.id} className={`notif ${n.seen ? '' : 'unread'}`} onClick={() => openItem(n)}>
                  <span className="ico"><Icon size={17} /></span>
                  <span style={{ flex: 1 }}><b style={{ display: 'block', fontSize: '0.92rem' }}>{n.title}</b><span className="faint">{timeAgo(n.createdAt)}</span></span>
                  {!n.seen && <i className="unread-dot" />}
                </button>
              );
            })}
            <Link to="/notifications" onClick={() => setOpen(false)} className="menu-item" style={{ justifyContent: 'center', color: 'var(--iris)', fontWeight: 600 }}>See everything</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { logout } = useAuth();
  const nav = useNavigate();
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.button whileTap={{ scale: 0.92 }} className="avatar" onClick={() => setOpen(!open)} aria-label="Account menu" aria-expanded={open}>{initials(user.name)}</motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className="popover" style={{ width: 240 }} initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
              <b>{user.name}</b><div className="faint">{roleLabel(user)}</div>
            </div>
            <button className="menu-item" onClick={() => { setOpen(false); nav('/profile'); }}><User size={17} />Profile</button>
            <button className="menu-item" style={{ color: 'var(--hibiscus)' }} onClick={() => { setOpen(false); logout(); nav('/'); }}><LogOut size={17} />Sign out</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const { user, ready } = useAuth();
  const [sheet, setSheet] = useState(false);
  const loc = useLocation();
  useEffect(() => setSheet(false), [loc.pathname]);
  const links = linksFor(user);

  const renderLinks = () => links.map(([to, label]) => (
    <NavLink key={to} to={to} end={to === '/events'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      {({ isActive }) => (<>{isActive && <motion.i layoutId="navpill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}<span>{label}</span></>)}
    </NavLink>
  ));

  return (
    <header className="nav-wrap">
      <div className="container">
        <nav className="nav" aria-label="Main">
          <Link to="/" className="logo">
            <motion.img src="/broadcast-logo.png" alt="" width="34" height="34" style={{ objectFit: 'contain' }} whileHover={{ rotate: -8, scale: 1.1 }} />
            <span>iTech <span style={{ color: 'var(--marigold)' }}>Broadcast</span></span>
          </Link>
          <div className="nav-links">{renderLinks()}</div>
          <div className="nav-actions">
            {ready && user && <Bell_ user={user} />}
            {ready && user && <UserMenu user={user} />}
            {ready && !user && (<><Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link><Link to="/register" className="btn btn-primary btn-sm">Create account</Link></>)}
            <button className="icon-btn nav-burger" onClick={() => setSheet(true)} aria-label="Open menu"><Menu size={22} /></button>
          </div>
        </nav>
      </div>
      <AnimatePresence>
        {sheet && (
          <motion.div className="sheet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)}>
            <motion.div className="sheet-body" initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: 'spring', stiffness: 360, damping: 34 }} onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn" style={{ alignSelf: 'flex-end' }} onClick={() => setSheet(false)} aria-label="Close menu"><X size={22} /></button>
              {links.map(([to, label]) => <NavLink key={to} to={to} className="nav-link"><span>{label}</span></NavLink>)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
