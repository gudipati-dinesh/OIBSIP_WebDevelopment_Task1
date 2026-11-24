const router = require('express').Router();
const Inventory = require('../models/Inventory');
const { protect, adminOnly } = require('../middleware/auth');
const { checkLowStock } = require('../jobs/stockCron');
const { CUSTOM_FEE } = require('./orders');

// Customers get option lists (for the builder); admins get thresholds as well
router.get('/', protect, async (req, res) => {
  const items = await Inventory.find().sort({ category: 1, price: 1 });
  res.json({ items, customFee: CUSTOM_FEE });
});

// Admin: manual stock / threshold / price update
router.patch('/:id', protect, adminOnly, async (req, res) => {
  const { quantity, threshold, price } = req.body;
  const item = await Inventory.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Item not found' });
  for (const [k, v] of Object.entries({ quantity, threshold, price })) {
    if (v === undefined) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ message: `${k} must be a non-negative number` });
    item[k] = Math.floor(n);
  }
  if (item.quantity >= item.threshold) item.lastAlertAt = undefined; // restocked → re-arm alert
  await item.save();
  req.app.get('io').to('admins').emit('inventory:update', item);
  if (item.quantity < item.threshold) checkLowStock().catch(() => {});
  res.json(item);
});

// Admin: trigger the low-stock email check right now (handy for demos)
router.post('/check-now', protect, adminOnly, async (req, res) => {
  await require('../models/Inventory').updateMany({}, { $unset: { lastAlertAt: 1 } });
  res.json(await checkLowStock());
});

module.exports = router;
