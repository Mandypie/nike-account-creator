import axios from 'axios';
import { Logger } from '../utils/Logger';
import { TempEmailService } from './TempEmailService';

export interface AccountConfig {
  email?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export class NikeAccountCreator {
  private logger: Logger;
  private tempEmailService: TempEmailService;
  private apiClient = axios.create({
    baseURL: process.env.NIKE_API_BASE_URL || 'https://www.nike.com',
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  constructor(tempEmailService: TempEmailService) {
    this.logger = new Logger('AccountCreator');
    this.tempEmailService = tempEmailService;
  }

  async createAccount(config: AccountConfig): Promise<void> {
    try {
      this.logger.info(`Creating Nike account for ${config.email ?? '(will generate temp email)'}...`);

      // 1) Ensure we have an email (generate temp inbox if not provided)
      let inbox = null;
      if (!config.email) {
        inbox = await this.tempEmailService.generateTempEmail();
        config.email = inbox.address;
        this.logger.info(`Generated temp email: ${config.email} (id=${inbox.id})`);
      }

      // 2) Build registration payload
      const payload = {
        email: config.email,
        password: config.password,
        firstName: config.firstName || 'John',
        lastName: config.lastName || 'Doe'
        // Note: real Nike signup likely requires many more fields and CSRF/session handling
      };

      // Live mode: optionally perform a real HTTP request to register (best-effort)
      const live = (process.env.LIVE_MODE === 'true');
      if (live) {
        this.logger.info('LIVE_MODE=true: attempting to submit registration request to Nike (best-effort)');
        try {
          // This is a best-effort request. Nike's real signup flow is more complex; this may not succeed.
          const res = await this.apiClient.post('/register', payload);
          this.logger.info(`Nike registration request responded: ${res.status}`);
        } catch (err) {
          this.logger.warn(`Nike registration request failed (this may be expected): ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        this.logger.info('LIVE_MODE not enabled — skipping real registration. Use LIVE_MODE=true to attempt real requests.');
      }

      // 3) Wait for verification email and extract code
      const inboxId = inbox?.id ?? config.email; // allow passing inbox id or address to getVerificationCode
      const code = await this.tempEmailService.getVerificationCode(inboxId, 60_000);

      if (!code) {
        this.logger.warn('No verification code was retrieved');
      } else {
        this.logger.success(`Retrieved verification code: ${code}`);
        // 4) If live, submit verification to Nike (best-effort)
        if (live) {
          try {
            const verifyRes = await this.apiClient.post('/verify', { email: config.email, code });
            this.logger.info(`Nike verification responded: ${verifyRes.status}`);
          } catch (err) {
            this.logger.warn(`Nike verification request failed: ${err instanceof Error ? err.message : String(err)}`);
          }
        } else {
          this.logger.info('LIVE_MODE not enabled — skipping real verification call.');
        }
      }

      this.logger.success('createAccount flow completed (check logs for details)');

    } catch (error) {
      this.logger.error(`Failed to create account: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async verifyEmail(tempEmail: string): Promise<string> {
    try {
      this.logger.info(`Verifying email/inbox: ${tempEmail}`);
      const code = await this.tempEmailService.getVerificationCode(tempEmail, 60_000);
      if (!code) {
        throw new Error('No verification code found');
      }
      return code;
    } catch (error) {
      this.logger.error(`Failed to verify email: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
