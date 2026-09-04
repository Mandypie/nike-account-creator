import express from 'express';
import { config } from './config/index.js';
import { logger } from './logging/logger.js';
import { initializeDatabase, closeDatabase } from './database/index.js';
import routes from './api/routes.js';

const app = express();

app.use(express.json());

// Mount routes
app.use('/api', routes);

// Initialize and start
async function start() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start server
    const PORT = config.port;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Nike Account Creator API running on port ${PORT}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

start();
