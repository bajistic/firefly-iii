# Claude Instructions for AI Financial Assistant

## Project Overview

This is an AI-driven financial assistant with dual database synchronization capabilities. The system maintains both a custom MariaDB database and Firefly III integration while providing a minimal natural language interface.

## Architecture

### Database Systems
- **Primary Database**: MariaDB at `192.168.1.100:3306` (database: `finance`)
  - Custom schema: `transactions`, `items`, `income`, `accounts`
  - Your original data store with 81+ transactions, 187+ items, 1+ income entries
  - **Single CHF Account**: All transactions use main CHF account with automatic currency conversion
  
- **Firefly III**: Docker container at `localhost:3001`
  - Professional financial management system
  - Auto-synced with primary database
  - Used for budgeting, reporting, and analysis

### Currency Handling
- **Single Account Approach**: Uses main CHF account for all payments (EUR, USD automatically converted)
- **Bank Reconciliation**: Monthly sync with actual bank statement for accurate amounts and fees
- **Exchange Rate Accuracy**: Eliminates estimation errors by using real bank statement values

### Key Components
- **Main Application**: `firefly-iii/` directory (Node.js/Express)
- **Dual Sync Layer**: `firefly-iii/src/firefly.js` with `createSyncedTransaction()` and `createSyncedIncome()`
- **Bank Reconciliation**: `firefly-iii/src/bankSync.js` for monthly bank statement synchronization
- **AI Dispatch**: `firefly-iii/src/server.js` handles natural language processing
- **Docker Setup**: `docker-compose.yml` for Firefly III instance

## Development Guidelines

### When Working on Financial Features

1. **Always maintain dual sync**: Any transaction/income changes must update both databases
2. **Use synced functions**: Call `createSyncedTransaction()` and `createSyncedIncome()` instead of individual database calls
3. **Preserve AI interface**: Keep natural language commands minimal and unchanged
4. **Test both systems**: Verify data appears correctly in both MariaDB and Firefly III

### Code Patterns

#### Transaction Creation
```javascript
// ✅ Correct - uses dual sync with bank reconciliation support
const syncResult = await createSyncedTransaction(shop, total, currency, date, receiptPath, items);
// Records original currency (e.g., €25) and estimates CHF (~25.38)
// Actual bank amount will be reconciled monthly

// ❌ Avoid - only updates one database  
const result = await dbRunAsync('INSERT INTO transactions...');
```

#### Error Handling
```javascript
if (syncResult.success) {
  stepResults.push({
    success: true,
    message: `✅ Added transaction... (Original ID: ${syncResult.originalId}, Firefly ID: ${syncResult.fireflyId})`
  });
} else {
  stepResults.push({
    success: false,
    error: `Failed to create transaction: ${syncResult.error}`
  });
}
```

### File Structure Understanding

```
/home/bayarbileg/jarvis/
├── firefly-iii/                    # Main AI application (submodule)
│   ├── src/
│   │   ├── server.js               # Main AI dispatch & Express server
│   │   ├── firefly.js              # Dual database sync layer ⭐
│   │   ├── bankSync.js             # Bank statement reconciliation system ⭐
│   │   ├── db.js                   # Database connections
│   │   ├── telegram.js             # Telegram bot for receipt processing
│   │   └── firefly-sync.js         # Sync helper functions
├── docker-compose.yml              # Firefly III Docker setup
├── migrate_finance_to_firefly.js   # One-time migration script
├── BANK_RECONCILIATION.md          # Bank reconciliation usage guide
└── test_sync.js                    # Dual sync testing
```

## Environment Variables

Required in `.env`:
```bash
# Database (Primary MariaDB)
DB_HOST=192.168.1.100
DB_PORT=3306
DB_USER=bayarbileg
DB_PASSWORD=budagch1n
DB_NAME=firefly_iii

# Firefly III Integration
FIREFLY_URL=http://localhost:3001
FIREFLY_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...

# AI & APIs
OPENAI_API_KEY=sk-...
TELEGRAM_BOT_TOKEN=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Testing Procedures

### Before Making Changes
1. Run `node test_sync.js` to verify dual sync works
2. Check both databases have consistent data
3. Test natural language commands: `"Track receipt from Migros"`

### After Making Changes  
1. Verify both databases are updated
2. Check Firefly III UI at `localhost:3001`
3. Test error scenarios (database failures, network issues)
4. Ensure AI interface remains minimal

## Common Tasks

### Adding New Financial Features
1. Extend sync layer in `firefly.js` first
2. Update AI prompts in `prompts.js` if needed
3. Modify server dispatch logic in `server.js`
4. Test with both databases running
5. Update documentation

### Monthly Bank Reconciliation
1. Download bank statement CSV from your bank
2. Run: `node firefly-iii/src/bankSync.js statement.csv 11 2024`
3. Review reconciliation report in `reports/` directory
4. Check for unmatched transactions and resolve manually

### Debugging Sync Issues
1. Check logs: `tail -f firefly-iii/error.log`
2. Verify database connections in `.env`
3. Test individual sync functions
4. Check Firefly III API token validity

### Data Migration
1. Use `migrate_finance_to_firefly.js` for bulk transfers
2. Always backup before migrations
3. Test with `DRY_RUN: true` first
4. Verify data integrity after migration

## Security Considerations

- Financial data never leaves your infrastructure
- Database credentials in `.env` (not committed)
- Firefly III token in `.env` (not committed)
- Receipt images stored locally in `uploads/`
- All API communication over local network

## AI Interface Philosophy

**Keep it minimal**: Users should be able to say natural things like:
- `"Track my receipt from Migros"`
- `"Add salary of 3000 CHF"`
- `"Record expense at restaurant"`

The system handles the complexity of dual database sync automatically while providing simple, conversational responses.

## Integration Points

### Telegram Bot
- Processes receipt images sent via Telegram
- Extracts items using AI/OCR
- Auto-syncs to both databases
- Sends confirmation messages

### Firefly III Features
- Professional budgeting and categorization
- Advanced reporting and charts
- Rule-based transaction automation
- Multi-currency support with exchange rates

### Google APIs
- Calendar integration for scheduling
- Docs integration for cover letter generation
- OAuth2 for secure authentication

## Troubleshooting

### Database Connection Issues
- Verify MariaDB is running on `192.168.1.100:3306`
- Check Docker containers: `sudo docker compose ps`
- Test database connectivity: `mysql -h 192.168.1.100 -u bayarbileg -p`

### Sync Failures
- Check both database logs
- Verify Firefly III API token is valid
- Ensure network connectivity between systems
- Check for schema mismatches

### AI Processing Issues
- Verify OpenAI API key is valid
- Check receipt image format (JPEG/HEIC supported)
- Ensure prompts are properly formatted
- Test with simplified commands first

## Best Practices

1. **Always test dual sync** before deploying changes
2. **Backup databases** before major changes
3. **Use environment variables** for all secrets
4. **Log errors comprehensively** for debugging
5. **Maintain API compatibility** with existing integrations
6. **Document schema changes** in migration scripts
7. **Test natural language variations** for robustness

## Development Workflow

1. Make changes in `firefly-iii/` submodule
2. Test locally with both databases
3. Commit submodule changes first
4. Update main repository if needed
5. Push both repositories to GitHub
6. Verify production deployment works

Remember: The goal is seamless dual database sync with a minimal, conversational AI interface!