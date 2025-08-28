/**
 * Access code input component for player login
 * Handles code validation and session creation
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Key, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../stores/gameStore';

interface AccessCodeForm {
  code: string;
}

export const AccessCodeInput: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<AccessCodeForm>();
  const { setSession, setGame, setPuzzles, setAccessCode, setLoading, setError } = useGameStore();

  const validateAndActivateCode = async (data: AccessCodeForm) => {
    setIsValidating(true);
    setError(null);
    
    try {
      // Check if code exists and is valid
      const { data: codeData, error: codeError } = await supabase
        .from('access_codes')
        .select(`
          *,
          games (*)
        `)
        .eq('code', data.code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !codeData) {
        setError('Invalid access code. Please check your code and try again.');
        return;
      }

      // Check if code is already activated and expired
      if (codeData.activated_at) {
        const activatedTime = new Date(codeData.activated_at);
        const expiryTime = new Date(activatedTime.getTime() + 12 * 60 * 60 * 1000); // 12 hours
        const now = new Date();

        // Skip expiry check for test code
        if (now > expiryTime && codeData.code !== 'TEST2025') {
          setError('This access code has expired. Each code is valid for 12 hours from first use.');
          return;
        }
      }

      // Activate code if first use
      let updatedCodeData = codeData;
      if (!codeData.activated_at) {
        const now = new Date().toISOString();
        const expiryTime = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

        const { data: updated, error: updateError } = await supabase
          .from('access_codes')
          .update({
            activated_at: now,
            expires_at: expiryTime
          })
          .eq('id', codeData.id)
          .select()
          .single();

        if (updateError) {
          setError('Failed to activate code. Please try again.');
          return;
        }

        updatedCodeData = updated;

        // Log activation
        await supabase.from('code_usage_logs').insert({
          access_code_id: codeData.id,
          game_id: codeData.game_id,
          action: 'activated',
          timestamp: now,
          metadata: { user_agent: navigator.userAgent }
        });
      }

      // Get puzzles for the game
      const { data: puzzlesData, error: puzzlesError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('game_id', codeData.game_id)
        .order('sequence_order');

      if (puzzlesError) {
        setError('Failed to load game puzzles.');
        return;
      }

      if (!puzzlesData || puzzlesData.length === 0) {
        setError('No puzzles found for this game. Please contact support.');
        return;
      }
      // Check for existing session or create new one
      let sessionData;
      const { data: existingSession } = await supabase
        .from('player_sessions')
        .select('*')
        .eq('access_code_id', updatedCodeData.id)
        .maybeSingle();

      if (existingSession) {
        // Update last activity
        const { data: updated } = await supabase
          .from('player_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', existingSession.id)
          .select()
          .single();
        sessionData = updated || existingSession;
      } else {
        // Create new session
        const { data: newSession, error: sessionError } = await supabase
          .from('player_sessions')
          .insert({
            access_code_id: updatedCodeData.id,
            game_id: codeData.game_id,
            current_puzzle_id: puzzlesData[0]?.id || null,
            completed_puzzles: [],
            session_data: {},
            last_activity: new Date().toISOString()
          })
          .select()
          .single();

        if (sessionError) {
          setError('Failed to create game session.');
          return;
        }

        sessionData = newSession;
      }

      // Set all the state
      setAccessCode(updatedCodeData);
      setGame(codeData.games);
      setPuzzles(puzzlesData);
      setSession(sessionData);
      
      // Scroll to top when successfully entering the game
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Code validation error:', error);
      setError('An unexpected error occurred. Please try again.');
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-2xl shadow-2xl p-8 max-w-md w-full border-4 border-yellow-600">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gray-800 p-4 rounded-full inline-block mb-4 shadow-lg border-2 border-yellow-600">
            <Key className="h-12 w-12 text-yellow-200" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Enter Your Access Code
          </h2>
          <p className="text-gray-700">
            Enter the unique code you received to start your puzzle adventure
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(validateAndActivateCode)} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-bold text-gray-900 mb-2">
              Access Code
            </label>
            <input
              {...register('code', { 
                required: 'Access code is required',
                minLength: { value: 6, message: 'Code must be at least 6 characters' }
              })}
              type="text"
              id="code"
              placeholder="Enter your code..."
              className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 outline-none transition-colors text-center text-lg font-mono uppercase tracking-wider"
              style={{ textTransform: 'uppercase' }}
            />
            {errors.code && (
              <p className="text-red-600 text-sm mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.code.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isValidating}
            className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-yellow-100 font-bold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? 'Validating...' : 'Start Adventure'}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-yellow-100 rounded-lg border-l-4 border-yellow-600">
          <p className="text-gray-800 text-sm">
            <strong>Note:</strong> Access codes are valid for 12 hours from first use. 
            You can resume your progress anytime within this window.
          </p>
        </div>
      </div>
    </div>
  );
};