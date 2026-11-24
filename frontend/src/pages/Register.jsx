import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';
import DevLink from '../components/DevLink';

export default function Register() {
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/auth/register', f); setDone(data); toast.success('Account created'); }
    catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };

  if (done) return (
    <AuthShell title="Check your inbox 📬" subtitle={done.message}>
      <DevLink link={done.devLink} />
      <Link to="/login" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>Go to log in</Link>
    </AuthShell>
  );
  return (
    <AuthShell title="Create account" subtitle="Sign up in a minute and start ordering.">
      <form onSubmit={submit}>
        <Field label="Full name" name="name" value={f.name} onChange={set} placeholder="Aarav Sharma" required />
        <Field label="Email" name="email" type="email" value={f.email} onChange={set} placeholder="you@example.com" required />
        <Field label="Password" name="password" type="password" value={f.password} onChange={set} placeholder="At least 6 characters" minLength={6} required />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <span className="spinner" /> : 'Create account'}</button>
      </form>
      <p className="muted" style={{ marginTop: 22 }}>Already have an account? <Link to="/login" className="link">Log in</Link></p>
    </AuthShell>
  );
}
