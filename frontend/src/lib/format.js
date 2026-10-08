import { Radio, Sparkles, Trophy, Wrench, Mic2, Clapperboard } from 'lucide-react';

export const CATEGORIES = {
  WEEKLY: { label: 'Weekly event', color: '#35447a', dark: '#1e2a5c', icon: Radio },
  FESTIVAL: { label: 'Festival', color: '#d9770a', dark: '#7a3f00', icon: Sparkles },
  WORKSHOP: { label: 'Workshop', color: '#0f8b8d', dark: '#084f52', icon: Wrench },
  TALK: { label: "Let's Talk", color: '#6b46a3', dark: '#3b2266', icon: Mic2 },
  CONTEST: { label: 'Contest', color: '#b13337', dark: '#6d1518', icon: Trophy },
  OTHER: { label: 'Other', color: '#4a4e73', dark: '#22243d', icon: Clapperboard },
};

export const STATUS = {
  PUBLISHED: { label: 'Live', cls: 'teal' },
  CANCELLED: { label: 'Cancelled', cls: 'grey' },
  COMPLETED: { label: 'Completed', cls: 'grey' },
};

const d = (s) => new Date(`${s}T00:00:00`);
export const fmtDay = (s) => d(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtLong = (s) => d(s).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const dayNum = (s) => d(s).getDate();
export const monthShort = (s) => d(s).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
export const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export const fmtStamp = (s) =>
  new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const timeAgo = (s) => {
  const mins = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};
export const isPast = (ev) => new Date(`${ev.eventDate}T${ev.endTime}`) < new Date();
export const seatsLeft = (ev) => Math.max(0, ev.capacity - ev.confirmedCount);
export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const toInputDateTime = (iso) => (iso ? iso.slice(0, 16) : '');
export const fmtDateTime = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');
