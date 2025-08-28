/**
 * Game management component for creating and editing games
 * Allows admins to manage the game catalog
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, GamepadIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Game } from '../../types';

interface GameForm {
  title: string;
  description: string;
  theme: string;
}

export const GameManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<GameForm>();

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGames(data || []);
    } catch (err) {
      setError('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGame = async (data: GameForm) => {
    try {
      if (editingGame) {
        // Update existing game
        const { error: updateError } = await supabase
          .from('games')
          .update({
            title: data.title,
            description: data.description,
            theme: data.theme,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingGame.id);

        if (updateError) throw updateError;
      } else {
        // Create new game
        const { error: insertError } = await supabase
          .from('games')
          .insert({
            title: data.title,
            description: data.description,
            theme: data.theme
          });

        if (insertError) throw insertError;
      }

      // Reset form and reload games
      reset();
      setEditingGame(null);
      setShowForm(false);
      loadGames();
    } catch (err) {
      setError('Failed to save game');
    }
  };

  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setValue('title', game.title);
    setValue('description', game.description);
    setValue('theme', game.theme);
    setShowForm(true);
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This will also delete all associated puzzles and access codes.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (deleteError) throw deleteError;
      loadGames();
    } catch (err) {
      setError('Failed to delete game');
    }
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
    setShowForm(false);
    reset();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Game Management</h2>
          <p className="text-gray-600 mt-1">Create and manage your puzzle games</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Game</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Game Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingGame ? 'Edit Game' : 'Create New Game'}
          </h3>
          
          <form onSubmit={handleSubmit(handleSaveGame)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game Title
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                placeholder="Enter game title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description', { required: 'Description is required' })}
                rows={3}
                placeholder="Describe your game..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                {...register('theme', { required: 'Theme is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">Select a theme...</option>
                <option value="mystery">Mystery</option>
                <option value="adventure">Adventure</option>
                <option value="historical">Historical</option>
                <option value="fantasy">Fantasy</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="horror">Horror</option>
                <option value="comedy">Comedy</option>
              </select>
              {errors.theme && (
                <p className="text-red-600 text-sm mt-1">{errors.theme.message}</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingGame ? 'Update Game' : 'Create Game'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Games List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <div key={game.id} className="bg-white rounded-lg shadow-lg border hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <GamepadIcon className="h-8 w-8 text-blue-600" />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditGame(game)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Edit Game"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete Game"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{game.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{game.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {game.theme}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(game.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && !showForm && (
        <div className="text-center py-12">
          <GamepadIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No games created yet</p>
          <p className="text-gray-500">Create your first game to get started</p>
        </div>
      )}
    </div>
  );
};