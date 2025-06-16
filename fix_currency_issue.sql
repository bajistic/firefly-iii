-- Fix currency and user group issues
USE firefly_iii;

-- Update accounts to use the correct user group (group 1)
UPDATE accounts SET user_group_id = 1 WHERE user_id = 1;

-- Update transaction journals to use correct user group
UPDATE transaction_journals SET user_group_id = 1 WHERE user_id = 1;

-- Add default currency preference for user
INSERT IGNORE INTO preferences (created_at, updated_at, user_id, name, data)
VALUES 
(NOW(), NOW(), 1, 'currencyPreference', 'EUR'),
(NOW(), NOW(), 1, 'language', 'en_US'),
(NOW(), NOW(), 1, 'locale', 'equal');

-- Ensure all currencies have proper symbols
UPDATE transaction_currencies SET symbol = '€' WHERE code = 'EUR' AND (symbol IS NULL OR symbol = '');
UPDATE transaction_currencies SET symbol = 'CHF' WHERE code = 'CHF' AND (symbol IS NULL OR symbol = '');
UPDATE transaction_currencies SET symbol = '$' WHERE code = 'USD' AND (symbol IS NULL OR symbol = '');

-- Check for any transactions missing currency info
SELECT 
    'Currency Check' as info,
    'Results' as results
UNION ALL
SELECT 'Transactions with NULL currency', COUNT(*) 
FROM transactions t 
JOIN transaction_journals tj ON t.transaction_journal_id = tj.id 
WHERE tj.transaction_currency_id IS NULL
UNION ALL
SELECT 'Currencies without symbols', COUNT(*) 
FROM transaction_currencies 
WHERE symbol IS NULL OR symbol = ''
UNION ALL
SELECT 'User accounts updated', COUNT(*) 
FROM accounts 
WHERE user_id = 1 AND user_group_id = 1;