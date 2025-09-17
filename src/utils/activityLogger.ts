/**
 * Activity logging utility for tracking user actions
 * This utility provides functions to log user activities to the database
 */

import { supabase } from '../lib/supabase';

export interface ActivityLogData {
  action: string;
  resource_type: 'puzzle' | 'game' | 'content' | 'splash_screen' | 'user' | 'settings' | 'access_code';
  resource_id?: string | null;
  details?: any;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Logs a user activity to the database
 * Only logs if the user has activity tracking enabled
 * 
 * @param activityData - The activity data to log
 * @returns Promise<boolean> - Returns true if logged successfully, false otherwise
 */
export const logActivity = async (activityData: ActivityLogData): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('No authenticated user for activity logging');
      return false;
    }

    // Check if user has activity tracking enabled
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('activity_tracking_enabled')
      .eq('id', user.id)
      .single();

    if (adminError || !adminUser?.activity_tracking_enabled) {
      // User doesn't have activity tracking enabled, skip logging
      return false;
    }

    // Log the activity
    const { error: logError } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        action: activityData.action,
        resource_type: activityData.resource_type,
        resource_id: activityData.resource_id || null,
        details: activityData.details || null,
        ip_address: activityData.ip_address || null,
        user_agent: activityData.user_agent || null,
        timestamp: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log activity:', logError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in activity logging:', error);
    return false;
  }
};

/**
 * Logs a create action
 */
export const logCreate = async (
  resourceType: ActivityLogData['resource_type'],
  resourceId: string,
  details?: any
): Promise<boolean> => {
  return logActivity({
    action: 'create',
    resource_type: resourceType,
    resource_id: resourceId,
    details
  });
};

/**
 * Logs an update action
 */
export const logUpdate = async (
  resourceType: ActivityLogData['resource_type'],
  resourceId: string,
  details?: any
): Promise<boolean> => {
  return logActivity({
    action: 'update',
    resource_type: resourceType,
    resource_id: resourceId,
    details
  });
};

/**
 * Logs a delete action
 */
export const logDelete = async (
  resourceType: ActivityLogData['resource_type'],
  resourceId: string,
  details?: any
): Promise<boolean> => {
  return logActivity({
    action: 'delete',
    resource_type: resourceType,
    resource_id: resourceId,
    details
  });
};

/**
 * Logs a login action
 */
export const logLogin = async (details?: any): Promise<boolean> => {
  return logActivity({
    action: 'login',
    resource_type: 'user',
    resource_id: null,
    details
  });
};

/**
 * Logs a logout action
 */
export const logLogout = async (details?: any): Promise<boolean> => {
  return logActivity({
    action: 'logout',
    resource_type: 'user',
    resource_id: null,
    details
  });
};
