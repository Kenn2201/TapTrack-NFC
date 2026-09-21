import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pino from 'pino';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const logger = pino({ level: config.logLevel || 'info' });
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
app.get('/health', (req, res) => res.json({ status: 'ok', version: '0.1.0' }));

// Error handler
app.use(errorHandler);

const PORT = config.port || 3001;
app.listen(PORT, () => {
  logger.info('TapTrack NFC API running on port ' + PORT);
});

export default app;
