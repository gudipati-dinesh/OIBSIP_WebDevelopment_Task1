
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

// Check required environment variables
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET missing in environment variables');
  process.exit(1);
}

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://slice-pizza-website.vercel.app'
];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an origin
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Express middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Initialize Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

app.set('io', io);

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('unauthorized'));
    }

    socket.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();

  } catch (error) {
    next(new Error('unauthorized'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  socket.join('user:' + socket.user.id);

  if (socket.user.role === 'admin') {
    socket.join('admins');
  }

  console.log(`Socket connected: ${socket.id}`);
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running'
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pizzas', require('./routes/pizzas'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

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
