import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Trash2 } from 'lucide-react';
import EventCard from '../components/EventCard';
import { Button, Field, Skeleton } from '../components/ui';
import { api, errMsg } from '../lib/api';
import { useToast } from '../lib/toast';
import { useDocTitle } from '../lib/hooks';
import { CATEGORIES, toInputDateTime } from '../lib/format';

const EMPTY = { title: '', description: '', category: 'WEEKLY', venue: '', eventDate: '', startTime: '17:00', endTime: '18:30', capacity: 60, registrationDeadline: '', posterUrl: '', pointsEligible: true, teamEvent: false, maxTeamSize: 4, whatsappLink: '' };

export default function EventForm() {
  const { id } = useParams();
  const editing = !!id;
  useDocTitle(editing ? 'Edit event' : 'New event');
  const toast = useToast();
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [f, setF] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api.get(`/events/${id}`).then((r) => {
      const e = r.data;
      setF({ ...EMPTY, ...e, description: e.description || '', posterUrl: e.posterUrl || '', startTime: e.startTime.slice(0, 5), endTime: e.endTime.slice(0, 5), registrationDeadline: toInputDateTime(e.registrationDeadline) });
    }).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const preview = useMemo(() => ({ ...f, id: id || 0, capacity: Number(f.capacity) || 1, confirmedCount: 0, eventDate: f.eventDate || new Date().toISOString().slice(0, 10) }), [f, id]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/files/posters', body);
      setF((s) => ({ ...s, posterUrl: data.url }));
    } catch (err) { toast(errMsg(err), 'error'); } finally { setUploading(false); e.target.value = ''; }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    const payload = { ...f, capacity: Number(f.capacity), startTime: f.startTime.length === 5 ? `${f.startTime}:00` : f.startTime, endTime: f.endTime.length === 5 ? `${f.endTime}:00` : f.endTime, registrationDeadline: f.registrationDeadline.length === 16 ? `${f.registrationDeadline}:00` : f.registrationDeadline };
    try {
      payload.maxTeamSize = payload.teamEvent ? Number(payload.maxTeamSize) : null;
      const { data } = editing ? await api.put(`/events/${id}`, payload) : await api.post('/events', payload);
      toast(editing ? 'Event updated' : 'Event published');
      nav(`/admin/events/${data.id}`);
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  if (loading) return <div className="container page"><Skeleton h={420} r={20} /></div>;

  return (
    <div className="container page">
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}>{editing ? 'Edit event' : 'New event'}</h1><p>The card on the right is exactly what students will see in the event list. Publishing is immediate.</p></div></div>
      <div className="two-col" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(280px,1fr)', alignItems: 'start' }}>
        <form className="panel stack" onSubmit={submit} style={{ gap: 18 }}>
          <Field label="Title"><input className="input" required value={f.title} onChange={set('title')} maxLength={120} placeholder="e.g. Weekly Broadcast Meet" /></Field>
          <Field label="Category">
            <div className="row" style={{ gap: 8 }}>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <button type="button" key={k} className={`chip ${f.category === k ? 'active' : ''}`} onClick={() => setF({ ...f, category: k })} style={f.category === k ? { background: v.color } : undefined}>
                  <span className="t"><v.icon size={14} />{v.label}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="Description"><textarea className="textarea" value={f.description} onChange={set('description')} placeholder="What will happen, who it's for, what to bring" maxLength={4000} /></Field>
          <div className="form-grid">
            <Field label="Venue"><input className="input" required value={f.venue} onChange={set('venue')} /></Field>
            <Field label="Capacity"><input className="input" type="number" min={1} required value={f.capacity} onChange={set('capacity')} /></Field>
            <Field label="Date"><input className="input" type="date" required value={f.eventDate} onChange={set('eventDate')} /></Field>
            <Field label="Registration closes" hint="Must be before the event starts"><input className="input" type="datetime-local" required value={f.registrationDeadline} onChange={set('registrationDeadline')} /></Field>
            <Field label="Starts"><input className="input" type="time" required value={f.startTime} onChange={set('startTime')} /></Field>
            <Field label="Ends"><input className="input" type="time" required value={f.endTime} onChange={set('endTime')} /></Field>
          </div>
          <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={f.pointsEligible} onChange={(e) => setF({ ...f, pointsEligible: e.target.checked })} />
            <span>Award activity points for attending this event (2 points, up to 3 events a semester)</span>
          </label>
          <Field label="Registration type" hint="Team events ask each registrant for a team name and roster; individual events only ask for a mobile number.">
            <div className="row" style={{ gap: 8 }}>
              <button type="button" className={`chip ${!f.teamEvent ? 'active' : ''}`} onClick={() => setF({ ...f, teamEvent: false })}><span className="t">Individual</span></button>
              <button type="button" className={`chip ${f.teamEvent ? 'active' : ''}`} onClick={() => setF({ ...f, teamEvent: true })}><span className="t">Team</span></button>
            </div>
          </Field>
          {f.teamEvent && (
            <Field label="Maximum team size" hint="The most members allowed on one team's roster">
              <input className="input" type="number" min={1} max={30} required style={{ maxWidth: 160 }}
                value={f.maxTeamSize} onChange={(e) => setF({ ...f, maxTeamSize: e.target.value })} />
            </Field>
          )}
          <Field label="WhatsApp group link (optional)" hint="Shown to students right after they register, so they can join the event's WhatsApp group in one tap.">
            <input className="input" type="url" placeholder="https://chat.whatsapp.com/..." value={f.whatsappLink} onChange={(e) => setF({ ...f, whatsappLink: e.target.value })} />
          </Field>
          <Field label="Poster (optional)" hint="PNG, JPG, WEBP or GIF up to 5 MB. Without one we generate artwork from the category.">
            <div className="upload">
              <ImagePlus size={26} color="var(--iris)" />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={upload} style={{ display: 'none' }} />
              <Button type="button" variant="ghost" size="sm" loading={uploading} onClick={() => fileRef.current.click()}>{f.posterUrl ? 'Replace image' : 'Choose image'}</Button>
              {f.posterUrl && <Button type="button" variant="danger-ghost" size="sm" onClick={() => setF({ ...f, posterUrl: '' })}><Trash2 size={14} />Remove</Button>}
            </div>
          </Field>
          {error && <p className="error-text" role="alert">{error}</p>}
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={() => nav(-1)}>Discard</Button>
            <Button type="submit" size="lg" loading={busy}>{editing ? 'Save changes' : 'Publish event'}</Button>
          </div>
        </form>
        <div className="preview-col"><EventCard event={preview} preview /></div>
      </div>
    </div>
  );
}
