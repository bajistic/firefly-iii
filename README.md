# 💰 AI Finance Assistant

A comprehensive personal finance management system with receipt scanning, detailed expense tracking, AI-powered transaction processing, and bank statement reconciliation.

## ✨ Features

### 🤖 AI-Powered Receipt Processing
- **Automatic receipt scanning** via Telegram or web interface
- **Manual file processing** via natural language commands to Jarvis
- **Automated email monitoring** with AI classification for 23+ vendors
- **Intelligent text extraction** from images (HEIC, JPG, PNG, PDF)
- **Item-level categorization** with quantity and price tracking
- **Multi-currency support** (CHF, EUR, USD) with automatic conversion
- **Smart duplicate detection** to prevent double entries
- **Confidence scoring** with automatic processing for high-confidence results

### 📊 Custom Finance Dashboard
- **Real-time spending analytics** with category breakdowns
- **Interactive transaction lists** with expandable item details
- **Monthly/weekly summaries** with trend analysis
- **Beautiful charts** powered by Chart.js
- **Responsive design** optimized for web and iOS Safari
- **Dark mode support** following system preferences

### 🏦 Bank Statement Reconciliation
- **PDF bank statement parsing** with automatic transaction extraction
- **Intelligent transaction matching** using date, amount, and description similarity
- **Discrepancy detection** for amounts, currencies, and dates
- **Interactive reconciliation interface** with approve/edit/ignore options
- **Automatic corrections** for exchange rates and processing fees
- **Batch processing** for monthly statement uploads

### 🌐 Multi-Platform Access
- **Web Dashboard**: Full-featured interface at `http://your-tailscale-ip:3000/dashboard`
- **Telegram Bot**: Instant receipt scanning and queries via @your_bot
- **iOS/Mobile**: Touch-optimized interface via Tailscale
- **API Access**: RESTful endpoints for custom integrations

### 🔧 Technical Features
- **Simple Database Schema**: Transactions, items, income, accounts tables
- **Multi-currency handling** with approximate exchange rates
- **Receipt storage** with path tracking for audit trails
- **Telegram integration** for notifications and interactions
- **Docker support** for easy deployment
- **Security**: Tailscale VPN integration for secure remote access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MariaDB/MySQL database
- Tailscale account (for remote access)
- Telegram Bot Token (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-finance-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database**
   ```bash
   # Create the finance database
   docker exec jarvis-db-1 mariadb -u firefly -p'secret_firefly_password' -e "CREATE DATABASE IF NOT EXISTS finance;"
   
   # Initialize tables
   node src/migrations/init-db.js
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Start the application**
   ```bash
   npm start
   ```

### Environment Variables

```env
# Server Configuration
PORT=3000
TAILSCALE_IP=your.tailscale.ip

# Database Configuration
DB_HOST=localhost
DB_PORT=8083
DB_USER=firefly
DB_PASSWORD=secret_firefly_password
DB_NAME=finance

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_chat_id

# Google Services (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# OpenAI API
OPENAI_API_KEY=your_openai_key
```

## 📱 Usage

### Dashboard Access
- **Web**: `http://your-tailscale-ip:3000/dashboard`
- **Reconciliation**: `http://your-tailscale-ip:3000/reconciliation`
- **Mobile**: Same URLs work perfectly on iOS via Tailscale

### Receipt Scanning

#### Via Telegram
1. Send a photo of your receipt to your bot
2. AI automatically extracts items, prices, and categories
3. Transaction is saved with full itemization
4. Get instant confirmation with transaction details

#### Via Web Interface
1. Go to `http://your-tailscale-ip:3000`
2. Upload receipt image or PDF
3. AI processes and categorizes items
4. Review and confirm transaction details

#### Via Jarvis Natural Language
1. Say: "process receipt file at uploads/receipt.pdf"
2. Jarvis analyzes the existing file using the same AI pipeline
3. High confidence results (≥60%) are automatically processed
4. Low confidence results are flagged for manual review

#### Automated Email Processing
1. System monitors Gmail every 15 minutes
2. Detects receipts from 23+ known vendors (Amazon, Uber, PayPal, etc.)
3. AI classifies emails and extracts transaction data
4. High confidence receipts are automatically processed
5. Admin receives Telegram notifications for all activities

### Bank Statement Reconciliation

1. **Upload Statement**
   - Go to Reconciliation page
   - Drag & drop or select your monthly PDF bank statement
   - System automatically parses transactions

2. **Review Matches**
   - **Perfect Matches**: Automatically approved
   - **Discrepancies**: Review and approve corrections for exchange rates, fees
   - **Unmatched**: Create new transactions or ignore

3. **Apply Changes**
   - Review all proposed changes
   - Click "Apply All Approved Changes"
   - Database is updated with correct amounts and new transactions

### API Usage

#### Create Transaction
```bash
curl -X POST http://your-ip:3000/ai/natural \
  -H "Content-Type: application/json" \
  -d '{"command": "Add expense: Migros - 45.50 CHF for groceries"}'
```

#### Get Dashboard Data
```bash
curl http://your-ip:3000/api/dashboard-data
```

#### Upload Receipt
```bash
curl -X POST http://your-ip:3000/ai/natural \
  -F "image=@receipt.jpg" \
  -F "command=Process this receipt"
```

## 🏗️ Architecture

### Database Schema
```sql
-- Core transaction storage
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop TEXT,
  date DATE NOT NULL,
  time TIME,
  total DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'CHF',
  receipt_path TEXT,
  account_id INT
);

-- Detailed item breakdown
CREATE TABLE items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT NOT NULL,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2),
  category VARCHAR(50),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- Income tracking
CREATE TABLE income (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  account_id INT
);

-- Account management
CREATE TABLE accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.0
);
```

### AI Processing Pipeline
1. **Image/Text Input** → OCR/Text extraction
2. **AI Analysis** → OpenAI GPT-4 processes content
3. **Data Extraction** → Structured JSON with items, prices, categories
4. **Validation** → Amount verification and duplicate checking
5. **Storage** → Database insertion with full audit trail

### Reconciliation Algorithm
1. **PDF Parsing** → Extract bank transactions with regex patterns
2. **Fuzzy Matching** → Score-based matching using:
   - Date proximity (±7 days)
   - Amount similarity (exact or with fees)
   - Description similarity (Levenshtein distance)
3. **Discrepancy Detection** → Flag differences in amount, currency, date
4. **User Review** → Interactive approval/correction interface
5. **Batch Application** → Apply all approved changes atomically

## 🔒 Security

- **VPN Access**: All endpoints accessible only via Tailscale
- **Input Validation**: All user inputs sanitized and validated
- **File Upload Limits**: PDF size limits and type checking
- **Database Security**: Parameterized queries prevent SQL injection
- **No Public Exposure**: Server binds to private interfaces only

## 🛠️ Development

### Adding New Features
1. Create feature branch from `main`
2. Add functionality with tests
3. Update documentation
4. Submit pull request

### Database Migrations
```bash
# Add new columns/tables
node src/migrations/add_new_feature.js

# Always backup before migrations
mysqldump finance > backup_$(date +%Y%m%d).sql
```

### Testing Bank Statement Parsing
```bash
# Test with sample PDF
node -e "
const { parseBankStatement } = require('./src/reconciliation');
parseBankStatement('./test-statement.pdf').then(console.log);
"
```

## 📈 Monitoring

### Telegram Notifications
- Transaction confirmations
- Error alerts
- Daily/weekly summaries
- Reconciliation results

### Log Analysis
```bash
# View recent activity
tail -f error.log | grep -E "(Created|Error|Reconciliation)"

# Check API usage
grep "POST /ai/natural" error.log | wc -l
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **Chart.js** for beautiful visualizations
- **Telegram** for bot platform
- **Tailscale** for secure networking
- **MariaDB** for reliable data storage

---

**Made with ❤️ for personal finance management**