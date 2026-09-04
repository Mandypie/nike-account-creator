import { Page } from 'playwright';
import { logger } from '../logging/logger.js';
import { browserService } from './browser.js';
import { tempMailService } from './tempmail.js';
import { nikeSignupWorkflow } from './nike.js';

interface AccountCreationRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  password: string;
}

interface AccountCreationResult {
  email: string;
  password: string;
  success: boolean;
  error?: string;
  createdAt: string;
  otpCode?: string;
}

export class AccountCreationOrchestrator {
  async createAccount(request: AccountCreationRequest): Promise<AccountCreationResult> {
    let page: Page | null = null;
    let inboxId: string | null = null;
    const startTime = Date.now();

    try {
      logger.info('🚀 Starting account creation process', { firstName: request.firstName });

      // Step 1: Create temp email
      logger.info('Step 1: Creating temporary email...');
      const tempEmail = await tempMailService.createTempEmail();
      inboxId = tempEmail.id;
      logger.info('✅ Temp email created', { email: tempEmail.emailAddress });

      // Step 2: Launch browser
      logger.info('Step 2: Launching browser...');
      await browserService.launch();
      page = await browserService.createPage();
      logger.info('✅ Browser launched');

      const accountData = {
        email: tempEmail.emailAddress,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth,
        phoneNumber: request.phoneNumber,
      };

      // Step 3: Fill Nike signup form
      logger.info('Step 3: Filling Nike signup form...');
      await nikeSignupWorkflow.signup(page, accountData);
      logger.info('✅ Signup form filled and submitted');

      // Step 4: Wait for OTP email
      logger.info('Step 4: Waiting for OTP email from Nike...');
      const { email, code } = await tempMailService.waitForOtpEmail(inboxId, 60000, 3);
      logger.info('✅ OTP email received', { code });

      // Step 5: Fill verification code
      logger.info('Step 5: Filling OTP code into form...');
      await nikeSignupWorkflow.fillVerificationCode(page, code);
      logger.info('✅ OTP code filled and submitted');

      // Step 6: Wait for account confirmation
      logger.info('Step 6: Waiting for account confirmation...');
      await page.waitForTimeout(3000);

      // Step 7: Verify account was created
      logger.info('Step 7: Verifying account creation...');
      const isCreated = await nikeSignupWorkflow.isAccountCreated(page);

      if (!isCreated) {
        throw new Error('Account creation could not be verified');
      }

      const duration = Date.now() - startTime;
      logger.info('✅ Account created successfully', {
        email: tempEmail.emailAddress,
        duration: `${duration}ms`,
      });

      return {
        email: tempEmail.emailAddress,
        password: request.password,
        success: true,
        otpCode: code,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('❌ Account creation failed', { error: errorMessage, duration: `${duration}ms` });

      return {
        email: '',
        password: request.password,
        success: false,
        error: errorMessage,
        createdAt: new Date().toISOString(),
      };
    } finally {
      // Cleanup
      logger.info('Cleaning up resources...');
      if (page) {
        await page.close();
      }
      await browserService.close();
      if (inboxId) {
        await tempMailService.deleteTempEmail(inboxId).catch(err =>
          logger.warn('Failed to delete temp email', { error: err })
        );
      }
      logger.info('Cleanup completed');
    }
  }
}

export const accountCreationOrchestrator = new AccountCreationOrchestrator();
