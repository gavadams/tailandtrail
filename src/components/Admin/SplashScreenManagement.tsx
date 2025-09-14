/**
 * Splash screen management for story narrative between puzzles
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, Image, ArrowUp, ArrowDown, AlertCircle, MapPin } from 'lucide-react';
import ReactQuill from 'react-quill';
import { supabase } from '../../lib/supabase';
import { Game, Puzzle, SplashScreen } from '../../types';

interface SplashScreenForm {
  title: string;
  content: string;
  image_url: string;
  video_url: string;
  game_id: string;
  puzzle_id: string;
  sequence_order: number;
}

export const SplashScreenManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [splashScreens, setSplashScreens] = useState<SplashScreen[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [editingSplash, setEditingSplash] = useState<SplashScreen | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [splashContent, setSplashContent] = useState('');

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SplashScreenForm>();
  const watchGameId = watch('game_id');

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      loadSplashScreensForGame(selectedGameId);
      loadPuzzlesForGame(selectedGameId);
    } else {
      setSplashScreens([]);
      setPuzzles([]);
    }
  }, [selectedGameId]);

  useEffect(() => {
    if (watchGameId && watchGameId !== selectedGameId) {
      loadPuzzlesForGame(watchGameId);
    }
  }, [watchGameId]);

  const loadGames = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select(`
          *,
          cities (id, name, country)
        `)
        .order('title');

      if (fetchError) throw fetchError;
      setGames(data || []);
    } catch (err) {
      setError('Failed to load games');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPuzzlesForGame = async (gameId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('puzzles')
        .select('*')
        .eq('game_id', gameId)
        .order('sequence_order');

      if (fetchError) throw fetchError;
      setPuzzles(data || []);
    } catch (err) {
      setError('Failed to load puzzles');
    }
  };

  const loadSplashScreensForGame = async (gameId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('splash_screens')
        .select('*')
        .eq('game_id', gameId)
        .order('sequence_order');

      if (fetchError) throw fetchError;
      setSplashScreens(data || []);
    } catch (err) {
      setError('Failed to load splash screens');
    }
  };

  const handleSaveSplash = async (data: SplashScreenForm) => {
    try {
      const splashData = {
        ...data,
        content: splashContent,
        puzzle_id: data.puzzle_id || null
      };

      if (editingSplash) {
        const { error: updateError } = await supabase
          .from('splash_screens')
          .update({
            ...splashData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSplash.id);

        if (updateError) throw updateError;
      } else {
        const maxOrder = splashScreens.length > 0 ? Math.max(...splashScreens.map(s => s.sequence_order)) : 0;
        
        const { error: insertError } = await supabase
          .from('splash_screens')
          .insert({
            ...splashData,
            sequence_order: maxOrder + 1
          });

        if (insertError) throw insertError;
      }

      reset();
      setSplashContent('');
      setEditingSplash(null);
      setShowForm(false);
      if (selectedGameId) {
        loadSplashScreensForGame(selectedGameId);
      }
    } catch (err) {
      setError('Failed to save splash screen');
    }
  };

  const handleEditSplash = (splash: SplashScreen) => {
    setEditingSplash(splash);
    setValue('title', splash.title);
    setValue('image_url', splash.image_url || '');
    setValue('video_url', splash.video_url || '');
    setValue('game_id', splash.game_id);
    setValue('puzzle_id', splash.puzzle_id || '');
    setValue('sequence_order', splash.sequence_order);
    setSplashContent(splash.content);
    setShowForm(true);
  };

  const handleDeleteSplash = async (splashId: string) => {
    if (!confirm('Are you sure you want to delete this splash screen?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('splash_screens')
        .delete()
        .eq('id', splashId);

      if (deleteError) throw deleteError;
      if (selectedGameId) {
        loadSplashScreensForGame(selectedGameId);
      }
    } catch (err) {
      setError('Failed to delete splash screen');
    }
  };

  const handleMoveSequence = async (splashId: string, direction: 'up' | 'down') => {
    const currentSplash = splashScreens.find(s => s.id === splashId);
    if (!currentSplash) return;

    const currentOrder = currentSplash.sequence_order;
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    const targetSplash = splashScreens.find(s => s.sequence_order === targetOrder);

    if (!targetSplash) return;

    try {
      await supabase
        .from('splash_screens')
        .update({ sequence_order: targetOrder })
        .eq('id', currentSplash.id);

      await supabase
        .from('splash_screens')
        .update({ sequence_order: currentOrder })
        .eq('id', targetSplash.id);

      loadSplashScreensForGame(selectedGameId);
    } catch (err) {
      setError('Failed to reorder splash screens');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading splash screens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Splash Screen Management</h2>
          <p className="text-gray-600 mt-1">Create story elements between puzzles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!selectedGameId}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Splash Screen</span>
        </button>
      </div>

      {/* Game Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Game
        </label>
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">Choose a game...</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.title} - {(game as any).cities?.name || 'No city assigned'}
            </option>
          ))}
        </select>
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

      {/* Splash Screen Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingSplash ? 'Edit Splash Screen' : 'Create New Splash Screen'}
          </h3>
          
          <form onSubmit={handleSubmit(handleSaveSplash)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game
                </label>
                <select
                  {...register('game_id', { required: 'Please select a game' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select a game...</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.title} - {(game as any).cities?.name || 'No city assigned'}
                    </option>
                  ))}
                </select>
                {errors.game_id && (
                  <p className="text-red-600 text-sm mt-1">{errors.game_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Show Before Puzzle (Optional)
                </label>
                <select
                  {...register('puzzle_id')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="">Game Introduction (Before Puzzle 1)</option>
                  {puzzles.map((puzzle) => (
                    <option key={puzzle.id} value={puzzle.id}>
                      Before Puzzle {puzzle.sequence_order}: {puzzle.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to show at game start. Multiple splash screens will play in sequence order.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                placeholder="Enter splash screen title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                {...register('image_url')}
                type="url"
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a background image for the splash screen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (Optional)
              </label>
              <input
                {...register('video_url')}
                type="url"
                placeholder="https://example.com/video.mp4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a short video to play on the splash screen
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <ReactQuill
                value={splashContent}
                onChange={setSplashContent}
                theme="snow"
                className="bg-white"
                placeholder="Enter the story content for this splash screen..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingSplash ? 'Update Splash Screen' : 'Create Splash Screen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingSplash(null);
                  reset();
                  setSplashContent('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Splash Screens List */}
      {selectedGameId && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Splash Screens for {games.find(g => g.id === selectedGameId)?.title}
            </h3>
            <p className="text-gray-600 text-sm mt-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Location: {(games.find(g => g.id === selectedGameId) as any)?.cities?.name || 'No city assigned'}
            </p>
          </div>
          
          {splashScreens.length > 0 ? (
            <div className="space-y-4">
              {splashScreens.map((splash, index) => (
                <div key={splash.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full font-medium">
                          #{splash.sequence_order}
                        </span>
                        <h4 className="text-lg font-bold text-gray-900">{splash.title}</h4>
                        {splash.image_url && (
                          <Image className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600 text-sm mb-2 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: splash.content }}
                      />
                      {splash.puzzle_id ? (
                        <p className="text-xs text-gray-500">
                          Shows before Puzzle {puzzles.find(p => p.id === splash.puzzle_id)?.sequence_order}: {puzzles.find(p => p.id === splash.puzzle_id)?.title}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Shows at game introduction (before Puzzle 1)
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Sequence controls */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveSequence(splash.id, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveSequence(splash.id, 'down')}
                          disabled={index === splashScreens.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Edit/Delete controls */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditSplash(splash)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Edit Splash Screen"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSplash(splash.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Splash Screen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No splash screens created yet</p>
              <p className="text-gray-500 text-sm">Create your first splash screen to add story elements</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};