import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FLOATS = [['🍕', '12%', '58%', 0], ['🧀', '68%', '70%', 0.6], ['🍅', '30%', '82%', 1.2], ['🌿', '74%', '44%', 1.8], ['🍄', '8%', '36%', 2.4]];

export default function AuthShell({ children, title, subtitle, admin = false }) {
  return (
    <div className={`auth ${admin ? 'admin' : ''}`}>
      <div className="auth-hero">
        <Link to={admin ? '/admin/login' : '/login'} className="logo" style={{ color: '#fff' }}>🍕 Slice.{admin && ' Admin'}</Link>
        {FLOATS.map(([e, l, t, d], i) => (
          <motion.span key={i} className="float" style={{ left: l, top: t, fontSize: i === 0 ? '5.5rem' : '3rem' }}
            animate={{ y: [0, -18, 0], rotate: [0, 8, -6, 0] }} transition={{ repeat: Infinity, duration: 5, delay: d, ease: 'easeInOut' }}>{e}</motion.span>
        ))}
        <div>
          <h1>{admin ? 'Run the kitchen from one screen.' : 'Hot, cheesy and at your door in minutes.'}</h1>
          <p>{admin ? 'Track incoming orders, update their status and keep every ingredient stocked.' : 'Pick a favourite or build your own pizza, base to toppings, and track it live.'}</p>
        </div>
      </div>
      <div className="auth-form">
        <motion.div className="auth-box" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <h2>{title}</h2>
          <p className="muted" style={{ marginBottom: 24 }}>{subtitle}</p>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
