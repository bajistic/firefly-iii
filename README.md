# AI Financial Assistant with Dual Database Sync

This repository implements an AI-driven assistant that handles multiple tasks via natural language commands, including:
- Scheduling Google Calendar events
- Creating Things (macOS) to-do items  
- Generating cover letters in Google Docs from a local dossier
- **Recording transactions with automatic dual database sync (MariaDB + Firefly III)**
- Adding income entries and managing accounts
- Processing receipts with OCR and item extraction
- Fallback general responses

The assistant now features **seamless dual database synchronization**, automatically maintaining data consistency between your original MariaDB database and Firefly III for comprehensive financial management.

## 🚀 Key Features

- **Natural-Language Interface**: One `/ai/natural` endpoint accepts free-text commands (and optional receipt images)
- **Dual Database Sync**: Automatically syncs financial data to both MariaDB and Firefly III
- **Calendar Integration**: Create, list, and delete events via Google Calendar API
- **To-Do Integration**: Add tasks to Things app via URL schemes on macOS
- **Cover Letter Generation**: Copy and populate Google Docs templates
- **Advanced Receipt Processing**: Parse receipts (JPEG/HEIC) to extract shop, date/time, total, line items
- **Multi-Currency Support**: Handle EUR, CHF, USD transactions
- **Firefly III Integration**: Full compatibility with Firefly III for budgeting and financial planning
- **Telegram Bot Integration**: Process receipts and commands via Telegram
- **Robust Validation**: JSON Schema and Zod schemas ensure data integrity

## 🗄️ Database Architecture

### Original MariaDB Database
- **Host**: `192.168.1.100:3306`
- **Database**: `finance` 
- **Tables**: `transactions`, `items`, `income`, `accounts`
- **Purpose**: Your primary data store with custom schema

### Firefly III (Docker)
- **URL**: `http://localhost:3001`
- **Purpose**: Professional financial management with budgets, reports, and analysis
- **Database**: Separate MariaDB container with full Firefly III schema

### Automatic Sync
All financial transactions are automatically synchronized between both systems:
- **Create Transaction** → Saved to both MariaDB and Firefly III
- **Add Income** → Synchronized across both databases  
- **Account Management** → Consistent across systems
- **Receipt Processing** → Item details preserved in both

## 📁 Repository Layout

```
├── firefly-iii/                    # Your main AI assistant application
│   ├── src/
│   │   ├── server.js               # Express server & main AI dispatch logic
│   │   ├── firefly.js              # Dual database sync layer
│   │   ├── auth.js                 # Google OAuth2 + token refresh
│   │   ├── calendar.js             # Google Calendar API wrappers
│   │   ├── telegram.js             # Telegram bot integration
│   │   ├── db.js                   # Database connection management
│   │   └── firefly-sync.js         # Sync layer helper functions
│   └── package.json
├── docker-compose.yml              # Firefly III Docker setup
├── .env.firefly                    # Firefly III configuration
├── migrate_finance_to_firefly.js   # Migration script for existing data
├── test_sync.js                    # Dual sync testing script
├── MIGRATION_GUIDE.md              # Detailed migration instructions
└── uploads/                        # Receipt images
```

## 🔧 Prerequisites

- **Node.js** (v16+) and npm
- **Docker** and Docker Compose
- **MariaDB** server (for your original database)
- **Google Cloud project** with OAuth 2.0 credentials
  1. Enable Calendar, Docs, and Drive APIs
  2. Download `credentials.json` and place at repo root
- **OpenAI API key** (v4+ access)
- **Telegram Bot Token** (optional, for Telegram integration)

## ⚙️ Environment Variables

Create a `.env` file at the project root:

```bash
# AI & Server
OPENAI_API_KEY=sk-...(your key)...
PORT=3000
TAILSCALE_IP=100.x.y.z

# Original Database
DB_HOST=192.168.1.100
DB_PORT=3306
DB_USER=bayarbileg
DB_PASSWORD=your_password
DB_NAME=firefly_iii

# Firefly III Integration (automatically configured)
FIREFLY_URL=http://localhost:3001
FIREFLY_TOKEN=your_firefly_token

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id

# Google APIs
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

## 🚀 Setup & Initialization

### 1. Install Dependencies
```bash
cd firefly-iii
npm install
```

### 2. Start Firefly III (Docker)
```bash
# From project root
sudo docker compose up -d
```

### 3. Configure Firefly III
1. Visit `http://localhost:3001`
2. Complete registration/setup
3. Go to Options → Profile → OAuth
4. Create Personal Access Token
5. Update `FIREFLY_TOKEN` in `.env`

### 4. Migrate Existing Data (Optional)
```bash
# Migrate your existing finance data to Firefly III
node migrate_finance_to_firefly.js
```

### 5. Test Dual Sync
```bash
# Verify both databases sync correctly  
node test_sync.js
```

### 6. Start AI Assistant
```bash
cd firefly-iii
npm run dev  # Development with auto-restart
# OR
npm start    # Production
```

## 🤖 API Usage

### Core Endpoint: `/ai/natural`

**Minimal Natural Language Interface** - No changes to existing usage!

```bash
# Process receipt
curl -F "command=Track my receipt from Migros" \
     -F "receipt=@receipt.jpg" \
     http://localhost:3000/ai/natural

# Add income  
curl -F "command=Add salary of 3000 CHF for December" \
     http://localhost:3000/ai/natural

# Record expense
curl -F "command=Spent 25.50 EUR at restaurant" \
     http://localhost:3000/ai/natural
```

**Response** (now includes dual sync confirmation):
```json
{
  "message": "✅ Added transaction for Migros on 2025-06-17 in CHF for total of 45.50 CHF. Synced to both databases (Original ID: 123, Firefly ID: 456)"
}
```

### Supported Commands
- **Transactions**: `"Track receipt"`, `"Add expense"`, `"Record purchase"`
- **Income**: `"Add salary"`, `"Record income"`, `"Got paid"`  
- **Calendar**: `"Schedule meeting"`, `"Create event"`
- **Documents**: `"Generate cover letter"`
- **General**: Any other command gets an AI response

## 🔄 Dual Database Sync

### How It Works
1. **AI processes** your natural language command
2. **Extracts** financial data (shop, amount, items, etc.)
3. **Creates** transaction in your original MariaDB database
4. **Automatically syncs** to Firefly III via native database integration
5. **Links** records with cross-references for consistency
6. **Reports** success with both database IDs

### What Gets Synced
- ✅ **Transactions** with full item details
- ✅ **Income entries** 
- ✅ **Multi-currency support** (EUR, CHF, USD)
- ✅ **Receipt metadata** and file paths
- ✅ **Categories and tags** from item analysis
- ✅ **Account relationships**

### Data Integrity
- **Atomic operations**: Both databases updated or neither
- **Error handling**: Failed syncs don't leave partial data
- **Backup preservation**: Original data always maintained
- **Cross-references**: Records linked between systems

## 🏦 Financial Management

### Your Original Database
- **Custom schema** tailored to your needs
- **Direct SQL access** for custom queries
- **Historical data** preservation
- **Backup and migration** control

### Firefly III Features  
- **Professional budgeting** with categories and limits
- **Advanced reporting** and charts
- **Rule-based automation** for transactions
- **Bill management** and recurring transactions
- **Multi-currency** support with exchange rates
- **Data export** and backup tools

## 📱 Telegram Integration

Process receipts directly through Telegram:

1. Send receipt image to your bot
2. Add caption: `"Track this receipt"`
3. AI processes image and extracts items
4. Automatically syncs to both databases
5. Receive confirmation with transaction details

## 🧪 Testing & Verification

### Test Dual Sync
```bash
node test_sync.js
```

### Verify Data Consistency
- Check original MariaDB: `SELECT * FROM transactions ORDER BY id DESC LIMIT 5;`
- Check Firefly III: Visit `http://localhost:3001/transactions`
- Compare record counts and amounts

### Debug Issues
- Check logs: `tail -f firefly-iii/error.log`
- Test individual components: `node test_integration.js`
- Verify database connections in `.env`

## 🛠️ System Components

| Component | Responsibility |
|-----------|----------------|
| `server.js` | Main AI dispatch, Express setup, request handling |
| `firefly.js` | Dual database sync layer, transaction management |
| `db.js` | Database connections and query helpers |
| `telegram.js` | Telegram bot integration for receipt processing |
| `auth.js` | Google OAuth2 flows and token management |
| `prompts.js` | OpenAI system prompts and function calling |
| `schemas.js` | Data validation and AI function schemas |

## 📊 Data Migration

For migrating existing financial data, see `MIGRATION_GUIDE.md` for detailed instructions on safely transferring your transaction history to the new dual-sync system.

## 🔒 Security & Privacy

- **Local processing**: Receipt OCR and data extraction happens locally
- **Secure connections**: All API calls use HTTPS/TLS
- **Token management**: OAuth tokens securely stored and refreshed
- **Database isolation**: Original and Firefly databases remain separate
- **No external data sharing**: Financial data stays within your infrastructure

## 🚀 Production Deployment

- Configure proper database backups for both systems
- Set up monitoring for Docker containers
- Use environment variables for all secrets
- Configure reverse proxy for HTTPS access
- Set up log rotation and monitoring

## 🤝 Contributing

Feel free to open issues or pull requests for enhancements or bug fixes. When contributing:

1. Test dual database sync functionality
2. Ensure backward compatibility with existing data
3. Update documentation for new features
4. Follow existing code style and patterns

## 📄 License

This project is released under the MIT License.