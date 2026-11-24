import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { inr } from '../api';
import StatusTracker from '../components/StatusTracker';
import useOrders from '../components/useOrders';

export default function Orders() {
  const orders = useOrders();
  if (!orders) return <div className="center-screen"><div className="spinner dark" /></div>;
  return (
    <div className="page"><div className="container" style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 6 }}>My orders</h1>
      <p className="muted" style={{ marginBottom: 22 }}><span className="live-dot" />Status updates appear here automatically.</p>
      {!orders.length && <div className="empty"><div className="big">🍽️</div><h3>No orders yet</h3><p className="muted" style={{ margin: '8px 0 20px' }}>Your first pizza is waiting.</p><Link to="/" className="btn btn-primary">Order now</Link></div>}
      {orders.map((o, i) => (
        <motion.div key={o._id} className="card order-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}>
          <div className="order-head">
            <div><b>Order #{o._id.slice(-6).toUpperCase()}</b><div className="muted" style={{ fontSize: '.85rem' }}>{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div></div>
            <span className={`badge ${o.status === 'Sent to Delivery' ? 'badge-green' : 'badge-orange'}`}>{o.status}</span>
          </div>
          <StatusTracker status={o.status} />
          <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            {o.items.map((it, k) => (
              <div key={k} className="row"><span>{it.qty} × {it.name}<div className="muted" style={{ fontSize: '.78rem' }}>{it.ingredients.map((g) => g.name).join(', ')}</div></span><span>{inr(it.unitPrice * it.qty)}</span></div>
            ))}
            <div className="row total" style={{ fontSize: '1rem' }}><span>Paid (incl. GST)</span><span>{inr(o.total)}</span></div>
            <div className="muted" style={{ fontSize: '.82rem' }}>📍 {o.address}</div>
          </div>
        </motion.div>
      ))}
    </div></div>
  );
}
