const mongoose = require('mongoose');
const lineSchema = new mongoose.Schema({
  name: String,
  kind: { type: String, enum: ['ready', 'custom'] },
  qty: Number,
  unitPrice: Number,
  ingredients: [{ item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }, name: String, category: String, emoji: String }],
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [lineSchema],
  subtotal: Number,
  tax: Number,
  total: Number,
  address: String,
  status: { type: String, enum: ['Pending Payment', 'Order Received', 'In Kitchen', 'Sent to Delivery'], default: 'Pending Payment' },
  paymentStatus: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
