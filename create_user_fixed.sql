-- Create a Firefly III user directly in the database with correct schema
USE firefly_iii;

-- Create user group first
INSERT INTO user_groups (created_at, updated_at, title) 
VALUES (NOW(), NOW(), 'bbayarbileg@gmail.com');

SET @user_group_id = LAST_INSERT_ID();

-- Create user with user_group_id
INSERT INTO users (created_at, updated_at, email, password, blocked, blocked_code, user_group_id) 
VALUES (NOW(), NOW(), 'bbayarbileg@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 0, NULL, @user_group_id);

SET @user_id = LAST_INSERT_ID();

-- Create group membership
INSERT INTO group_memberships (created_at, updated_at, user_id, user_group_id, user_role_id)
VALUES (NOW(), NOW(), @user_id, @user_group_id, 21);

-- Add default preferences
INSERT INTO preferences (created_at, updated_at, user_id, name, data)
VALUES 
(NOW(), NOW(), @user_id, 'currencyPreference', 'EUR'),
(NOW(), NOW(), @user_id, 'language', 'en_US'),
(NOW(), NOW(), @user_id, 'locale', 'equal');

-- Create default asset account (bank account)
INSERT INTO accounts (created_at, updated_at, user_id, user_group_id, account_type_id, name, virtual_balance, active, encrypted, `order`)
VALUES (NOW(), NOW(), @user_id, @user_group_id, 3, 'Main Bank Account', 0.00, 1, 0, 1);

-- Create default expense account
INSERT INTO accounts (created_at, updated_at, user_id, user_group_id, account_type_id, name, virtual_balance, active, encrypted, `order`)
VALUES (NOW(), NOW(), @user_id, @user_group_id, 4, 'General Expenses', 0.00, 1, 0, 1);

-- Show created user
SELECT 'User and accounts created successfully' as status, @user_id as user_id, @user_group_id as user_group_id;