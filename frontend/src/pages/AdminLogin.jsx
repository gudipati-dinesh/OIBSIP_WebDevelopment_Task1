import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';

export default function AdminLogin() {
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/auth/admin/login', f); login(data.token, data.user); nav('/admin'); }
    catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };
  return (
    <AuthShell admin title="Admin sign in" subtitle="Restricted area. Authorised staff only.">
      <form onSubmit={submit}>
        <Field label="Admin email" name="email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <Field label="Password" name="password" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <button className="btn btn-dark btn-block" disabled={busy}>{busy ? <span className="spinner" /> : 'Sign in to admin'}</button>
      </form>
    </AuthShell>
  );
}
