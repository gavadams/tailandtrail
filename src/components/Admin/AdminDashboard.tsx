/**
 * Main admin dashboard component with navigation and content management
 * Central hub for all administrative functions
 */

import React, { useState, useEffect } from 'react';
import { Users, GamepadIcon, Puzzle, Key, BarChart3, TrendingUp, MapPin, ExternalLink, Menu, X, Shield, User } from 'lucide-react';
import { Header } from '../Layout/Header';
import { GameManagement } from './GameManagement';
import { PuzzleManagement } from './PuzzleManagement';
import { AccessCodeManagement } from './AccessCodeManagement';
import { ContentManagement } from './ContentManagement';
import { SplashScreenManagement } from './SplashScreenManagement';
import { PurchaseManagement } from './PurchaseManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { LocationManagement } from './LocationManagement';
import UserManagement from './UserManagement';
import UserProfile from './UserProfile';
import { supabase, signOut } from '../../lib/supabase';
import { getUserPrivileges } from '../../utils/permissions';
import type { AdminUser } from '../../types';

type AdminView = 'overview' | 'games' | 'puzzles' | 'codes' | 'content' | 'splash' | 'purchases' | 'analytics' | 'locations' | 'users' | 'profile';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface DashboardStats {
  totalGames: number;
  totalPuzzles: number;
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState<AdminView>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalGames: 0,
    totalPuzzles: 0,
    totalCodes: 0,
    activeCodes: 0,
    usedCodes: 0
  });

  useEffect(() => {
    loadCurrentUser();
    loadDashboardStats();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.warn('No authenticated user');
        return;
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email, role, is_active, activity_tracking_enabled, password_changed, last_login, created_at, updated_at, created_by')
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

  const loadDashboardStats = async () => {
    try {
      // Get game count
      const { count: gameCount } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true });

      // Get puzzle count
      const { count: puzzleCount } = await supabase
        .from('puzzles')
        .select('*', { count: 'exact', head: true });

      // Get code stats
      const { count: totalCodeCount } = await supabase
        .from('access_codes')
        .select('*', { count: 'exact', head: true });

      const { count: activeCodeCount } = await supabase
        .from('access_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: usedCodeCount } = await supabase
        .from('access_codes')
        .select('*', { count: 'exact', head: true })
        .not('activated_at', 'is', null);

      setStats({
        totalGames: gameCount || 0,
        totalPuzzles: puzzleCount || 0,
        totalCodes: totalCodeCount || 0,
        activeCodes: activeCodeCount || 0,
        usedCodes: usedCodeCount || 0
      });
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const getNavigationItems = () => {
    if (!currentUser) return [];
    
    const privileges = getUserPrivileges(currentUser.role);
    const allItems = [
      { id: 'overview' as AdminView, label: 'Overview', icon: BarChart3, permission: null },
      { id: 'games' as AdminView, label: 'Games', icon: GamepadIcon, permission: 'can_manage_games' },
      { id: 'puzzles' as AdminView, label: 'Puzzles', icon: Puzzle, permission: 'can_manage_puzzles' },
      { id: 'splash' as AdminView, label: 'Splash Screens', icon: Users, permission: 'can_manage_splash_screens' },
      { id: 'locations' as AdminView, label: 'Locations', icon: MapPin, permission: 'can_manage_content' },
      { id: 'codes' as AdminView, label: 'Access Codes', icon: Key, permission: 'can_manage_access_codes' },
      { id: 'purchases' as AdminView, label: 'Purchases', icon: Users, permission: null },
      { id: 'analytics' as AdminView, label: 'Analytics', icon: TrendingUp, permission: 'can_view_analytics' },
      { id: 'content' as AdminView, label: 'Content', icon: Users, permission: 'can_manage_content' },
      { id: 'users' as AdminView, label: 'User Management', icon: Shield, permission: 'can_manage_users' },
      { id: 'profile' as AdminView, label: 'My Profile', icon: User, permission: null }
    ];

    return allItems.filter(item => 
      item.permission === null || privileges[item.permission as keyof typeof privileges]
    );
  };

  const externalLinks = [
    { 
      label: 'Generator', 
      icon: ExternalLink, 
      url: 'https://taleandtrailgenerator.vercel.app/',
      description: 'Remote Generator'
    }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'games':
        return <GameManagement />;
      case 'puzzles':
        return <PuzzleManagement />;
      case 'codes':
        return <AccessCodeManagement />;
      case 'content':
        return <ContentManagement />;
      case 'splash':
        return <SplashScreenManagement />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'locations':
        return <LocationManagement />;
      case 'users':
        return <UserManagement />;
      case 'profile':
        return <UserProfile />;
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 sm:p-8 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to Admin Dashboard</h2>
              <p className="text-blue-100 text-base sm:text-lg">
                Manage your Tale and Trail games, puzzles, and access codes from here.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Games</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalGames}</p>
                  </div>
                  <GamepadIcon className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Puzzles</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalPuzzles}</p>
                  </div>
                  <Puzzle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Access Codes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalCodes}</p>
                    <p className="text-xs text-gray-500">{stats.activeCodes} active</p>
                  </div>
                  <Key className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Used Codes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.usedCodes}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalCodes > 0 ? Math.round((stats.usedCodes / stats.totalCodes) * 100) : 0}% usage
                    </p>
                  </div>
                  <Users className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCurrentView('games')}
                  className="p-4 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center"
                >
                  <GamepadIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium text-sm sm:text-base">Create New Game</p>
                  <p className="text-xs sm:text-sm text-gray-500">Start building a new puzzle experience</p>
                </button>
                
                <button
                  onClick={() => setCurrentView('puzzles')}
                  className="p-4 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all text-center"
                >
                  <Puzzle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-sm sm:text-base">Add Puzzles</p>
                  <p className="text-xs sm:text-sm text-gray-500">Create challenges for your games</p>
                </button>
                
                <button
                  onClick={() => setCurrentView('codes')}
                  className="p-4 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all text-center"
                >
                  <Key className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium text-sm sm:text-base">Generate Codes</p>
                  <p className="text-xs sm:text-sm text-gray-500">Create access codes for players</p>
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-yellow-800 mb-2">Getting Started Tips</h3>
              <ul className="space-y-2 text-sm sm:text-base text-yellow-700">
                <li>• Create a game first, then add puzzles to it in the desired sequence</li>
                <li>• Use progressive clues to help players when they get stuck</li>
                <li>• Generate access codes after your game is ready for players</li>
                <li>• Each access code is valid for 12 hours from first use</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showAdminControls onLogout={handleLogout} hideBranding={true} adminUser={currentUser} />
      
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-lg border border-gray-200"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Sidebar */}
        <div className={`w-full lg:w-64 bg-white shadow-lg lg:min-h-screen transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:relative z-40 lg:z-auto`}>
          <nav className="p-4 pt-16 lg:pt-4">
            <div className="space-y-2">
              {getNavigationItems().map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              {/* External Links */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-4">
                  External Tools
                </p>
                {externalLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-x-auto">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};