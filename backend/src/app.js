const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');

const routes                    = require('./routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// ── Security headers ─────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────
// Allowed origins are read from environment variables and known app domains.
// Mobile apps (React Native) do not send an Origin header and are allowed through.
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_WEB_URL,
  'https://bicycle-ymym.vercel.app',
  'https://bicycle-uuue.vercel.app',
  'https://bicycle-flax-chi.vercel.app',
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Check explicit allowed origins list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow any Vercel deployment preview / production domain
      try {
        const url = new URL(origin);
        if (url.hostname.endsWith('.vercel.app') || url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return callback(null, true);
        }
      } catch {
        // invalid URL
      }

      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// ── Request logging (development only) ───────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Root / Health check for browser & monitoring ────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pixx Bicycle Owner's Declaration API is live",
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth:   '/api/auth/login',
    },
  });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// ── Database connection middleware (Serverless / Vercel) ──
const connectDB = require('./config/db');

app.use(async (req, res, next) => {
  // Pass root, favicon, and health check without blocking on DB
  if (req.path === '/' || req.path === '/favicon.ico' || req.path === '/api/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGODB_URI is configured in Vercel Environment Variables and Network Access (0.0.0.0/0) is enabled in MongoDB Atlas.',
      error: process.env.NODE_ENV === 'production' ? 'Database connection failure' : err.message,
    });
  }
});

// ── API routes ───────────────────────────────────────────
app.use('/api', routes);

// ── 404 — catch undefined routes ─────────────────────────
app.use(notFound);

// ── Centralised error handler ─────────────────────────────
// Must be last middleware registered.
app.use(errorHandler);

module.exports = app;
