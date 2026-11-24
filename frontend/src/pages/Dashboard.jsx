import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { errMsg, inr } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import PizzaArt from '../components/PizzaArt';
import StatusTracker from '../components/StatusTracker';
import useOrders from '../components/useOrders';

function PizzaCard({ p, i }) {
  const { items, add, setQty } = useCart();
  const key = 'ready:' + p._id;
  const inCart = items.find((c) => c.key === key);
  const ing = p.ingredients;
  return (
    <motion.div className="pizza-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
      <div className="art">
        <span className={`badge tag ${p.spicy ? 'badge-red' : 'badge-orange'}`}>{p.spicy ? '🌶️ ' : ''}{p.tag}</span>
        <span className="rate">★ {p.rating}</span>
        <PizzaArt base={ing.base} sauce={ing.sauce} cheese={ing.cheese} veggies={ing.veggies} size={190} animate={false} />
      </div>
      <div className="body">
        <h3>{p.name}</h3>
        <p className="desc">{p.description}</p>
        <div className="foot">
          <span className="price">{inr(p.price)}</span>
          {!p.available ? <span className="badge badge-grey">Sold out</span> : inCart ? (
            <div className="stepper"><button aria-label="Remove one" onClick={() => setQty(key, inCart.qty - 1)}>−</button><span>{inCart.qty}</span><button aria-label="Add one" onClick={() => setQty(key, inCart.qty + 1)}>+</button></div>
          ) : (
            <button className="btn btn-ghost btn-sm" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
              onClick={() => { add({ key, kind: 'ready', pizzaId: p._id, name: p.name, unitPrice: p.price, details: [ing.base, ing.sauce, ing.cheese, ...ing.veggies].map((x) => x.name).join(', ') }); toast.success(`${p.name} added`); }}>
              Add +
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { count, subtotal } = useCart();
  const [pizzas, setPizzas] = useState(null);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('All');
  const orders = useOrders();

  useEffect(() => { api.get('/pizzas').then((r) => setPizzas(r.data)).catch((e) => toast.error(errMsg(e))); }, []);
  const tags = useMemo(() => ['All', ...new Set((pizzas || []).map((p) => p.tag))], [pizzas]);
  const shown = (pizzas || []).filter((p) => (tag === 'All' || p.tag === tag) && p.name.toLowerCase().includes(q.toLowerCase()));
  const active = (orders || []).filter((o) => o.status !== 'Sent to Delivery').concat((orders || []).filter((o) => o.status === 'Sent to Delivery').slice(0, 1));

  return (
    <div className="page"><div className="container">
      <motion.section className="hero" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .5 }}>
        <div>
          <h1>Hungry, {user.name.split(' ')[0]}? Pizza's a few taps away.</h1>
          <p>Pick a house favourite or build your own from five bases, five sauces and a pile of fresh veggies.</p>
          <div className="search">
            <span>🔍</span>
            <input aria-label="Search pizzas" placeholder="Search for Farmhouse, Paneer…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="hero-art">
          {pizzas?.[1] && <PizzaArt base={pizzas[1].ingredients.base} sauce={pizzas[1].ingredients.sauce} cheese={pizzas[1].ingredients.cheese} veggies={pizzas[1].ingredients.veggies} size={260} spin />}
        </div>
      </motion.section>

      {active.length > 0 && (
        <>
          <div className="section-title"><h2><span className="live-dot" />Your orders, live</h2><Link to="/orders" className="link">All orders</Link></div>
          {active.map((o) => (
            <div key={o._id} className="card order-card">
              <div className="order-head">
                <div><b>{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</b><div className="muted" style={{ fontSize: '.85rem' }}>#{o._id.slice(-6).toUpperCase()} · {inr(o.total)}</div></div>
                <span className={`badge ${o.status === 'Sent to Delivery' ? 'badge-green' : 'badge-orange'}`}>{o.status}</span>
              </div>
              <StatusTracker status={o.status} />
            </div>
          ))}
        </>
      )}

      <div className="section-title"><h2>Menu</h2><span className="muted">{shown.length} pizzas</span></div>
      <div className="chips">{tags.map((t) => <button key={t} className={`chip ${tag === t ? 'on' : ''}`} onClick={() => setTag(t)}>{t}</button>)}</div>
      {!pizzas ? <div className="center-screen"><div className="spinner dark" /></div> : shown.length ? (
        <div className="grid">{shown.map((p, i) => <PizzaCard key={p._id} p={p} i={i} />)}</div>
      ) : <div className="empty"><div className="big">🔎</div><h3>No pizza matches "{q}"</h3><p className="muted">Try a different name or clear the filter.</p></div>}

      <div className="promo">
        <div><h3>Can't decide? Make it yours.</h3><p style={{ opacity: .8, marginTop: 6 }}>Choose base, sauce, cheese and veggies, then watch it come together.</p></div>
        <Link to="/build" className="btn btn-grad">Build your pizza</Link>
      </div>
    </div>

    {count > 0 && (
      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} style={{ position: 'fixed', bottom: 18, left: 0, right: 0, zIndex: 40, padding: '0 16px' }}>
        <Link to="/cart" className="btn btn-primary" style={{ display: 'flex', maxWidth: 620, margin: '0 auto', justifyContent: 'space-between', padding: '16px 22px' }}>
          <span>{count} item{count > 1 ? 's' : ''} · {inr(subtotal)}</span><span>View cart</span>
        </Link>
      </motion.div>
    )}
    </div>
  );
}
