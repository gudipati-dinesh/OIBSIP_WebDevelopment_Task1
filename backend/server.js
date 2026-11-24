
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

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET missing in .env');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Allow both local development and deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true
};

// Express CORS
app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions
});

app.set('io', io);

// Socket authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('unauthorized'));
    }

    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();

  } catch (error) {
    next(new Error('unauthorized'));
  }
});

// Socket connection
io.on('connection', (socket) => {
  socket.join('user:' + socket.user.id);

  if (socket.user.role === 'admin') {
    socket.join('admins');
  }

  console.log(`Socket connected: ${socket.id}`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pizzas', require('./routes/pizzas'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await seed();

    startStockCron();

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
