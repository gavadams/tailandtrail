/**
 * Main player game component that orchestrates the gaming experience
 * Handles session management, puzzle progression, and game completion
 */

import React, { useEffect, useState } from 'react';
import { Header } from '../Layout/Header';
import { ProgressIndicator } from './ProgressIndicator';
import { PuzzleDisplay } from './PuzzleDisplay';
import { SplashScreen } from './SplashScreen';
import { useGameStore } from '../../stores/gameStore';
import { supabase } from '../../lib/supabase';
import { SplashScreen as SplashScreenType } from '../../types';

export const PlayerGame: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSplash, setCurrentSplash] = useState<SplashScreenType | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [splashScreens, setSplashScreens] = useState<SplashScreenType[]>([]);
  const [splashQueue, setSplashQueue] = useState<SplashScreenType[]>([]);
  const {
    currentSession,
    currentGame,
    puzzles,
    currentPuzzle,
    accessCode,
    setCurrentPuzzle,
    clearSession,
    setError,
    setSession
  } = useGameStore();

  useEffect(() => {
    // Load splash screens for the game
    if (currentGame) {
      loadSplashScreens();
    }
  }, [currentGame]);

  const loadSplashScreens = async () => {
    if (!currentGame) return;
    
    try {
      const { data, error } = await supabase
        .from('splash_screens')
        .select('*')
        .eq('game_id', currentGame.id)
        .order('sequence_order');

      if (error) throw error;
      setSplashScreens(data || []);
    } catch (error) {
      console.error('Failed to load splash screens:', error);
    }
  };

  useEffect(() => {
    if (currentSession && puzzles.length > 0) {
      // First check for pending splash screens before setting puzzle
      checkForPendingSplashScreens();
      
      // Only set puzzle if no splash screens are pending
      if (!showSplash) {
        // Find the current puzzle to display
        let puzzleToShow = null;
        
        if (currentSession.current_puzzle_id) {
          puzzleToShow = puzzles.find(p => p.id === currentSession.current_puzzle_id);
        }
        
        // If no current puzzle or it's completed, find the next uncompleted puzzle
        if (!puzzleToShow || currentSession.completed_puzzles.includes(puzzleToShow.id)) {
          puzzleToShow = puzzles.find(p => !currentSession.completed_puzzles.includes(p.id));
        }
        
        // If all puzzles are completed, keep the last puzzle for completion screen
        if (!puzzleToShow && currentSession.completed_puzzles.length === puzzles.length && puzzles.length > 0) {
          puzzleToShow = puzzles[puzzles.length - 1];
        }
        
        setCurrentPuzzle(puzzleToShow);
      }
      
      setIsLoading(false);
    } else if (currentSession && puzzles.length === 0 && !isLoading) {
      // Only show error if we're not still loading and have a session but no puzzles
      setTimeout(() => {
        if (puzzles.length === 0) {
          setError('No puzzles found for this game.');
          setIsLoading(false);
        }
      }, 1000); // Give time for puzzles to load
    } else if (!currentSession && !isLoading) {
      setTimeout(() => {
        if (!currentSession) {
          setError('No active game session found.');
          setIsLoading(false);
        }
      }, 1000); // Give time for session to load
    }
  }, [currentSession, puzzles, splashScreens, showSplash, setCurrentPuzzle, setError]);

  const checkForPendingSplashScreens = () => {
    if (!currentSession || splashScreens.length === 0) {
      return;
    }

    const viewedSplashes = currentSession.session_data?.viewedSplashes || [];
    let pendingSplashes: SplashScreenType[] = [];
    
    // First, check for intro splash screens (no puzzle_id)
    const introSplashes = splashScreens
      .filter(s => !s.puzzle_id)
      .sort((a, b) => a.sequence_order - b.sequence_order);
    
    const unviewedIntroSplashes = introSplashes.filter(s => !viewedSplashes.includes(s.id));
    
    if (unviewedIntroSplashes.length > 0) {
      pendingSplashes = unviewedIntroSplashes;
    } else {
      // If all intro splashes are viewed, check for puzzle-specific splashes
      const nextPuzzle = puzzles.find(p => !currentSession.completed_puzzles.includes(p.id));
      
      if (nextPuzzle) {
        const puzzleSplashes = splashScreens
          .filter(s => s.puzzle_id === nextPuzzle.id)
          .sort((a, b) => a.sequence_order - b.sequence_order);
        
        const unviewedPuzzleSplashes = puzzleSplashes.filter(s => !viewedSplashes.includes(s.id));
        
        if (unviewedPuzzleSplashes.length > 0) {
          pendingSplashes = unviewedPuzzleSplashes;
        }
      }
    }

    // Show pending splash screens if any exist
    if (pendingSplashes.length > 0) {
      setSplashQueue(pendingSplashes);
      setCurrentSplash(pendingSplashes[0]);
      setShowSplash(true);
    }
  };


  const handleSplashContinue = async () => {
    if (currentSplash && currentSession) {
      // Mark splash as viewed
      const viewedSplashes = currentSession.session_data?.viewedSplashes || [];
      const updatedSessionData = {
        ...currentSession.session_data,
        viewedSplashes: [...viewedSplashes, currentSplash.id]
      };

      await supabase
        .from('player_sessions')
        .update({ session_data: updatedSessionData })
        .eq('id', currentSession.id);
      
      // Update local session data
      setSession({
        ...currentSession,
        session_data: updatedSessionData
      });
    }

    // Check if there are more splash screens in the queue
    const remainingQueue = splashQueue.slice(1);
    
    if (remainingQueue.length > 0) {
      // Show next splash screen
      setSplashQueue(remainingQueue);
      setCurrentSplash(remainingQueue[0]);
    } else {
      // No more splash screens, continue to game
      setShowSplash(false);
      setCurrentSplash(null);
      setSplashQueue([]);
    }
  };

  useEffect(() => {
    // Check if access code is expired
    if (accessCode && accessCode.activated_at && accessCode.code !== 'TEST2025') {
      const activatedTime = new Date(accessCode.activated_at);
      const expiryTime = new Date(activatedTime.getTime() + 12 * 60 * 60 * 1000);
      const now = new Date();
      
      if (now > expiryTime) {
        setError('Your access code has expired. Each code is valid for 12 hours from first use.');
        setTimeout(() => {
          clearSession();
        }, 3000);
        return;
      }
      
      // Set up a timer to check expiration
      const timeUntilExpiry = expiryTime.getTime() - now.getTime();
      const timer = setTimeout(() => {
        setError('Your access code has expired.');
        clearSession();
      }, timeUntilExpiry);
      
      return () => clearTimeout(timer);
    }
  }, [accessCode, setError, clearSession]);

  const handleLogout = () => {
    // Scroll to top before clearing session
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearSession();
  };

  const handleTestReset = async () => {
    if (!currentSession || !accessCode || accessCode.code !== 'TEST2025') return;

    try {
      // Reset the session for test code
      const { error: updateError } = await supabase
        .from('player_sessions')
        .update({
          current_puzzle_id: puzzles[0]?.id || null,
          completed_puzzles: [],
          session_data: { viewedSplashes: [] },
          last_activity: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (updateError) {
        setError('Failed to reset game');
        return;
      }

      // Update local state
      setSession({
        ...currentSession,
        current_puzzle_id: puzzles[0]?.id || null,
        completed_puzzles: [],
        session_data: { viewedSplashes: [] }
      });

      setCurrentPuzzle(puzzles[0] || null);
      
      // Reset splash screen state
      setShowSplash(false);
      setCurrentSplash(null);
      setSplashQueue([]);
      
      // Scroll to top after reset
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Trigger splash screen check after reset
      setTimeout(() => {
        checkForPendingSplashScreens();
      }, 100);
      
    } catch (error) {
      console.error('Failed to reset test game:', error);
      setError('Failed to reset game');
    }
  };

  const isGameCompleted = currentSession ? 
    currentSession.completed_puzzles.length === puzzles.length && puzzles.length > 0 : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-200 mx-auto mb-4"></div>
          <p className="text-yellow-200 text-lg">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  // Show splash screen if active
  if (showSplash && currentSplash) {
    const isLastInSequence = splashQueue.length <= 1;
    return <SplashScreen splashScreen={currentSplash} onContinue={handleSplashContinue} isLastInSequence={isLastInSequence} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header onLogout={handleLogout} />
      <ProgressIndicator />
      
      <div className="py-8">
        {isGameCompleted ? (
          // Game Completion Screen
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-12 text-center shadow-2xl">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-4xl font-bold text-green-100 mb-4">
                Congratulations!
              </h2>
              <p className="text-xl text-green-200 mb-6">
                You've successfully completed "{currentGame?.title}"!
              </p>
              <div className="bg-green-800 rounded-lg p-6 mb-6">
                <h3 className="text-2xl font-bold text-green-100 mb-2">
                  Game Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-green-200">
                  <div>
                    <p className="text-3xl font-bold">{puzzles.length}</p>
                    <p className="text-sm">Puzzles Solved</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">
                      {Math.round((Date.now() - new Date(currentSession!.created_at).getTime()) / (1000 * 60))}
                    </p>
                    <p className="text-sm">Minutes Played</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">100%</p>
                    <p className="text-sm">Completion Rate</p>
                  </div>
                </div>
              </div>
              <p className="text-green-200 mb-6">
                Thank you for playing! We hope you enjoyed your puzzle adventure.
              </p>
              <button
                onClick={handleLogout}
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
              >
                Finish Game
              </button>
              
              {/* Test Code Reset Button */}
              {accessCode?.code === 'TEST2025' && (
                <button
                  onClick={handleTestReset}
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg ml-4"
                >
                  Play Again (Test Mode)
                </button>
              )}
            </div>
          </div>
        ) : (
          // Active Game Display
          <PuzzleDisplay />
        )}
      </div>
      
      {/* Session Info Footer */}
      <div className="fixed bottom-4 right-4 bg-gray-800 text-yellow-200 px-4 py-2 rounded-lg shadow-lg text-sm border border-yellow-600">
        {accessCode?.code === 'TEST2025' ? (
          <span className="text-green-400 font-bold">🧪 TEST MODE - Never Expires</span>
        ) : accessCode && accessCode.activated_at && (
          <>
            Time remaining: {(() => {
              const activatedTime = new Date(accessCode.activated_at);
              const expiryTime = new Date(activatedTime.getTime() + 12 * 60 * 60 * 1000);
              const now = new Date();
              const remainingMs = expiryTime.getTime() - now.getTime();
              const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
              const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
              return `${remainingHours}h ${remainingMinutes}m`;
            })()}
          </>
        )}
      </div>
    </div>
  );
};