# Safe Migration Guide: Custom Finance DB → Firefly III

## Overview

This guide helps you safely migrate data from your custom SQLite finance database to Firefly III.

## Current Status

✅ **Firefly III Docker server** is running on http://localhost:3001  
✅ **Migration script** has been created  
✅ **Your firefly-iii submodule** is on the firefly-final branch  

## Next Steps

### 1. Complete Firefly III Setup

1. **Wait for initial setup to complete**:
   ```bash
   sudo docker compose logs -f app
   ```
   Wait until you see "Ready for connections" or similar.

2. **Access Firefly III**: Open http://localhost:3001 in your browser

3. **Create your account**:
   - Follow the registration process
   - Set up your initial preferences

4. **Create API Token**:
   - Go to Options → Profile → OAuth
   - Click "Create New Personal Access Token"
   - Name it "Migration Script"
   - Copy the token

### 2. Configure Migration Script

Edit `migrate_to_firefly.js` and update:
```javascript
const CONFIG = {
    FIREFLY_URL: 'http://localhost:3001',
    FIREFLY_TOKEN: 'your_api_token_here', // ← Paste your token here
    SQLITE_PATH: './firefly-iii/src/expenses.db',
    DRY_RUN: true, // ← Keep as true for testing
    // ... other settings
};
```

### 3. Test Migration (Dry Run)

```bash
cd /home/bayarbileg/jarvis
node migrate_to_firefly.js
```

This will:
- ✅ Create a backup of your original data
- ✅ Show what would be migrated without actually doing it
- ✅ Display any potential issues

### 4. Perform Actual Migration

Once you're satisfied with the dry run:

1. **Set DRY_RUN to false** in the script:
   ```javascript
   DRY_RUN: false
   ```

2. **Run the migration**:
   ```bash
   node migrate_to_firefly.js
   ```

## Data Mapping

Your custom database will be mapped as follows:

| Custom DB | Firefly III |
|-----------|-------------|
| `accounts` | Asset/Expense/Revenue accounts |
| `transactions` | Withdrawal transactions |
| `items` | Transaction line items (in notes/tags) |
| `income` | Deposit transactions |

## Safety Features

- ✅ **Backup created**: Original data backed up to `migration_backup.json`
- ✅ **Dry run mode**: Test before actual migration
- ✅ **Error handling**: Failed items are logged but don't stop the process
- ✅ **API rate limiting**: Processes in batches to avoid overwhelming Firefly
- ✅ **Data validation**: Checks data format before sending to Firefly

## Troubleshooting

### Common Issues

1. **Connection refused**: Firefly III may still be starting up
   ```bash
   sudo docker compose logs app
   ```

2. **401 Unauthorized**: API token not set or invalid
   - Recreate the API token in Firefly III
   - Update the script configuration

3. **Database not found**: Check the SQLite path
   ```bash
   ls -la firefly-iii/src/expenses.db
   ```

### Recovery

If something goes wrong:
1. Your original data is safe in SQLite
2. Backup is available in `migration_backup.json`
3. You can reset Firefly III: `sudo docker compose down -v && sudo docker compose up -d`

## Post-Migration

After successful migration:
- Review imported data in Firefly III
- Set up budgets, categories, and rules as needed
- Configure recurring transactions
- Set up data import automation for future receipts

## Support

If you encounter issues:
1. Check the migration logs for specific error messages
2. Verify Firefly III is accessible at http://localhost:3001
3. Ensure your API token has the correct permissions