import { motion } from 'framer-motion';

export default function AuthArt({ title, text }) {
  const dots = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) dots.push([c * 44 + (r % 2) * 22, r * 44]);
  return (
    <div className="auth-art">
      <svg viewBox="0 0 400 400" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {dots.map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r="3.5" fill="#fff" initial={{ opacity: 0.1 }} animate={{ opacity: [0.1, 0.5, 0.1] }} transition={{ duration: 3.2, delay: (i % 9) * 0.12 + Math.floor(i / 9) * 0.08, repeat: Infinity }} />
        ))}
      </svg>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 0.1 }}
        style={{ position: 'absolute', top: 34, left: 34, width: 96, height: 96, borderRadius: 26, background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 14px 34px rgba(0,0,0,.28)' }}>
        <img src="/broadcast-logo.png" alt="iTech Broadcast" width="72" height="72" style={{ objectFit: 'contain' }} />
      </motion.div>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
