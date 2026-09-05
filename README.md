# account-automation

Automated account creation with temporary email verification and verification code auto-fill

## Features

- 🤖 Automated account creation
- 📧 Temporary email integration for verification
- 🔐 Automatic verification code extraction and auto-fill
- ⚡ High-speed account creation
- 🛡️ Built with TypeScript for type safety
- 🎯 Easy-to-use CLI interface

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn

## Installation

### Clone the repository

```bash
git clone https://github.com/Mandypie/account-automation.git
cd account-automation
```

### Install dependencies

```bash
npm install
```

## Configuration

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:

```env
API_BASE_URL=https://www.example.com
TEMP_EMAIL_SERVICE=tempmail
DEBUG=false
LOG_LEVEL=info
```

## Building

### Build the project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Development mode

```bash
npm run dev
```

Runs the project in development mode with ts-node (no compilation needed).

## Usage

### Using the CLI

```bash
# Create a new account
npm start create --password "your-password"

# Verify email and auto-fill codes
npm start verify --email "temp-email@example.com"
```

### Programmatic usage

```typescript
import { AccountCreator } from './services/AccountCreator';
import { TempEmailService } from './services/TempEmailService';

const tempEmailService = new TempEmailService();
const creator = new AccountCreator(tempEmailService);

await creator.createAccount({
  email: 'user@example.com',
  password: 'secure-password',
  firstName: 'John',
  lastName: 'Doe'
});
```

## Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Run in development mode
- `npm start` - Run the compiled CLI
- `npm run clean` - Remove dist directory
- `npm run lint` - Run ESLint
- `npm run type-check` - Check types without emitting files

## Project Structure

```
account-automation/
├── src/
│   ├── services/
│   │   ├── AccountCreator.ts      # Main account creation logic
│   │   └── TempEmailService.ts    # Temp email handling
│   ├── utils/
│   │   └── Logger.ts              # Logging utility
│   ├── index.ts                   # Main entry point
│   └── cli.ts                     # CLI commands
├── dist/                          # Compiled output
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── .eslintrc.json                 # ESLint configuration
├── .gitignore                     # Git ignore rules
├── .env.example                   # Environment template
└── README.md                       # This file
```

## Dependencies

### Production

- **axios** - HTTP client for API requests
- **chalk** - Terminal string styling
- **dotenv** - Environment variable management
- **ora** - Terminal spinner
- **temp-mail** - Temporary email service integration

### Development

- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution
- **@typescript-eslint/parser** - TypeScript ESLint parser
- **@typescript-eslint/eslint-plugin** - TypeScript ESLint plugin
- **eslint** - Code linting

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Mandypie/account-automation.git
cd account-automation
npm install

# 2. Build the project
npm run build

# 3. Configure environment
cp .env.example .env
# Edit .env with your settings

# 4. Run
npm start create --password "your-password"
```

## Troubleshooting

### Build errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Type errors

```bash
# Check types
npm run type-check
```

### Linting errors

```bash
# Run ESLint
npm run lint
```

## Development

### Running in development mode

```bash
npm run dev
```

### Type checking

```bash
npm run type-check
```

### Code quality

```bash
npm run lint
```

## API Reference

### AccountCreator

```typescript
class AccountCreator {
  createAccount(config: AccountConfig): Promise<void>
  verifyEmail(tempEmail: string): Promise<string>
}
```

### TempEmailService

```typescript
class TempEmailService {
  generateTempEmail(): Promise<TempEmail>
  getEmails(tempEmailId: string): Promise<string[]>
  getVerificationCode(tempEmailId: string, maxAttempts?: number): Promise<string>
}
```

## License

MIT

## Author

Mandypie

## Support

For issues and questions, please open an issue on GitHub.
