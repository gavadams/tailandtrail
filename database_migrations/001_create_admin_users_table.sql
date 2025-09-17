-- Create admin_users table for managing admin accounts
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Only super_admins can read admin_users (view user list)
CREATE POLICY "Super admins can read admin_users" ON admin_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

-- Users can read their own account information
CREATE POLICY "Users can read their own account" ON admin_users
    FOR SELECT USING (id = auth.uid());

-- Users can update their own account (except role, created_by, and activity_tracking_enabled)
CREATE POLICY "Users can update their own account" ON admin_users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        role = (SELECT role FROM admin_users WHERE id = auth.uid()) AND
        created_by = (SELECT created_by FROM admin_users WHERE id = auth.uid()) AND
        activity_tracking_enabled = (SELECT activity_tracking_enabled FROM admin_users WHERE id = auth.uid())
    );

-- Only super_admins can insert, delete, or manage other users
CREATE POLICY "Super admins can manage admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id = auth.uid() 
            AND role = 'super_admin' 
            AND is_active = true
        )
    );

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
