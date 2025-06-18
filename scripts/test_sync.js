#!/usr/bin/env node

/**
 * Test script to verify dual database sync functionality
 */

const { createSyncedTransaction, createSyncedIncome } = require('./firefly-iii/src/firefly');

async function testSync() {
    console.log('🧪 Testing dual database sync...');
    
    try {
        // Test transaction sync
        console.log('📝 Testing transaction sync...');
        const transactionResult = await createSyncedTransaction(
            'Test Store', 
            25.99, 
            'CHF', 
            null, 
            null, 
            [
                { name: 'Test Item 1', quantity: 2, price: 12.99, category: 'test' },
                { name: 'Test Item 2', quantity: 1, price: 12.99, category: 'test' }
            ]
        );
        
        if (transactionResult.success) {
            console.log('✅ Transaction sync test passed!');
            console.log(`   Original ID: ${transactionResult.originalId}`);
            console.log(`   Firefly ID: ${transactionResult.fireflyId}`);
        } else {
            console.log('❌ Transaction sync test failed:', transactionResult.error);
        }
        
        // Test income sync
        console.log('\n💰 Testing income sync...');
        const incomeResult = await createSyncedIncome(
            'Test Salary',
            3000.00,
            'Test salary payment',
            new Date().toISOString().split('T')[0]
        );
        
        if (incomeResult.success) {
            console.log('✅ Income sync test passed!');
            console.log(`   Original ID: ${incomeResult.originalId}`);
            console.log(`   Firefly ID: ${incomeResult.fireflyId}`);
        } else {
            console.log('❌ Income sync test failed:', incomeResult.error);
        }
        
        console.log('\n🎉 Sync testing completed!');
        console.log('💡 Your AI assistant will now automatically sync to both databases');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    process.exit(0);
}

if (require.main === module) {
    testSync();
}

module.exports = testSync;