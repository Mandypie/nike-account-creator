# Nike Account Creator - Setup Steps

Follow these steps to complete the Nike Account Creator project setup.

## Step 1: Environment Configuration

Copy the example environment file and update it with your actual values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `MAILSLURP_API_KEY` - Get from https://www.mailslurp.com (free account)
- `DATABASE_URL` - PostgreSQL connection (format: `postgresql://user:password@host:port/database`)
- `APP_SECRET` - Change from default (any random string)
- `NODE_ENV` - Set to `development` or `production`

## Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages including:
- Express (API framework)
- Playwright (browser automation)
- PostgreSQL client
- Pino (logging)
- Zod (validation)

## Step 3: Set Up PostgreSQL Database

### Option A: Local PostgreSQL (Recommended for Development)

Make sure PostgreSQL is installed and running:

```bash
# Start PostgreSQL service (if not already running)
# On macOS with Homebrew:
brew services start postgresql

# On Linux:
sudo systemctl start postgresql

# On Windows, use PostgreSQL Service in Services app
```

Create the database:

```bash
createdb nike_creator
```

Update `DATABASE_URL` in `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nike_creator
```

### Option B: Docker PostgreSQL

```bash
docker run --name nike-postgres \
  -e POSTGRES_DB=nike_creator \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:17
```

## Step 4: Get MailSlurp API Key

1. Go to https://www.mailslurp.com
2. Sign up for a free account
3. Navigate to Settings → API Keys
4. Copy your API key
5. Paste it in `.env` as `MAILSLURP_API_KEY`

## Step 5: Build TypeScript

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Step 6: Run Database Migrations

Migrations run automatically when the app starts, but you can test them:

```bash
npm run dev
```

The app will:
- Connect to PostgreSQL
- Create required tables (`accounts` and `creation_logs`)
- Start the Express server on port 3000

## Step 7: Test the API

Keep the dev server running and test in a new terminal:

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-09-04T18:45:00.000Z"
}
```

### Create an Account
```bash
curl -X POST http://localhost:3000/api/accounts/create \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-15",
    "phoneNumber": "+1234567890",
    "password": "MySecurePassword123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "email": "temp.email@mailslurp.com",
  "error": null,
  "duration": "45000ms"
}
```

### List Created Accounts
```bash
curl http://localhost:3000/api/accounts
```

Expected response:
```json
{
  "total": 1,
  "accounts": [
    {
      "email": "temp.email@mailslurp.com",
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "2026-09-04T18:45:00.000Z"
    }
  ]
}
```

## Step 8: Verify the Workflow (Optional)

To see the browser automation in action:

1. Set `HEADLESS=false` in `.env`
2. Run the app again
3. Create an account - you'll see the browser open and fill the Nike signup form

## Step 9: Production Deployment

### Option A: Railway (Recommended)

1. Push repo to GitHub
2. Go to https://railway.app
3. Connect GitHub repository
4. Add PostgreSQL plugin
5. Set environment variables
6. Deploy

### Option B: Docker

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
npm run build
docker build -t nike-account-creator .
docker run -e DATABASE_URL=... -e MAILSLURP_API_KEY=... -p 3000:3000 nike-account-creator
```

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run build
```

### Database connection fails
- Check `DATABASE_URL` format
- Verify PostgreSQL is running
- Check username/password

### MailSlurp API errors
- Verify `MAILSLURP_API_KEY` is correct
- Check MailSlurp account has credits

### Nike form selectors not found
- Nike's HTML may have changed
- Update selectors in `src/services/nike.ts`
- Use `HEADLESS=false` to debug visually

## Available Commands

```bash
npm run dev          # Start development server
npm run build        # Compile TypeScript
npm run typecheck    # Check types without building
npm run start        # Start production server (requires build first)
npm test            # Run tests
```

## Project Layout

- **Config**: Environment validation with Zod
- **Services**: Core automation (browser, temp email, Nike workflow)
- **Database**: PostgreSQL schema and queries
- **API**: Express endpoints for account creation/listing
- **Logging**: Structured JSON logs with Pino

## Next Features to Add

- [ ] Bulk account creation queue
- [ ] Webhook notifications on account creation
- [ ] Dashboard UI for account management
- [ ] Export accounts to CSV
- [ ] Account verification status tracking
- [ ] Rate limiting per IP
- [ ] Failed account retry logic

---

**You're all set!** 🎉 Your Nike Account Creator is ready to use. Start with `npm run dev` and test the API endpoints.
