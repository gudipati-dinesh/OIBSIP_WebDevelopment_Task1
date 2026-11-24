import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

export default function ProtectedRoute({ role = 'user', children, withNav = true }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen"><div className="spinner dark" /></div>;
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return <>{role === 'user' && withNav && <Navbar />}{children}</>;
}
