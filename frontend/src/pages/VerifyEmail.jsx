import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import AuthShell from '../components/AuthShell';

export default function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    api.get(`/auth/verify-email/${token}`).then((r) => setState({ ok: true, msg: r.data.message }))
      .catch((e) => setState({ ok: false, msg: errMsg(e) }));
  }, [token]);
  return (
    <AuthShell title={state.loading ? 'Verifying…' : state.ok ? 'Email verified ✅' : 'Link problem'} subtitle={state.msg || 'Hold on a second.'}>
      {!state.loading && <Link to="/login" className="btn btn-primary btn-block">Go to log in</Link>}
    </AuthShell>
  );
}
