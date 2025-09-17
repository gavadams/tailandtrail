-- Debug script to check if the user exists in admin_users table
-- Run this in your Supabase SQL Editor

-- Check if the user exists
SELECT id, email, role, password_changed, created_at 
FROM admin_users 
WHERE id = '9818926a-5000-4bba-a858-b4b1dbe2a23e';

-- Check all users to see what's in the table
SELECT id, email, role, password_changed, created_at 
FROM admin_users 
ORDER BY created_at DESC;

-- Check the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;
