## Vercel deployment (serverless webhook flow)

This repository includes two serverless endpoints suitable for deployment on Vercel:

- `POST /api/create` — creates a MailSlurp inbox and returns { id, emailAddress }.
- `POST /api/webhook` — receives inbound email webhooks from MailSlurp, extracts an OTP (regex-first, optional OpenAI fallback), and optionally forwards the result to a CALLBACK_URL.

How it works
1. Deploy to Vercel (connect this repository and use the `make-working` branch or main).
2. Configure environment variables in the Vercel Project Settings:
   - MAILSLURP_API_KEY (required to create inboxes programmatically)
   - OPENAI_API_KEY (optional, for AI fallback when regex extraction fails)
   - CALLBACK_URL (optional, if you want webhook events forwarded to another service)
   - LIVE_MODE (false by default; do not enable unless you understand legal/TOS risks)

MailSlurp webhook configuration
- After creating an inbox (via `POST /api/create` or the MailSlurp dashboard), configure the inbox's webhook to point to:
  `https://<your-vercel-domain>/api/webhook`
- When inbound email arrives, MailSlurp will POST the message payload to this endpoint. The webhook handler will try to extract a verification code and respond with the extracted code.

Notes and cautions
- Do NOT enable LIVE_MODE=true on a public deployment unless you explicitly accept legal and Terms-of-Service risks for interacting with Nike.
- Keep your API keys in Vercel Environment Variables (do not commit them to source control).

Testing locally
- You can still test the API locally using Vercel CLI or by running the project and exposing the endpoints via ngrok and configuring MailSlurp to send to your tunnel.

Example create call (curl):

```
curl -X POST https://<your-vercel-domain>/api/create -H "Content-Type: application/json" -d '{"name":"test-inbox"}'
```

Example webhook payload handler response (MailSlurp will POST to /api/webhook automatically):
```
{ "ok": true, "extractedCode": "123456" }
```
