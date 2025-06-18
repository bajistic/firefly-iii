const { extractTransactionFromPDF, createTransactionFromEmail } = require('./src/email-receipts');

async function testFullPipeline() {
  const emailInfo = {
    from: 'Anthropic, PBC <invoice+statements@mail.anthropic.com>',
    subject: 'Your receipt from Anthropic, PBC #2484-4837-8974'
  };
  
  const pdfPath = './uploads/1750211465253-email-Receipt-2484-4837-8974.pdf';
  
  console.log('Testing full transaction creation pipeline...');
  
  try {
    // Extract transaction data
    const transactionData = await extractTransactionFromPDF(pdfPath, emailInfo);
    if (!transactionData) {
      console.log('❌ No transaction data extracted');
      return;
    }
    
    console.log('✅ Transaction data extracted successfully');
    
    // Create transaction
    const result = await createTransactionFromEmail(transactionData, pdfPath, emailInfo);
    console.log('Transaction Creation Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFullPipeline();