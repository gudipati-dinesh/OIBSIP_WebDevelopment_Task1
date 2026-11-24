import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { connectSocket } from '../api';

// Loads the user's orders and keeps them live via Socket.IO (with a 15s polling safety net).
export default function useOrders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => api.get('/orders/mine').then((r) => alive && setOrders(r.data)).catch(() => alive && setOrders((o) => o || []));
    load();
    const poll = setInterval(load, 15000);
    const socket = connectSocket();
    socket.on('order:update', (o) => {
      setOrders((cur) => {
        const list = cur || [];
        return list.some((x) => x._id === o._id) ? list.map((x) => (x._id === o._id ? o : x)) : [o, ...list];
      });
      if (o.status !== 'Order Received') toast(`Your order is now: ${o.status}`, { icon: o.status === 'In Kitchen' ? '👨‍🍳' : '🛵' });
    });
    return () => { alive = false; clearInterval(poll); socket.disconnect(); };
  }, []);
  return orders;
}
