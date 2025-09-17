-- Fix for the missing admin_users record
-- Run this in your Supabase SQL Editor

-- Insert the missing admin_users record for the existing auth user
INSERT INTO admin_users (
  id, 
  email, 
  role, 
  is_active, 
  activity_tracking_enabled, 
  password_changed, 
  created_at, 
  updated_at
) VALUES (
  '9818926a-5000-4bba-a858-b4b1dbe2a23e',
  'testemai180190@gmail.com',
  'viewer',
  true,
  true,
  false,  -- This will force password change on first login
  NOW(),
  NOW()
);

-- Verify the user was inserted
SELECT id, email, role, password_changed, created_at 
FROM admin_users 
WHERE id = '9818926a-5000-4bba-a858-b4b1dbe2a23e';
