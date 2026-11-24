const router = require('express').Router();
const Pizza = require('../models/Pizza');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  const pizzas = await Pizza.find()
    .populate('ingredients.base ingredients.sauce ingredients.cheese ingredients.veggies')
    .sort({ price: 1 });
  // available = every ingredient has at least 1 unit in stock
  const out = pizzas.map((p) => {
    const parts = [p.ingredients.base, p.ingredients.sauce, p.ingredients.cheese, ...p.ingredients.veggies].filter(Boolean);
    return { ...p.toObject(), available: parts.every((i) => i.quantity > 0) };
  });
  res.json(out);
});

module.exports = router;
