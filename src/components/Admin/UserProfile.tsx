/**
 * User Profile component for managing own account
 * Allows users to view and update their own account information
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Eye, EyeOff, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logActivity, logUpdate } from '../../utils/activityLogger';
import { getUserPrivileges } from '../../utils/permissions';
import type { AdminUser } from '../../types';

interface UserProfileForm {
  email: string;
  role: string;
  is_active: boolean;
}

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserProfileForm>();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: passwordErrors } } = useForm<PasswordForm>();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setError('Failed to load user information');
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;
      
      setUser(data);
      setValue('email', data.email);
      setValue('role', data.role);
      setValue('is_active', data.is_active);
    } catch (err) {
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: UserProfileForm) => {
    if (!user) return;

    try {
      setIsUpdating(true);
      setError(null);

      // Only super admins can update is_active
      const updateData: any = {
        email: data.email,
        updated_at: new Date().toISOString()
      };
      
      if (user.role === 'super_admin') {
        updateData.is_active = data.is_active;
      }

      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Log the profile update activity
      const logData: any = {
        email: data.email,
        previous_email: user.email
      };
      
      if (user.role === 'super_admin') {
        logData.is_active = data.is_active;
        logData.previous_is_active = user.is_active;
      }
      
      await logUpdate('user', user.id, logData);

      setSuccess('Profile updated successfully!');
      loadUserProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (data: PasswordForm) => {
    try {
      setIsChangingPassword(true);
      setError(null);

      if (data.new_password !== data.confirm_password) {
        setError('New passwords do not match');
        return;
      }

      if (data.new_password.length < 6) {
        setError('New password must be at least 6 characters long');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      });

      if (error) throw error;

      // Update password_changed flag in admin_users table
      if (user) {
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({ 
            password_changed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.warn('Failed to update password_changed flag:', updateError);
        }
      }

      // Log the password change activity
      await logActivity({
        action: 'change_password',
        resource_type: 'user',
        resource_id: user?.id || null,
        details: {
          password_changed: true,
          timestamp: new Date().toISOString()
        }
      });

      setSuccess('Password changed successfully!');
      setShowPasswordForm(false);
      resetPassword();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to change password');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'editor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
        <p className="text-gray-500">Unable to load your user profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center mb-4">
          <User className="h-10 w-10 text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
        <p className="text-gray-600 mt-1">Manage your account settings</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-lg p-6 border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        
        <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                }
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500">(Cannot be changed)</span>
            </div>
          </div>

          <div className="space-y-3">
            {user && user.role === 'super_admin' && (
              <div className="flex items-center">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  id="is_active"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Account Active (can log in) - Super Admin only
                </label>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.activity_tracking_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                Activity Tracking: {user.activity_tracking_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <span className="text-sm text-gray-500">(Managed by super admin)</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isUpdating ? 'Updating...' : 'Update Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg shadow-lg p-6 border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
        
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handleSubmitPassword(handleChangePassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                {...registerPassword('current_password', { required: 'Current password is required' })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Enter current password"
              />
              {passwordErrors.current_password && (
                <p className="text-red-600 text-sm mt-1">{passwordErrors.current_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                {...registerPassword('new_password', { 
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Enter new password"
              />
              {passwordErrors.new_password && (
                <p className="text-red-600 text-sm mt-1">{passwordErrors.new_password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                {...registerPassword('confirm_password', { required: 'Please confirm your new password' })}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="Confirm new password"
              />
              {passwordErrors.confirm_password && (
                <p className="text-red-600 text-sm mt-1">{passwordErrors.confirm_password.message}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  resetPassword();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Statistics */}
      <div className="bg-white rounded-lg shadow-lg p-6 border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Account Created</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Login</p>
            <p className="text-lg font-medium text-gray-900">
              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
