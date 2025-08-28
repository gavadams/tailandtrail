/**
 * Main navigation component with dynamic menu items
 * Supports both public and admin navigation
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Beer, Menu, X, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useContentStore } from '../../stores/contentStore';
import { ContentPage } from '../../types';

interface NavigationProps {
  isAdmin?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ isAdmin = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const { pages, getSetting, refreshSettings } = useContentStore();
  const [dynamicPages, setDynamicPages] = useState<ContentPage[]>([]);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    // Refresh settings when component mounts
    refreshSettings();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Load pages that should show in navigation
    const loadNavPages = async () => {
      try {
        const { data } = await supabase
          .from('content_pages')
          .select('*')
          .eq('is_published', true)
          .eq('show_in_nav', true)
          .order('nav_order');
        
        setDynamicPages(data || []);
      } catch (error) {
        console.error('Failed to load navigation pages:', error);
      }
    };

    loadNavPages();
  }, []);
  const publicNavItems = [
    { path: '/', label: 'Home' },
    { path: '/purchase', label: 'Purchase' },
    { path: '/play', label: 'Play Game' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/contact', label: 'Contact' },
  ];

  // Combine static nav items with dynamic pages
  const dynamicNavItems = dynamicPages.map(page => ({
    path: `/${page.slug}`,
    label: page.title
  }));

  const navItems = [...publicNavItems, ...dynamicNavItems];
  const siteName = getSetting('site_name');

  // Debug: Log current settings
  console.log('Current site name from store:', siteName);
  console.log('All settings:', useContentStore.getState().settings);
  return (
    <nav className="bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-xl border-b-4 border-yellow-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-2 rounded-full shadow-lg">
              <Beer className="h-8 w-8 text-gray-900" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-yellow-200 tracking-wide">
                {siteName}
              </h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-yellow-200 hover:text-yellow-100 font-medium transition-colors px-3 py-2 rounded-lg ${
                  location.pathname === item.path ? 'bg-green-700' : 'hover:bg-gray-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            <Link
              to="/purchase"
              className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-yellow-100 font-bold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Buy Now
            </Link>

            {isAuthenticated && (
              <Link
                to="/admin"
                className="text-yellow-300 hover:text-yellow-100 font-medium"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-yellow-200 hover:text-yellow-100 p-2"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-yellow-600">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block text-yellow-200 hover:text-yellow-100 font-medium px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path ? 'bg-green-700' : 'hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              <Link
                to="/purchase"
                onClick={() => setIsMenuOpen(false)}
                className="block bg-gradient-to-r from-green-700 to-green-800 text-yellow-100 font-bold px-4 py-2 rounded-lg mx-4 mt-4 text-center"
              >
                Buy Now
              </Link>

              {isAuthenticated && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-yellow-300 hover:text-yellow-100 font-medium px-4 py-2"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};