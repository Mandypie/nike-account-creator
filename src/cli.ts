import { program } from 'commander';
import chalk from 'chalk';
import 'dotenv/config';
import { NikeAccountCreator } from './services/AccountCreator';
import { TempEmailService } from './services/TempEmailService';
import { Logger } from './utils/Logger';

const logger = new Logger('CLI');

program
  .name('nike-account-creator')
  .description('Automated Nike account creation with temp email verification')
  .version('1.0.1');

program
  .command('create')
  .description('Create a new Nike account')
  .option('-e, --email <email>', 'Email address (optional, generates temp email if not provided)')
  .option('-p, --password <password>', 'Password for the account')
  .option('-f, --firstName <firstName>', 'First name')
  .option('-l, --lastName <lastName>', 'Last name')
  .action(async (options) => {
    try {
      logger.info('Starting account creation process...');

      const tempEmailService = new TempEmailService();
      const accountCreator = new NikeAccountCreator(tempEmailService);

      if (!options.password) {
        logger.error('Password is required (use -p or --password)');
        process.exit(1);
      }

      const config = {
        email: options.email,
        password: options.password,
        firstName: options.firstName,
        lastName: options.lastName
      };

      await accountCreator.createAccount(config);
      logger.success('Account creation flow finished (see logs for details)');

    } catch (error) {
      logger.error(`Account creation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify email and auto-fill verification codes')
  .option('-e, --email <email>', 'Temporary email to verify (inbox id or address)')
  .action(async (options) => {
    try {
      logger.info('Starting email verification...');
      const tempEmailService = new TempEmailService();
      const accountCreator = new NikeAccountCreator(tempEmailService);

      if (!options.email) {
        logger.error('Email (inbox id or address) is required for verify');
        process.exit(1);
      }

      const code = await accountCreator.verifyEmail(options.email);
      logger.success(`Email verification completed! Code: ${code}`);

    } catch (error) {
      logger.error(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
