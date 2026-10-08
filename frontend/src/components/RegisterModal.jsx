import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users } from 'lucide-react';
import { Button, Field, Modal } from './ui';

const emptyMember = () => ({ name: '', yearOfStudy: '' });
const DEFAULT_MAX = 10;

/** Collects a mobile number for every registration, plus a team name and roster when the event is a team event. */
export default function RegisterModal({ open, onClose, event, onSubmit, busy }) {
  const [mobile, setMobile] = useState('');
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState([emptyMember()]);
  const [error, setError] = useState('');

  const setMember = (i, patch) => setMembers((m) => m.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const max = event.maxTeamSize || DEFAULT_MAX;
  const addMember = () => setMembers((m) => (m.length < max ? [...m, emptyMember()] : m));
  const removeMember = (i) => setMembers((m) => m.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\+?[0-9\s-]{10,15}$/.test(mobile.trim())) return setError('Enter a valid mobile number');
    if (event.teamEvent) {
      if (!teamName.trim()) return setError('Enter a team name');
      if (members.some((m) => !m.name.trim() || !m.yearOfStudy)) return setError('Fill in every member\u2019s name and year');
      if (members.length > max) return setError(`Teams can have at most ${max} members`);
    }
    await onSubmit({
      mobileNumber: mobile.trim(),
      teamName: event.teamEvent ? teamName.trim() : undefined,
      members: event.teamEvent ? members.map((m) => ({ name: m.name.trim(), yearOfStudy: Number(m.yearOfStudy) })) : undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={event.teamEvent ? 'Register your team' : 'Register'}>
      <form className="stack" onSubmit={submit} style={{ gap: 16 }}>
        <Field label="Mobile number" hint="So we can reach you about this event"><input className="input" type="tel" required autoFocus value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile number" /></Field>

        {event.teamEvent && (
          <>
            <Field label="Team name"><input className="input" required value={teamName} onChange={(e) => setTeamName(e.target.value)} /></Field>
            <div className="field">
              <span className="label row" style={{ gap: 6 }}><Users size={15} />Team members <span className="faint" style={{ fontWeight: 500 }}>(up to {max})</span></span>
              <div className="stack" style={{ gap: 10 }}>
                {members.map((m, i) => (
                  <motion.div key={i} className="row" style={{ gap: 8, flexWrap: 'nowrap' }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                    <input className="input" placeholder={`Member ${i + 1} name`} value={m.name} onChange={(e) => setMember(i, { name: e.target.value })} style={{ flex: 2 }} />
                    <select className="select" value={m.yearOfStudy} onChange={(e) => setMember(i, { yearOfStudy: e.target.value })} style={{ flex: 1 }}>
                      <option value="">Year</option>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>Y{y}</option>)}
                    </select>
                    {members.length > 1 && <Button type="button" variant="danger-ghost" size="sm" onClick={() => removeMember(i)} aria-label="Remove member"><Trash2 size={14} /></Button>}
                  </motion.div>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addMember} disabled={members.length >= max} style={{ marginTop: 4, width: 'fit-content' }}><Plus size={14} />Add member</Button>
            </div>
          </>
        )}

        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Confirm registration</Button>
        </div>
      </form>
    </Modal>
  );
}
