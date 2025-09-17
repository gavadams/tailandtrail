-- Fix script for password_changed column
-- This will add the column if it doesn't exist

-- Check if the column exists
DO $$
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'admin_users' 
        AND column_name = 'password_changed'
    ) THEN
        -- Add password_changed column
        ALTER TABLE admin_users 
        ADD COLUMN password_changed BOOLEAN NOT NULL DEFAULT FALSE;
        
        -- Update existing users to have password_changed = true (they've been using the system)
        UPDATE admin_users 
        SET password_changed = TRUE 
        WHERE password_changed = FALSE;
        
        -- Add comment to document the column
        COMMENT ON COLUMN admin_users.password_changed IS 'Tracks whether user has changed their password from default. New users must change password on first login.';
        
        RAISE NOTICE 'password_changed column added successfully';
    ELSE
        RAISE NOTICE 'password_changed column already exists';
    END IF;
END $$;

-- Verify the column exists and show current data
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
AND column_name = 'password_changed';

-- Show all users and their password_changed status
SELECT id, email, role, password_changed, created_at 
FROM admin_users 
ORDER BY created_at DESC;
