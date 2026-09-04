export default async function handler(req: any, res: any) {
  // Simple Vercel Serverless handler to create a MailSlurp inbox
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed, use POST' });
      return;
    }

    const MailSlurp = require('mailslurp-client').default || require('mailslurp-client');
    const apiKey = process.env.MAILSLURP_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'MAILSLURP_API_KEY not configured' });
      return;
    }

    const client = new MailSlurp({ apiKey });
    const name = (req.body && req.body.name) || `nike-creator-${Date.now()}`;

    const inbox = await client.createInbox({ name });

    res.status(200).json({ id: inbox.id, emailAddress: inbox.emailAddress });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
}
