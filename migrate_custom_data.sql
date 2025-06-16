-- Migration script to import custom transaction data into Firefly III
-- User ID: 1 (bbayarbileg@gmail.com)

USE firefly_iii;

-- Create default accounts if they don't exist
INSERT IGNORE INTO accounts (
    created_at, updated_at, user_id, account_type_id, name, virtual_balance, 
    iban, account_number, account_role, opening_balance, opening_balance_date,
    cc_type, cc_monthly_payment_date, cc_type_id, order_id, active, encrypted
) VALUES 
(NOW(), NOW(), 1, 3, 'Main Checking Account', 0.00, NULL, NULL, 'defaultAsset', 0.00, NULL, NULL, NULL, NULL, 1, 1, 1),
(NOW(), NOW(), 1, 4, 'General Expenses', 0.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, 1, 1);

-- Create a default user group for user 1 if it doesn't exist
INSERT IGNORE INTO user_groups (created_at, updated_at, title) VALUES (NOW(), NOW(), 'Default Group');

-- Set variables for account IDs
SET @asset_account_id = (SELECT id FROM accounts WHERE user_id = 1 AND account_type_id = 3 LIMIT 1);
SET @expense_account_id = (SELECT id FROM accounts WHERE user_id = 1 AND account_type_id = 4 LIMIT 1);
SET @user_group_id = (SELECT id FROM user_groups LIMIT 1);
SET @withdrawal_type_id = 1; -- Withdrawal transaction type
SET @eur_currency_id = 1;
SET @chf_currency_id = 27;
SET @usd_currency_id = 12;

-- Create transaction groups and journals for each custom transaction
INSERT INTO transaction_groups (created_at, updated_at, user_id, title)
SELECT 
    t.created_at,
    t.updated_at,
    1 as user_id,
    CONCAT('Transaction from ', t.shop, ' on ', DATE(t.date)) as title
FROM finance.transactions t
WHERE t.deleted_at IS NULL;

-- Insert transaction journals
INSERT INTO transaction_journals (
    created_at, updated_at, user_id, user_group_id, transaction_type_id, 
    transaction_group_id, transaction_currency_id, description, date, 
    interest_date, book_date, process_date, order_id, tag_count, encrypted, completed
)
SELECT 
    t.created_at,
    t.updated_at,
    1 as user_id,
    @user_group_id,
    @withdrawal_type_id,
    tg.id as transaction_group_id,
    CASE 
        WHEN t.currency = 'EUR' THEN @eur_currency_id
        WHEN t.currency = 'CHF' THEN @chf_currency_id
        WHEN t.currency = 'USD' THEN @usd_currency_id
        ELSE @eur_currency_id
    END as transaction_currency_id,
    CONCAT('Purchase at ', t.shop, CASE WHEN t.description IS NOT NULL THEN CONCAT(' - ', t.description) ELSE '' END) as description,
    CASE 
        WHEN t.time IS NOT NULL THEN CONCAT(t.date, ' ', t.time)
        ELSE CONCAT(t.date, ' 12:00:00')
    END as date,
    t.date as interest_date,
    t.date as book_date,
    t.date as process_date,
    0 as order_id,
    0 as tag_count,
    1 as encrypted,
    1 as completed
FROM finance.transactions t
JOIN transaction_groups tg ON tg.title = CONCAT('Transaction from ', t.shop, ' on ', DATE(t.date))
WHERE t.deleted_at IS NULL
ORDER BY t.id;

-- Insert actual transactions (source: asset account, destination: expense account)
INSERT INTO transactions (
    created_at, updated_at, transaction_journal_id, account_id, amount, 
    foreign_amount, foreign_currency_id, description, identifier
)
SELECT 
    t.created_at,
    t.updated_at,
    tj.id as transaction_journal_id,
    @asset_account_id as account_id,
    -ABS(t.total) as amount, -- Negative for withdrawal from asset account
    NULL as foreign_amount,
    NULL as foreign_currency_id,
    CONCAT('Withdrawal: ', t.shop) as description,
    0 as identifier
FROM finance.transactions t
JOIN transaction_journals tj ON tj.description LIKE CONCAT('Purchase at ', t.shop, '%')
WHERE t.deleted_at IS NULL
ORDER BY t.id;

INSERT INTO transactions (
    created_at, updated_at, transaction_journal_id, account_id, amount, 
    foreign_amount, foreign_currency_id, description, identifier
)
SELECT 
    t.created_at,
    t.updated_at,
    tj.id as transaction_journal_id,
    @expense_account_id as account_id,
    ABS(t.total) as amount, -- Positive for expense account
    NULL as foreign_amount,
    NULL as foreign_currency_id,
    CONCAT('Expense: ', t.shop) as description,
    1 as identifier
FROM finance.transactions t
JOIN transaction_journals tj ON tj.description LIKE CONCAT('Purchase at ', t.shop, '%')
WHERE t.deleted_at IS NULL
ORDER BY t.id;

-- Create transaction meta for receipt paths if they exist
INSERT INTO transaction_journal_meta (
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
JOIN transaction_journals tj ON tj.description LIKE CONCAT('Purchase at ', t.shop, '%')
WHERE t.deleted_at IS NULL AND t.receipt_path IS NOT NULL
ORDER BY t.id;

-- Show summary of migration
SELECT 
    'Migration Summary' as info,
    '' as details
UNION ALL
SELECT 'Custom transactions processed', COUNT(*) FROM finance.transactions WHERE deleted_at IS NULL
UNION ALL
SELECT 'Transaction groups created', COUNT(*) FROM transaction_groups WHERE user_id = 1
UNION ALL
SELECT 'Transaction journals created', COUNT(*) FROM transaction_journals WHERE user_id = 1
UNION ALL
SELECT 'Firefly transactions created', COUNT(*) FROM transactions WHERE transaction_journal_id IN (SELECT id FROM transaction_journals WHERE user_id = 1);