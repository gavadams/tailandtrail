/**
 * Game management component for creating and editing games
 * Allows admins to manage the game catalog
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, GamepadIcon, AlertCircle, MapPin, Copy, Play, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Game, City } from '../../types';

interface GameForm {
  title: string;
  description: string;
  theme: string;
  city_id: string;
  is_active: boolean;
  game_tested: boolean;
  content_tested: boolean;
}

export const GameManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [duplicatingGame, setDuplicatingGame] = useState<Game | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<GameForm>({
    defaultValues: {
      is_active: true,
      game_tested: false,
      content_tested: false
    }
  });

  useEffect(() => {
    loadGames();
    loadCities();
  }, []);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select(`
          *,
          cities (id, name, country)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setGames(data || []);
    } catch (err) {
      setError('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;
      setCities(data || []);
    } catch (err) {
      setError('Failed to load cities');
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
            city_id: data.city_id,
            is_active: data.is_active,
            game_tested: data.game_tested,
            content_tested: data.content_tested,
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
            theme: data.theme,
            city_id: data.city_id,
            is_active: data.is_active,
            game_tested: data.game_tested,
            content_tested: data.content_tested
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
    setValue('city_id', game.city_id);
    setValue('is_active', game.is_active);
    setValue('game_tested', game.game_tested || false);
    setValue('content_tested', game.content_tested || false);
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

  const handleDuplicateGame = (game: Game) => {
    setDuplicatingGame(game);
    setShowDuplicateModal(true);
  };

  const handleDuplicateSubmit = async (data: { new_city_id: string; new_title: string }) => {
    if (!duplicatingGame) return;

    setIsDuplicating(true);
    try {
      // First, create the new game
        const { data: newGame, error: gameError } = await supabase
          .from('games')
          .insert({
            title: data.new_title,
            description: duplicatingGame.description,
            theme: duplicatingGame.theme,
            city_id: data.new_city_id,
            is_active: true // New games are active by default
          })
          .select()
          .single();

      if (gameError) throw gameError;

      // Then, get all puzzles from the original game
      const { data: originalPuzzles, error: puzzlesError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('game_id', duplicatingGame.id)
        .order('sequence_order');

      if (puzzlesError) throw puzzlesError;

      // Duplicate all puzzles for the new game
      if (originalPuzzles && originalPuzzles.length > 0) {
        const newPuzzles = originalPuzzles.map(puzzle => ({
          game_id: newGame.id,
          title: puzzle.title,
          description: puzzle.description,
          riddle: puzzle.riddle,
          clues: puzzle.clues,
          answer: puzzle.answer,
          answer_type: puzzle.answer_type,
          answer_options: puzzle.answer_options,
          sequence_order: puzzle.sequence_order,
          image_url: puzzle.image_url,
          video_url: puzzle.video_url
        }));

        const { error: insertPuzzlesError } = await supabase
          .from('puzzles')
          .insert(newPuzzles);

        if (insertPuzzlesError) throw insertPuzzlesError;
      }

      // Duplicate splash screens for the new game
      const { data: originalSplashScreens, error: splashError } = await supabase
        .from('splash_screens')
        .select('*')
        .eq('game_id', duplicatingGame.id)
        .order('sequence_order');

      if (splashError) throw splashError;

      if (originalSplashScreens && originalSplashScreens.length > 0) {
        const newSplashScreens = originalSplashScreens.map(splash => ({
          game_id: newGame.id,
          title: splash.title,
          content: splash.content,
          image_url: splash.image_url,
          video_url: splash.video_url,
          sequence_order: splash.sequence_order,
          puzzle_id: splash.puzzle_id // This will be null initially, can be updated later
        }));

        const { error: insertSplashError } = await supabase
          .from('splash_screens')
          .insert(newSplashScreens);

        if (insertSplashError) throw insertSplashError;
      }

      // Reset and reload
      setShowDuplicateModal(false);
      setDuplicatingGame(null);
      loadGames();
    } catch (err) {
      setError('Failed to duplicate game');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateModal(false);
    setDuplicatingGame(null);
  };

  const handleTestGame = (gameId: string) => {
    // Navigate to test game route - this will be secure as it requires admin authentication
    window.open(`/test-game/${gameId}`, '_blank');
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Game Management</h2>
          <p className="text-gray-600 mt-1">Create and manage your puzzle games</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
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
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            {editingGame ? 'Edit Game' : 'Create New Game'}
          </h3>
          
          <form onSubmit={handleSubmit(handleSaveGame)} className="space-y-4 sm:space-y-6">
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
                <MapPin className="inline h-4 w-4 mr-1" />
                City
              </label>
              <select
                {...register('city_id', { required: 'City is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="">Select a city...</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.country}
                  </option>
                ))}
              </select>
              {errors.city_id && (
                <p className="text-red-600 text-sm mt-1">{errors.city_id.message}</p>
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

            <div>
              <label className="flex items-center space-x-3">
                <input
                  {...register('is_active')}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Game is active (available for new purchases)
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Inactive games won't appear in purchase dropdown but existing access codes will still work
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  {...register('game_tested')}
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Game has been tested and confirmed good
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Confirm that the game mechanics and flow work correctly
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input
                  {...register('content_tested')}
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Content has been tested and confirmed good
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Confirm that all puzzles, clues, and content are accurate and working
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors text-center font-medium"
              >
                {editingGame ? 'Update Game' : 'Create Game'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors text-center font-medium"
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
                <div className="flex space-x-1 sm:space-x-2">
                  <button
                    onClick={() => handleTestGame(game.id)}
                    className="text-purple-600 hover:text-purple-700 p-2 sm:p-1 rounded-md hover:bg-purple-50 transition-colors"
                    title="Test Game"
                  >
                    <Play className="h-4 w-4 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => handleEditGame(game)}
                    className="text-blue-600 hover:text-blue-700 p-2 sm:p-1 rounded-md hover:bg-blue-50 transition-colors"
                    title="Edit Game"
                  >
                    <Edit3 className="h-4 w-4 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateGame(game)}
                    className="text-green-600 hover:text-green-700 p-2 sm:p-1 rounded-md hover:bg-green-50 transition-colors"
                    title="Duplicate Game"
                  >
                    <Copy className="h-4 w-4 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    className="text-red-600 hover:text-red-700 p-2 sm:p-1 rounded-md hover:bg-red-50 transition-colors"
                    title="Delete Game"
                  >
                    <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2">{game.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{game.description}</p>
              
              <div className="mb-3">
                <div className="flex items-center text-gray-600 text-sm mb-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{(game as any).cities?.name || 'No city assigned'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {game.theme}
                  </span>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                    game.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {game.is_active ? 'Active' : 'Inactive'}
                  </span>
                  
                  {/* Game Testing Status Icons */}
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-1">
                      {game.game_tested ? (
                        <CheckCircle className="h-3 w-3 text-green-600" title="Game tested and confirmed good" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" title="Game not tested" />
                      )}
                      <span className="text-xs text-gray-600">Game</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {game.content_tested ? (
                        <CheckCircle className="h-3 w-3 text-purple-600" title="Content tested and confirmed good" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" title="Content not tested" />
                      )}
                      <span className="text-xs text-gray-600">Content</span>
                    </div>
                  </div>
                </div>
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

      {/* Duplicate Game Modal */}
      {showDuplicateModal && duplicatingGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Duplicate Game
            </h3>
            <p className="text-gray-600 mb-4">
              Duplicating: <strong>{duplicatingGame.title}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will copy the game and all its puzzles and splash screens to a new city.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleDuplicateSubmit({
                new_city_id: formData.get('new_city_id') as string,
                new_title: formData.get('new_title') as string
              });
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  New City
                </label>
                <select
                  name="new_city_id"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select a city...</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}, {city.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Game Title
                </label>
                <input
                  name="new_title"
                  type="text"
                  defaultValue={`${duplicatingGame.title} (Copy)`}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isDuplicating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-3 sm:py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  {isDuplicating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Duplicating...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Duplicate Game</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelDuplicate}
                  disabled={isDuplicating}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-3 sm:py-2 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};