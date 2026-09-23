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
// Allowed origins are read from environment variables.
// Mobile apps (React Native) do not send an Origin header and are
// permitted via the !origin check below.
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_WEB_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // In development with no origins configured, allow everything
      if (allowedOrigins.length === 0) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

// ── API routes ───────────────────────────────────────────
app.use('/api', routes);

// ── 404 — catch undefined routes ─────────────────────────
app.use(notFound);

// ── Centralised error handler ─────────────────────────────
// Must be last middleware registered.
app.use(errorHandler);

module.exports = app;
