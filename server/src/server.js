import pino from 'pino';
import app from './app.js';
import { config } from './config/index.js';

const logger = pino({ level: config.logLevel || 'info' });
const PORT = config.port || 3001;

app.listen(PORT, () => {
  logger.info(`TapTrack NFC API running on port ${PORT}`);
});
