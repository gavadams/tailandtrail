-- Debug script to check password_changed column status
-- Run this to verify the migration worked correctly

-- Check if the column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name = 'password_changed';

-- Check all users and their password_changed status
SELECT id, email, role, password_changed, created_at 
FROM admin_users 
ORDER BY created_at DESC;

-- Check specifically for users with password_changed = false
SELECT id, email, role, password_changed, created_at 
FROM admin_users 
WHERE password_changed = false;
