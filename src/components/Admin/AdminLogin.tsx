/**
 * Admin login component with secure authentication
 * Protects access to the management dashboard
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Shield, AlertCircle, Crown } from 'lucide-react';
import { signInAdmin } from '../../lib/supabase';

interface AdminLoginForm {
  email: string;
  password: string;
}

interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginForm>();

  const handleLogin = async (data: AdminLoginForm) => {
    setIsLoggingIn(true);
    setError(null);

    try {
      const { error: authError } = await signInAdmin(data.email, data.password);
      
      if (authError) {
        setError('Invalid email or password. Please try again.');
      } else {
        onLogin();
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-2xl shadow-2xl p-8 max-w-md w-full border-4 border-slate-600">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-slate-800 p-4 rounded-full inline-block mb-4 shadow-lg">
            <Crown className="h-12 w-12 text-slate-100" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Admin Access
          </h2>
          <p className="text-slate-700">
            Enter your admin password to access the management dashboard
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-2">
              Admin Email
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
              id="email"
              placeholder="Enter admin email..."
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-colors text-lg"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-slate-900 mb-2">
              Admin Password
            </label>
            <input
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              type="password"
              id="password"
              placeholder="Enter admin password..."
              className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-slate-500 focus:ring-2 focus:ring-slate-200 outline-none transition-colors text-lg"
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Shield className="h-5 w-5 mr-2" />
            {isLoggingIn ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-slate-200 rounded-lg border-l-4 border-slate-600">
          <p className="text-slate-800 text-sm">
            <strong>Security Notice:</strong> This area is restricted to authorized administrators only. 
            All access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};