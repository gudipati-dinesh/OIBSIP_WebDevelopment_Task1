import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';
import DevLink from '../components/DevLink';

export default function Login() {
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [devLink, setDevLink] = useState();
  const { login } = useAuth();
  const nav = useNavigate();
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const { data } = await api.post('/auth/login', f);
      login(data.token, data.user); toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`); nav('/');
    } catch (err) { toast.error(errMsg(err)); setUnverified(!!err.response?.data?.needsVerification); }
    setBusy(false);
  };
  const resend = async () => {
    const { data } = await api.post('/auth/resend-verification', { email: f.email });
    toast.success(data.message); setDevLink(data.devLink);
  };

  return (
    <AuthShell title="Log in" subtitle="Enter your details to order your next pizza.">
      <form onSubmit={submit}>
        <Field label="Email" name="email" type="email" value={f.email} onChange={set} placeholder="you@example.com" required autoComplete="email" />
        <Field label="Password" name="password" type="password" value={f.password} onChange={set} placeholder="Your password" required autoComplete="current-password" />
        <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 18 }}><Link to="/forgot-password" className="link">Forgot password?</Link></div>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <span className="spinner" /> : 'Log in'}</button>
      </form>
      {unverified && <p style={{ marginTop: 14 }}>Didn't get the email? <button className="link" onClick={resend}>Resend verification link</button></p>}
      <DevLink link={devLink} />
      <p className="muted" style={{ marginTop: 22 }}>New to Slice? <Link to="/register" className="link">Create an account</Link></p>
    </AuthShell>
  );
}
