-- Migration: Add email_verified column to customers table
-- Date: 2026-01-26
-- Description: Adds email verification support for email/password users
--
-- This migration adds the email_verified column and sets appropriate defaults:
-- - Existing Google OAuth users (with firebase_uid) are marked as verified
-- - Existing email/password users (without firebase_uid) are marked as verified
--   (grandfathered in, since they registered before email verification was required)
-- - New email/password users will default to FALSE and must verify

-- Add the email_verified column with default FALSE
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark all existing customers as email verified (grandfathering existing users)
-- They registered before email verification was required
UPDATE customers
SET email_verified = TRUE
WHERE email_verified = FALSE;

-- Add a comment to the column for documentation
COMMENT ON COLUMN customers.email_verified IS
'Email verification status. Google OAuth users are auto-verified. Email/password users must verify via Firebase email verification.';
