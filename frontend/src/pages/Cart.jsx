import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { errMsg, inr, TAX_RATE } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true); s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

export default function Cart() {
  const { items, setQty, clear, subtotal } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(null); // demo-payment modal (when no Razorpay keys are configured)
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  const done = () => { clear(); toast.success('Payment successful! Your order is confirmed 🎉'); nav('/orders'); };
  const verify = async (payload) => {
    try { await api.post('/orders/verify', payload); done(); } catch (e) { toast.error(errMsg(e)); }
  };

  const pay = async () => {
    if (address.trim().length < 8) return toast.error('Enter your full delivery address');
    setBusy(true);
    try {
      const { data } = await api.post('/orders/checkout', { address, items: items.map(({ kind, pizzaId, base, sauce, cheese, veggies, qty }) => ({ kind, pizzaId, base, sauce, cheese, veggies, qty })) });
      if (data.mock) { setDemo(data.order); setBusy(false); return; }
      if (!(await loadRazorpay())) throw new Error('Could not load Razorpay. Check your internet connection.');
      const rz = new window.Razorpay({
        key: data.razorpay.key, amount: data.razorpay.amount, currency: 'INR', name: 'Slice Pizza', description: 'Pizza order',
        order_id: data.razorpay.orderId, prefill: { name: user.name, email: user.email }, theme: { color: '#e23744' },
        handler: (r) => verify({ orderId: data.order._id, ...r }),
        modal: { ondismiss: () => toast('Payment cancelled', { icon: '↩️' }) },
      });
      rz.on('payment.failed', (r) => toast.error(r.error?.description || 'Payment failed'));
      rz.open();
    } catch (e) { toast.error(errMsg(e)); }
    setBusy(false);
  };

  if (!items.length) return (
    <div className="page"><div className="container empty"><div className="big">🛒</div><h2>Your cart is empty</h2>
      <p className="muted" style={{ margin: '8px 0 22px' }}>Add a pizza from the menu or build your own.</p>
      <Link to="/" className="btn btn-primary">Browse menu</Link></div></div>
  );

  return (
    <div className="page"><div className="container">
      <h1 style={{ fontSize: '2rem', marginBottom: 22 }}>Order summary</h1>
      <div className="summary">
        <div>
          <div className="card" style={{ padding: '6px 22px' }}>
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <motion.div key={it.key} className="line" layout exit={{ opacity: 0, height: 0 }} transition={{ duration: .25 }}>
                  <div className="thumb" style={{ fontSize: '2rem' }}>{it.kind === 'custom' ? '🧑‍🍳' : '🍕'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{it.name}</b>
                    <div className="muted" style={{ fontSize: '.82rem' }}>{it.details}</div>
                    <div className="price" style={{ fontSize: '.95rem', marginTop: 4 }}>{inr(it.unitPrice)}</div>
                  </div>
                  <div className="stepper"><button aria-label="Remove one" onClick={() => setQty(it.key, it.qty - 1)}>−</button><span>{it.qty}</span><button aria-label="Add one" onClick={() => setQty(it.key, it.qty + 1)}>+</button></div>
                  <b style={{ width: 70, textAlign: 'right' }}>{inr(it.unitPrice * it.qty)}</b>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="card" style={{ padding: 22, marginTop: 20 }}>
            <div className="field" style={{ margin: 0 }}>
              <label htmlFor="addr">Delivery address</label>
              <textarea id="addr" className="input" rows={3} placeholder="Flat no, building, street, area, city, pincode" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, position: 'sticky', top: 94 }}>
          <h3 style={{ marginBottom: 12 }}>Bill details</h3>
          <div className="row"><span>Item total</span><span>{inr(subtotal)}</span></div>
          <div className="row"><span>GST (5%)</span><span>{inr(tax)}</span></div>
          <div className="row"><span>Delivery</span><span style={{ color: 'var(--green)', fontWeight: 700 }}>FREE</span></div>
          <div className="row total"><span>To pay</span><span>{inr(total)}</span></div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 18, padding: 15 }} disabled={busy} onClick={pay}>{busy ? <span className="spinner" /> : `Pay ${inr(total)}`}</button>
          <p className="muted" style={{ fontSize: '.78rem', marginTop: 12, textAlign: 'center' }}>Secure payment by Razorpay (test mode)</p>
        </div>
      </div>

      <AnimatePresence>
        {demo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 16 }}>
            <motion.div initial={{ scale: .9, y: 20 }} animate={{ scale: 1, y: 0 }} className="card" style={{ padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '2.6rem' }}>💳</div>
              <h3 style={{ margin: '8px 0 4px' }}>Demo payment</h3>
              <p className="muted" style={{ fontSize: '.9rem' }}>Razorpay keys aren't set, so this simulates the test checkout. Paying <b>{inr(demo.total)}</b>.</p>
              <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
                <button className="btn btn-primary" style={{ background: 'var(--green)', boxShadow: 'none' }} onClick={() => { const o = demo; setDemo(null); verify({ orderId: o._id, mock: true }); }}>Success</button>
                <button className="btn btn-ghost" onClick={() => { setDemo(null); toast.error('Payment failed'); }}>Failure</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div></div>
  );
}
