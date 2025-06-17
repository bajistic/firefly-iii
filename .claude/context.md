# Project Context for Claude

## Current State

**Last Updated**: June 17, 2025

### Successfully Completed
✅ **Dual Database Migration**: Migrated 81 transactions + 187 items + 1 income from custom schema to Firefly III  
✅ **Docker Setup**: Firefly III running on `localhost:3001` with MariaDB backend  
✅ **Sync Layer**: Implemented automatic dual database synchronization  
✅ **AI Interface**: Maintained minimal natural language commands  
✅ **Submodule Setup**: `firefly-iii` submodule on `firefly-final` branch with enhanced sync  

### System Status
- **Main Database**: MariaDB `192.168.1.100:3306` (database: `finance`) - ✅ Active
- **Firefly III**: Docker container `localhost:3001` - ✅ Running  
- **AI Assistant**: `firefly-iii/src/server.js` - ✅ Enhanced with dual sync
- **Migration**: 100% complete (0 errors) - ✅ Success

### Recent Changes Made
1. **Enhanced `firefly.js`** with `createSyncedTransaction()` and `createSyncedIncome()` functions
2. **Modified `server.js`** to use synced functions for all financial operations
3. **Created Docker setup** with `docker-compose.yml` and `.env.firefly`
4. **Added migration scripts** for safe data transfer
5. **Updated README.md** with comprehensive dual sync documentation

## Technical Architecture

### Database Sync Flow
```
Natural Language Input → AI Processing → Dual Database Sync
                                       ├── Original MariaDB (finance)
                                       └── Firefly III (Docker)
```

### Key Functions
- `createSyncedTransaction(shop, total, currency, date, receiptPath, items)`
- `createSyncedIncome(type, amount, description, date)`  
- Both return `{originalId, fireflyId, success}` for verification

### API Endpoints (Unchanged)
- `POST /ai/natural` - Core natural language processing
- Response format enhanced with dual database IDs
- Telegram bot integration for receipt processing

## Data Mapping

### Custom Schema → Firefly III
| Original | Firefly III | Status |
|----------|-------------|---------|
| `transactions` table | `transaction_journals` + `transactions` | ✅ Synced |
| `items` table | Transaction notes + tags | ✅ Preserved |  
| `income` table | Deposit transactions | ✅ Synced |
| `accounts` table | Asset accounts (CHF/EUR/USD) | ✅ Created |

### Currency Accounts Created
- **CHF Account** (ID: 6) - Main checking account
- **EUR Account** (ID: 7) - EUR transactions  
- **USD Account** (ID: 8) - USD transactions

## Current Challenges/Considerations

1. **Token Management**: Firefly III API token needs periodic renewal
2. **Docker Dependency**: Firefly III requires Docker containers to be running
3. **Network Connectivity**: Both MariaDB (192.168.1.100) and Docker must be accessible
4. **Backup Strategy**: Two databases require coordinated backup procedures

## Usage Patterns

### Typical Commands (No Changes Required)
- `"Track my receipt from Migros"` + image → Dual sync with item extraction
- `"Add salary of 3000 CHF"` → Income in both databases
- `"Record expense at restaurant 45.50 EUR"` → Transaction in both systems

### Response Format
```json
{
  "message": "✅ Added transaction for Migros on 2025-06-17 in CHF for total of 45.50 CHF. Synced to both databases (Original ID: 123, Firefly ID: 456)"
}
```

## File Locations

### Critical Files
- `/home/bayarbileg/jarvis/firefly-iii/src/firefly.js` - Dual sync implementation
- `/home/bayarbileg/jarvis/firefly-iii/src/server.js` - AI dispatch with sync calls
- `/home/bayarbileg/jarvis/docker-compose.yml` - Firefly III Docker setup
- `/home/bayarbileg/jarvis/.env` - Database and API credentials

### Migration Artifacts  
- `migrate_finance_to_firefly.js` - Completed migration script
- `finance_migration_backup.json` - Backup of migrated data
- `MIGRATION_GUIDE.md` - Step-by-step migration instructions

## Integration Status

### Active Integrations
- ✅ **OpenAI API** - Natural language processing
- ✅ **Google APIs** - Calendar, Docs, Drive  
- ✅ **Telegram Bot** - Receipt processing
- ✅ **MariaDB** - Primary database (finance)
- ✅ **Firefly III** - Professional financial management
- ✅ **Docker** - Containerized Firefly III

### Planned/Future
- 📋 Automated backups across both databases
- 📋 Advanced reporting combining both systems
- 📋 Rule-based categorization sync
- 📋 Exchange rate synchronization

## Development Guidelines

When making changes:
1. **Test dual sync first** with `node test_sync.js`
2. **Use synced functions** - never update databases individually  
3. **Maintain minimal AI interface** - users shouldn't notice complexity
4. **Verify both databases** after changes
5. **Check Firefly III UI** to ensure data appears correctly

## Emergency Procedures

### If Sync Fails
1. Check both database connections
2. Verify Firefly III Docker containers are running
3. Test API token validity
4. Check logs: `tail -f firefly-iii/error.log`
5. Rollback to last known good state if needed

### If Docker Issues
1. Restart containers: `sudo docker compose restart`
2. Check logs: `sudo docker compose logs`
3. Verify port 3001 is available
4. Recreate if needed: `sudo docker compose down && sudo docker compose up -d`

This context should help understand the current state and recent dual database sync implementation.