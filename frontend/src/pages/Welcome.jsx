import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Field } from '../components/ui';
import { api, errMsg } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useToast } from '../lib/toast';
import { useDocTitle } from '../lib/hooks';

const DEPTS = ['CSE', 'IT', 'AI&DS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'BME', 'MBA', 'MCA'];

/** Shown after signup: department and year go on every registration sheet and the activity points record. */
export default function Welcome() {
  useDocTitle('Your details');
  const { user, setUser } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ department: user.department || '', yearOfStudy: user.yearOfStudy || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const first = !user.profileComplete;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { data } = await api.put('/users/profile', { rollNumber: user.rollNumber, ...f, yearOfStudy: Number(f.yearOfStudy) });
      setUser(data);
      toast('Details saved');
      nav(loc.state?.from || '/events', { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="container page" style={{ maxWidth: 560 }}>
      <div className="page-head"><div><h1 style={{ fontSize: 'clamp(2rem,4vw,2.8rem)' }}>{first ? `Welcome, ${user.name.split(' ')[0]}` : 'Your details'}</h1><p>Your department and year appear on registration sheets and your activity point record.</p></div></div>
      <form className="panel stack" onSubmit={submit} style={{ gap: 18 }}>
        <Field label="Register number"><input className="input" value={user.rollNumber} disabled style={{ opacity: 0.7 }} /></Field>
        <div className="form-grid">
          <Field label="Department"><input className="input" required list="depts" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /><datalist id="depts">{DEPTS.map((d) => <option key={d} value={d} />)}</datalist></Field>
          <Field label="Year of study">
            <select className="select" required value={f.yearOfStudy} onChange={(e) => setF({ ...f, yearOfStudy: e.target.value })}>
              <option value="">Select</option>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </Field>
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        <Button type="submit" size="lg" loading={busy}>{first ? 'Continue' : 'Save'}</Button>
      </form>
    </div>
  );
}
