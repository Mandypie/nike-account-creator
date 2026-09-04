import pino from 'pino';
import { config } from '../config/index.js';

const transport = pino.transport({
  target: 'pino/file',
  options: { destination: `${config.logDir}/app.log` },
});

export const logger = pino(
  {
    level: config.logLevel,
  },
  transport
);
