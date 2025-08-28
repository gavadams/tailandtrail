/**
 * Progress indicator component showing puzzle completion status
 * Visual representation of player's journey through the game
 */

import React from 'react';
import { CheckCircle, Circle, Lock } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';

export const ProgressIndicator: React.FC = () => {
  const { puzzles, currentPuzzle, currentSession } = useGameStore();

  if (!puzzles.length || !currentSession) return null;

  const currentIndex = currentPuzzle ? puzzles.findIndex(p => p.id === currentPuzzle.id) : 0;
  const completedPuzzles = currentSession.completed_puzzles;

  return (
    <div className="bg-gray-800 py-4 px-6 shadow-lg border-b border-yellow-600">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between text-yellow-200 mb-3">
          <h3 className="font-bold">Progress</h3>
          <span className="text-sm">
            {completedPuzzles.length} of {puzzles.length} completed
          </span>
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {puzzles.map((puzzle, index) => {
            const isCompleted = completedPuzzles.includes(puzzle.id);
            const isCurrent = currentPuzzle?.id === puzzle.id;
            const isAccessible = index <= currentIndex;
            
            return (
              <div key={puzzle.id} className="flex items-center flex-shrink-0">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-600 border-green-400 text-white'
                      : isCurrent
                      ? 'bg-yellow-600 border-yellow-400 text-gray-900 animate-pulse'
                      : isAccessible
                      ? 'bg-gray-700 border-yellow-500 text-yellow-200'
                      : 'bg-gray-600 border-gray-500 text-gray-400'
                  }`}
                  title={puzzle.title}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : isAccessible ? (
                    <Circle className="h-6 w-6" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
                
                {index < puzzles.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      completedPuzzles.includes(puzzle.id) ? 'bg-green-400' : 'bg-yellow-600'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Current puzzle title */}
        {currentPuzzle && (
          <p className="text-yellow-300 text-sm mt-2 text-center">
            Current: {currentPuzzle.title}
          </p>
        )}
      </div>
    </div>
  );
};