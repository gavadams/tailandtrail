/**
 * User Management component for admin panel
 * Allows managing admin users, their roles, and viewing activity logs
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, Eye, User, Clock, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logActivity, logCreate, logUpdate, logDelete } from '../../utils/activityLogger';
import { getUserPrivileges, getRoleBadgeColor } from '../../utils/permissions';
import type { AdminUser, UserActivity, NewsletterSubscriber } from '../../types';

interface UserForm {
  email: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  activity_tracking_enabled: boolean;
}

interface ActivityFilters {
  user_id: string;
  action: string;
  resource_type: string;
  date_from: string;
  date_to: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'activities' | 'subscribers'>('users');
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [authUserIds, setAuthUserIds] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserForm>();
  const { register: registerFilters, handleSubmit: handleSubmitFilters, reset: resetFilters } = useForm<ActivityFilters>();


  useEffect(() => {
    loadCurrentUser();
    loadUsers();
    loadActivities();
    checkAuthUsers();
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      loadSubscribers();
    }
  }, [currentUser]);
  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.warn('Failed to load subscribers:', err);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setSuccess('Subscriber removed');
    } catch (err) {
      setError('Failed to remove subscriber');
    }
  };

  const exportSubscribersCsv = () => {
    const header = ['email','source','subscribed_at','ip_address'];
    const rows = subscribers.map(s => [s.email, s.source || '', s.subscribed_at, s.ip_address || '']);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'newsletter-subscribers.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.warn('No authenticated user');
        return;
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError) {
        console.warn('Could not load current user:', adminError.message);
        return;
      }

      setCurrentUser(adminUser);
    } catch (err) {
      console.warn('Error loading current user:', err);
    }
  };

  const checkAuthUsers = async () => {
    try {
      // Get all auth users to check which admin users have auth accounts
      const { data: authUsers, error } = await supabase.auth.admin.listUsers();
      if (error) {
        console.warn('Could not fetch auth users:', error.message);
        return;
      }
      
      const authIds = new Set(authUsers.users.map(user => user.id));
      setAuthUserIds(authIds);
    } catch (err) {
      console.warn('Could not check auth users:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      console.log('Loading users...');
      
      // First check if user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('Auth user:', authUser);
      console.log('Auth error:', authError);
      
      if (authError || !authUser) {
        setError('Not authenticated. Please log in first.');
        return;
      }

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Users query result:', { data, error });
      
      if (error) {
        console.error('Users query error:', error);
        setError(`Failed to load users: ${error.message}`);
        return;
      }
      
      setUsers(data || []);
      console.log('Users loaded successfully:', data);
    } catch (err) {
      console.error('Load users error:', err);
      setError(`Failed to load users: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivities = async (filters?: Partial<ActivityFilters>) => {
    try {
      let query = supabase
        .from('user_activities')
        .select(`
          *,
          admin_users!user_activities_user_id_fkey(email)
        `)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      if (filters?.date_from) {
        query = query.gte('timestamp', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('timestamp', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      setError('Failed to load activity logs');
    }
  };

  const handleSaveUser = async (data: UserForm) => {
    try {
      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from('admin_users')
        .update({
          email: data.email,
          role: data.role,
          is_active: data.is_active,
          activity_tracking_enabled: data.activity_tracking_enabled,
          updated_at: new Date().toISOString()
        })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
        
        // Log the update activity
        await logUpdate('user', editingUser.id, {
          email: data.email,
          role: data.role,
          is_active: data.is_active,
          activity_tracking_enabled: data.activity_tracking_enabled
        });
        
        setSuccess('User updated successfully!');
      } else {
        // Create new user - try to create auth user first, then admin user
        try {
          console.log('=== STARTING USER CREATION ===');
          console.log('Email:', data.email);
          console.log('Role:', data.role);
          
          // First, try to create the auth user
          console.log('Creating auth user...');
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.email, // Default password is email
            options: {
              emailRedirectTo: undefined // Skip email confirmation
            }
          });

          console.log('Auth creation result:', { authData, authError });

          let userId: string;
          
          if (authError) {
            // If auth creation fails, create with generated ID
            console.warn('Auth user creation failed, using generated ID:', authError.message);
            userId = crypto.randomUUID();
          } else if (authData.user?.id) {
            // Use the auth user ID
            userId = authData.user.id;
            console.log('Auth user created successfully with ID:', userId);
          } else {
            // Fallback if no user ID
            console.warn('Auth user created but no ID returned, using generated ID');
            userId = crypto.randomUUID();
          }
          
          console.log('Final user ID to use:', userId);
          
          // Create admin user record
          const insertData = {
            id: userId,
            email: data.email,
            role: data.role,
            is_active: data.is_active,
            activity_tracking_enabled: data.activity_tracking_enabled,
            password_changed: false, // New users must change password on first login
            created_by: (await supabase.auth.getUser()).data.user?.id
          };

          console.log('Inserting admin user with data:', insertData);
          
          const { data: newUser, error: insertError } = await supabase
            .from('admin_users')
            .insert(insertData)
            .select()
            .single();

          if (insertError) {
            console.error('Failed to insert admin user:', insertError);
            throw insertError;
          }
          
          // Debug logging
          console.log('=== USER CREATION SUCCESS ===');
          console.log('New user created:', newUser);
          console.log('Password changed set to:', newUser.password_changed);
          console.log('User creation timestamp:', new Date().toISOString());
          console.log('Auth user created:', !authError);
          console.log('=== END USER CREATION ===');
          
          // Log the creation activity
          await logCreate('user', newUser.id, {
            email: data.email,
            role: data.role,
            is_active: data.is_active,
            activity_tracking_enabled: data.activity_tracking_enabled,
            password_changed: newUser.password_changed,
            auth_user_created: !authError,
            note: authError ? "User created in admin_users table. Auth user creation failed - may need manual creation." : "User created successfully with both admin_users and auth user."
          });
          
          if (authError) {
            setSuccess('User created in admin_users table. Auth user creation failed - you may need to create the auth user manually with email as password.');
          } else {
            setSuccess('User created successfully! Default password is their email address.');
          }
        } catch (authErr) {
          // Fallback: create with generated ID if everything fails
          const tempId = crypto.randomUUID();
          
          const { data: newUser, error: insertError } = await supabase
            .from('admin_users')
            .insert({
              id: tempId,
              email: data.email,
              role: data.role,
              is_active: data.is_active,
              activity_tracking_enabled: data.activity_tracking_enabled,
              created_by: (await supabase.auth.getUser()).data.user?.id
            })
            .select()
            .single();

          if (insertError) throw insertError;
          
          await logCreate('user', newUser.id, {
            email: data.email,
            role: data.role,
            is_active: data.is_active,
            activity_tracking_enabled: data.activity_tracking_enabled,
            note: "User created in admin_users table only. Auth user creation failed - needs manual creation."
          });
          
          setSuccess('User created in admin_users table. Auth user creation failed - needs manual creation with email as password.');
        }
      }

      reset();
      setEditingUser(null);
      setShowUserForm(false);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    // Prevent editing super admins unless current user is super admin
    if (user.role === 'super_admin' && currentUser?.role !== 'super_admin') {
      setError('Only super admins can edit other super admins');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Prevent users from editing themselves to a higher role
    if (currentUser && user.id === currentUser.id && user.role !== currentUser.role) {
      setError('You cannot change your own role');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setEditingUser(user);
    setValue('email', user.email);
    setValue('role', user.role);
    setValue('is_active', user.is_active);
    setValue('activity_tracking_enabled', user.activity_tracking_enabled);
    setShowUserForm(true);
    
    // Scroll to form
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleDeleteUser = async (userId: string) => {
    // Find the user to check their role
    const userToDelete = users.find(u => u.id === userId);
    
    // Prevent deleting super admins unless current user is super admin
    if (userToDelete?.role === 'super_admin' && currentUser?.role !== 'super_admin') {
      setError('Only super admins can delete other super admins');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Prevent users from deleting themselves
    if (currentUser && userId === currentUser.id) {
      setError('You cannot delete your own account');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Get user info before deleting for logging
      const userToDelete = users.find(u => u.id === userId);
      
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      // Log the deletion activity
      if (userToDelete) {
        await logDelete('user', userId, {
          email: userToDelete.email,
          role: userToDelete.role
        });
      }
      
      setSuccess('User deleted successfully!');
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleActivityTracking = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({
          activity_tracking_enabled: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Log the activity tracking toggle
      await logActivity({
        action: 'toggle_activity_tracking',
        resource_type: 'user',
        resource_id: userId,
        details: {
          enabled: !currentStatus,
          previous_status: currentStatus
        }
      });
      
      setSuccess(`Activity tracking ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update activity tracking');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleActivityFilter = (filters: ActivityFilters) => {
    loadActivities(filters);
  };

  const toggleActivityExpansion = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const handleCreateAuthUser = async (userId: string, email: string) => {
    try {
      // Try to create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: email, // Default password is email
        options: {
          emailRedirectTo: undefined // Skip email confirmation
        }
      });

      if (authError) {
        setError(`Failed to create auth user: ${authError.message}`);
        return;
      }

      // Update the admin user with the new auth ID if it was different
      if (authData.user && authData.user.id !== userId) {
        await supabase
          .from('admin_users')
          .update({ id: authData.user.id })
          .eq('id', userId);
      }

      // Log the auth user creation
      await logActivity({
        action: 'create_auth_user',
        resource_type: 'user',
        resource_id: userId,
        details: {
          email: email,
          auth_user_id: authData.user?.id,
          note: "Auth user created for existing admin user"
        }
      });

      setSuccess('Auth user created successfully! User can now log in with their email as password.');
      loadUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create auth user');
      setTimeout(() => setError(null), 3000);
    }
  };



  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage admin users, roles, and view activity logs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              activeTab === 'activities' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Activity Logs</span>
          </button>
          {currentUser && getUserPrivileges(currentUser.role).can_manage_users && (
            <button
              onClick={() => setShowUserForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4 inline mr-2" />
            Users ({users.length})
          </button>
          {currentUser && getUserPrivileges(currentUser.role).can_view_activity_logs && (
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activities'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Activity Logs ({activities.length})
            </button>
          )}
          {currentUser?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subscribers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 inline mr-2" />
              Subscribers ({subscribers.length})
            </button>
          )}
        </nav>
      </div>
      {/* Subscribers Tab - Super Admin only */}
      {activeTab === 'subscribers' && currentUser?.role === 'super_admin' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {subscribers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subscribers found</h3>
              <p className="text-gray-500">Newsletter opt-ins will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="text-base font-semibold text-gray-900">Newsletter Subscribers</h3>
                <button onClick={exportSubscribersCsv} className="text-sm text-blue-600 hover:text-blue-700">Export CSV</button>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscribed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.source || 'purchase'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(s.subscribed_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.ip_address || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => handleDeleteSubscriber(s.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Remove subscriber"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

      {/* User Form */}
      {showUserForm && (
        <div ref={formRef} className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h3>
          
          <form onSubmit={handleSubmit(handleSaveUser)} className="space-y-4">
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
              <select
                {...register('role', { required: 'Role is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="viewer">Viewer - Read-only access</option>
                <option value="editor">Editor - Can edit content and puzzles</option>
                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
                  <option value="admin">Admin - Full access except user management</option>
                )}
                {currentUser && currentUser.role === 'super_admin' && (
                  <option value="super_admin">Super Admin - Full access including user management</option>
                )}
              </select>
              {errors.role && (
                <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  id="is_active"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active (user can log in)
                </label>
              </div>
              
              {currentUser && currentUser.role === 'super_admin' && (
                <div className="flex items-center">
                  <input
                    {...register('activity_tracking_enabled')}
                    type="checkbox"
                    id="activity_tracking_enabled"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activity_tracking_enabled" className="ml-2 block text-sm text-gray-900">
                    Enable Activity Tracking (log user actions)
                  </label>
                  <span className="ml-2 text-xs text-gray-500">(Super admin only)</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                  reset();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first admin user.</p>
              {currentUser && getUserPrivileges(currentUser.role).can_manage_users && (
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Add User
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tracking
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.email}</div>
                              <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.activity_tracking_enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.activity_tracking_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {!authUserIds.has(user.id) && currentUser && getUserPrivileges(currentUser.role).can_manage_users && (
                              <button
                                onClick={() => handleCreateAuthUser(user.id, user.email)}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="Create Auth User (allows login)"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                            )}
                            {currentUser && getUserPrivileges(currentUser.role).can_manage_users && currentUser.role === 'super_admin' && (
                              <button
                                onClick={() => handleToggleActivityTracking(user.id, user.activity_tracking_enabled)}
                                className={`p-1 ${
                                  user.activity_tracking_enabled 
                                    ? 'text-blue-600 hover:text-blue-700' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title={`${user.activity_tracking_enabled ? 'Disable' : 'Enable'} Activity Tracking`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            {currentUser && getUserPrivileges(currentUser.role).can_manage_users && (
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-700 p-1"
                                title="Edit User"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                            )}
                            {currentUser && getUserPrivileges(currentUser.role).can_manage_users && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-700 p-1"
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activities' && currentUser && getUserPrivileges(currentUser.role).can_view_activity_logs && (
        <div className="space-y-4">
          {/* Activity Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Activity Logs</h3>
            <form onSubmit={handleSubmitFilters(handleActivityFilter)} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <select
                  {...registerFilters('user_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  {...registerFilters('action')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <select
                  {...registerFilters('resource_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="puzzle">Puzzle</option>
                  <option value="game">Game</option>
                  <option value="content">Content</option>
                  <option value="splash_screen">Splash Screen</option>
                  <option value="user">User</option>
                  <option value="settings">Settings</option>
                  <option value="access_code">Access Code</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  {...registerFilters('date_from')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  {...registerFilters('date_to')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-3 lg:col-span-5 flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    loadActivities();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </form>
          </div>

          {/* Activity List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity logs found</h3>
                <p className="text-gray-500">Activity logs will appear here as users interact with the system.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activities.map((activity) => {
                      const isExpanded = expandedActivities.has(activity.id);
                      const detailsString = activity.details ? JSON.stringify(activity.details, null, 2) : 'No details available';
                      
                      return (
                        <React.Fragment key={activity.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {(activity as any).admin_users?.email || 'Unknown User'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(activity.action)}`}>
                                {activity.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {activity.resource_type} {activity.resource_id && `#${activity.resource_id.slice(0, 8)}`}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-2">
                                <span className="max-w-xs truncate">
                                  {activity.details ? JSON.stringify(activity.details).substring(0, 50) + '...' : '-'}
                                </span>
                                {activity.details && (
                                  <button
                                    onClick={() => toggleActivityExpansion(activity.id)}
                                    className="text-blue-600 hover:text-blue-700 p-1"
                                    title={isExpanded ? 'Collapse details' : 'Expand details'}
                                  >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </td>
                          </tr>
                          {isExpanded && activity.details && (
                            <tr className="bg-gray-50">
                              <td colSpan={5} className="px-6 py-4">
                                <div className="bg-white rounded-lg border p-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Activity Details</h4>
                                  <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                                    {detailsString}
                                  </pre>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
