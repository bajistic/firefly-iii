#!/usr/bin/env node

const { createFireflyTransaction } = require('./src/firefly');
const { dbAllAsync } = require('./src/db');

async function testFireflyTransaction() {
  console.log('🔍 Testing Firefly Transaction Creation...\n');
  
  try {
    // 1. Check if users exist
    console.log('1. Checking users table...');
    const users = await dbAllAsync('SELECT id, email FROM users LIMIT 5');
    console.log(`   Found ${users.length} users:`, users);
    
    if (users.length === 0) {
      console.log('   ❌ NO USERS FOUND - This is the main issue!\n');
      return;
    }
    
    // 2. Check user groups
    console.log('2. Checking user groups...');
    const userId = users[0].id;
    const memberships = await dbAllAsync('SELECT user_group_id FROM group_memberships WHERE user_id = ?', [userId]);
    console.log(`   Found ${memberships.length} group memberships:`, memberships);
    
    if (memberships.length === 0) {
      console.log('   ❌ NO USER GROUP MEMBERSHIPS FOUND!\n');
      return;
    }
    
    // 3. Check accounts
    console.log('3. Checking accounts...');
    const assetAccounts = await dbAllAsync('SELECT id, name FROM accounts WHERE user_id = ? AND account_type_id = 3 LIMIT 1', [userId]);
    const expenseAccounts = await dbAllAsync('SELECT id, name FROM accounts WHERE user_id = ? AND account_type_id = 4 LIMIT 1', [userId]);
    
    console.log(`   Asset accounts: ${assetAccounts.length}`, assetAccounts);
    console.log(`   Expense accounts: ${expenseAccounts.length}`, expenseAccounts);
    
    if (assetAccounts.length === 0 || expenseAccounts.length === 0) {
      console.log('   ❌ MISSING REQUIRED ACCOUNTS!\n');
      return;
    }
    
    // 4. Test transaction creation
    console.log('4. Testing transaction creation...');
    const result = await createFireflyTransaction('TEST SHOP', 10.00, 'EUR');
    console.log(`   Transaction result: ${result}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFireflyTransaction().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});