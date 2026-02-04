-- Migration: Add sales_channel and offline customer fields to orders table
-- Date: 2026-02-04
-- Description: Adds sales_channel enum column and offline customer info fields for offline sales feature

-- Create the sales_channel enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sales_channel') THEN
        CREATE TYPE sales_channel AS ENUM ('online', 'offline');
    END IF;
END $$;

-- Add sales_channel column with default 'online'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sales_channel sales_channel NOT NULL DEFAULT 'online';

-- Make customer_id nullable for offline sales (it was NOT NULL before)
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;

-- Add offline customer info columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offline_customer_name VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offline_customer_phone VARCHAR(20);

-- Create index on sales_channel for efficient filtering
CREATE INDEX IF NOT EXISTS idx_orders_sales_channel ON orders(sales_channel);

-- Add comment for documentation
COMMENT ON COLUMN orders.sales_channel IS 'Sales channel: online (web orders) or offline (walk-in/phone orders)';
COMMENT ON COLUMN orders.offline_customer_name IS 'Customer name for offline sales (when customer_id is null)';
COMMENT ON COLUMN orders.offline_customer_phone IS 'Customer phone for offline sales (when customer_id is null)';
