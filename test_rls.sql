-- Test RLS policies on admin_users table
-- Run this in your Supabase SQL Editor

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'admin_users';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'admin_users';

-- Test query as the specific user (you'll need to replace the user ID)
-- This simulates what the app is trying to do
SELECT id, email, role, password_changed 
FROM admin_users 
WHERE id = '9818926a-5000-4bba-a858-b4b1dbe2a23e';
