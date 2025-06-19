# Jarvis AI Assistant Instructions

This is Jarvis - a personal AI finance assistant with comprehensive receipt scanning, expense tracking, bank statement reconciliation, and intelligent task execution capabilities.

## System Architecture

### Core Functionality
- **AI-powered receipt processing** via Telegram and web interface
- **Agentic multi-step task execution** with intelligent planning and fallbacks
- **Claude Code administrative agent** with direct action execution and safety confirmations
- **Simple finance database** with detailed item tracking
- **Custom responsive dashboard** with real-time analytics
- **Bank statement reconciliation** with PDF parsing and automatic matching
- **Multi-currency support** with automatic conversion to CHF
- **Automated email monitoring** for receipt processing every 15 minutes
- **Duplicate detection** using receipt/invoice numbers
- **Tailscale integration** for secure remote access

### Database Schema (finance database)
```sql
-- Main transaction storage
transactions: id, shop, date, time, total, currency, receipt_path, account_id, receipt_number

-- Detailed item breakdown for each transaction  
items: id, transaction_id, name, quantity, price, category

-- Income tracking
income: id, type, amount, date, description, account_id

-- Account management
accounts: id, name, description, type, balance
```

**Note**: `receipt_number` field added for duplicate detection using extracted invoice/receipt numbers from PDFs.

## Key Features Implementation

### 1. Receipt Processing Pipeline
1. **Input**: Image upload (HEIC/JPG/PNG/PDF) via Telegram or web
2. **AI Processing**: GPT-4 extracts shop, items, prices, categories
3. **Validation**: Amount verification and duplicate detection
4. **Storage**: Save transaction + itemized breakdown to database
5. **Confirmation**: Send summary to user via Telegram/web response

### 2. Finance Dashboard (`/dashboard`)
- **Real-time analytics**: Monthly/weekly spending with change indicators
- **Interactive transactions**: Click to expand and see itemized receipts
- **Category charts**: Visual spending breakdown with Chart.js
- **Mobile-optimized**: Perfect iOS Safari experience via Tailscale
- **Auto-refresh**: Updates every 30 seconds

### 3. Bank Statement Reconciliation (`/reconciliation`)
- **PDF Upload**: Drag & drop bank statements
- **Smart Parsing**: Extract transactions using regex patterns for various bank formats
- **Fuzzy Matching**: Score-based matching using date proximity, amount similarity, description similarity
- **Interactive Review**: Approve/edit/ignore interface for discrepancies
- **Batch Apply**: Update database with correct amounts and create missing transactions

### 4. Agentic Task Execution
- **Multi-step planning**: AI creates intelligent plans for complex requests
- **Conditional execution**: Steps execute based on context and previous results
- **Intelligent fallbacks**: Alternative approaches when primary methods fail
- **Progress tracking**: Real-time updates via Telegram during execution
- **Smart confirmations**: User input requested only when confidence is low
- **File & email search**: Unified search across local files and Gmail
- **Batch processing**: Handle multiple receipts from various sources simultaneously

#### Example Agentic Commands:
- `"add all my Anthropic receipts from this week"` → Searches files, then Gmail, processes all found receipts
- `"find and process all Amazon receipts from last month"` → Date-range search + batch processing
- `"search for any grocery receipts in the last 7 days"` → Pattern + time-based search

### 5. Claude Code Administrative Agent (NEW)
- **Direct Action Execution**: Performs file operations, database queries, and system analysis with real results
- **Safety System**: Path restrictions, dangerous operation detection, and confirmation requirements
- **File Management**: Organize files by date, find duplicates, backup directories, clean old files
- **Database Reporting**: Execute SQL queries for spending analysis, category breakdowns, merchant reports
- **System Analysis**: Error log analysis, performance monitoring, maintenance tasks
- **Smart Parsing**: Recognizes executable tasks vs advisory guidance

#### Administrative Task Types:
- **file_management**: File organization, duplicate detection, backup operations
- **analysis**: Log analysis, pattern detection, system insights
- **maintenance**: Database optimization, system health checks, cleanup tasks
- **reporting**: SQL-based reports, spending analytics, transaction summaries
- **general**: Multi-purpose administrative tasks

#### Example Administrative Commands:
- `"organize files by date"` → Actually moves files into date-organized folders
- `"show category breakdown this month"` → Executes SQL query with live spending data
- `"list files in uploads"` → Real directory listing with file details
- `"analyze error log patterns"` → Reviews actual system logs for insights
- `"find duplicate files"` → Scans directories for duplicate detection
- `"backup uploads directory"` → Creates timestamped backup copies

### 6. Automated Email Monitoring
- **Continuous monitoring**: Checks Gmail every 15 minutes for receipt emails
- **Smart filtering**: 23+ known vendor patterns + subject line analysis
- **AI classification**: Confidence-based processing (70%+ auto-process, <70% manual review)
- **Duplicate prevention**: Uses extracted receipt numbers to prevent reprocessing
- **Attachment handling**: Downloads and processes PDF receipts automatically

## API Endpoints

### Core Finance Operations
- `POST /ai/natural` - Process natural language commands and receipt images (supports agentic planning)
- `GET /api/dashboard-data` - Get spending analytics and transaction data
- `POST /api/reconcile-statement` - Upload and process bank statement PDF
- `POST /api/apply-reconciliation` - Apply approved reconciliation changes
- `POST /api/process-receipt` - Process individual receipt files (PDF/image)
- `GET /api/check-receipts` - Manually trigger email receipt monitoring
- `GET /api/receipt-senders` - Get list of known receipt sender patterns

### Dashboard Access
- `GET /dashboard` - Main spending dashboard
- `GET /reconciliation` - Bank statement reconciliation interface

### Agentic Actions (via /ai/natural)
- `execute_plan` - Multi-step task execution with intelligent planning
- `search_files` - Search local files with patterns and time constraints
- `search_gmail` - Search Gmail for receipts with attachment download
- `process_multiple_receipts` - Batch process receipts from multiple sources
- `request_confirmation` - Interactive user confirmation system
- `claude_code_admin` - Administrative tasks with direct execution (file management, reporting, analysis, maintenance)

## User Workflow

### Daily Usage (Receipt Scanning)
1. User sends receipt photo to Telegram bot or uploads via web
2. AI extracts: shop name, individual items with prices and categories
3. System stores transaction with full itemization in simple database
4. User gets immediate confirmation with transaction details
5. Dashboard updates in real-time with new spending data

### Monthly Reconciliation  
1. User receives monthly bank statement PDF
2. Upload to reconciliation interface
3. System automatically:
   - Parses PDF and extracts bank transactions
   - Matches with existing database transactions
   - Identifies discrepancies (exchange rates, fees, timing)
   - Flags unmatched transactions
4. User reviews and approves corrections
5. System applies all changes to maintain accurate financial records

### Agentic Workflows (NEW)
1. **Complex Commands**: User sends natural language requests like "add all my Anthropic receipts from this week"
2. **Intelligent Planning**: AI creates multi-step execution plan with fallbacks
3. **Autonomous Execution**: System searches files, Gmail, processes receipts automatically
4. **Progress Updates**: Real-time notifications sent via Telegram during execution
5. **Smart Confirmations**: User asked for input only when confidence is low (<80%)
6. **Adaptive Behavior**: System learns from context and adjusts approach dynamically

### Automated Background Processing
1. **Email Monitoring**: System checks Gmail every 15 minutes for new receipts
2. **Vendor Recognition**: Uses 23+ known sender patterns + AI classification
3. **Automatic Processing**: High-confidence receipts (≥70%) processed automatically
4. **Duplicate Prevention**: Receipt numbers extracted to prevent reprocessing
5. **Manual Review Queue**: Low-confidence items flagged for user review

## Key Design Principles

### 1. Simplicity Over Complexity
- **Simple database schema** instead of complex double-entry bookkeeping
- **Direct database operations** instead of API complications  
- **Clean, focused UI** instead of feature bloat
- **Manual approval workflow** instead of automatic corrections

### 2. Detailed Tracking
- **Item-level receipt data** with quantities, prices, categories
- **Multi-currency support** with conversion tracking for reconciliation
- **Receipt image storage** for audit trails
- **Category-based spending analysis**

### 3. User Experience
- **Mobile-first design** optimized for iOS Safari
- **Instant feedback** via Telegram notifications
- **Visual analytics** with charts and trend indicators
- **Touch-friendly interfaces** for mobile interaction

### 4. Security & Access
- **Tailscale VPN** for secure remote access
- **No public exposure** - all endpoints private
- **File upload validation** with size and type limits
- **Parameterized queries** to prevent SQL injection

### 5. Agentic Intelligence (NEW)
- **Multi-step reasoning** instead of single-action responses
- **Intelligent fallbacks** when primary approaches fail
- **Context-aware decisions** based on previous step results
- **User confirmation** only when confidence is genuinely low
- **Progress transparency** with real-time updates
- **Adaptive behavior** that learns from user patterns

## Implementation Notes

### Database Connection
- Uses MariaDB with `finance` database
- Connection details in `.env` file
- Simple connection pooling for performance

### File Handling
- Receipt images stored in `uploads/` directory
- Bank statements stored in `uploads/statements/`
- PDF parsing with `pdf-parse` library
- Image processing with `sharp` for optimization

### AI Integration
- OpenAI GPT-4 for receipt text extraction and categorization
- **Agentic planning system** for multi-step task execution
- Structured JSON responses with validation (Zod schemas)
- Error handling and fallback for API failures
- Context-aware transaction processing
- **Confidence-based decision making** (80% threshold for auto-processing)
- **Intelligent search** across files and Gmail with pattern matching
- **Duplicate detection** using extracted receipt/invoice numbers

### Telegram Integration
- Bot for instant receipt scanning
- Admin notifications for errors and summaries
- Message formatting with markdown support
- File upload handling for various image formats

## Development Guidelines

### When Adding Features
1. **Keep it simple** - avoid over-engineering
2. **Test with real data** - use actual receipts and bank statements
3. **Mobile-first** - ensure iOS compatibility
4. **Document changes** - update this file and README
5. **Backup database** before schema changes

### Error Handling
- Log all errors to `error.log` with timestamps
- Send error notifications via Telegram
- Graceful degradation for AI service failures
- User-friendly error messages in UI

### Performance Considerations
- Database query optimization for dashboard analytics
- Image compression for receipt storage
- Pagination for large transaction lists
- Caching for frequently accessed data

## Monitoring & Maintenance

### Key Metrics
- Transaction processing success rate
- AI extraction accuracy
- Bank statement matching accuracy
- User engagement (receipts scanned per day)

### Regular Tasks
- Monthly bank statement reconciliation
- Receipt image cleanup (archive old files)
- Database backup and maintenance
- Security updates and dependency management

### Troubleshooting
- Check `error.log` for detailed error information
- Verify Tailscale connectivity for remote access issues
- Test AI service connectivity for processing failures
- Validate database connections for data issues

---

## Quick Commands for Claude

When helping with this system:

### Database Queries
1. **Check transaction data**: `SELECT * FROM transactions ORDER BY date DESC LIMIT 10`
2. **View recent items**: `SELECT t.shop, i.name, i.price FROM transactions t JOIN items i ON t.id = i.transaction_id ORDER BY t.date DESC LIMIT 20`
3. **Check duplicates**: `SELECT receipt_number, COUNT(*) FROM transactions WHERE receipt_number IS NOT NULL GROUP BY receipt_number HAVING COUNT(*) > 1`

### API Testing
4. **Test dashboard**: `curl http://localhost:3000/api/dashboard-data`
5. **Check reconciliation**: `curl http://localhost:3000/reconciliation`
6. **Trigger email check**: `curl http://localhost:3000/api/check-receipts`
7. **Test agentic search**: Send "find all receipts from this week" to Telegram bot

### Monitoring & Logging
8. **View logs**: `tail -f error.log`
9. **Check email monitoring**: `grep "📧 Checking for new receipt emails" error.log | tail -5`
10. **View agentic plans**: `grep "🎯 Starting agentic plan" error.log | tail -5`

### Logging Configuration
The system supports configurable logging verbosity to reduce noise while maintaining debugging capabilities:

**Environment Variables:**
- `VERBOSE_LOGGING=true/false` - Controls console output verbosity (default: false)
- `LOG_LEVEL=DEBUG/INFO/WARN/ERROR` - Sets logging level (default: INFO)

**Logging Modes:**
- **Minimal (default)**: Shows only essential information (transactions, errors, important events)
- **Verbose**: Shows all debug details including API responses, token refreshes, parsing steps

**Usage:**
```bash
# Minimal logging (default) - essential info only
VERBOSE_LOGGING=false npm start

# Full debug logging - all details
VERBOSE_LOGGING=true npm start

# Use helper script for easy switching
./scripts/set-logging.sh quiet    # Essential only
./scripts/set-logging.sh verbose  # All debug info
./scripts/set-logging.sh normal   # Default mode
```

**What gets filtered in minimal mode:**
- OpenAI API response details and parsing steps
- Gmail OAuth token refresh notifications
- Gmail query strings and "no emails found" messages
- Internal processing serialization steps
- Detailed AI decision validation logs

**Dual logging system:**
- **Console output**: Respects verbosity settings for clean terminal experience
- **File logging** (`error.log`): Always captures everything for debugging and analysis

### Agentic Commands to Test
- `"add all my Anthropic receipts from this week"`
- `"find and process all Amazon receipts from last month"`
- `"search for any grocery receipts in the last 7 days"`

### Claude Code Administrative Commands to Test
- `"organize files by date"`
- `"show category breakdown this month"`
- `"list files in uploads"`
- `"analyze error log patterns"`
- `"find duplicate files"`
- `"backup uploads directory"`
- `"show recent transactions"`
- `"top merchants this month"`
- `"monthly spending report"`

### Command Suggestions Feature
- `"suggest commands"` or `"what can I ask you?"` → Returns personalized command suggestions
- `"show me examples"` → Displays executable commands with descriptions
- Dynamic suggestions based on current data, recent activity, and system capabilities

#### Command Inference System
The system uses multiple layers to understand and suggest commands:

**1. AI Prompt Engineering** (`src/prompts.js`)
- Teaches AI to recognize help-seeking patterns and category specifications
- Maps natural language to structured actions with parameters
- Handles variations: "admin commands", "finance examples", "what can I do?"

**2. Natural Language Processing**
- **Intent Recognition**: Distinguishes between help requests vs execution commands
- **Parameter Extraction**: "show me admin commands" → `category: "admin"`
- **Context Awareness**: Understands implicit categories and user goals

**3. Dynamic Command Generation** (`generateCommandSuggestions()`)
- **Data-Driven Personalization**: Queries actual transaction history, file counts, spending patterns
- **Contextual Adaptation**: Suggests relevant commands based on system state
- **Smart Prioritization**: Most frequent merchants, top categories, urgent file counts

**4. Personalization Examples**
- **Frequent Merchant**: "show transactions from REWE" (based on your top shop)
- **File Organization**: "organize 100+ files by date" (when file count > 50)
- **Category Focus**: "spending by groceries category" (based on your top spending category)
- **Urgency Indicators**: Highlights time-sensitive tasks like file cleanup

**5. Category-Specific Suggestions**
- **finance**: Transaction queries, spending analysis, merchant reports
- **admin**: File management, system maintenance, backup operations
- **receipts**: Receipt processing, email monitoring, batch operations
- **reports**: Database queries, analytics, spending summaries
- **all**: Mixed suggestions from all categories with smart prioritization

**6. Execution vs Suggestion Detection**
```javascript
// Triggers suggestions:
"what can I ask you?" → suggest_commands
"admin examples" → suggest_commands(category="admin")

// Triggers execution:
"show recent transactions" → claude_code_admin(type="reporting")
"organize files by date" → claude_code_admin(type="file_management")
```

The system continuously learns from your financial data and usage patterns to provide increasingly relevant and personalized command suggestions.

Remember: This system now combines simplicity with intelligent agentic behavior and direct action execution - it can plan and execute complex multi-step tasks while maintaining user control, transparency, and safety through confirmation systems.