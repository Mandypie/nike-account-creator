import axios from 'axios';

export default async function handler(req: any, res: any) {
  // Webhook receiver for MailSlurp inbound emails.
  // MailSlurp will POST JSON like: { messageId, subject, body, preview, inboxId, from, to }
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const payload = req.body || {};
    const body = payload.body || payload.subject || '';

    // Simple regex extractor
    const regexMatch = body.match(/(?:verification code|code|otp|one-time code)[^\d]{0,10}(\d{4,8})/i) || body.match(/(\d{4,8})/);
    let code = regexMatch ? regexMatch[1] : null;

    // Optional AI fallback
    if (!code && process.env.OPENAI_API_KEY) {
      try {
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
        if (m) code = m[1];
      } catch (e) {
        console.error('AI extraction failed', e?.message || e);
      }
    }

    // If there's a CALLBACK_URL configured, POST the extracted code and payload there
    if (process.env.CALLBACK_URL) {
      try {
        await axios.post(process.env.CALLBACK_URL, { code, payload });
      } catch (e) {
        console.error('Failed to forward webhook to CALLBACK_URL', e?.message || e);
      }
    }

    // Log and respond
    console.log('Received MailSlurp webhook for inbox:', payload.inboxId, 'extractedCode:', code);

    res.status(200).json({ ok: true, extractedCode: code });
  } catch (err: any) {
    console.error('Webhook handler error', err?.message || err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
