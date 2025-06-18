-- Add receipt_number field to transactions table for duplicate detection
-- This field will store invoice numbers, receipt numbers, or other unique identifiers from PDFs

ALTER TABLE transactions 
ADD COLUMN receipt_number VARCHAR(255) DEFAULT NULL COMMENT 'Unique receipt/invoice number extracted from PDF';

-- Create index for faster duplicate lookups
CREATE INDEX idx_receipt_number ON transactions(receipt_number);

-- Create index on shop + receipt_number combination for vendor-specific duplicate detection
CREATE INDEX idx_shop_receipt_number ON transactions(shop, receipt_number);