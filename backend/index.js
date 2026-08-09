import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

import paymentRoutes from './routes/payment.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminAuthRoutes from './routes/admin-auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import contentRoutes from './routes/content.routes.js';
import servicesRoutes from './routes/services.routes.js';
import contactRoutes from './routes/contact.routes.js';
import adminRoutes from './routes/admin.routes.js';
import BirthdayService from './services/birthday.service.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust the proxy (Render / Vercel / cPanel)
app.set('trust proxy', 1);

/**
 * ALLOWED ORIGINS
 * ---------------------------------------------------------
 * Accepts requests from all our known frontend domains.
 */
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://nacoslasustech.org.ng',
  'https://www.nacoslasustech.org.ng',
  'https://awards.nacoslasustech.org.ng',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed.`));
  },
  credentials: true,
}));

/**
 * SECURITY & MIDDLEWARE
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Take a break and try again later.'
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(limiter);

/**
 * STATIC FILES
 * ---------------------------------------------------------
 * Serves uploaded images. Note: on Vercel's serverless
 * environment, uploads are ephemeral (/tmp). For persistent
 * file storage in production, migrate to Cloudinary or S3.
 */
const uploadsPath = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : (process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads'));

app.use('/uploads', express.static(uploadsPath));

/**
 * ROUTES
 */
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'NACOS LASUSTECH API is running.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'up',
    timestamp: new Date().toISOString(),
    message: 'NACOS LASUSTECH Backend is humming along nicely.',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Vercel Cron Job endpoint — called daily at 07:00 UTC
// Configured in vercel.json: "0 7 * * *"
app.get('/api/cron/birthday', async (req, res) => {
  // Secure the cron endpoint so only Vercel can call it
  const cronSecret = req.headers['authorization'];
  if (process.env.NODE_ENV === 'production' && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await BirthdayService.checkBirthdays();
    res.json({ success: true, message: 'Birthday check completed.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Diagnostic Ping to Central System
app.get('/api/ping-central', async (req, res) => {
  try {
    const start = Date.now();
    const response = await axios.post('https://nacosid.tmb.it.com/api.php?action=login',
      { matric_number: '000', password: '000' },
      {
        timeout: 5000,
        headers: {
          'X-API-KEY': process.env.ID_SYSTEM_API_KEY || 'NACOS_LASUSTECH_SECURE_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({
      status: 'success',
      latency: `${Date.now() - start}ms`,
      central_response: response.data
    });
  } catch (error) {
    res.status(502).json({
      status: 'error',
      message: 'Could not reach central system',
      error: error.message,
      code: error.code
    });
  }
});

// Register all API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/admin-auth', authLimiter, adminAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

/**
 * GLOBAL ERROR HANDLER
 */
app.use((err, req, res, _next) => {
  console.error('🔥 CRITICAL ERROR:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went sideways on our end. We are looking into it!'
  });
});

/**
 * SERVER STARTUP
 * ---------------------------------------------------------
 * On Vercel, the app is exported as a serverless function.
 * app.listen() is only called in local/cPanel environments.
 */
if (!process.env.VERCEL) {
  // Run birthday check once on startup (for cPanel / local)
  BirthdayService.start();

  app.listen(PORT, () => {
    console.log(`
  --------------------------------------------------
  ✨ NACOS LASUSTECH Backend Started
  🌍 Server: http://localhost:${PORT}
  🛠️  Mode: ${process.env.NODE_ENV || 'development'}
  --------------------------------------------------
    `);
  });
}

// Export for Vercel serverless
export default app;
