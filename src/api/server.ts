import express, { Express } from 'express';
import * as dotenv from 'dotenv';
import cors, { CorsOptions } from 'cors';

import { getHealth } from './routes/health';
import { getDashboard } from './routes/dashboard';
import { getRpcs, postRpcs } from './routes/rpcs';
import { getEvents } from './routes/events';
import { db } from './db';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = 3000;

// ======================
// CORS CONFIGURATION
// ======================
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests without origin (curl, health checks, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// ======================
// MIDDLEWARE
// ======================
app.use(express.json());

// ======================
// ROUTES
// ======================
app.get('/health', getHealth);
app.get('/dashboard', getDashboard);
app.get('/rpcs', getRpcs);
app.post('/rpcs', postRpcs);
app.get('/events', getEvents);

// ======================
// SERVER STARTUP
// ======================
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT 1');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
