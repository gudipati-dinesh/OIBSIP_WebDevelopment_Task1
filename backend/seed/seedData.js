const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Pizza = require('../models/Pizza');

const T = 20; // default low-stock threshold
const INVENTORY = [
  // bases
  { category: 'base', name: 'Classic Hand-Tossed', emoji: '🍞', color: '#e8c48a', price: 60, quantity: 100, threshold: T, description: 'Soft, chewy and golden' },
  { category: 'base', name: 'Thin Crust', emoji: '🥖', color: '#dcb072', price: 55, quantity: 100, threshold: T, description: 'Crispy and light' },
  { category: 'base', name: 'Cheese Burst', emoji: '🧀', color: '#f0cd84', price: 95, quantity: 80, threshold: T, description: 'Molten cheese in the crust' },
  { category: 'base', name: 'Whole Wheat', emoji: '🌾', color: '#c99a62', price: 70, quantity: 80, threshold: T, description: 'Nutty and wholesome' },
  { category: 'base', name: 'Multigrain', emoji: '🌱', color: '#b98a55', price: 80, quantity: 60, threshold: T, description: 'Seeds, oats and flax' },
  // sauces
  { category: 'sauce', name: 'Classic Tomato', emoji: '🍅', color: '#d9392b', price: 20, quantity: 150, threshold: T, description: 'Sweet, slow-cooked tomato' },
  { category: 'sauce', name: 'Pesto Basil', emoji: '🌿', color: '#5f9238', price: 35, quantity: 100, threshold: T, description: 'Fresh basil and pine nuts' },
  { category: 'sauce', name: 'Spicy Arrabbiata', emoji: '🌶️', color: '#b3261e', price: 25, quantity: 100, threshold: T, description: 'Garlic and red chilli kick' },
  { category: 'sauce', name: 'Garlic Cream', emoji: '🧄', color: '#f3e4b8', price: 30, quantity: 100, threshold: T, description: 'Silky white sauce' },
  { category: 'sauce', name: 'Smoky BBQ', emoji: '🔥', color: '#6d2e14', price: 30, quantity: 100, threshold: T, description: 'Sweet and smoky' },
  // cheeses
  { category: 'cheese', name: 'Mozzarella', emoji: '🧀', color: '#fff0b3', price: 45, quantity: 150, threshold: T, description: 'The stretchy classic' },
  { category: 'cheese', name: 'Cheddar', emoji: '🟧', color: '#ffb52e', price: 50, quantity: 100, threshold: T, description: 'Sharp and golden' },
  { category: 'cheese', name: 'Parmesan', emoji: '🧂', color: '#f6e6a8', price: 60, quantity: 80, threshold: T, description: 'Salty, nutty and aged' },
  { category: 'cheese', name: 'Vegan Cheese', emoji: '🥥', color: '#f2e3c6', price: 65, quantity: 60, threshold: T, description: 'Plant-based and creamy' },
  // veggies
  { category: 'veggie', name: 'Onion', emoji: '🧅', color: '#b78ad9', price: 15, quantity: 200, threshold: T },
  { category: 'veggie', name: 'Capsicum', emoji: '🫑', color: '#3f9a3f', price: 20, quantity: 200, threshold: T },
  { category: 'veggie', name: 'Mushroom', emoji: '🍄', color: '#a98467', price: 25, quantity: 150, threshold: T },
  { category: 'veggie', name: 'Black Olives', emoji: '🫒', color: '#2d2d2d', price: 25, quantity: 150, threshold: T },
  { category: 'veggie', name: 'Sweet Corn', emoji: '🌽', color: '#f4c20d', price: 20, quantity: 150, threshold: T },
  { category: 'veggie', name: 'Jalapeño', emoji: '🥒', color: '#2f7d32', price: 20, quantity: 150, threshold: T },
  { category: 'veggie', name: 'Tomato', emoji: '🍅', color: '#e53935', price: 15, quantity: 200, threshold: T },
  { category: 'veggie', name: 'Paneer', emoji: '🧈', color: '#fff8e1', price: 40, quantity: 120, threshold: T },
];

const PIZZAS = [
  { name: 'Margherita', price: 249, tag: 'Classic', rating: 4.4, description: 'Tomato, mozzarella and fresh tomato slices. Simple done right.',
    base: 'Classic Hand-Tossed', sauce: 'Classic Tomato', cheese: 'Mozzarella', veggies: ['Tomato'] },
  { name: 'Farmhouse', price: 349, tag: 'Bestseller', rating: 4.6, description: 'Onion, capsicum, mushroom and tomato on a hand-tossed base.',
    base: 'Classic Hand-Tossed', sauce: 'Classic Tomato', cheese: 'Mozzarella', veggies: ['Onion', 'Capsicum', 'Mushroom', 'Tomato'] },
  { name: 'Peppy Paneer', price: 379, tag: 'Spicy', spicy: true, rating: 4.5, description: 'Paneer cubes, capsicum and jalapeño with arrabbiata and cheddar.',
    base: 'Thin Crust', sauce: 'Spicy Arrabbiata', cheese: 'Cheddar', veggies: ['Paneer', 'Capsicum', 'Jalapeño'] },
  { name: 'Veggie Supreme', price: 429, tag: 'Loaded', rating: 4.3, description: 'Five vegetables on a cheese burst base. Heavy and happy.',
    base: 'Cheese Burst', sauce: 'Classic Tomato', cheese: 'Mozzarella', veggies: ['Onion', 'Capsicum', 'Black Olives', 'Sweet Corn', 'Mushroom'] },
  { name: 'Mexican Fiesta', price: 399, tag: 'Spicy', spicy: true, rating: 4.2, description: 'Jalapeño, corn, onion and olives on thin crust with cheddar.',
    base: 'Thin Crust', sauce: 'Spicy Arrabbiata', cheese: 'Cheddar', veggies: ['Jalapeño', 'Sweet Corn', 'Onion', 'Black Olives'] },
  { name: 'Pesto Garden', price: 419, tag: 'Chef\'s pick', rating: 4.5, description: 'Basil pesto, parmesan, olives, mushroom and tomato on multigrain.',
    base: 'Multigrain', sauce: 'Pesto Basil', cheese: 'Parmesan', veggies: ['Black Olives', 'Mushroom', 'Tomato'] },
  { name: 'BBQ Paneer Crunch', price: 389, tag: 'Bestseller', rating: 4.4, description: 'Smoky BBQ sauce, paneer, onion and capsicum on whole wheat.',
    base: 'Whole Wheat', sauce: 'Smoky BBQ', cheese: 'Mozzarella', veggies: ['Paneer', 'Onion', 'Capsicum'] },
  { name: 'Corn & Cream', price: 329, tag: 'Cheesy', rating: 4.1, description: 'Garlic cream sauce, sweet corn and parmesan on cheese burst.',
    base: 'Cheese Burst', sauce: 'Garlic Cream', cheese: 'Parmesan', veggies: ['Sweet Corn'] },
];

module.exports = async function seed() {
  // Admin account (credentials from .env)
  const email = (process.env.ADMIN_EMAIL || 'admin@pizza.com').toLowerCase();
  if (!(await User.findOne({ email }))) {
    await User.create({ name: 'Store Admin', email, role: 'admin', isVerified: true,
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10) });
    console.log(`👤 Admin created: ${email}`);
  }
  // Inventory + pizzas only if empty (never overwrites live stock)
  if (!(await Inventory.countDocuments())) {
    await Inventory.insertMany(INVENTORY);
    console.log(`📦 Seeded ${INVENTORY.length} inventory items`);
  }
  // Keep emoji/colour/description in sync with this file (never touches quantity, price or thresholds)
  await Inventory.bulkWrite(INVENTORY.map((i) => ({ updateOne: {
    filter: { category: i.category, name: i.name },
    update: { $set: { emoji: i.emoji, color: i.color, description: i.description } } } })));
  if (!(await Pizza.countDocuments())) {
    const inv = await Inventory.find();
    const id = (cat, name) => inv.find((i) => i.category === cat && i.name === name)._id;
    await Pizza.insertMany(PIZZAS.map((p) => ({
      name: p.name, description: p.description, price: p.price, tag: p.tag, spicy: !!p.spicy, rating: p.rating,
      ingredients: { base: id('base', p.base), sauce: id('sauce', p.sauce), cheese: id('cheese', p.cheese),
        veggies: p.veggies.map((v) => id('veggie', v)) },
    })));
    console.log(`🍕 Seeded ${PIZZAS.length} pizzas`);
  }
};