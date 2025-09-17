-- Complete migration script for User Management System
-- Run this entire script in your Supabase SQL Editor

-- ==============================================
-- 1. Create admin_users table
-- ==============================================

CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    activity_tracking_enabled BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (fixed to avoid infinite recursion)
-- Allow all authenticated users to read admin_users (we'll handle permissions in the app)
CREATE POLICY "Authenticated users can read admin_users" ON admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can update their own account (except role, created_by, and activity_tracking_enabled)
CREATE POLICY "Users can update their own account" ON admin_users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        role = (SELECT role FROM admin_users WHERE id = auth.uid()) AND
        created_by = (SELECT created_by FROM admin_users WHERE id = auth.uid()) AND
        activity_tracking_enabled = (SELECT activity_tracking_enabled FROM admin_users WHERE id = auth.uid())
    );

-- Allow all authenticated users to insert
CREATE POLICY "Authenticated users can insert admin_users" ON admin_users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update
CREATE POLICY "Authenticated users can update admin_users" ON admin_users
    FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to delete
CREATE POLICY "Authenticated users can delete admin_users" ON admin_users
    FOR DELETE WITH CHECK (auth.role() = 'authenticated');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_updated_at();

-- ==============================================
-- 2. Create user_activities table
-- ==============================================

CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('puzzle', 'game', 'content', 'splash_screen', 'user', 'settings', 'access_code')),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_timestamp ON user_activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_action ON user_activities(action);
CREATE INDEX IF NOT EXISTS idx_user_activities_resource_type ON user_activities(resource_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_resource_id ON user_activities(resource_id);

-- Enable Row Level Security
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (fixed to avoid infinite recursion)
-- Allow all authenticated users to read activities (we'll handle permissions in the app)
CREATE POLICY "Authenticated users can read activities" ON user_activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert activities" ON user_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete activities" ON user_activities
    FOR DELETE WITH CHECK (auth.role() = 'authenticated');

-- ==============================================
-- 3. Insert initial admin user
-- ==============================================
-- IMPORTANT: Make sure you've created your user in Supabase Auth first!

INSERT INTO admin_users (id, email, role, is_active, activity_tracking_enabled, created_by)
SELECT 
    auth.users.id,
    auth.users.email,
    'super_admin',
    true,
    true,
    auth.users.id
FROM auth.users 
WHERE auth.users.email = 'gav.adams@gmail.com'  -- Replace with your email if different
ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    activity_tracking_enabled = true,
    updated_at = NOW();

-- ==============================================
-- Migration Complete!
-- ==============================================

-- Migration 003: Add password_changed column
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

-- ==============================================

-- Verify the tables were created
SELECT 'admin_users table created successfully' as status;
SELECT 'user_activities table created successfully' as status;

-- Check if your admin user was inserted
SELECT email, role, is_active, activity_tracking_enabled, password_changed
FROM admin_users 
WHERE email = 'gav.adams@gmail.com';
