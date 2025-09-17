-- Fix RLS policies to avoid infinite recursion
-- Run this in your Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Super admins can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can read all activities" ON user_activities;
DROP POLICY IF EXISTS "Super admins can delete activities" ON user_activities;

-- Create new policies that don't cause recursion
-- For admin_users table
CREATE POLICY "Users can read their own account" ON admin_users
    FOR SELECT USING (id = auth.uid());

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

-- Allow all authenticated users to insert (we'll handle permissions in the app)
CREATE POLICY "Authenticated users can insert admin_users" ON admin_users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to update (we'll handle permissions in the app)
CREATE POLICY "Authenticated users can update admin_users" ON admin_users
    FOR UPDATE WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to delete (we'll handle permissions in the app)
CREATE POLICY "Authenticated users can delete admin_users" ON admin_users
    FOR DELETE WITH CHECK (auth.role() = 'authenticated');

-- For user_activities table
CREATE POLICY "Users can read their own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

-- Allow all authenticated users to read activities (we'll handle permissions in the app)
CREATE POLICY "Authenticated users can read activities" ON user_activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert activities" ON user_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow all authenticated users to delete activities (we'll handle permissions in the app)
CREATE POLICY "Authenticated users can delete activities" ON user_activities
    FOR DELETE WITH CHECK (auth.role() = 'authenticated');
