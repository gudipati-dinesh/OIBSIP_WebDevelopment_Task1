require('express-async-errors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const seed = require('./seed/seedData');
const { startStockCron } = require('./jobs/stockCron');

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET missing in .env'); process.exit(1); }

const app = express();
const server = http.createServer(app);
const origin = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, { cors: { origin, credentials: true } });
app.set('io', io);

// Socket auth: every connection must carry a valid JWT; users join a private room, admins join "admins"
io.use((socket, next) => {
  try { socket.user = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET); next(); }
  catch { next(new Error('unauthorized')); }
});
io.on('connection', (socket) => {
  socket.join('user:' + socket.user.id);
  if (socket.user.role === 'admin') socket.join('admins');
});

app.use(cors({ origin, credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pizzas', require('./routes/pizzas'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));
app.use((err, req, res, next) => res.status(500).json({ message: err.message }));

(async () => {
  try {
    await connectDB();
    await seed();
    startStockCron();
    const port = process.env.PORT || 5000;
    server.listen(port, () => console.log(`🚀 API running on http://localhost:${port}`));
  } catch (e) {
    console.error('❌ Failed to start:', e.message);
    process.exit(1);
  }
})();
