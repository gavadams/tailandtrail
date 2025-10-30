/**
 * Main player game component that orchestrates the gaming experience
 * Handles session management, puzzle progression, and game completion
 */

import React, { useEffect, useState } from 'react';
import { Header } from '../Layout/Header';
import { ProgressIndicator } from './ProgressIndicator';
import { PuzzleDisplay } from './PuzzleDisplay';
import { SplashScreen } from './SplashScreen';
import { Notepad } from './Notepad';
import { NotepadToggle } from './NotepadToggle';
import { useGameStore } from '../../stores/gameStore';
import { supabase } from '../../lib/supabase';
import { SplashScreen as SplashScreenType } from '../../types';

export const PlayerGame: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [checkingDisclaimer, setCheckingDisclaimer] = useState(true);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentSplash, setCurrentSplash] = useState<SplashScreenType | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [splashScreens, setSplashScreens] = useState<SplashScreenType[]>([]);
  const [splashQueue, setSplashQueue] = useState<SplashScreenType[]>([]);
  const [testModeViewedSplashes, setTestModeViewedSplashes] = useState<string[]>([]);
  const {
    currentSession,
    currentGame,
    puzzles,
    currentPuzzle,
    accessCode,
    isTestMode,
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

  // Check disclaimer acceptance when session/access code available
  useEffect(() => {
    const checkAcceptance = async () => {
      if (!accessCode || !currentGame) {
        setCheckingDisclaimer(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('disclaimer_acceptances')
          .select('id')
          .eq('access_code_id', accessCode.id)
          .maybeSingle();
        if (error) throw error;
        setHasAcceptedDisclaimer(!!data);
      } catch (e) {
        console.warn('Failed to check disclaimer acceptance', e);
      } finally {
        setCheckingDisclaimer(false);
      }
    };
    checkAcceptance();
  }, [accessCode, currentGame]);

  const handleAgreeDisclaimer = async () => {
    if (!accessCode || !currentGame) return;
    setIsAccepting(true);
    try {
      // Use existing edge function to fetch purchaser email and id (bypasses RLS)
      let purchaserEmail: string | null = null;
      let purchaseId: string | null = null;
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('get-purchase-email', {
          body: { access_code_id: accessCode.id }
        });
        if (!emailError && emailData) {
          purchaserEmail = emailData.email || null;
          purchaseId = emailData.purchase_id || null;
        }
      } catch {}

      await supabase
        .from('disclaimer_acceptances')
        .insert({
          access_code_id: accessCode.id,
          purchase_id: purchaseId,
          game_id: currentGame.id,
          email: purchaserEmail || currentSession?.player_email || '',
          agreed: true,
          disclaimer_version: 'v1',
          ip_address: null,
          user_agent: navigator.userAgent
        } as any);

      // Retry to attach purchase_id shortly after if it was unavailable on first attempt
      if (!purchaseId) {
        setTimeout(async () => {
          try {
            const { data: retryData, error: retryErr } = await supabase.functions.invoke('get-purchase-email', {
              body: { access_code_id: accessCode.id }
            });
            const retryPurchaseId = retryErr ? null : retryData?.purchase_id;
            if (retryPurchaseId) {
              await supabase
                .from('disclaimer_acceptances')
                .update({ purchase_id: retryPurchaseId })
                .eq('access_code_id', accessCode.id);
            }
          } catch {}
        }, 2000);
      }

      setHasAcceptedDisclaimer(true);
    } catch (e) {
      console.error('Failed to record disclaimer acceptance', e);
      setError('Failed to record disclaimer acceptance. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

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
    // Handle test mode
    if (isTestMode && puzzles.length > 0) {
      // In test mode, check for splash screens first (just like real players)
      // Only check if we're not already showing a splash screen
      if (!showSplash) {
        checkForPendingSplashScreens();
      }
      
      // Only set puzzle if no splash screens are pending
      if (!showSplash && !currentPuzzle) {
        setCurrentPuzzle(puzzles[0]);
      }
      setIsLoading(false);
      return;
    }

    // Handle normal player mode
    if (currentSession && puzzles.length > 0) {
      // First check for pending splash screens before setting puzzle
      // Only check if we're not already showing a splash screen
      if (!showSplash) {
        checkForPendingSplashScreens();
      }
      
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
        
        // If all puzzles are completed, check for final splash screens first
        if (!puzzleToShow && currentSession.completed_puzzles.length === puzzles.length && puzzles.length > 0) {
          // Check for final splash screens before showing completion screen
          const finalSplashes = splashScreens
            .filter(s => s.puzzle_id === 'END')
            .sort((a, b) => a.sequence_order - b.sequence_order);
          
          const viewedSplashes = currentSession.session_data?.viewedSplashes || [];
          const unviewedFinalSplashes = finalSplashes.filter(s => !viewedSplashes.includes(s.id));
          
          if (unviewedFinalSplashes.length > 0) {
            // Show final splash screens first
            setSplashQueue(unviewedFinalSplashes);
            setCurrentSplash(unviewedFinalSplashes[0]);
            setShowSplash(true);
          } else {
            // No final splash screens, show completion screen
          puzzleToShow = puzzles[puzzles.length - 1];
          }
        }
        
        setCurrentPuzzle(puzzleToShow || null);
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
    } else if (!currentSession && !isTestMode && !isLoading) {
      setTimeout(() => {
        if (!currentSession && !isTestMode) {
          setError('No active game session found.');
          setIsLoading(false);
        }
      }, 1000); // Give time for session to load
    }
  }, [currentSession, puzzles, splashScreens, setCurrentPuzzle, setError, isTestMode, currentPuzzle, showSplash]);

  const checkForPendingSplashScreens = () => {
    if ((!currentSession && !isTestMode) || splashScreens.length === 0) {
      return;
    }

    const viewedSplashes = isTestMode ? [] : (currentSession?.session_data?.viewedSplashes || []);
    let pendingSplashes: SplashScreenType[] = [];
    
    if (isTestMode) {
      // In test mode, show splash screens that haven't been viewed yet
      // First, check for intro splash screens (no puzzle_id)
      const introSplashes = splashScreens
        .filter(s => !s.puzzle_id)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      const unviewedIntroSplashes = introSplashes.filter(s => !testModeViewedSplashes.includes(s.id));
      
      if (unviewedIntroSplashes.length > 0) {
        pendingSplashes = unviewedIntroSplashes;
      } else {
        // If all intro splashes are viewed, check for puzzle-specific splashes for the first puzzle
        const firstPuzzle = puzzles[0];
        if (firstPuzzle) {
          const puzzleSplashes = splashScreens
            .filter(s => s.puzzle_id === firstPuzzle.id)
            .sort((a, b) => a.sequence_order - b.sequence_order);
          
          const unviewedPuzzleSplashes = puzzleSplashes.filter(s => !testModeViewedSplashes.includes(s.id));
          
          if (unviewedPuzzleSplashes.length > 0) {
            pendingSplashes = unviewedPuzzleSplashes;
          }
        }
        
        // If no puzzle-specific splashes, check for final splash screens
        if (pendingSplashes.length === 0) {
          const finalSplashes = splashScreens
            .filter(s => s.puzzle_id === 'END')
            .sort((a, b) => a.sequence_order - b.sequence_order);
          
          const unviewedFinalSplashes = finalSplashes.filter(s => !testModeViewedSplashes.includes(s.id));
          
          if (unviewedFinalSplashes.length > 0) {
            pendingSplashes = unviewedFinalSplashes;
          }
        }
      }
    } else {
      // Normal player mode - only show unviewed splash screens
      // First, check for intro splash screens (no puzzle_id)
      const introSplashes = splashScreens
        .filter(s => !s.puzzle_id)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      const unviewedIntroSplashes = introSplashes.filter(s => !viewedSplashes.includes(s.id));
      
      if (unviewedIntroSplashes.length > 0) {
        pendingSplashes = unviewedIntroSplashes;
      } else {
        // If all intro splashes are viewed, check for puzzle-specific splashes
        const nextPuzzle = puzzles.find(p => !currentSession?.completed_puzzles.includes(p.id));
        
        if (nextPuzzle) {
          const puzzleSplashes = splashScreens
            .filter(s => s.puzzle_id === nextPuzzle.id)
            .sort((a, b) => a.sequence_order - b.sequence_order);
          
          const unviewedPuzzleSplashes = puzzleSplashes.filter(s => !viewedSplashes.includes(s.id));
          
          if (unviewedPuzzleSplashes.length > 0) {
            pendingSplashes = unviewedPuzzleSplashes;
          }
        } else {
          // All puzzles completed - check for final splash screens (puzzle_id = 'END')
          const finalSplashes = splashScreens
            .filter(s => s.puzzle_id === 'END')
            .sort((a, b) => a.sequence_order - b.sequence_order);
          
          const unviewedFinalSplashes = finalSplashes.filter(s => !viewedSplashes.includes(s.id));
          
          if (unviewedFinalSplashes.length > 0) {
            pendingSplashes = unviewedFinalSplashes;
          }
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
    if (currentSplash) {
      if (isTestMode) {
        // In test mode, track viewed splash screens locally
        setTestModeViewedSplashes(prev => [...prev, currentSplash.id]);
      } else if (currentSession) {
        // Mark splash as viewed in normal mode
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
      
      // Check if we were showing final splash screens and all puzzles are completed
      if (currentSession && currentSession.completed_puzzles.length === puzzles.length && puzzles.length > 0) {
        // Show completion screen (last puzzle)
        setCurrentPuzzle(puzzles[puzzles.length - 1]);
      } else if (isTestMode && !currentPuzzle && puzzles.length > 0) {
      // In test mode, make sure we have a puzzle to show
        setCurrentPuzzle(puzzles[0]);
      }
    }
  };

  // Function to handle moving to next puzzle in test mode
  const handleNextPuzzle = (completedPuzzleId: string) => {
    if (!isTestMode) return;
    
    const currentIndex = puzzles.findIndex(p => p.id === completedPuzzleId);
    const nextPuzzle = puzzles[currentIndex + 1];
    
    if (nextPuzzle) {
      // Check for splash screens before the next puzzle
      const puzzleSplashes = splashScreens
        .filter(s => s.puzzle_id === nextPuzzle.id)
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      const unviewedPuzzleSplashes = puzzleSplashes.filter(s => !testModeViewedSplashes.includes(s.id));
      
      if (unviewedPuzzleSplashes.length > 0) {
        // Show splash screens first
        setSplashQueue(unviewedPuzzleSplashes);
        setCurrentSplash(unviewedPuzzleSplashes[0]);
        setShowSplash(true);
      } else {
        // No splash screens, go directly to next puzzle
        setCurrentPuzzle(nextPuzzle);
      }
    } else {
      // No more puzzles - check for final splash screens before completion
      const finalSplashes = splashScreens
        .filter(s => s.puzzle_id === 'END')
        .sort((a, b) => a.sequence_order - b.sequence_order);
      
      const unviewedFinalSplashes = finalSplashes.filter(s => !testModeViewedSplashes.includes(s.id));
      
      if (unviewedFinalSplashes.length > 0) {
        // Show final splash screens first
        setSplashQueue(unviewedFinalSplashes);
        setCurrentSplash(unviewedFinalSplashes[0]);
        setShowSplash(true);
      } else {
        // No final splash screens, game completed
      setCurrentPuzzle(null);
      }
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

  if (isLoading || checkingDisclaimer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-200 mx-auto mb-4"></div>
          <p className="text-yellow-200 text-lg">Loading your adventure...</p>
        </div>
      </div>
    );
  }

  // Show splash screen if active and disclaimer accepted (or in test mode)
  if (showSplash && currentSplash && (hasAcceptedDisclaimer || isTestMode)) {
    const isLastInSequence = splashQueue.length <= 1;
    return <SplashScreen splashScreen={currentSplash} onContinue={handleSplashContinue} isLastInSequence={isLastInSequence} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header onLogout={handleLogout} hideBranding={true} />
      <ProgressIndicator />
      
      {/* Disclaimer gate */}
      {!hasAcceptedDisclaimer && !isTestMode && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-white max-w-2xl w-full rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] border">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">⚠️ Tale & Trail Disclaimer</h2>
            <p className="text-gray-700 mb-4">Please read before starting your adventure</p>
            <div className="prose max-w-none text-gray-800 text-sm">
              <p>By taking part in this Tale & Trail game, you agree to the following terms and conditions:</p>
              <h3>Independent Experience</h3>
              <p>Tale & Trail is an independent entertainment experience. We are not affiliated with, endorsed by, or sponsored by any of the venues, pubs, or establishments featured in the game.</p>
              <h3>Venue Access</h3>
              <p>Entry to venues is at the sole discretion of each establishment. If you are denied entry, cannot gain access, or a venue is closed, simply move on to a nearby or alternative location and continue your adventure from there. The game is designed to be flexible and fun wherever you play.</p>
              <h3>Player Responsibility</h3>
              <p>Participants are entirely responsible for their own actions, behaviour, and safety while taking part in the game. Please drink responsibly, respect staff and patrons, and follow all local laws and venue policies.</p>
              <h3>Health & Safety</h3>
              <p>Take care when navigating between venues — be aware of your surroundings, traffic, and weather conditions. Participation is at your own risk.</p>
              <h3>Content & Gameplay</h3>
              <p>Clues, storylines, and puzzles are provided for entertainment purposes only. Any resemblance to real persons, businesses, or events is purely coincidental.</p>
              <h3>Liability</h3>
              <p>Tale & Trail and its creators accept no responsibility or liability for injury, loss, damage, or inconvenience arising from participation in the game.</p>
              <p><strong>By proceeding, you confirm you understand and agree to these terms.</strong></p>
              <p>Now grab your first clue and begin your adventure  - the mystery awaits!</p>
            </div>
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={handleAgreeDisclaimer}
                disabled={isAccepting}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold px-5 py-2 rounded-lg"
              >
                {isAccepting ? 'Please wait…' : 'I Agree, Start Game'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          hasAcceptedDisclaimer || isTestMode ? (
            <PuzzleDisplay onPuzzleComplete={isTestMode ? handleNextPuzzle : undefined} />
          ) : (
            <div className="max-w-3xl mx-auto p-6 text-center text-yellow-200">Please accept the disclaimer to begin.</div>
          )
        )}
      </div>
      
      {/* Session Info Footer */}
      <div className="fixed bottom-4 left-4 bg-gray-800 text-yellow-200 px-4 py-2 rounded-lg shadow-lg text-sm border border-yellow-600">
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
      
      {/* Notepad Components - Only show during puzzles, not splash screens */}
      {currentPuzzle && !showSplash && (
        <>
          <NotepadToggle />
          <Notepad puzzleId={currentPuzzle.id} />
        </>
      )}
    </div>
  );
};