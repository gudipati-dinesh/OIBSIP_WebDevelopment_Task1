import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';

export default function ResetPassword() {
  const { token } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState({ password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (p.password !== p.confirm) return toast.error('Passwords do not match');
    setBusy(true);
    try { const { data } = await api.post(`/auth/reset-password/${token}`, { password: p.password }); toast.success(data.message); nav('/login'); }
    catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };
  return (
    <AuthShell title="Set a new password" subtitle="Choose something you'll remember.">
      <form onSubmit={submit}>
        <Field label="New password" name="password" type="password" minLength={6} value={p.password} onChange={(e) => setP({ ...p, password: e.target.value })} required />
        <Field label="Confirm password" name="confirm" type="password" minLength={6} value={p.confirm} onChange={(e) => setP({ ...p, confirm: e.target.value })} required />
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <span className="spinner" /> : 'Update password'}</button>
      </form>
      <p style={{ marginTop: 22 }}><Link to="/login" className="link">Back to log in</Link></p>
    </AuthShell>
  );
}
