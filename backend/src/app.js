const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const watchlistRoutes = require('./routes/watchlistRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const stocksRoutes = require('./routes/stocksRoutes');
const marketRoutes = require('./routes/marketRoutes');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'pulse-api',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlists', dashboardRoutes); // Summary & Checkpoint handlers
app.use('/api/watchlists', watchlistRoutes);  // CRUD & Stock management
app.use('/api/stocks', stocksRoutes);
app.use('/api/market', marketRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Pulse API Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

module.exports = app;
