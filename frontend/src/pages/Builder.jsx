import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api, { errMsg, inr } from '../api';
import { useCart } from '../context/CartContext';
import PizzaArt from '../components/PizzaArt';

const STEPS = [
  { cat: 'base', title: 'Choose your base', hint: 'The foundation of every great pizza.' },
  { cat: 'sauce', title: 'Pick a sauce', hint: 'One sauce, spread edge to edge.' },
  { cat: 'cheese', title: 'Select your cheese', hint: 'Melted, golden, stretchy.' },
  { cat: 'veggie', title: 'Load up the veggies', hint: 'Choose as many as you like.' },
];

export default function Builder() {
  const [inv, setInv] = useState(null);
  const [fee, setFee] = useState(99);
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState({ base: null, sauce: null, cheese: null, veggies: [] });
  const { add } = useCart();
  const nav = useNavigate();

  useEffect(() => { api.get('/inventory').then((r) => { setInv(r.data.items); setFee(r.data.customFee); }).catch((e) => toast.error(errMsg(e))); }, []);
  if (!inv) return <div className="center-screen"><div className="spinner dark" /></div>;

  const by = (cat) => inv.filter((i) => i.category === cat);
  const byId = (id) => inv.find((i) => i._id === id);
  const cur = STEPS[step];
  const base = byId(sel.base), sauce = byId(sel.sauce), cheese = byId(sel.cheese);
  const veggies = sel.veggies.map(byId);
  const price = fee + [base, sauce, cheese, ...veggies].filter(Boolean).reduce((s, i) => s + i.price, 0);
  const canNext = step === 3 || (step === 0 && sel.base) || (step === 1 && sel.sauce) || (step === 2 && sel.cheese);

  const pick = (item) => {
    if (cur.cat === 'veggie') setSel((s) => ({ ...s, veggies: s.veggies.includes(item._id) ? s.veggies.filter((v) => v !== item._id) : [...s.veggies, item._id] }));
    else setSel((s) => ({ ...s, [cur.cat]: item._id }));
  };
  const isSel = (item) => (cur.cat === 'veggie' ? sel.veggies.includes(item._id) : sel[cur.cat] === item._id);

  const finish = () => {
    const key = ['custom', sel.base, sel.sauce, sel.cheese, ...[...sel.veggies].sort()].join(':');
    add({ key, kind: 'custom', name: 'Custom Pizza', unitPrice: price, base: sel.base, sauce: sel.sauce, cheese: sel.cheese, veggies: sel.veggies,
      details: [base, sauce, cheese, ...veggies].map((i) => i.name).join(', ') });
    toast.success('Your pizza is in the cart 🍕'); nav('/cart');
  };

  return (
    <div className="page"><div className="container">
      <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>Build your own pizza</h1>
      <p className="muted" style={{ marginBottom: 24 }}>Every choice shows up on your pizza instantly.</p>
      <div className="builder">
        <div className="card builder-art">
          <PizzaArt base={base} sauce={sauce} cheese={cheese} veggies={veggies} size={340} />
          <div style={{ marginTop: 12 }}>
            <div className="muted" style={{ fontSize: '.85rem' }}>Your pizza so far</div>
            <motion.div key={price} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="price" style={{ fontSize: '1.7rem' }}>{inr(price)}</motion.div>
            <div className="chips-sm" style={{ justifyContent: 'center' }}>
              {[base, sauce, cheese].filter(Boolean).map((i) => <span key={i._id} className="badge badge-orange">{i.name}</span>)}
              {veggies.map((i) => <span key={i._id} className="badge badge-green">{i.emoji} {i.name}</span>)}
            </div>
          </div>
        </div>

        <div>
          <div className="progress">{STEPS.map((s, i) => <div key={s.cat} className={i === step ? 'on' : i < step ? 'done' : ''}>{i < step ? '✓ ' : ''}{['Base', 'Sauce', 'Cheese', 'Veggies'][i]}</div>)}</div>
          <h2 style={{ fontSize: '1.5rem' }}>{cur.title}</h2>
          <p className="muted" style={{ margin: '4px 0 18px' }}>{cur.hint}</p>
          <AnimatePresence mode="wait">
            <motion.div key={step} className="opts" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: .25 }}>
              {by(cur.cat).map((item) => (
                <button key={item._id} className={`opt ${isSel(item) ? 'sel' : ''}`} disabled={item.quantity <= 0} onClick={() => pick(item)} aria-pressed={isSel(item)}>
                  {isSel(item) && <span className="tick">✓</span>}
                  <span className="em">{item.emoji}</span>
                  <b>{item.name}</b>
                  {item.description && <small>{item.description}</small>}
                  <small><b style={{ color: 'var(--ink)' }}>+{inr(item.price)}</b>{item.quantity <= 0 ? ' · Out of stock' : item.quantity < item.threshold ? ' · Few left' : ''}</small>
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
          <div className="builder-bar">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {step < 3
              ? <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Next: {['Sauce', 'Cheese', 'Veggies'][step]}</button>
              : <button className="btn btn-grad" onClick={finish}>Add to cart · {inr(price)}</button>}
          </div>
          <p className="muted" style={{ fontSize: '.8rem', marginTop: 14 }}>Price includes a {inr(fee)} baking and prep charge.</p>
        </div>
      </div>
    </div></div>
  );
}
