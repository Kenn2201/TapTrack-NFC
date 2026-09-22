import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { requireTrustedOrigin } from './middleware/originGuard.js';
import { maintenanceMiddleware } from './middleware/maintenance.js';

const app = express();

// Trust reverse proxy (e.g. Render, Cloudflare) - 1 hop
app.set('trust proxy', 1);

// Security
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, or matching clientUrl
    if (!origin || origin === config.clientUrl) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

// Parsing
app.use(express.json());
app.use(cookieParser());

// Per-request correlation id for safe support references
app.use((req, res, next) => {
  req.id = req.header('x-correlation-id') || crypto.randomUUID();
  res.setHeader('x-correlation-id', req.id);
  next();
});

// Routes (maintenance mode is server-enforced between origin guard and routes)
app.use('/api', requireTrustedOrigin, maintenanceMiddleware, routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: config.version }));

// Error handler
app.use(errorHandler);

export default app;
