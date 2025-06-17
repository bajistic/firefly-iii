# Bank Statement Reconciliation System

## Overview

This system solves the currency conversion accuracy problem by reconciling your transactions with your actual bank statement at month-end, ensuring perfect accuracy with real exchange rates and fees.

## How It Works

### Daily Transaction Recording
1. **Record transactions with original currency**: When you buy something for €25, record it as €25
2. **Rough CHF estimate**: System estimates ~25.38 CHF (€25 × 1.015)
3. **Both databases synced**: Original DB and Firefly III get the estimated amount
4. **Wait for bank statement**: Actual amount will be reconciled later

### Monthly Bank Reconciliation
1. **Download bank statement**: Export your CHF account statement as CSV
2. **Run reconciliation**: `node firefly-iii/src/bankSync.js bank_nov2024.csv 11 2024`
3. **Automatic matching**: System matches estimated transactions with actual bank transactions
4. **Apply corrections**: Updates both databases with real amounts and fees

## Example Workflow

### Recording a Transaction
```javascript
// You record: €25 at Migros
createSyncedTransaction('Migros', 25, 'EUR', '2024-11-15', 'receipt.jpg', items);

// System stores:
// - Original: €25 EUR
// - Estimate: ~25.38 CHF
// - Note: "needs reconciliation"
```

### Bank Reconciliation
```bash
# Download your UBS/Credit Suisse statement for November 2024
# Run reconciliation
node firefly-iii/src/bankSync.js ubs_statement_nov2024.csv 11 2024

# Output:
# 🔍 Matching transactions for 11/2024...
# 📝 Adjusted transaction 123: 25.38 → 25.45 CHF (+0.07)
# 📝 Adjusted transaction 124: 42.30 → 42.18 CHF (-0.12)
# ✅ Reconciliation completed!
```

## Bank Statement Format

The system supports common Swiss bank CSV formats. Adjust the column mapping in `bankSync.js` if needed:

```javascript
mapHeaders: ({ header }) => {
  const mapping = {
    'Date': 'date',           // Transaction date
    'Description': 'description', // Shop/merchant name  
    'Amount': 'amount',       // CHF amount (negative for expenses)
    'Balance': 'balance',     // Account balance
    'Reference': 'reference'  // Bank reference number
  };
  return mapping[header] || header.toLowerCase();
}
```

### Example CSV:
```csv
Date,Description,Amount,Balance,Reference
15.11.2024,MIGROS ZURICH,-25.45,1234.56,REF123456
16.11.2024,CURRENCY CONVERSION FEE EUR,-0.38,1234.18,FEE789
```

## Reconciliation Features

### Automatic Matching
- **Date tolerance**: ±3 days window
- **Amount tolerance**: 5% or 1 CHF (whichever is larger)
- **Smart matching**: Handles multiple candidates by picking closest amount

### Adjustments Applied
- Updates transaction amounts with actual bank values
- Calculates real processing fees (instead of 1.5% estimate)
- Tracks adjustments for analysis
- Syncs corrections to both databases

### Report Generation
```json
{
  "period": "11/2024",
  "summary": {
    "total_transactions": 45,
    "matched_transactions": 43,
    "estimated_total": 1234.56,
    "actual_total": 1238.22,
    "total_adjustments": 3.66
  },
  "adjustments": [
    {
      "shop": "Migros",
      "date": "2024-11-15", 
      "estimated": 25.38,
      "actual": 25.45,
      "adjustment": 0.07
    }
  ]
}
```

## Usage Commands

### Monthly Reconciliation
```bash
# Basic reconciliation
node firefly-iii/src/bankSync.js statement.csv 11 2024

# With debug info
DEBUG=1 node firefly-iii/src/bankSync.js statement.csv 11 2024
```

### View Reconciliation Status
```sql
-- Check unreconciled transactions
SELECT shop, date, total, original_amount, original_currency 
FROM transactions 
WHERE matched_bank_amount IS NULL 
  AND date >= '2024-11-01';

-- View adjustments
SELECT * FROM bank_adjustments 
WHERE sync_date >= '2024-11-01' 
ORDER BY adjustment DESC;
```

## Benefits

### Accuracy
- ✅ **Perfect amounts**: Uses actual bank statement values
- ✅ **Real fees**: Captures exact processing fees, not estimates
- ✅ **Exchange rates**: Uses bank's actual conversion rates

### Automation
- ✅ **Batch processing**: Handle entire month at once
- ✅ **Smart matching**: Automatic transaction correlation
- ✅ **Error reporting**: Flags unmatched or problematic transactions

### Tracking
- ✅ **Audit trail**: Complete history of all adjustments
- ✅ **Monthly reports**: Summary of reconciliation accuracy
- ✅ **Dual sync**: Both databases stay perfectly aligned

## Troubleshooting

### Common Issues

**Unmatched transactions**: 
- Check date format in CSV
- Verify amount formatting (decimals, currency symbols)
- Manual review of complex transactions

**Multiple matches**:
- System picks closest by amount
- Review large adjustments manually
- Consider date/amount tolerance settings

**Missing transactions**:
- Bank statement may have transactions not recorded in system
- System will flag these for manual review
- Add missing transactions and re-run reconciliation

### Recovery
```bash
# Reset reconciliation for a month (if needed)
mysql -h 192.168.1.100 -u bayarbileg -pbudagch1n finance -e "
UPDATE transactions 
SET matched_bank_amount = NULL, bank_adjustment = 0, bank_sync_date = NULL 
WHERE MONTH(date) = 11 AND YEAR(date) = 2024;
"
```

This system ensures your financial tracking is always accurate while keeping the daily interface simple!