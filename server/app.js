const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const config = require('./config');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const resourceRoutes = require('./routes/resource.routes');
const bookmarkRoutes = require('./routes/bookmark.routes');
const downloadRoutes = require('./routes/download.routes');
const ratingRoutes = require('./routes/rating.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const courseRoutes = require('./routes/course.routes');
const departmentRoutes = require('./routes/department.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ============================================================
// Security Middleware
// ============================================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: config.cors.origin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// ============================================================
// Body Parsing
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// Logging
// ============================================================
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ============================================================
// Static Files
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, config.upload.dir)));

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'WolloShare API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// ============================================================
// Swagger Documentation (placeholder)
// ============================================================
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API documentation will be available here.',
    note: 'Swagger/OpenAPI documentation coming soon.'
  });
});

// ============================================================
// Error Handling
// ============================================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;

