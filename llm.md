# Google Calendar API AI Assistant

This repository implements an AI-driven assistant that handles multiple tasks via natural language commands, including:
- Scheduling Google Calendar events
- Creating Things (macOS) to-do items
- Generating cover letters in Google Docs from a local dossier
- Recording transactions (with receipt images) into a local SQLite database
- Adding income entries and managing accounts in SQLite
- Fallback general responses

Under the hood, the assistant leverages OpenAI’s function-calling chat API, Google APIs (Calendar, Docs, Drive), a SQLite data store, and minimal client UI.

## Features
- **Natural-Language Interface**: One `/ai/natural` endpoint accepts free-text commands (and optional receipt images) to drive all actions.
- **Calendar Integration**: Create, list, and delete events via Google Calendar API.
- **To-Do Integration**: Add tasks to Things app via URL schemes on macOS.
- **Cover Letter Generation**: Copy and populate a Google Docs template using YAML-structured prompts and a local `dossier.md` (CV).
- **Expense Tracking**: Parse receipts (JPEG/HEIC) to extract shop, date/time, total, line items, and store in SQLite tables (`transactions`, `items`).
- **Income & Accounts**: Record income entries, create accounts, and maintain balances in SQLite.
- **Robust Validation**: JSON Schema and Zod schemas ensure correct structure before executing actions.
- **Result Interpretation**: A second AI pass formats success/error results into human-friendly summaries.

## Repository Layout
```
├── credentials.json         # OAuth2 client credentials for Google APIs
├── token.json               # Stored OAuth2 tokens (auto-generated)
├── .env                     # Environment variables (see below)
├── dossier.md               # Local CV/resume used for cover-letter data
├── expenses.db              # SQLite database (created after init)
├── uploads/                 # Uploaded receipt images
├── src/
│   ├── server.js            # Express server & main AI dispatch logic
│   ├── auth.js              # Google OAuth2 + token refresh logic
│   ├── calendar.js          # Google Calendar API wrappers
│   ├── coverletter.js       # Google Docs/Drive wrapper for cover letters
│   ├── prompts.js           # OpenAI system, interpreter, and cover-letter prompts
│   ├── schemas.js           # JSON Schema for AI function-calling
│   ├── zodschemas.js        # Zod schemas for runtime validation
│   ├── migrations/
│   │   ├── init-db.js        # SQLite schema initialization
│   │   ├── migrate-db.js     # SQLite migration scripts
│   │   └── update-db.js      # SQLite migration helper
│   └── public/              # Static client UI for Calendar testing
│       └── index.html
├── package.json             # Node.js dependencies & scripts
├── package-lock.json
├── debug.log                # Optional debug logs
└── error.log                # Runtime error logging
```

## Prerequisites
- Node.js (v16+) and npm
- A Google Cloud project with OAuth 2.0 credentials (Web/Desktop)
  1. Enable Calendar, Docs, and Drive APIs.
  2. Download `credentials.json` and place at the repo root.
- An OpenAI API key (v4+ access).

## Environment Variables
Create a `.env` file at the project root with:
```
OPENAI_API_KEY=sk-...(your key)...
# Optional: override auto-detected Tailscale IP for status endpoint
TAILSCALE_IP=100.x.y.z
# Optional: custom server port (defaults to 3000)
PORT=3000
```

## Setup & Initialization
1. Install dependencies:
   ```bash
   npm install
   ```
2. Initialize the local SQLite database:
   ```bash
   node src/migrations/init-db.js
   ```
3. (Optional) Apply migrations:
   ```bash
   node src/migrations/update-db.js
   ```
4. Start the server:
   - Development (auto-restart): `npm run dev`
   - Production: `npm start`

The server listens on `http://<TAILSCALE_IP>:<PORT>` bound to `0.0.0.0`.

## API Endpoints

### GET /status
Returns basic health and the detected Tailscale IP:
```json
{ "status": "ok", "tailscale_ip": "100.x.y.z" }
```

### POST /ai/natural
Core endpoint for all AI-driven actions.
- Content-Type: `multipart/form-data`
- Fields:
  - `command` (string): the natural language instruction.
  - `receipt` (file, optional): an image (JPEG/HEIC) of a receipt.

Example cURL:
```bash
curl -F "command=Track my receipt from Migros" \
     -F "receipt=@/path/to/receipt.jpg" \
     http://localhost:3000/ai/natural
```

Response:
```json
{ "message": "Added transaction for Migros on 2025-05-21 CHF45.50." }
```

Supported actions automatically parsed include:
- `create_event`, `list_events`, `delete_event`
- `create_todo`
- `create_cover_letter`
- `create_transaction`, `add_income`, `add_account`
- Fallback: `respond`

## Static Client (Calendar Testing)
Open `src/public/index.html` in your browser (served at `/`) to manually:
- Create events
- List events
- Delete events

## Key Components

### `src/server.js`
- Configures Express, file uploads (multer), image conversion (sharp).
- Central `/ai/natural` handler: builds prompts, calls OpenAI, dispatches actions, interprets results.
- Error logging to `error.log`.

### `src/auth.js`
- Reads `credentials.json`, handles OAuth2 flows, token storage (`token.json`), and refresh.

### `src/calendar.js`
- `createEvent`, `listEvents`, `deleteEvent` wrappers around Google Calendar API v3.

### `src/coverletter.js`
- Copies a Google Docs template, replaces placeholders based on YAML payloads, returns a share URL.

### `src/prompts.js`
- Defines system/cover-letter/interpreter prompts for OpenAI’s chat API with function-calling.

### `src/schemas.js` & `src/zodschemas.js`
- JSON-Schema and Zod definitions to validate AI’s function calls before execution.

### Database Scripts
- `src/init-db.js`: creates tables for `transactions`, `items`, `income`, and `accounts`.
- `src/update-db.js`: example migration (adding a `currency` column).

## Logging & Debugging
- Debug logs printed to console and optionally captured in `debug.log`.
- Runtime errors are appended to `error.log` with timestamps.

## Contributing
- Feel free to open issues or pull requests for enhancements or bug fixes.

## License
This project is released under the MIT License. See `LICENSE` (if present) for details.


# 📁Claude Instructions

  1. .claude/instructions.md - Comprehensive Development Guide

  - Project architecture and database systems overview
  - Development guidelines and code patterns
  - Testing procedures and common tasks
  - Security considerations and best practices
  - Troubleshooting guide and emergency procedures

  2. .claude/context.md - Current Project State

  - Recent changes and migration status
  - System status with all components
  - Technical architecture and data mapping
  - Usage patterns and response formats
  - Integration status and future plans

  3. .claude/project-structure.md - Detailed File Structure

  - Complete repository layout with explanations
  - Key components and their responsibilities
  - Database architecture diagrams
  - Data flow visualization
  - Recent changes tracking

  4. .claude/CLAUDE.md - Quick Reference Summary

  - Concise project overview
  - Key features and architecture summary
  - Critical files and development guidelines
  - Current status checklist

  🎯 Benefits:

  - Future Development: Any Claude instance can quickly understand your
  project
  - Consistency: Clear guidelines for maintaining dual database sync
  - Onboarding: New developers can understand the system architecture
  - Documentation: Comprehensive reference for all project aspects
  - Best Practices: Established patterns for financial data handling
