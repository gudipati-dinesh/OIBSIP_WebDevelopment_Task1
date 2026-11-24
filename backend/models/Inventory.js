const mongoose = require('mongoose');
const invSchema = new mongoose.Schema({
  category: { type: String, enum: ['base', 'sauce', 'cheese', 'veggie'], required: true },
  name: { type: String, required: true },
  description: String,
  emoji: { type: String, default: '🍕' },
  color: { type: String, default: '#e9c58b' },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 0, min: 0 },
  threshold: { type: Number, default: 20 },
  lastAlertAt: Date,
}, { timestamps: true });
invSchema.index({ category: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Inventory', invSchema);
