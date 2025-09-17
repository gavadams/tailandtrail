# Database Migrations for User Management System

This directory contains SQL migration scripts to set up the user management and activity tracking system.

## Migration Order

Run these migrations in order:

1. **001_create_admin_users_table.sql** - Creates the admin_users table
2. **002_create_user_activities_table.sql** - Creates the user_activities table  
3. **003_insert_initial_admin_user.sql** - Inserts your initial super admin user

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration script
4. Run them in order (001, 002, 003)

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset
# Then run each migration file
```

## Important Notes

### Before Running Migration 003:
1. **Create your admin user in Supabase Auth first:**
   - Go to **Authentication > Users** in your Supabase dashboard
   - Click **Add User**
   - Enter your email: `gav.adams@gmail.com`
   - Set a secure password
   - Click **Create User**

2. **Update the email in migration 003:**
   - Open `003_insert_initial_admin_user.sql`
   - Replace `'gav.adams@gmail.com'` with your actual admin email if different

### After Running Migrations:
1. Your user management system will be ready
2. You can log in with your admin credentials
3. Navigate to **User Management** in the admin panel
4. Create additional admin users as needed

## Table Structure

### admin_users
- `id` - UUID primary key (linked to auth.users)
- `email` - User's email address
- `role` - User role (super_admin, admin, editor, viewer)
- `is_active` - Whether user can log in
- `activity_tracking_enabled` - Whether to track this user's activities
- `last_login` - Timestamp of last login
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - Who created this user

### user_activities
- `id` - UUID primary key
- `user_id` - Reference to admin_users
- `action` - Action performed (create, update, delete, login, etc.)
- `resource_type` - Type of resource affected
- `resource_id` - ID of the affected resource
- `details` - Additional details (JSON)
- `ip_address` - User's IP address
- `user_agent` - User's browser info
- `timestamp` - When the action occurred

## Security Features

- **Row Level Security (RLS)** enabled on both tables
- **Role-based access control** - only super admins can manage other users
- **Self-management** - users can update their own account information
- **Activity tracking** - can be enabled/disabled per user
- **Audit trail** - all user actions are logged (when enabled)

## User Permissions

### Super Admins
- ✅ View all users and their activities
- ✅ Add, edit, and delete users
- ✅ Control activity tracking for all users
- ✅ Manage their own account

### Regular Admins, Editors, Viewers
- ✅ View and manage their own account
- ✅ Change their own password
- ❌ Cannot control activity tracking (super admin only)
- ❌ Cannot view other users
- ❌ Cannot manage other users
- ❌ Cannot view other users' activities
