-- Migration: Add firebase_uid column to employees table
-- Created: 2026-01-26
-- Purpose: Enable Google Sign-In authentication for employees
--
-- BUSINESS RULE: Employee accounts are provisioned exclusively by administrators.
-- Google Sign-In is used strictly for authentication, not onboarding.
-- Employees CANNOT self-register - they must be created by an Admin first.

-- Add firebase_uid column to employees table
-- This field stores the Firebase UID for employees who log in via Google Sign-In
-- It's populated on first Google login and used for subsequent authentications
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE;

-- Create index for faster lookups by firebase_uid
CREATE INDEX IF NOT EXISTS idx_employees_firebase_uid ON employees(firebase_uid);

-- Make password_hash nullable to support Google-only auth employees
-- Employees created by Admin can have either:
-- 1. Email/password auth (password_hash set)
-- 2. Google-only auth (password_hash null)
-- 3. Both (password_hash set AND firebase_uid set)
ALTER TABLE employees
ALTER COLUMN password_hash DROP NOT NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees'
  AND column_name IN ('firebase_uid', 'password_hash');
