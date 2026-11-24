const mongoose = require('mongoose');
const ref = { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' };
const pizzaSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  tag: { type: String, default: 'Classic' },
  spicy: { type: Boolean, default: false },
  rating: { type: Number, default: 4.2 },
  ingredients: { base: ref, sauce: ref, cheese: ref, veggies: [ref] },
}, { timestamps: true });
module.exports = mongoose.model('Pizza', pizzaSchema);
