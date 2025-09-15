/**
 * Game state management using Zustand
 * This store manages the current game session, player progress, and puzzle states
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game, Puzzle, PlayerSession, AccessCode } from '../types';

interface GameState {
  // Current session data
  currentSession: PlayerSession | null;
  currentGame: Game | null;
  currentPuzzle: Puzzle | null;
  puzzles: Puzzle[];
  splashScreens: any[];
  accessCode: AccessCode | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  revealedClues: number;
  isTestMode: boolean;
  
  // Actions
  setSession: (session: PlayerSession) => void;
  setGame: (game: Game) => void;
  setPuzzles: (puzzles: Puzzle[]) => void;
  setSplashScreens: (splashScreens: any[]) => void;
  setCurrentPuzzle: (puzzle: Puzzle | null) => void;
  setAccessCode: (code: AccessCode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTestMode: (isTestMode: boolean) => void;
  revealNextClue: () => void;
  resetClues: () => void;
  markPuzzleComplete: (puzzleId: string) => void;
  clearSession: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      currentGame: null,
      currentPuzzle: null,
      puzzles: [],
      splashScreens: [],
      accessCode: null,
      isLoading: false,
      error: null,
      revealedClues: 0,
      isTestMode: false,

      setSession: (session) => set({ currentSession: session }),
      setGame: (game) => set({ currentGame: game }),
      setPuzzles: (puzzles) => set({ puzzles }),
      setSplashScreens: (splashScreens) => set({ splashScreens }),
      setCurrentPuzzle: (puzzle) => set({ currentPuzzle: puzzle, revealedClues: 0 }),
      setAccessCode: (code) => set({ accessCode: code }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setTestMode: (isTestMode) => set({ isTestMode }),
      
      revealNextClue: () => {
        const { currentPuzzle, revealedClues } = get();
        if (currentPuzzle && revealedClues < currentPuzzle.clues.length) {
          set({ revealedClues: revealedClues + 1 });
        }
      },
      
      resetClues: () => set({ revealedClues: 0 }),
      
      markPuzzleComplete: (puzzleId) => {
        const { currentSession } = get();
        if (currentSession) {
          const updatedCompletedPuzzles = [...currentSession.completed_puzzles, puzzleId];
          set({
            currentSession: {
              ...currentSession,
              completed_puzzles: updatedCompletedPuzzles
            }
          });
        }
      },
      
      clearSession: () => set({
        currentSession: null,
        currentGame: null,
        currentPuzzle: null,
        puzzles: [],
        splashScreens: [],
        accessCode: null,
        revealedClues: 0,
        error: null,
        isTestMode: false
      })
    }),
    {
      name: 'pub-puzzle-session',
      partialize: (state) => ({
        currentSession: state.currentSession,
        currentGame: state.currentGame,
        puzzles: state.puzzles,
        accessCode: state.accessCode,
        revealedClues: state.revealedClues
      })
    }
  )
);