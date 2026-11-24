require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
(async () => {
  await connectDB();
  if (process.argv.includes('--reset')) { await mongoose.connection.dropDatabase(); console.log('🗑️  Database cleared'); }
  await require('./seedData')();
  await mongoose.disconnect();
  console.log('Seed complete');
})();
