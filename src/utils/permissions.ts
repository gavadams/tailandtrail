import type { UserPrivileges } from '../types';

/**
 * Get user privileges based on their role
 */
export const getUserPrivileges = (role: string): UserPrivileges => {
  switch (role) {
    case 'super_admin':
      return {
        can_manage_users: true,
        can_manage_games: true,
        can_manage_puzzles: true,
        can_manage_content: true,
        can_manage_splash_screens: true,
        can_manage_access_codes: true,
        can_view_analytics: true,
        can_manage_settings: true,
        can_view_activity_logs: true,
      };
    case 'admin':
      return {
        can_manage_users: true,
        can_manage_games: true,
        can_manage_puzzles: true,
        can_manage_content: true,
        can_manage_splash_screens: true,
        can_manage_access_codes: true,
        can_view_analytics: true,
        can_manage_settings: false,
        can_view_activity_logs: true,
      };
    case 'editor':
      return {
        can_manage_users: false,
        can_manage_games: true,
        can_manage_puzzles: true,
        can_manage_content: true,
        can_manage_splash_screens: true,
        can_manage_access_codes: false,
        can_view_analytics: true,
        can_manage_settings: false,
        can_view_activity_logs: false,
      };
    case 'viewer':
      return {
        can_manage_users: false,
        can_manage_games: false,
        can_manage_puzzles: false,
        can_manage_content: false,
        can_manage_splash_screens: false,
        can_manage_access_codes: false,
        can_view_analytics: true,
        can_manage_settings: false,
        can_view_activity_logs: false,
      };
    default:
      return {
        can_manage_users: false,
        can_manage_games: false,
        can_manage_puzzles: false,
        can_manage_content: false,
        can_manage_splash_screens: false,
        can_manage_access_codes: false,
        can_view_analytics: false,
        can_manage_settings: false,
        can_view_activity_logs: false,
      };
  }
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (role: string, permission: keyof UserPrivileges): boolean => {
  const privileges = getUserPrivileges(role);
  return privileges[permission];
};

/**
 * Get role badge color for UI display
 */
export const getRoleBadgeColor = (role: string): string => {
  switch (role) {
    case 'super_admin': return 'bg-red-100 text-red-800';
    case 'admin': return 'bg-blue-100 text-blue-800';
    case 'editor': return 'bg-green-100 text-green-800';
    case 'viewer': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};
