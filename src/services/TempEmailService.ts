import MailSlurp from 'mailslurp-client';
import axios from 'axios';
import { Logger } from '../utils/Logger';

export interface TempEmail {
  address: string;
  id: string;
  expiresAt: Date | null;
}

export class TempEmailService {
  private logger: Logger;
  private client: any;

  constructor() {
    this.logger = new Logger('TempEmailService');
    const apiKey = process.env.MAILSLURP_API_KEY;
    if (!apiKey) {
      this.logger.warn('MAILSLURP_API_KEY not set — TempEmailService will still work in mock mode for generateTempEmail');
    }
    this.client = new MailSlurp({ apiKey });
  }

  async generateTempEmail(): Promise<TempEmail> {
    try {
      this.logger.info('Generating temporary email address via MailSlurp');
      if (!process.env.MAILSLURP_API_KEY) {
        // Fallback mock
        const tempEmail: TempEmail = {
          address: `temp-${Date.now()}@example.com`,
          id: `mock-${Date.now()}`,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        };
        this.logger.success(`(mock) Temp email generated: ${tempEmail.address}`);
        return tempEmail;
      }

      const inbox = await this.client.createInbox({ name: `nike-creator-${Date.now()}` });
      const tempEmail: TempEmail = {
        address: inbox.emailAddress,
        id: inbox.id,
        expiresAt: null
      };
      this.logger.success(`Temp email generated: ${tempEmail.address} (id=${tempEmail.id})`);
      return tempEmail;
    } catch (error) {
      this.logger.error(`Failed to generate temp email: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async getEmails(tempEmailIdOrAddress: string): Promise<string[]> {
    try {
      this.logger.debug(`Fetching emails for: ${tempEmailIdOrAddress}`);
      if (!process.env.MAILSLURP_API_KEY) return [];

      // If the caller passed an address rather than inbox id, try to find the inbox
      let inboxId = tempEmailIdOrAddress;
      if (tempEmailIdOrAddress.includes('@')) {
        const inboxes = await this.client.getInboxes({ emailAddress: tempEmailIdOrAddress });
        if (inboxes && inboxes.content && inboxes.content.length > 0) {
          inboxId = inboxes.content[0].id;
        }
      }

      const emails = await this.client.getEmails(inboxId, { size: 50 });
      return emails.map((e: any) => e.body || e.subject || '');
    } catch (error) {
      this.logger.error(`Failed to fetch emails: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private extractOtpWithRegex(body: string): string | null {
    if (!body) return null;
    // Common patterns: 4-8 digit codes
    const m = body.match(/(?:verification code|code|otp|one-time code)[^\d]{0,10}(\d{4,8})/i) || body.match(/(\d{4,8})/);
    return m ? m[1] : null;
  }

  private async extractOtpWithAI(body: string): Promise<string | null> {
    if (!process.env.OPENAI_API_KEY) {
      this.logger.debug('OPENAI_API_KEY not set — skipping AI extraction');
      return null;
    }
    try {
      this.logger.info('Attempting AI extraction fallback for OTP');
      const prompt = `Extract the verification code (4-8 digits) from the following email and return only the digits. If none found, return an empty string.\n\nEmail:\n${body}`;
      const resp = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const text = resp.data?.choices?.[0]?.message?.content || '';
      const m = text.match(/(\d{4,8})/);
      return m ? m[1] : null;
    } catch (error) {
      this.logger.error(`AI extraction failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  async getVerificationCode(tempEmailIdOrAddress: string, maxWaitMs: number = 30_000): Promise<string> {
    try {
      this.logger.info('Polling for verification code...');

      if (!process.env.MAILSLURP_API_KEY) {
        this.logger.warn('MAILSLURP_API_KEY not set — cannot poll real inbox. Returning mock code "000000"');
        return '000000';
      }

      // Resolve inbox id if an address was passed
      let inboxId = tempEmailIdOrAddress;
      if (tempEmailIdOrAddress.includes('@')) {
        const inboxes = await this.client.getInboxes({ emailAddress: tempEmailIdOrAddress });
        if (inboxes && inboxes.content && inboxes.content.length > 0) {
          inboxId = inboxes.content[0].id;
        }
      }

      const start = Date.now();
      const pollInterval = 2000;
      while (Date.now() - start < maxWaitMs) {
        try {
          // waitForLatestEmail is convenient — use it with a short timeout
          const email = await this.client.waitForLatestEmail(inboxId, 5000);
          const body = email.body || email.subject || '';
          this.logger.debug(`Received email: ${body.substring(0, 200)}`);

          // Try regex first
          let code = this.extractOtpWithRegex(body);
          if (code) return code;

          // Fallback to AI extraction if configured
          code = await this.extractOtpWithAI(body);
          if (code) return code;

        } catch (err) {
          // waitForLatestEmail times out often — ignore and continue polling
          this.logger.debug('No new email yet (waiting)...');
        }

        await new Promise((r) => setTimeout(r, pollInterval));
      }

      this.logger.warn('Timed out waiting for verification code');
      return '';
    } catch (error) {
      this.logger.error(`Failed to get verification code: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
