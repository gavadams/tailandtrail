/**
 * Content management store using Zustand
 * Manages site content, pages, and settings
 */

import { create } from 'zustand';
import { ContentPage } from '../types';
import { supabase } from '../lib/supabase';

interface ContentState {
  pages: ContentPage[];
  settings: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isAppReady: boolean;
  
  // Actions
  setPages: (pages: ContentPage[]) => void;
  setSettings: (settings: Record<string, string>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAppReady: (ready: boolean) => void;
  getSetting: (key: string, defaultValue?: string) => string;
  refreshSettings: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  pages: [],
  settings: {},
  isLoading: false,
  error: null,
  isInitialized: false,
  isAppReady: false,

  setPages: (pages) => set({ pages }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setAppReady: (ready) => set({ isAppReady: ready }),
  
  getSetting: (key: string, defaultValue = '') => {
    const { settings } = get();
    return settings[key] || defaultValue;
  },

  refreshSettings: async () => {
    try {
      console.log('Refreshing settings from database...');
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*');
      
      if (settingsData) {
        const settingsMap = settingsData.reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {});
        set({ settings: settingsMap });
        console.log('Settings refreshed:', settingsMap);
      } else {
        console.log('No settings data returned from database');
      }
    } catch (error) {
      console.error('Failed to refresh settings:', error);
      set({ error: 'Failed to refresh settings' });
    }
  },

  initialize: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;
    
    console.log('Initializing content store...');
    set({ isInitialized: true, isLoading: true });
    
    try {
      await get().refreshSettings();
      set({ isAppReady: true, isLoading: false });
      console.log('Content store initialized successfully');
    } catch (error) {
      console.error('Failed to initialize content store:', error);
      set({ error: 'Failed to initialize content store', isLoading: false });
      // Still mark as ready to prevent app from hanging
      set({ isAppReady: true });
    }
  }
}));