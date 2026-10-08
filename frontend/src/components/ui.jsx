import { useEffect } from 'react';
import { AnimatePresence, motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { X, Ticket } from 'lucide-react';
import { STATUS, CATEGORIES } from '../lib/format';

export function Spinner({ size = 18 }) {
  return (
    <motion.span aria-label="Loading" style={{ width: size, height: size, borderRadius: '50%', border: '2.5px solid currentColor', borderTopColor: 'transparent', display: 'inline-block' }}
      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} />
  );
}

export function Button({ loading, children, variant = 'primary', size, block, className = '', ...rest }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', className].filter(Boolean).join(' ');
  return (
    <motion.button whileTap={{ scale: 0.96 }} className={cls} disabled={loading || rest.disabled} {...rest}>
      {loading && <Spinner size={16} />}
      {children}
    </motion.button>
  );
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="error-text">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </label>
  );
}

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div className="modal" role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
            <div className="row spread">
              <h3>{title}</h3>
              <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, title, text, confirmLabel = 'Confirm', danger, loading, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="muted">{text}</p>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Keep it</Button>
        <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, cls: 'grey' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export function CategoryBadge({ category }) {
  const c = CATEGORIES[category];
  if (!c) return null;
  const Icon = c.icon;
  return <span className="badge" style={{ background: '#fff', color: c.dark }}><Icon size={13} />{c.label}</span>;
}

export function CountUp({ value, decimals = 0, suffix = '' }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${v.toFixed(decimals)}${suffix}`);
  useEffect(() => {
    const c = animate(mv, Number(value) || 0, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

export function Skeleton({ h = 20, w = '100%', r }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} />;
}

export function CardSkeletons({ n = 6 }) {
  return (
    <div className="grid-events">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <Skeleton h={170} r={0} />
          <div className="stack" style={{ padding: 18, gap: 10 }}><Skeleton h={22} w="70%" /><Skeleton h={14} w="90%" /><Skeleton h={14} w="50%" /></div>
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon = Ticket, title, children, action }) {
  return (
    <motion.div className="empty" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
      <Icon size={44} className="big" strokeWidth={1.5} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Empty title="That didn't load" action={onRetry && <Button variant="ghost" onClick={onRetry}>Try again</Button>}>{message}</Empty>
  );
}

export function Stars({ value, onChange, size = 28, readOnly }) {
  return (
    <div className="stars" role={readOnly ? 'img' : 'radiogroup'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button key={n} type="button" className={`star-btn ${n <= value ? 'on' : ''}`} disabled={readOnly}
          whileHover={readOnly ? undefined : { scale: 1.25, rotate: -8 }} whileTap={readOnly ? undefined : { scale: 0.85 }}
          onClick={() => onChange?.(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
          <svg width={size} height={size} viewBox="0 0 24 24" fill={n <= value ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" />
          </svg>
        </motion.button>
      ))}
    </div>
  );
}

/** One-off burst used when a registration is confirmed. */
export function Confetti({ show }) {
  const colors = ['#e0871a', '#35447a', '#b13337', '#0f8b8d', '#fff'];
  return (
    <AnimatePresence>
      {show && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 80, overflow: 'hidden' }} aria-hidden="true">
          {Array.from({ length: 46 }).map((_, i) => {
            const angle = (i / 46) * Math.PI * 2 + (i % 3) * 0.2;
            const dist = 160 + (i % 7) * 46;
            return (
              <motion.i key={i}
                style={{ position: 'absolute', left: '50%', top: '55%', width: 9 + (i % 3) * 3, height: 14, background: colors[i % colors.length], borderRadius: 2 }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 220, opacity: 0, rotate: 540 + i * 20 }}
                transition={{ duration: 1.5 + (i % 5) * 0.1, ease: [0.16, 0.8, 0.4, 1] }} />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
