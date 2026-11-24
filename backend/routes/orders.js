const router = require('express').Router();
const crypto = require('crypto');
const Inventory = require('../models/Inventory');
const Pizza = require('../models/Pizza');
const Order = require('../models/Order');
const rzp = require('../utils/razorpay');
const { protect, adminOnly } = require('../middleware/auth');
const { checkLowStock } = require('../jobs/stockCron');

const CUSTOM_FEE = 99;     // baking + prep charge for build-your-own pizzas
const TAX_RATE = 0.05;     // 5% GST
const STATUSES = ['Order Received', 'In Kitchen', 'Sent to Delivery'];
const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const ing = (i) => ({ item: i._id, name: i.name, category: i.category, emoji: i.emoji });

// Turn the cart sent by the client into trusted lines — prices always come from the DB.
async function buildLines(items) {
  if (!Array.isArray(items) || !items.length) throw bad('Your cart is empty');
  const inv = new Map((await Inventory.find()).map((i) => [String(i._id), i]));
  const pizzas = new Map((await Pizza.find()).map((p) => [String(p._id), p]));
  const lines = [];

  for (const it of items) {
    const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
    if (it.kind === 'ready') {
      const p = pizzas.get(String(it.pizzaId));
      if (!p) throw bad('A pizza in your cart is no longer available');
      const ids = [p.ingredients.base, p.ingredients.sauce, p.ingredients.cheese, ...p.ingredients.veggies];
      lines.push({ name: p.name, kind: 'ready', qty, unitPrice: p.price, ingredients: ids.map((id) => ing(inv.get(String(id)))) });
    } else if (it.kind === 'custom') {
      const base = inv.get(String(it.base)), sauce = inv.get(String(it.sauce)), cheese = inv.get(String(it.cheese));
      const veggies = (it.veggies || []).map((id) => inv.get(String(id)));
      if (base?.category !== 'base' || sauce?.category !== 'sauce' || cheese?.category !== 'cheese' || veggies.some((v) => v?.category !== 'veggie'))
        throw bad('Your custom pizza has an invalid ingredient');
      const parts = [base, sauce, cheese, ...veggies];
      lines.push({ name: 'Custom Pizza', kind: 'custom', qty, ingredients: parts.map(ing),
        unitPrice: CUSTOM_FEE + parts.reduce((s, p) => s + p.price, 0) });
    } else throw bad('Invalid cart item');
  }
  return lines;
}

const stockNeeded = (lines) => {
  const need = new Map();
  lines.forEach((l) => l.ingredients.forEach((g) => need.set(String(g.item), (need.get(String(g.item)) || 0) + l.qty)));
  return need;
};

async function assertStock(lines) {
  for (const [id, n] of stockNeeded(lines)) {
    const i = await Inventory.findById(id);
    if (!i || i.quantity < n) throw bad(`Sorry, ${i ? i.name : 'an ingredient'} is out of stock`);
  }
}

// Atomic decrement with rollback if any ingredient runs short
async function decrementStock(order) {
  const done = [];
  for (const [id, n] of stockNeeded(order.items)) {
    const r = await Inventory.findOneAndUpdate({ _id: id, quantity: { $gte: n } }, { $inc: { quantity: -n } });
    if (!r) { for (const [d, dn] of done) await Inventory.updateOne({ _id: d }, { $inc: { quantity: dn } }); return false; }
    done.push([id, n]);
  }
  return true;
}

// 1) Create order + Razorpay order
router.post('/checkout', protect, async (req, res) => {
  try {
    const { items, address } = req.body;
    if (!address || address.trim().length < 8) throw bad('Please enter a full delivery address');
    const lines = await buildLines(items);
    await assertStock(lines);
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;
    const order = await Order.create({ user: req.user._id, items: lines, subtotal, tax, total, address: address.trim() });

    if (!rzp) return res.json({ order, mock: true });
    const rOrder = await rzp.orders.create({ amount: total * 100, currency: 'INR', receipt: String(order._id) });
    order.razorpayOrderId = rOrder.id; await order.save();
    res.json({ order, razorpay: { key: process.env.RAZORPAY_KEY_ID, orderId: rOrder.id, amount: rOrder.amount, currency: 'INR' } });
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// 2) Verify payment signature, confirm order, decrement stock
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, mock } = req.body;
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) throw bad('Order not found');
    if (order.paymentStatus === 'paid') return res.json(order);

    if (rzp) {
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${order.razorpayOrderId}|${razorpay_payment_id}`).digest('hex');
      if (razorpay_order_id !== order.razorpayOrderId || expected !== razorpay_signature) {
        order.paymentStatus = 'failed'; await order.save();
        throw bad('Payment verification failed');
      }
      order.razorpayPaymentId = razorpay_payment_id;
    } else if (!mock) throw bad('Payment details missing');
    else order.razorpayPaymentId = 'demo_' + crypto.randomBytes(5).toString('hex');

    if (!(await decrementStock(order))) {
      order.paymentStatus = 'failed'; await order.save();
      throw bad('An ingredient just ran out. Your payment was not captured — please try again.');
    }
    order.paymentStatus = 'paid'; order.status = 'Order Received'; await order.save();

    const io = req.app.get('io');
    io.to('user:' + order.user).emit('order:update', order);
    io.to('admins').emit('order:new', await order.populate('user', 'name email'));
    io.to('admins').emit('inventory:refresh');
    checkLowStock().catch((e) => console.error(e.message));
    res.json(order);
  } catch (e) { res.status(e.status || 500).json({ message: e.message }); }
});

// Customer: own orders
router.get('/mine', protect, async (req, res) => {
  res.json(await Order.find({ user: req.user._id, paymentStatus: 'paid' }).sort({ createdAt: -1 }));
});

// Admin: all paid orders
router.get('/', protect, adminOnly, async (req, res) => {
  res.json(await Order.find({ paymentStatus: 'paid' }).populate('user', 'name email').sort({ createdAt: -1 }));
});

// Admin: change status → pushed live to the customer
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Invalid status' });
  const order = await Order.findOneAndUpdate({ _id: req.params.id, paymentStatus: 'paid' }, { status }, { new: true }).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  req.app.get('io').to('user:' + order.user._id).emit('order:update', order);
  res.json(order);
});

module.exports = router;
module.exports.CUSTOM_FEE = CUSTOM_FEE;
