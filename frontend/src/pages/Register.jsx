import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthArt from '../components/AuthArt';
import { Button, Field } from '../components/ui';
import { useAuth } from '../lib/auth';
import { errMsg } from '../lib/api';
import { useDocTitle } from '../lib/hooks';

export default function Register() {
  useDocTitle('Create account');
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', rollNumber: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirmPassword) return setError("Passwords don't match");
    setBusy(true); setError('');
    try { await register(f); nav('/welcome', { replace: true }); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="container auth">
      <AuthArt title="One account for every iTech Broadcast event." text="Register in a tap, keep your QR tickets in one place, and watch your activity points add up." />
      <div className="auth-form">
        <h2>Create your account</h2>
        <p className="muted" style={{ marginTop: 8 }}>Already registered? <Link to="/login" style={{ color: 'var(--iris)', fontWeight: 600 }}>Sign in</Link></p>
        <form onSubmit={submit}>
          <Field label="Full name"><input className="input" required value={f.name} onChange={set('name')} autoComplete="name" /></Field>
          <Field label="Email"><input className="input" type="email" required value={f.email} onChange={set('email')} autoComplete="email" /></Field>
          <Field label="Register number"><input className="input" required value={f.rollNumber} onChange={set('rollNumber')} placeholder="e.g. 24CS045" /></Field>
          <Field label="Password" hint="At least 8 characters"><input className="input" type="password" minLength={8} required value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
          <Field label="Confirm password"><input className="input" type="password" minLength={8} required value={f.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" /></Field>
          {error && <p className="error-text" role="alert">{error}</p>}
          <Button loading={busy} size="lg" type="submit">Create account</Button>
        </form>
      </div>
    </div>
  );
}
