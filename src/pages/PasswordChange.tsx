/**
 * Password Change Page
 * Dedicated page for forced password changes
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logActivity } from '../utils/activityLogger';
import type { AdminUser } from '../types';

interface PasswordChangeForm {
  new_password: string;
  confirm_password: string;
}

const PasswordChange: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordChangeForm>();

  const newPassword = watch('new_password');

  useEffect(() => {
    // Get user data from sessionStorage
    const userData = sessionStorage.getItem('passwordChangeUser');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // If no user data, redirect back to login
      window.location.href = '/admin/login';
    }
  }, []);

  const handlePasswordChange = async (data: PasswordChangeForm) => {
    if (data.new_password !== data.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (data.new_password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsChanging(true);
      setError(null);

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.new_password
      });

      if (updateError) throw updateError;

      // Update password_changed flag in admin_users table
      if (user) {
        const { error: adminError } = await supabase
          .from('admin_users')
          .update({ 
            password_changed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (adminError) {
          // Log error but don't block user
          console.error('Failed to update password_changed flag:', adminError);
        }

        // Log the password change activity
        await logActivity({
          action: 'password_change',
          resource_type: 'user',
          resource_id: user.id,
          details: {
            user_email: user.email,
            forced_change: true
          }
        });
      }

      // Clear session storage and redirect to dashboard
      sessionStorage.removeItem('passwordChangeUser');
      window.location.href = '/admin';
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl shadow-2xl p-8 max-w-md w-full border-4 border-slate-600">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-slate-800 p-4 rounded-full inline-block mb-4 shadow-lg">
            <Lock className="h-12 w-12 text-slate-100" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Change Password Required
          </h2>
          <p className="text-slate-600">
            You must change your password before accessing the admin panel
          </p>
        </div>

        {/* User Info */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>User:</strong> {user.email}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Role:</strong> {user.role}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                {...register('new_password', { 
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type={showNewPassword ? 'text' : 'password'}
                id="new_password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...register('confirm_password', { 
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isChanging}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isChanging ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Changing Password...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Change Password
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              sessionStorage.removeItem('passwordChangeUser');
              window.location.href = '/admin/login';
            }}
            className="text-slate-600 hover:text-slate-800 text-sm flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordChange;
