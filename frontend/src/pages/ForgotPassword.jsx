import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import AuthShell from '../components/AuthShell';
import Field from '../components/Field';
import DevLink from '../components/DevLink';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState(null);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/auth/forgot-password', { email }); setRes(data); }
    catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };
  return (
    <AuthShell title="Forgot password?" subtitle="We'll email you a link to set a new one.">
      {res ? (<><p className="badge badge-green" style={{ padding: '10px 14px' }}>{res.message}</p><DevLink link={res.devLink} /></>) : (
        <form onSubmit={submit}>
          <Field label="Email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? <span className="spinner" /> : 'Send reset link'}</button>
        </form>
      )}
      <p style={{ marginTop: 22 }}><Link to="/login" className="link">Back to log in</Link></p>
    </AuthShell>
  );
}
