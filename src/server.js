import './utils/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import youtubeRoutes from './routes/youtube.js';
import adminRoutes from './routes/admin.js';
import systemRoutes from './routes/system.js';
import notificationRoutes from './routes/notifications.js';

// Import middleware
import { trackingMiddleware } from './middleware/trackingMiddleware.js';

// Import utilities
import systemMonitor from './utils/systemMonitor.js';
import errorTracker from './utils/errorTracker.js';

// Create Express app and HTTP server
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: function (origin) {
      if (!origin) return true;
      return origin.match(/^http:\/\/localhost:\d+$/) || origin === process.env.FRONTEND_URL;
    },
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.match(/^http:\/\/localhost:\d+$/) || origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true
}));

// Rate Limiting: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    error: 'Too many requests, please try again later.'
  }
});

// Apply rate limiting to all requests
app.use(limiter);

// Prevent HTTP Parameter Pollution
app.use(hpp());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply tracking middleware
app.use(trackingMiddleware);

// Lightweight ping endpoint for UptimeRobot (prevent Render spin-down)
app.get('/ping', (req, res) => {
  res.status(200).send('Server is alive!');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'E & T PRODUCTION Public Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/youtube', youtubeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler with error tracking
app.use('*', (req, res) => {
  // Log 404 error
  errorTracker.log404Error({
    path: req.originalUrl,
    method: req.method,
    referrer: req.get('referer') || 'Direct',
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(404).json({ error: 'Route not found' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Send initial data
  socket.emit('connected', {
    message: 'Connected to E & T PRODUCTION server',
    timestamp: new Date().toISOString()
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Broadcast system health every 1 second (Realtime)
setInterval(async () => {
  const quickStats = await systemMonitor.getQuickStats();
  io.emit('system:health', quickStats);
}, 1000);

// Broadcast error stats every 30 seconds
setInterval(() => {
  const errorStats = errorTracker.getStats();
  io.emit('system:errors', errorStats);
}, 30000);

// Make io available globally for visitor tracking
app.set('io', io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 E & T PRODUCTION Backend server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.io server ready for real-time updates`);
});

export default app;
