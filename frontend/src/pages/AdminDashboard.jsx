import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { connectSocket, errMsg, inr } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery'];
const CATS = [['base', 'Pizza bases', '🍞'], ['sauce', 'Sauces', '🍅'], ['cheese', 'Cheeses', '🧀'], ['veggie', 'Vegetables', '🥬']];

function InvRow({ item, onSaved }) {
  const [qty, setQty] = useState(item.quantity);
  const [th, setTh] = useState(item.threshold);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setQty(item.quantity); setTh(item.threshold); }, [item.quantity, item.threshold]);
  const low = item.quantity < item.threshold;
  const dirty = Number(qty) !== item.quantity || Number(th) !== item.threshold;
  const pct = Math.min(100, (item.quantity / Math.max(item.threshold * 3, 1)) * 100);

  const save = async (patch) => {
    setBusy(true);
    try { const { data } = await api.patch(`/inventory/${item._id}`, patch); onSaved(data); toast.success(`${item.name} updated`); }
    catch (e) { toast.error(errMsg(e)); }
    setBusy(false);
  };
  return (
    <div className="inv-row">
      <div><b>{item.emoji} {item.name}</b> {low && <span className="badge badge-red">Low stock</span>}<div className="muted" style={{ fontSize: '.8rem' }}>{inr(item.price)} each</div></div>
      <div>
        <b style={{ color: low ? 'var(--red)' : 'var(--ink)' }}>{item.quantity}</b> <span className="muted">in stock</span>
        <div className="bar"><div style={{ width: pct + '%', background: low ? 'var(--red)' : 'var(--green)' }} /></div>
      </div>
      <div><div className="muted" style={{ fontSize: '.72rem', marginBottom: 3 }}>Set stock</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }} onClick={() => save({ quantity: item.quantity + 10 })} disabled={busy}>+10</button>
          <input className="mini-input" type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} aria-label={`${item.name} stock`} />
        </div></div>
      <div className="hide-sm"><div className="muted" style={{ fontSize: '.72rem', marginBottom: 3 }}>Alert below</div>
        <input className="mini-input" type="number" min="0" value={th} onChange={(e) => setTh(e.target.value)} aria-label={`${item.name} threshold`} /></div>
      <button className="btn btn-primary btn-sm" disabled={!dirty || busy} onClick={() => save({ quantity: Number(qty), threshold: Number(th) })}>Save</button>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState(null);
  const [inv, setInv] = useState(null);

  const loadInv = useCallback(() => api.get('/inventory').then((r) => setInv(r.data.items)).catch((e) => toast.error(errMsg(e))), []);
  useEffect(() => {
    api.get('/orders').then((r) => setOrders(r.data)).catch((e) => toast.error(errMsg(e)));
    loadInv();
    const socket = connectSocket();
    socket.on('order:new', (o) => { setOrders((c) => [o, ...(c || [])]); toast(`New order #${o._id.slice(-6).toUpperCase()} · ${inr(o.total)}`, { icon: '🔔' }); });
    socket.on('inventory:refresh', loadInv);
    socket.on('inventory:update', (item) => setInv((c) => c && c.map((x) => (x._id === item._id ? item : x))));
    return () => socket.disconnect();
  }, [loadInv]);

  const setStatus = async (o, status) => {
    try { const { data } = await api.patch(`/orders/${o._id}/status`, { status }); setOrders((c) => c.map((x) => (x._id === o._id ? data : x))); toast.success(`Marked "${status}"`); }
    catch (e) { toast.error(errMsg(e)); }
  };
  const alertNow = async () => {
    try { const { data } = await api.post('/inventory/check-now'); toast.success(data.alerted ? `Email sent for ${data.alerted} item(s)` : 'Nothing is below its threshold'); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const lowCount = (inv || []).filter((i) => i.quantity < i.threshold).length;
  const open = (orders || []).filter((o) => o.status !== 'Sent to Delivery').length;
  const revenue = (orders || []).reduce((s, o) => s + o.total, 0);

  return (
    <>
      <header className="admin-top"><div className="container nav-in">
        <div className="logo" style={{ color: '#fff' }}>🍕 Slice<span className="dot">.</span> <span className="badge badge-red" style={{ marginLeft: 6 }}>Admin</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span className="hide-sm" style={{ opacity: .75 }}>{user.email}</span>
          <button className="btn btn-ghost btn-sm" style={{ color: '#fff', borderColor: '#555', background: 'transparent' }} onClick={() => { logout(); nav('/admin/login'); }}>Log out</button></div>
      </div></header>

      <div className="page"><div className="container">
        <div className="stats">
          <div className="card stat"><span className="muted">Open orders</span><b>{orders ? open : '–'}</b></div>
          <div className="card stat"><span className="muted">Total orders</span><b>{orders ? orders.length : '–'}</b></div>
          <div className="card stat"><span className="muted">Revenue</span><b>{orders ? inr(revenue) : '–'}</b></div>
          <div className="card stat"><span className="muted">Low-stock items</span><b style={{ color: lowCount ? 'var(--red)' : 'var(--green)' }}>{inv ? lowCount : '–'}</b></div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'orders' ? 'on' : ''}`} onClick={() => setTab('orders')}>Orders{open > 0 && ` (${open})`}</button>
          <button className={`tab ${tab === 'inventory' ? 'on' : ''}`} onClick={() => setTab('inventory')}>Inventory{lowCount > 0 && ` · ${lowCount} low`}</button>
        </div>

        {tab === 'orders' && (
          <div>
            {!orders ? <div className="center-screen"><div className="spinner dark" /></div> : !orders.length ? <div className="empty"><div className="big">📭</div><h3>No orders yet</h3><p className="muted">New paid orders appear here instantly.</p></div> : (
              <AnimatePresence initial={false}>
                {orders.map((o) => (
                  <motion.div key={o._id} layout initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="card order-card">
                    <div className="order-head">
                      <div><b>#{o._id.slice(-6).toUpperCase()}</b> · {o.user?.name} <span className="muted">({o.user?.email})</span>
                        <div className="muted" style={{ fontSize: '.82rem' }}>{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · 📍 {o.address}</div></div>
                      <b className="price">{inr(o.total)}</b>
                    </div>
                    {o.items.map((it, k) => (
                      <div key={k} style={{ marginBottom: 8 }}><b>{it.qty} × {it.name}</b>
                        <div className="chips-sm" style={{ marginTop: 4 }}>{it.ingredients.map((g, j) => <span key={j} className="badge badge-grey">{g.emoji} {g.name}</span>)}</div></div>
                    ))}
                    <div className="status-btns" style={{ marginTop: 14 }}>
                      {STATUSES.map((s) => <button key={s} className={o.status === s ? 'on' : ''} onClick={() => o.status !== s && setStatus(o, s)}>{s}</button>)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {tab === 'inventory' && (
          !inv ? <div className="center-screen"><div className="spinner dark" /></div> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <p className="muted">Stock drops automatically after every paid order. A scheduled job emails you when anything falls below its alert level.</p>
                <button className="btn btn-dark btn-sm" onClick={alertNow}>Send low-stock email now</button>
              </div>
              {CATS.map(([cat, title, em]) => (
                <div key={cat} className="inv-group">
                  <h3 style={{ marginBottom: 10 }}>{em} {title}</h3>
                  <div className="card">{inv.filter((i) => i.category === cat).map((item) => <InvRow key={item._id} item={item} onSaved={(n) => setInv((c) => c.map((x) => (x._id === n._id ? n : x)))} />)}</div>
                </div>
              ))}
            </>
          )
        )}
      </div></div>
    </>
  );
}
