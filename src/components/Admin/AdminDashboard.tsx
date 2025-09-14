/**
 * Main admin dashboard component with navigation and content management
 * Central hub for all administrative functions
 */

import React, { useState, useEffect } from 'react';
import { Users, GamepadIcon, Puzzle, Key, BarChart3, TrendingUp } from 'lucide-react';
import { Header } from '../Layout/Header';
import { GameManagement } from './GameManagement';
import { PuzzleManagement } from './PuzzleManagement';
import { AccessCodeManagement } from './AccessCodeManagement';
import { ContentManagement } from './ContentManagement';
import { SplashScreenManagement } from './SplashScreenManagement';
import { PurchaseManagement } from './PurchaseManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { supabase, signOut } from '../../lib/supabase';

type AdminView = 'overview' | 'games' | 'puzzles' | 'codes' | 'content' | 'splash' | 'purchases' | 'analytics';

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
  const [stats, setStats] = useState<DashboardStats>({
    totalGames: 0,
    totalPuzzles: 0,
    totalCodes: 0,
    activeCodes: 0,
    usedCodes: 0
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

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

  const navigationItems = [
    { id: 'overview' as AdminView, label: 'Overview', icon: BarChart3 },
    { id: 'games' as AdminView, label: 'Games', icon: GamepadIcon },
    { id: 'puzzles' as AdminView, label: 'Puzzles', icon: Puzzle },
    { id: 'codes' as AdminView, label: 'Access Codes', icon: Key },
    { id: 'analytics' as AdminView, label: 'Analytics', icon: TrendingUp },
    { id: 'content' as AdminView, label: 'Content', icon: Users },
    { id: 'splash' as AdminView, label: 'Splash Screens', icon: Users },
    { id: 'purchases' as AdminView, label: 'Purchases', icon: Users }
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
      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-2">Welcome to Admin Dashboard</h2>
              <p className="text-blue-100 text-lg">
                Manage your Tale and Trail games, puzzles, and access codes from here.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Games</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalGames}</p>
                  </div>
                  <GamepadIcon className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Puzzles</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPuzzles}</p>
                  </div>
                  <Puzzle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Access Codes</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalCodes}</p>
                    <p className="text-xs text-gray-500">{stats.activeCodes} active</p>
                  </div>
                  <Key className="h-10 w-10 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Used Codes</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.usedCodes}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalCodes > 0 ? Math.round((stats.usedCodes / stats.totalCodes) * 100) : 0}% usage
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCurrentView('games')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <GamepadIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-medium">Create New Game</p>
                  <p className="text-sm text-gray-500">Start building a new puzzle experience</p>
                </button>
                
                <button
                  onClick={() => setCurrentView('puzzles')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
                >
                  <Puzzle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium">Add Puzzles</p>
                  <p className="text-sm text-gray-500">Create challenges for your games</p>
                </button>
                
                <button
                  onClick={() => setCurrentView('codes')}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all"
                >
                  <Key className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-medium">Generate Codes</p>
                  <p className="text-sm text-gray-500">Create access codes for players</p>
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6">
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Getting Started Tips</h3>
              <ul className="space-y-2 text-yellow-700">
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
      <Header showAdminControls onLogout={handleLogout} />
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
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
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};