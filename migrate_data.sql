-- Migration script to convert custom transaction data to Firefly III format
-- This script will be used after a user is properly created in Firefly III

-- First, let's create a backup of custom data
CREATE TABLE IF NOT EXISTS custom_transactions_backup AS SELECT * FROM transactions;
CREATE TABLE IF NOT EXISTS custom_accounts_backup AS SELECT * FROM accounts;

-- Show current data summary
SELECT 'Custom Transactions Count' as info, COUNT(*) as count FROM transactions
UNION ALL
SELECT 'Custom Accounts Count' as info, COUNT(*) as count FROM accounts
UNION ALL
SELECT 'Firefly Users Count' as info, COUNT(*) as count FROM users
UNION ALL
SELECT 'Firefly Transaction Journals Count' as info, COUNT(*) as count FROM transaction_journals;