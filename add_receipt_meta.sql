-- Add receipt metadata for migrated transactions
USE firefly_iii;

-- Add receipt paths to journal_meta table
INSERT INTO journal_meta (
    created_at, updated_at, transaction_journal_id, name, data, hash
)
SELECT 
    t.created_at,
    t.updated_at,
    tj.id as transaction_journal_id,
    'receipt_path' as name,
    t.receipt_path as data,
    MD5(t.receipt_path) as hash
FROM finance.transactions t
JOIN transaction_groups tg ON tg.title = CONCAT('Transaction #', t.id, ' - ', t.shop, ' on ', DATE(t.date))
JOIN transaction_journals tj ON tj.transaction_group_id = tg.id
WHERE t.deleted_at IS NULL AND t.receipt_path IS NOT NULL
ORDER BY t.id;

-- Final migration summary
SELECT 
    'Final Migration Summary' as info,
    '' as details
UNION ALL
SELECT 'Custom transactions processed', COUNT(*) FROM finance.transactions WHERE deleted_at IS NULL
UNION ALL
SELECT 'Transaction groups created', COUNT(*) FROM transaction_groups WHERE user_id = 1
UNION ALL
SELECT 'Transaction journals created', COUNT(*) FROM transaction_journals WHERE user_id = 1
UNION ALL
SELECT 'Firefly transactions created', COUNT(*) FROM transactions WHERE transaction_journal_id IN (SELECT id FROM transaction_journals WHERE user_id = 1)
UNION ALL
SELECT 'Receipt metadata entries', COUNT(*) FROM journal_meta WHERE name = 'receipt_path';