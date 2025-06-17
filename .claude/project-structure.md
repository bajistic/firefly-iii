# Project Structure Overview

## Repository Layout

```
/home/bayarbileg/jarvis/
├── .claude/                         # Claude AI instructions and context
│   ├── instructions.md              # Development guidelines and best practices
│   ├── context.md                   # Current project state and recent changes
│   └── project-structure.md         # This file - architectural overview
│
├── firefly-iii/                     # Main AI Assistant Application (Git Submodule)
│   ├── src/
│   │   ├── server.js                # 🔥 Express server + AI dispatch (MODIFIED for dual sync)
│   │   ├── firefly.js               # 🔥 Dual database sync layer (ENHANCED)
│   │   ├── firefly-sync.js          # 🆕 Sync helper functions  
│   │   ├── auth.js                  # Google OAuth2 + token management
│   │   ├── calendar.js              # Google Calendar API wrappers
│   │   ├── coverletter.js           # Google Docs template generation
│   │   ├── telegram.js              # Telegram bot for receipt processing
│   │   ├── gmail.js                 # Gmail API integration
│   │   ├── db.js                    # Database connection management
│   │   ├── prompts.js               # OpenAI system prompts
│   │   ├── schemas.js               # JSON Schema for AI functions
│   │   ├── zodschemas.js            # Zod runtime validation
│   │   ├── scraper.js               # Job scraping functionality
│   │   ├── init-db.js               # Database initialization
│   │   ├── migrate-db.js            # Database migration scripts
│   │   ├── update-db.js             # Database update utilities
│   │   ├── console.js               # Console logging utilities
│   │   ├── dossier.md               # CV/resume data for cover letters
│   │   └── public/
│   │       └── index.html           # Static client UI for calendar testing
│   ├── __tests__/                   # Test suites
│   │   ├── auth.test.js
│   │   ├── calendar.test.js
│   │   ├── server.test.js
│   │   └── zodschemas.test.js
│   ├── uploads/                     # Receipt images and attachments
│   ├── package.json                 # Node.js dependencies
│   ├── package-lock.json
│   ├── nodemon.json                 # Development server config
│   ├── jest.config.js               # Testing configuration
│   ├── ecosystem.config.js          # PM2 process management
│   ├── error.log                    # Application error logs
│   └── README.md                    # Application-specific documentation
│
├── docker-compose.yml               # 🆕 Firefly III Docker setup
├── .env.firefly                     # 🆕 Firefly III Docker configuration
│
├── migrate_finance_to_firefly.js    # 🆕 Data migration script (COMPLETED)
├── migrate_to_firefly.js            # 🆕 Alternative migration script
├── test_sync.js                     # 🆕 Dual database sync testing
│
├── MIGRATION_GUIDE.md               # 🆕 Step-by-step migration instructions
├── README.md                        # 🔄 Updated project documentation
│
├── .env                             # Environment variables (DB, APIs, tokens)
├── .gitmodules                      # Git submodule configuration
├── .gitignore                       # Git ignore patterns
│
├── finance_migration_backup.json    # 🆕 Backup of migrated data
├── finance.sql                      # Original database structure dump
│
├── package.json                     # Root project dependencies
├── package-lock.json
├── nodemon.json
├── jest.config.js
│
├── uploads/                         # Receipt images (also at root level)
├── node_modules/                    # Node.js dependencies
│
├── __tests__/                       # Root-level test suites
│   ├── auth.test.js
│   ├── calendar.test.js
│   ├── server.test.js
│   └── zodschemas.test.js
│
├── src/                             # Duplicate of firefly-iii/src (legacy)
│   ├── expenses.db                  # SQLite database files
│   ├── expenses_bk.db
│   ├── expenses_mm.db
│   └── uploads/
│
└── SQL Scripts/                     # Database management scripts
    ├── add_receipt_meta.sql
    ├── create_api_token.sql
    ├── create_firefly_user.sql
    ├── create_firefly_user_fixed.sql
    ├── fix_currency_issue.sql
    ├── migrate_custom_data.sql
    ├── migrate_custom_data_fixed.sql
    ├── migrate_data.sql
    └── reimport_data_carefully.js
```

## Key Components

### 🔥 Core Application (`firefly-iii/`)
**Git Submodule** on `firefly-final` branch containing the main AI assistant.

#### Critical Modified Files:
- **`src/firefly.js`** - Enhanced with dual database sync functions
- **`src/server.js`** - Modified to use synced functions for all financial operations

#### New Files Added:
- **`src/firefly-sync.js`** - Helper functions for database synchronization

### 🆕 Docker Infrastructure
- **`docker-compose.yml`** - Firefly III MariaDB + web container setup
- **`.env.firefly`** - Firefly III specific configuration

### 🆕 Migration & Testing
- **`migrate_finance_to_firefly.js`** - Successfully migrated 81 transactions + 187 items
- **`test_sync.js`** - Verifies dual database synchronization works correctly

## Database Architecture

### Primary Database (MariaDB)
```
Host: 192.168.1.100:3306
Database: finance

Tables:
├── transactions      # Main transaction records
├── items            # Transaction line items  
├── income           # Income entries
└── accounts         # Account information
```

### Firefly III Database (Docker)
```
Host: localhost:3001 (Docker container)
Database: firefly (MariaDB container)

Schema: Full Firefly III Laravel schema
├── transaction_journals    # Main transaction records
├── transactions           # Debit/credit entries
├── accounts              # Asset/expense/revenue accounts
├── transaction_groups    # Transaction groupings
└── [50+ other tables]    # Full Firefly III schema
```

## Data Flow

```
Natural Language Input
         ↓
    AI Processing (OpenAI)
         ↓
   Extract Financial Data
         ↓
    Dual Database Sync
    ├── Original MariaDB (finance.transactions)
    └── Firefly III (Docker container)
         ↓
    Success Response with Both IDs
```

## Key Integrations

### Active APIs
- **OpenAI API** - Natural language processing and function calling
- **Google Calendar API** - Event scheduling and management  
- **Google Docs API** - Cover letter generation from templates
- **Google Drive API** - Document sharing and management
- **Telegram Bot API** - Receipt processing via chat interface

### Database Connections
- **MariaDB** (`192.168.1.100:3306`) - Primary data store
- **Firefly III** (`localhost:3001`) - Professional financial management
- **SQLite** (`src/expenses.db`) - Legacy database (still present)

## Development Environment

### Required Services
1. **MariaDB Server** - Running on `192.168.1.100:3306`
2. **Docker + Docker Compose** - For Firefly III containers
3. **Node.js Application** - Main AI assistant server
4. **Telegram Bot** - For receipt processing (optional)

### Environment Files
- **`.env`** - Main configuration (database, APIs, tokens)
- **`.env.firefly`** - Firefly III Docker configuration
- **`credentials.json`** - Google OAuth2 credentials (not in repo)
- **`token.json`** - Google OAuth2 tokens (auto-generated)

## Recent Changes (June 17, 2025)

### ✅ Completed
1. **Dual Database Sync Implementation**
   - Enhanced `firefly.js` with `createSyncedTransaction()` and `createSyncedIncome()`
   - Modified `server.js` to use synced functions
   - All financial operations now update both databases automatically

2. **Data Migration**
   - Successfully migrated 81 transactions from custom schema to Firefly III
   - Migrated 187 transaction items with full details preserved
   - Migrated 1 income entry with proper categorization
   - 0 errors during migration process

3. **Docker Infrastructure**
   - Set up Firefly III on `localhost:3001`
   - Configured MariaDB backend for Firefly III
   - Created environment-specific configuration

4. **Documentation**
   - Updated README.md with dual sync documentation
   - Created MIGRATION_GUIDE.md with detailed setup instructions
   - Added Claude instructions for future development

### 🔄 Maintained
- **AI Interface** - Natural language commands unchanged
- **Telegram Integration** - Receipt processing still works seamlessly  
- **Google APIs** - Calendar, Docs, Drive integrations preserved
- **Original Database** - Custom schema maintained alongside Firefly III

## Security & Access

### Credentials Location
- Database passwords in `.env` (not committed)
- API tokens in `.env` (not committed)  
- Google OAuth credentials in `credentials.json` (not committed)
- Firefly III API token in `.env` (auto-configured)

### Network Access
- MariaDB: `192.168.1.100:3306` (internal network)
- Firefly III: `localhost:3001` (Docker container)
- AI Assistant: `localhost:3000` (configurable)

### Data Privacy
- All processing happens locally
- No financial data sent to external services (except OpenAI for NLP)
- Receipt images stored locally in `uploads/`
- Database connections over internal network only

This structure enables seamless dual database synchronization while maintaining the existing AI assistant functionality.