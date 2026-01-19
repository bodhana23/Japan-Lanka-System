-- Migration: Add return_items table and description column to return_requests
-- Date: January 2026
-- Description: Adds item-level return tracking

-- Add description column to return_requests if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'return_requests'
        AND column_name = 'description'
    ) THEN
        ALTER TABLE return_requests ADD COLUMN description TEXT;
    END IF;
END $$;

-- Modify reason column to allow shorter values (category-based)
-- This is safe as we're making it less restrictive
ALTER TABLE return_requests ALTER COLUMN reason TYPE VARCHAR(100);

-- Create return_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES order_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_return_items_return_request_id ON return_items(return_request_id);
CREATE INDEX IF NOT EXISTS idx_return_items_order_item_id ON return_items(order_item_id);

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully: return_items table created and return_requests updated';
END $$;
