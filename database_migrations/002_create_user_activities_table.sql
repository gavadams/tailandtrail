-- Create user_activities table for tracking admin user actions
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

-- Create RLS policies
-- Users can read their own activities
CREATE POLICY "Users can read their own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

-- Only super admins can read all activities
CREATE POLICY "Super admins can read all activities" ON user_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

-- Only authenticated users can insert activities (for logging)
CREATE POLICY "Authenticated users can insert activities" ON user_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only super admins can delete activities
CREATE POLICY "Super admins can delete activities" ON user_activities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );
