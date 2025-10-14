/**
 * Main puzzle display component
 * Shows the current puzzle with progressive clues and answer submission
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Lightbulb, CheckCircle, XCircle, ArrowRight, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../stores/gameStore';
import { Puzzle } from '../../types';

interface AnswerForm {
  answer: string;
}

interface PuzzleDisplayProps {
  onPuzzleComplete?: (puzzleId: string) => void;
}

export const PuzzleDisplay: React.FC<PuzzleDisplayProps> = ({ onPuzzleComplete }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [puzzleStartTime, setPuzzleStartTime] = useState<Date | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnswerForm>();
  
  const {
    currentPuzzle,
    currentSession,
    puzzles,
    revealedClues,
    revealNextClue,
    resetClues,
    markPuzzleComplete,
    setCurrentPuzzle,
    setSession,
    setError
  } = useGameStore();

  useEffect(() => {
    if (currentPuzzle) {
      resetClues();
      setShowAnswer(false);
      reset();
      setPuzzleStartTime(new Date());
      
      // Track puzzle start
      trackPuzzleInteraction('puzzle_started');
    }
  }, [currentPuzzle?.id]);

  // Analytics tracking functions
  const trackPuzzleInteraction = async (
    actionType: 'puzzle_started' | 'hint_revealed' | 'wrong_answer' | 'correct_answer' | 'puzzle_completed',
    data?: {
      hintIndex?: number;
      hintText?: string;
      userAnswer?: string;
      isCorrect?: boolean;
    }
  ) => {
    // Skip tracking in test mode or if no session/puzzle
    if (!currentPuzzle || (!currentSession && !isTestMode)) return;
    
    // Skip database operations in test mode
    if (isTestMode) return;

    try {
      const now = new Date();
      const timeToSolve = puzzleStartTime ? Math.floor((now.getTime() - puzzleStartTime.getTime()) / 1000) : 0;
      const timeToHint = data?.hintIndex !== undefined && puzzleStartTime ? 
        Math.floor((now.getTime() - puzzleStartTime.getTime()) / 1000) : null;

      await supabase.from('puzzle_interactions').insert({
        player_session_id: currentSession.id,
        puzzle_id: currentPuzzle.id,
        game_id: currentPuzzle.game_id,
        access_code_id: currentSession.access_code_id,
        action_type: actionType,
        hint_index: data?.hintIndex,
        hint_text: data?.hintText,
        user_answer: data?.userAnswer,
        is_correct: data?.isCorrect,
        puzzle_start_time: puzzleStartTime?.toISOString(),
        puzzle_end_time: actionType === 'puzzle_completed' ? now.toISOString() : null,
        time_to_solve: actionType === 'puzzle_completed' ? timeToSolve : null,
        time_to_hint: timeToHint,
        user_agent: navigator.userAgent,
        created_at: now.toISOString()
      });
    } catch (error) {
      console.error('Failed to track puzzle interaction:', error);
    }
  };

  const submitAnswer = async (data: AnswerForm) => {
    // Allow test mode to proceed without session, but require session for normal mode
    if (!currentPuzzle || (!currentSession && !isTestMode)) return;

    setIsSubmitting(true);
    const userAnswer = data.answer.toLowerCase().trim();
    const correctAnswer = currentPuzzle.answer.toLowerCase().trim();

    if (userAnswer === correctAnswer) {
      // Track correct answer (skipped in test mode)
      await trackPuzzleInteraction('correct_answer', {
        userAnswer: data.answer,
        isCorrect: true
      });

      if (isTestMode) {
        // In test mode, just show success and call the callback
        setShowAnswer(true);
        
        // Call onPuzzleComplete callback if provided (for test mode)
        if (onPuzzleComplete) {
          onPuzzleComplete(currentPuzzle.id);
        }
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setIsSubmitting(false);
        reset();
        return;
      }

      // Normal mode: Mark puzzle as complete
      const updatedCompletedPuzzles = [...currentSession.completed_puzzles, currentPuzzle.id];
      
      // Update session in database
      const { error: updateError } = await supabase
        .from('player_sessions')
        .update({
          completed_puzzles: updatedCompletedPuzzles,
          last_activity: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (updateError) {
        setError('Failed to save progress');
        setIsSubmitting(false);
        return;
      }

      // Track puzzle completion
      await trackPuzzleInteraction('puzzle_completed');

      // Update local state
      markPuzzleComplete(currentPuzzle.id);
      setSession({
        ...currentSession,
        completed_puzzles: updatedCompletedPuzzles
      });

      setShowAnswer(true);
      
      // Call onPuzzleComplete callback if provided (for test mode)
      if (onPuzzleComplete) {
        onPuzzleComplete(currentPuzzle.id);
      }
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Auto-advance after 3 seconds
      setTimeout(() => {
        goToNextPuzzle();
      }, 3000);
      
    } else {
      // Track wrong answer (skipped in test mode)
      await trackPuzzleInteraction('wrong_answer', {
        userAnswer: data.answer,
        isCorrect: false
      });

      // Wrong answer - reveal next clue if available
      if (revealedClues < currentPuzzle.clues.length) {
        const newClueIndex = revealedClues;
        const newClueText = currentPuzzle.clues[newClueIndex];
        
        revealNextClue();
        
        // Track hint reveal (skipped in test mode)
        await trackPuzzleInteraction('hint_revealed', {
          hintIndex: newClueIndex,
          hintText: newClueText
        });
        
        // Scroll to the newly revealed clue after a short delay to ensure DOM update
        setTimeout(() => {
          const clueElement = document.getElementById(`clue-${newClueIndex}`);
          
          if (clueElement) {
            // Scroll to the specific newly revealed clue
            clueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // Fallback: scroll to the clues section
            const cluesSection = document.getElementById('clues-section');
            if (cluesSection) {
              cluesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              // Final fallback: scroll to answer input
              const answerInput = document.getElementById('answer-input');
              if (answerInput) {
                answerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }
        }, 100);
      } else {
        // No more clues available, scroll to answer input to encourage retry
        setTimeout(() => {
          const answerInput = document.getElementById('answer-input');
          if (answerInput) {
            answerInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      
      // Show encouraging message for wrong answers
      const encouragements = [
        "Not quite! Try again with the clue below.",
        "Close! Check out the hint that just appeared.",
        "Keep thinking! A new clue is now available.",
        "Almost there! Use the new clue to guide you."
      ];
      // You could show these messages in a toast or temporary display
    }
    
    setIsSubmitting(false);
    reset();
  };

  const goToNextPuzzle = () => {
    // Allow test mode to proceed without session
    if (!currentPuzzle || (!currentSession && !isTestMode)) return;

    const currentIndex = puzzles.findIndex(p => p.id === currentPuzzle.id);
    const nextPuzzle = puzzles[currentIndex + 1];

    if (nextPuzzle) {
      setCurrentPuzzle(nextPuzzle);
      
      // Scroll to top when moving to next puzzle
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Update current puzzle in session (skip in test mode)
      if (!isTestMode && currentSession) {
        supabase
          .from('player_sessions')
          .update({ current_puzzle_id: nextPuzzle.id })
          .eq('id', currentSession.id);
      }
    }
  };


  const isLastPuzzle = currentPuzzle ? puzzles.findIndex(p => p.id === currentPuzzle.id) === puzzles.length - 1 : false;
  const isCompleted = currentSession?.completed_puzzles.includes(currentPuzzle?.id || '') || false;

  if (!currentPuzzle) {
    return (
      <div className="text-center py-12">
        <p className="text-yellow-200 text-lg">Loading puzzle...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Puzzle Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 mb-8 shadow-xl border border-yellow-600">
        <h2 className="text-3xl font-bold text-yellow-200 mb-3 text-center">
          {currentPuzzle.title}
        </h2>
        <div 
          className="prose prose-lg prose-invert max-w-none text-yellow-300"
          dangerouslySetInnerHTML={{ __html: currentPuzzle.description }}
        />
      </div>

      {/* Riddle */}
      <div className="bg-gray-100 rounded-xl p-6 mb-6 border-4 border-yellow-400 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Eye className="h-6 w-6 mr-2" />
          The Challenge
        </h3>
        
        {/* Puzzle Media */}
        {(currentPuzzle.image_url || currentPuzzle.video_url) && (
          <div className="mb-6">
            {currentPuzzle.video_url ? (
              <div className="relative rounded-lg overflow-hidden">
                <video 
                  className="w-full h-auto object-contain"
                  controls
                  preload="metadata"
                >
                  <source src={currentPuzzle.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : currentPuzzle.image_url && (
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={currentPuzzle.image_url} 
                  alt="Puzzle illustration"
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}
        
        <div 
          className="prose prose-lg max-w-none text-gray-800 font-medium"
          dangerouslySetInnerHTML={{ __html: currentPuzzle.riddle }}
        />
      </div>

      {/* Progressive Clues */}
      {currentPuzzle.clues.length > 0 && (
        <div id="clues-section" className="bg-yellow-50 rounded-xl p-6 mb-6 border-2 border-yellow-500">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Clues {revealedClues > 0 && `(${revealedClues}/${currentPuzzle.clues.length})`}
          </h3>
          
          {revealedClues === 0 ? (
            <p className="text-gray-700 italic">
              Submit an incorrect answer to reveal your first clue!
            </p>
          ) : (
            <div className="space-y-3">
              {currentPuzzle.clues.slice(0, revealedClues).map((clue, index) => (
                <div key={index} id={`clue-${index}`} className="flex items-start space-x-3">
                  <div className="bg-yellow-600 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-800 flex-1">{clue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Answer Section */}
      {!isCompleted && !showAnswer && (
        <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-yellow-400">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Answer</h3>
          
          <form onSubmit={handleSubmit(submitAnswer)} className="space-y-4">
            <div>
              {currentPuzzle.answer_type === 'dropdown' && currentPuzzle.answer_options ? (
                <select
                  {...register('answer', { required: 'Please select an answer' })}
                  id="answer-input"
                  className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors text-lg bg-white"
                >
                  <option value="">Choose your answer...</option>
                  {currentPuzzle.answer_options.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...register('answer', { required: 'Please enter your answer' })}
                  id="answer-input"
                  type="text"
                  placeholder="Enter your answer..."
                  className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors text-lg"
                />
              )}
              {errors.answer && (
                <p className="text-red-600 text-sm mt-1">{errors.answer.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-yellow-100 font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? 'Checking...' : 'Submit Answer'}
            </button>
          </form>
        </div>
      )}

      {/* Success State */}
      {showAnswer && (
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-center shadow-xl">
          <CheckCircle className="h-16 w-16 text-green-100 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-100 mb-2">
            Brilliant! You got it!
          </h3>
          <p className="text-green-200 text-lg mb-4">
            The answer was: <strong>{currentPuzzle.answer}</strong>
          </p>
          
          {!isLastPuzzle ? (
            <div className="space-y-2">
              <p className="text-green-100">Moving to the next puzzle...</p>
              <button
                onClick={goToNextPuzzle}
                className="inline-flex items-center bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          ) : (
            <p className="text-green-100 text-xl font-bold">
              🎉 Congratulations! You've completed all puzzles! 🎉
            </p>
          )}
        </div>
      )}
    </div>
  );
};