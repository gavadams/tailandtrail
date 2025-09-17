-- Run this in your Supabase SQL Editor to fix the password_changed column issue

-- Step 1: Check if the column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name = 'password_changed';

-- Step 2: Add the column if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 3: Update existing users to have password_changed = true
UPDATE admin_users 
SET password_changed = TRUE 
WHERE password_changed = FALSE;

-- Step 4: Add comment to document the column
COMMENT ON COLUMN admin_users.password_changed IS 'Tracks whether user has changed their password from default. New users must change password on first login.';

-- Step 5: Verify the fix
SELECT id, email, role, password_changed, created_at 
FROM admin_users 
ORDER BY created_at DESC;
