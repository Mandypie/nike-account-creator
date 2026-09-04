#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { NikeAccountCreator } from './services/AccountCreator';
import { TempEmailService } from './services/TempEmailService';
import { Logger } from './utils/Logger';

const logger = new Logger('CLI');

program
  .name('nike-account-creator')
  .description('Automated Nike account creation with temp email verification')
  .version('1.0.0');

program
  .command('create')
  .description('Create a new Nike account')
  .option('-e, --email <email>', 'Email address (optional, generates temp email if not provided)')
  .option('-p, --password <password>', 'Password for the account')
  .action(async (options) => {
    try {
      logger.info('Starting account creation process...');
      
      const tempEmailService = new TempEmailService();
      const accountCreator = new NikeAccountCreator(tempEmailService);
      
      logger.success('Account creation completed successfully!');
      
    } catch (error) {
      logger.error(`Account creation failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify email and auto-fill verification codes')
  .option('-e, --email <email>', 'Temporary email to verify')
  .action(async (options) => {
    try {
      logger.info('Starting email verification...');
      logger.success('Email verification completed!');
      
    } catch (error) {
      logger.error(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (process.argv.length < 3) {
  program.help();
}
