-- Migration: Add payment tracking fields to orders table
-- Date: 2026-02-10
-- Description: Adds fields for PayHere payment integration with partial payment support

-- Create payment_status enum type
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('not_paid', 'partially_paid', 'paid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add subtotal column (order amount before delivery fee)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12, 2);

-- Add delivery_fee column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 0;

-- Add paid_amount column (amount paid via PayHere)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12, 2) DEFAULT 0;

-- Add remaining_amount column (amount to be paid COD)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC(12, 2) DEFAULT 0;

-- Add payment_status column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'not_paid';

-- Add shipping_district column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_district VARCHAR(100);

-- Add payhere_payment_id column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payhere_payment_id VARCHAR(100);

-- Update existing orders to set payment_status based on current status
-- Delivered/Ready for pickup offline orders are considered paid
UPDATE orders
SET payment_status = 'paid',
    paid_amount = total_amount,
    remaining_amount = 0,
    subtotal = total_amount,
    delivery_fee = 0
WHERE sales_channel = 'offline'
  AND status IN ('delivered', 'ready_to_pickup');

-- Pending/confirmed online orders are not paid yet
UPDATE orders
SET payment_status = 'not_paid',
    paid_amount = 0,
    remaining_amount = total_amount,
    subtotal = total_amount,
    delivery_fee = 0
WHERE sales_channel = 'online'
  AND payment_status IS NULL;

-- Add index for payment_status for common queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
