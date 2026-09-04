import { Page } from 'playwright';
import { config } from '../config/index.js';
import { logger } from '../logging/logger.js';
import { tempMailService } from './tempmail.js';

interface NikeAccount {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
}

export class NikeSignupWorkflow {
  async signup(page: Page, accountData: NikeAccount): Promise<boolean> {
    try {
      logger.info('Starting Nike signup workflow', { email: accountData.email });

      // Navigate to Nike signup
      await page.goto(config.nikeSignupUrl, { waitUntil: 'networkidle' });
      logger.info('Navigated to Nike signup page');

      // Wait for email field
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Fill email
      await page.fill('input[type="email"]', accountData.email);
      logger.info('Email filled', { email: accountData.email });

      // Fill password
      const passwordInputs = await page.$$('input[type="password"]');
      if (passwordInputs.length > 0) {
        await passwordInputs[0].fill(accountData.password);
        logger.info('Password filled');
      }

      // Fill first name
      const firstNameInput = await page.$('input[name="firstName"]');
      if (firstNameInput) {
        await firstNameInput.fill(accountData.firstName);
        logger.info('First name filled');
      }

      // Fill last name
      const lastNameInput = await page.$('input[name="lastName"]');
      if (lastNameInput) {
        await lastNameInput.fill(accountData.lastName);
        logger.info('Last name filled');
      }

      // Fill date of birth
      const dobInput = await page.$('input[name="dateOfBirth"]');
      if (dobInput) {
        await dobInput.fill(accountData.dateOfBirth);
        logger.info('Date of birth filled');
      }

      // Fill phone number
      const phoneInput = await page.$('input[type="tel"]');
      if (phoneInput) {
        await phoneInput.fill(accountData.phoneNumber);
        logger.info('Phone number filled');
      }

      // Submit form
      const submitButton = await page.$('button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        logger.info('Form submitted');
      }

      // Wait for verification code page or email
      await page.waitForTimeout(2000);

      logger.info('Nike signup workflow completed successfully');
      return true;
    } catch (error) {
      logger.error('Nike signup workflow failed', { error });
      throw error;
    }
  }

  async fillVerificationCode(page: Page, code: string): Promise<boolean> {
    try {
      logger.info('Filling verification code', { code });

      // Look for verification code input
      const codeInputs = await page.$$('input[type="text"]');
      
      for (const input of codeInputs) {
        const placeholder = await input.getAttribute('placeholder');
        if (placeholder && (placeholder.includes('code') || placeholder.includes('Code'))) {
          await input.fill(code);
          logger.info('Verification code filled');
          
          // Try to submit
          const submitButton = await page.$('button[type="submit"]');
          if (submitButton) {
            await submitButton.click();
            logger.info('Verification submitted');
          }
          
          return true;
        }
      }

      throw new Error('Could not find verification code input field');
    } catch (error) {
      logger.error('Failed to fill verification code', { error });
      throw error;
    }
  }

  async isAccountCreated(page: Page): Promise<boolean> {
    try {
      // Check if redirected to dashboard or success page
      const currentUrl = page.url();
      logger.info('Current page URL', { url: currentUrl });

      // Nike typically redirects to /orders or dashboard after successful signup
      if (currentUrl.includes('/orders') || currentUrl.includes('/dashboard') || currentUrl.includes('/home')) {
        logger.info('Account creation confirmed - redirected to dashboard');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking account creation', { error });
      return false;
    }
  }
}

export const nikeSignupWorkflow = new NikeSignupWorkflow();
