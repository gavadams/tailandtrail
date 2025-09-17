-- Insert initial admin user (replace with your actual email)
-- This will create the first super admin user
-- You'll need to manually create this user in Supabase Auth first, then run this script

-- Replace 'your-email@example.com' with your actual admin email
-- Make sure this user exists in Supabase Auth before running this script

INSERT INTO admin_users (id, email, role, is_active, activity_tracking_enabled, created_by)
SELECT 
    auth.users.id,
    auth.users.email,
    'super_admin',
    true,
    true,
    auth.users.id
FROM auth.users 
WHERE auth.users.email = 'gav.adams@gmail.com'  -- Replace with your email
ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    activity_tracking_enabled = true,
    updated_at = NOW();
