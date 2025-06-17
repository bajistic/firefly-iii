# Claude AI Assistant Instructions

This is a personal AI finance assistant with comprehensive receipt scanning, expense tracking, and bank statement reconciliation capabilities.

## System Architecture

### Core Functionality
- **AI-powered receipt processing** via Telegram and web interface
- **Simple finance database** with detailed item tracking
- **Custom responsive dashboard** with real-time analytics
- **Bank statement reconciliation** with PDF parsing and automatic matching
- **Multi-currency support** with automatic conversion to CHF
- **Tailscale integration** for secure remote access

### Database Schema (finance database)
```sql
-- Main transaction storage
transactions: id, shop, date, time, total, currency, receipt_path, account_id

-- Detailed item breakdown for each transaction  
items: id, transaction_id, name, quantity, price, category

-- Income tracking
income: id, type, amount, date, description, account_id

-- Account management
accounts: id, name, description, type, balance
```

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

## API Endpoints

### Core Finance Operations
- `POST /ai/natural` - Process natural language commands and receipt images
- `GET /api/dashboard-data` - Get spending analytics and transaction data
- `POST /api/reconcile-statement` - Upload and process bank statement PDF
- `POST /api/apply-reconciliation` - Apply approved reconciliation changes

### Dashboard Access
- `GET /dashboard` - Main spending dashboard
- `GET /reconciliation` - Bank statement reconciliation interface

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
- Structured JSON responses with validation
- Error handling and fallback for API failures
- Context-aware transaction processing

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

1. **Check transaction data**: `SELECT * FROM transactions ORDER BY date DESC LIMIT 10`
2. **View recent items**: `SELECT t.shop, i.name, i.price FROM transactions t JOIN items i ON t.id = i.transaction_id ORDER BY t.date DESC LIMIT 20`
3. **Test dashboard**: `curl http://localhost:3000/api/dashboard-data`
4. **Check reconciliation**: `curl http://localhost:3000/reconciliation`
5. **View logs**: `tail -f error.log`

Remember: This system prioritizes simplicity, accuracy, and user experience over complex financial features.