import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import db from './db.js';
import paymentRoutes from './routes/payment.routes.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import contentRoutes from './routes/content.routes.js';
import servicesRoutes from './routes/services.routes.js';
import contactRoutes from './routes/contact.routes.js';
import adminRoutes from './routes/admin.routes.js';


// Pulling in our environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * SECURITY RATE LIMITING
 * ---------------------------------------------------------
 * Stops attackers from spamming our API or brute-forcing logins.
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login attempts per hour
  message: 'Too many login attempts. Take a break and try again later.'
});

/**
 * MIDDLEWARE SETUP
 * ---------------------------------------------------------
 * We want this to be secure and readable. 
 * Helmet helps with basic security headers, 
 * Morgan logs our requests so we know what's happening.
 */
app.use(helmet({ crossOriginResourcePolicy: false })); // Stay safe out there, but let images load!
app.use(cors());   // Allow our frontend to talk to us
app.use(express.json({ limit: '10kb' })); // Security: Limit JSON body size to prevent DoS
app.use(morgan('dev'));  // Log requests to the console
app.use(limiter); // Apply general rate limit to all requests

/**
 * THE CORE ROUTES
 * ---------------------------------------------------------
 * I'll keep these clean. We'll eventually move these into a 
 * separate routes folder once the project grows.
 */

// Registering modular routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// Serve uploads folder statically
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// A simple health check to make sure the lights are on
app.get('/health', (req, res) => {
  res.json({ 
    status: 'up', 
    timestamp: new Date().toISOString(),
    message: 'NACOS LASUSTECH Backend is humming along nicely.'
  });
});

/**
 * ERROR HANDLING
 * ---------------------------------------------------------
 * Every good backend engineer knows that things WILL go wrong.
 * Let's catch those errors gracefully so the server doesn't crash.
 */
app.use((err, req, res, next) => {
  console.error('🔥 CRITICAL ERROR:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'Something went sideways on our end. We are looking into it!' 
  });
});

// Fire it up!
app.listen(PORT, () => {
  console.log(`
  --------------------------------------------------
  ✨ NACOS LASUSTECH Backend Started
  🌍 Server: http://localhost:${PORT}
  🛠️  Mode: ${process.env.NODE_ENV || 'development'}
  --------------------------------------------------
  `);
});
