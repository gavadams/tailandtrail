/**
 * Test Game component for admins to test games as players
 * Provides secure admin-only access to test any game
 */

import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../stores/gameStore';
import { PlayerGame } from '../Player/PlayerGame';

export const TestGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setGame, setPuzzles, setSplashScreens, setTestMode } = useGameStore();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin && gameId) {
      loadTestGameData();
    }
  }, [isAdmin, gameId]);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If user has a session, they're authenticated as admin
      // The route protection in App.tsx already ensures only admins can access this
      setIsAdmin(!!session);
      setIsLoading(false);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
      setIsLoading(false);
    }
  };

  const loadTestGameData = async () => {
    if (!gameId) return;

    try {
      setIsLoading(true);
      setError(null);
      // Load game data
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      if (gameError) throw gameError;
      if (!gameData) throw new Error('Game not found');

      // Load puzzles
      const { data: puzzlesData, error: puzzlesError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('game_id', gameId)
        .order('sequence_order');

      if (puzzlesError) throw puzzlesError;

      // Load splash screens
      const { data: splashData, error: splashError } = await supabase
        .from('splash_screens')
        .select('*')
        .eq('game_id', gameId)
        .order('sequence_order');
      if (splashError) throw splashError;

      // Set game data in store
      setGame(gameData);
      setPuzzles(puzzlesData || []);
      setSplashScreens(splashData || []);
      setTestMode(true); // Enable test mode

      setIsLoading(false);
    } catch (err) {
      console.error('Error loading test game:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test game');
      setIsLoading(false);
    }
  };

  const handleBackToAdmin = () => {
    // Clear test mode and redirect to admin
    setTestMode(false);
    window.location.href = '/admin';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-200 mx-auto mb-4"></div>
          <p className="text-yellow-200 text-lg">Loading test game...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return <Navigate to="/admin" replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Test Game Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleBackToAdmin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Test Mode Banner */}
      <div className="bg-yellow-600 text-black py-2 px-4 text-center font-medium">
        <div className="flex items-center justify-center space-x-2">
          <AlertTriangle className="h-4 w-4" />
          <span>TEST MODE - Admin Testing Game</span>
          <button
            onClick={handleBackToAdmin}
            className="ml-4 flex items-center space-x-1 bg-yellow-700 hover:bg-yellow-800 text-black px-3 py-1 rounded text-sm transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Admin</span>
          </button>
        </div>
      </div>

      {/* Game Content */}
      <PlayerGame />
    </div>
  );
};
