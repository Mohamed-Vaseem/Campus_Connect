import { CATEGORIES } from '../lib/format';
import { toAssetUrl } from '../lib/api';

// Small deterministic random generator so a given event always gets the same poster.
function rng(seed) {
  let s = 0;
  for (const c of String(seed)) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Generated poster: each category has its own pattern so the grid is easy to scan. */
export default function EventArt({ event, className }) {
  if (event.posterUrl) return <img className={className} src={toAssetUrl(event.posterUrl)} alt="" loading="lazy" />;
  const cat = CATEGORIES[event.category] || CATEGORIES.OTHER;
  const r = rng(event.title + event.id);
  const id = `g${event.id ?? 'x'}${event.category}`;
  const shapes = [];

  if (event.category === 'FESTIVAL') {
    // pulli kolam / pookalam feel: a diamond lattice of dots joined by soft loops
    for (let row = 0; row < 7; row++) {
      const n = row < 4 ? row * 2 + 1 : (6 - row) * 2 + 1;
      for (let i = 0; i < n; i++) {
        const x = 200 - (n - 1) * 20 + i * 40;
        const y = 30 + row * 40;
        shapes.push(<circle key={`d${row}-${i}`} cx={x} cy={y} r="4.5" fill="#fff" opacity="0.9" />);
        if (i < n - 1) shapes.push(<path key={`l${row}-${i}`} d={`M${x} ${y} q20 -22 40 0`} stroke="#ffd166" strokeWidth="2.5" fill="none" opacity="0.85" />);
      }
    }
  } else if (event.category === 'WEEKLY') {
    for (let i = 0; i < 26; i++) {
      const x = r() * 380 + 10, y = r() * 230 + 10, w = 14 + r() * 60;
      shapes.push(<rect key={i} x={x} y={y} width={w} height="7" rx="3.5" fill="#fff" opacity={0.15 + r() * 0.5} />);
      shapes.push(<circle key={`c${i}`} cx={x} cy={y + 3.5} r="6" fill="#e0871a" opacity={r() > 0.7 ? 0.95 : 0} />);
    }
  } else if (event.category === 'CONTEST') {
    for (let i = 0; i < 7; i++) shapes.push(<ellipse key={i} cx="300" cy="250" rx={60 + i * 42} ry={40 + i * 30} fill="none" stroke="#fff" strokeWidth={i % 2 ? 3 : 10} opacity={0.12 + i * 0.05} />);
  } else if (event.category === 'WORKSHOP') {
    for (let i = 0; i < 16; i++) {
      const x = r() * 360, y = r() * 220, s = 30 + r() * 70;
      shapes.push(<polygon key={i} points={`${x},${y + s} ${x + s / 2},${y} ${x + s},${y + s}`} fill="#fff" opacity={0.08 + r() * 0.3} />);
    }
  } else if (event.category === 'TALK') {
    for (let i = 0; i < 34; i++) {
      const h = 20 + r() * 150;
      shapes.push(<rect key={i} x={10 + i * 11.4} y={125 - h / 2} width="6" height={h} rx="3" fill="#fff" opacity={0.25 + r() * 0.6} />);
    }
  } else {
    for (let i = 0; i < 6; i++) shapes.push(<circle key={i} cx={r() * 400} cy={r() * 250} r={30 + r() * 80} fill={i % 2 ? '#e0871a' : '#fff'} opacity={0.14 + r() * 0.2} />);
  }

  return (
    <svg className={className} viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={cat.color} />
          <stop offset="1" stopColor={cat.dark} />
        </linearGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#${id})`} />
      {shapes}
    </svg>
  );
}
