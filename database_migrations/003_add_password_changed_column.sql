-- Migration: Add password_changed column to admin_users table
-- This tracks whether a user has changed their password from the default
-- New users will be required to change their password on first login

-- Add password_changed column
ALTER TABLE admin_users 
ADD COLUMN password_changed BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing users to have password_changed = true (they've been using the system)
UPDATE admin_users 
SET password_changed = TRUE 
WHERE password_changed = FALSE;

-- Add comment to document the column
COMMENT ON COLUMN admin_users.password_changed IS 'Tracks whether user has changed their password from default. New users must change password on first login.';
