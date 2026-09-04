import { NikeAccountCreator } from './services/AccountCreator';
import { TempEmailService } from './services/TempEmailService';
import { Logger } from './utils/Logger';

const logger = new Logger('Main');

async function main(): Promise<void> {
  try {
    logger.info('Nike Account Creator initialized');
    
    const tempEmailService = new TempEmailService();
    const accountCreator = new NikeAccountCreator(tempEmailService);
    
    // Example usage
    logger.info('Ready to create Nike accounts');
    
  } catch (error) {
    logger.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
