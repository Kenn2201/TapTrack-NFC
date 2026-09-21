import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));

// Parsing
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', version: '0.2.0' }));

// Error handler
app.use(errorHandler);

export default app;
