import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

// cart item: { key, kind:'ready'|'custom', name, unitPrice, qty, pizzaId? , base?, sauce?, cheese?, veggies?, art? }
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; } });
  useEffect(() => localStorage.setItem('cart', JSON.stringify(items)), [items]);

  const add = (item) => setItems((cur) => {
    const found = cur.find((c) => c.key === item.key);
    return found ? cur.map((c) => (c.key === item.key ? { ...c, qty: Math.min(10, c.qty + 1) } : c)) : [...cur, { ...item, qty: 1 }];
  });
  const setQty = (key, qty) => setItems((cur) => (qty <= 0 ? cur.filter((c) => c.key !== key) : cur.map((c) => (c.key === key ? { ...c, qty: Math.min(10, qty) } : c))));
  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  return <Ctx.Provider value={{ items, add, setQty, clear, count, subtotal }}>{children}</Ctx.Provider>;
}
