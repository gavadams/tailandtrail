/**
 * Main header component with pub theme styling
 * Displays the app title and navigation elements
 */

import React from 'react';
import { Beer, Crown, LogOut } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';
import { useContentStore } from '../../stores/contentStore';

interface HeaderProps {
  showAdminControls?: boolean;
  onLogout?: () => void;
  hideBranding?: boolean; // Hide beer icon and site name for player game mode
}

export const Header: React.FC<HeaderProps> = ({ showAdminControls, onLogout, hideBranding = false }) => {
  const { currentGame, currentSession } = useGameStore();
  const { getSetting } = useContentStore();

  return (
    <header className="bg-gradient-to-r from-gray-900 via-black to-gray-900 shadow-xl border-b-4 border-yellow-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            {!hideBranding && (
              <div className="bg-yellow-100 p-2 rounded-full shadow-lg">
                <Beer className="h-8 w-8 text-gray-900" />
              </div>
            )}
            <div>
              {!hideBranding && (
                <h1 className="text-2xl md:text-3xl font-bold text-yellow-200 tracking-wide">
                  {getSetting('site_name')}
                </h1>
              )}
              {currentGame && (
                <p className="text-yellow-300 text-sm font-medium">
                  {currentGame.title}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {showAdminControls && (
              <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                <Crown className="h-5 w-5 text-yellow-300" />
                <span className="text-yellow-200 font-medium">Admin</span>
              </div>
            )}
            
            {currentSession && (
              <div className="text-yellow-200 text-sm">
                Progress: {currentSession.completed_puzzles.length} puzzles
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};