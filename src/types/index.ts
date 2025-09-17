/**
 * Type definitions for the Tale and Trail application
 * These types define the structure of our data throughout the app
 */

export interface City {
  id: string;
  name: string;
  country: string;
  state_province?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  theme: string;
  city_id: string;
  is_active: boolean;
  game_tested: boolean;
  content_tested: boolean;
  created_at: string;
  updated_at: string;
}

export interface Puzzle {
  id: string;
  game_id: string;
  title: string;
  description: string;
  riddle: string;
  clues: string[]; // Array of progressive clues
  answer: string;
  answer_type: 'text' | 'dropdown';
  answer_options?: string[]; // Array of dropdown options
  sequence_order: number;
  image_url?: string;
  video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AccessCode {
  id: string;
  code: string;
  game_id: string;
  is_active: boolean;
  activated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface PlayerSession {
  id: string;
  access_code_id: string;
  game_id: string;
  current_puzzle_id: string | null;
  completed_puzzles: string[]; // Array of completed puzzle IDs
  session_data: any; // Store puzzle progress, revealed clues, etc.
  player_email?: string; // Player's email address
  last_activity: string;
  created_at: string;
}

export interface CodeUsageLog {
  id: string;
  access_code_id: string;
  game_id: string;
  action: 'activated' | 'expired' | 'completed';
  timestamp: string;
  metadata: any;
}

export interface SplashScreen {
  id: string;
  game_id: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  sequence_order: number;
  puzzle_id?: string; // Show before this puzzle
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  email: string;
  game_id: string;
  access_code_id: string;
  amount: number;
  stripe_payment_intent_id: string;
  status: 'pending' | 'completed' | 'failed';
  opt_in_marketing: boolean;
  created_at: string;
}

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description?: string;
  is_published: boolean;
  show_in_nav: boolean;
  nav_order: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'textarea' | 'html' | 'image' | 'boolean' | 'number';
  category: string;
  label: string;
  description?: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  activity_tracking_enabled: boolean;
  password_changed: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  resource_type: 'puzzle' | 'game' | 'content' | 'splash_screen' | 'user' | 'settings' | 'access_code';
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

export interface UserPrivileges {
  can_manage_users: boolean;
  can_manage_games: boolean;
  can_manage_puzzles: boolean;
  can_manage_content: boolean;
  can_manage_splash_screens: boolean;
  can_manage_access_codes: boolean;
  can_view_analytics: boolean;
  can_manage_settings: boolean;
  can_view_activity_logs: boolean;
}