import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthArt from '../components/AuthArt';
import { Button, Field } from '../components/ui';
import { useAuth, homeFor } from '../lib/auth';
import { errMsg } from '../lib/api';
import { useDocTitle } from '../lib/hooks';

export default function Login() {
  useDocTitle('Sign in');
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const u = await login(form.username.trim(), form.password);
      nav(u.profileComplete ? loc.state?.from || homeFor(u) : '/welcome', { replace: true, state: { from: loc.state?.from } });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="container auth">
      <AuthArt title="Your next iTech Broadcast event is one tap away." text="Sign in to register, keep your QR tickets and track your activity points." />
      <div className="auth-form">
        <h2>Welcome back</h2>
        <p className="muted" style={{ marginTop: 8 }}>New here? <Link to="/register" style={{ color: 'var(--iris)', fontWeight: 600 }}>Create an account</Link></p>
        <form onSubmit={submit}>
          <Field label="Username"><input className="input" required autoFocus autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          {error && <motion.p className="error-text" initial={{ x: -8 }} animate={{ x: [0, -8, 8, -5, 5, 0] }} transition={{ duration: 0.4 }} role="alert">{error}</motion.p>}
          <Button loading={busy} size="lg" type="submit">Sign in</Button>
        </form>
      </div>
    </div>
  );
}
