/**
 * Puzzle management component for creating and editing puzzles
 * Allows admins to manage puzzles for each game with sequencing
 */

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Edit3, Trash2, Puzzle as PuzzleIcon, ArrowUp, ArrowDown, AlertCircle, MapPin, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import type { Game, Puzzle, SplashScreen } from '../../types';


interface PuzzleForm {
  title: string;
  description: string;
  riddle: string;
  clues: { value: string }[];
  answer: string;
  answer_type: 'text' | 'dropdown';
  answer_options: { value: string }[];
  game_id: string;
  image_url: string;
  video_url: string;
}

export const PuzzleManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [editingPuzzle, setEditingPuzzle] = useState<Puzzle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Splash screen states
  const [splashScreens, setSplashScreens] = useState<SplashScreen[]>([]);

  // Rich text editor states
  const [puzzleDescription, setPuzzleDescription] = useState('');
  const [puzzleRiddle, setPuzzleRiddle] = useState('');

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PuzzleForm>({
    defaultValues: {
      clues: [{ value: '' }],
      answer_options: [{ value: '' }],
      answer_type: 'text'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "clues"
  });

  const { fields: answerOptionFields, append: appendAnswerOption, remove: removeAnswerOption, move: moveAnswerOption } = useFieldArray({
    control,
    name: "answer_options"
  });

  const watchAnswerType = watch("answer_type");

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      loadPuzzlesForGame(selectedGameId);
      loadSplashScreensForGame(selectedGameId);
    } else {
      setPuzzles([]);
      setSplashScreens([]);
    }
  }, [selectedGameId]);

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
      console.log('Loading splash screens for game:', gameId);
      const { data, error: fetchError } = await supabase
        .from('splash_screens')
        .select('*')
        .eq('game_id', gameId)
        .order('sequence_order');

      if (fetchError) throw fetchError;
      console.log('Loaded splash screens:', data);
      console.log('Splash screen puzzle_ids:', data?.map(s => ({ id: s.id, title: s.title, puzzle_id: s.puzzle_id })));
      setSplashScreens(data || []);
    } catch (err) {
      console.error('Error loading splash screens:', err);
      setError('Failed to load splash screens');
    }
  };

  const handleSavePuzzle = async (data: PuzzleForm) => {
    try {
      const clues = data.clues.map(c => c.value).filter(c => c.trim() !== '');
      const answerOptions = data.answer_options.map(o => o.value).filter(o => o.trim() !== '');
      
      const puzzleData = {
        title: data.title,
        description: puzzleDescription,
        riddle: puzzleRiddle,
        clues: clues,
        answer: data.answer,
        answer_type: data.answer_type,
        answer_options: data.answer_type === 'dropdown' ? answerOptions : null,
        image_url: data.image_url || null,
        video_url: data.video_url || null
      };
      
      if (editingPuzzle) {
        // Update existing puzzle
        const { error: updateError } = await supabase
          .from('puzzles')
          .update({
            ...puzzleData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPuzzle.id);

        if (updateError) throw updateError;
      } else {
        // Create new puzzle - get next sequence order
        const maxOrder = puzzles.length > 0 ? Math.max(...puzzles.map(p => p.sequence_order)) : 0;
        
        const { error: insertError } = await supabase
          .from('puzzles')
          .insert({
            ...puzzleData,
            game_id: data.game_id,
            sequence_order: maxOrder + 1
          });

        if (insertError) throw insertError;
      }

      // Reset form and reload puzzles
      reset({ clues: [{ value: '' }] });
      setPuzzleDescription('');
      setPuzzleRiddle('');
      setEditingPuzzle(null);
      setShowForm(false);
      if (selectedGameId) {
        loadPuzzlesForGame(selectedGameId);
      }
    } catch (err) {
      setError('Failed to save puzzle');
    }
  };

  const handleEditPuzzle = (puzzle: Puzzle) => {
    setEditingPuzzle(puzzle);
    setValue('title', puzzle.title);
    setPuzzleDescription(puzzle.description);
    setPuzzleRiddle(puzzle.riddle);
    setValue('answer', puzzle.answer);
    setValue('answer_type', puzzle.answer_type || 'text');
    setValue('answer_options', puzzle.answer_options ? puzzle.answer_options.map(option => ({ value: option })) : [{ value: '' }]);
    setValue('game_id', puzzle.game_id);
    setValue('image_url', puzzle.image_url || '');
    setValue('video_url', puzzle.video_url || '');
    setValue('clues', puzzle.clues.map(clue => ({ value: clue })));
    setShowForm(true);
  };

  const handleDeletePuzzle = async (puzzleId: string) => {
    if (!confirm('Are you sure you want to delete this puzzle?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('puzzles')
        .delete()
        .eq('id', puzzleId);

      if (deleteError) throw deleteError;
      if (selectedGameId) {
        loadPuzzlesForGame(selectedGameId);
      }
    } catch (err) {
      setError('Failed to delete puzzle');
    }
  };

  const handleMoveSequence = async (puzzleId: string, direction: 'up' | 'down') => {
    const currentPuzzle = puzzles.find(p => p.id === puzzleId);
    if (!currentPuzzle) return;

    const currentOrder = currentPuzzle.sequence_order;
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    const targetPuzzle = puzzles.find(p => p.sequence_order === targetOrder);

    if (!targetPuzzle) return;

    try {
      // Swap sequence orders
      await supabase
        .from('puzzles')
        .update({ sequence_order: targetOrder })
        .eq('id', currentPuzzle.id);

      await supabase
        .from('puzzles')
        .update({ sequence_order: currentOrder })
        .eq('id', targetPuzzle.id);

      loadPuzzlesForGame(selectedGameId);
    } catch (err) {
      setError('Failed to reorder puzzles');
    }
  };

  const handleCancelEdit = () => {
    setEditingPuzzle(null);
    setShowForm(false);
    setPuzzleDescription('');
    setPuzzleRiddle('');
    reset({ 
      clues: [{ value: '' }],
      answer_options: [{ value: '' }],
      answer_type: 'text'
    });
  };

  // Splash screen handlers - positioning only (no creation/deletion)
  const handleRepositionSplashScreen = async (splashScreenId: string, newPuzzleId: string | null | 'END') => {
    try {
      console.log('Repositioning splash screen:', splashScreenId, 'to:', newPuzzleId);
      
      const updateData = newPuzzleId === null ? { puzzle_id: null } : { puzzle_id: newPuzzleId };
      
      const { error } = await supabase
        .from('splash_screens')
        .update(updateData)
        .eq('id', splashScreenId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully repositioned splash screen');
      // Small delay to ensure database has updated
      setTimeout(() => {
        loadSplashScreensForGame(selectedGameId);
      }, 100);
    } catch (err) {
      console.error('Error repositioning splash screen:', err);
      setError('Failed to reposition splash screen');
    }
  };

  // Helper function to render splash screen section - full position control
  const renderSplashSection = (puzzleId: string | null | 'END', title: string) => {
    // Handle the 'END' case - we'll use a special marker for splash screens after the last puzzle
    const actualPuzzleId = puzzleId === 'END' ? 'END' : puzzleId;
    const positionSplashScreens = splashScreens.filter(s => s.puzzle_id === actualPuzzleId);
    
    console.log(`Rendering section for ${actualPuzzleId}:`, positionSplashScreens.map(s => ({ id: s.id, title: s.title, puzzle_id: s.puzzle_id })));
    
    // Get all splash screens for dropdown options
    const allSplashScreens = splashScreens;
    
    return (
      <div key={`splash-section-${actualPuzzleId}-${splashScreens.length}`} className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {positionSplashScreens.length} splash screen{positionSplashScreens.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="space-y-2">
          {positionSplashScreens.map((splash) => (
            <div key={splash.id} className="flex items-center space-x-2 p-2 bg-white rounded border">
              <select
                value={splash.id}
                onChange={(e) => {
                  const selectedSplashId = e.target.value;
                  if (selectedSplashId === '') {
                    // Remove splash screen from this position (unassign)
                    handleRepositionSplashScreen(splash.id, null);
                  } else if (selectedSplashId !== splash.id) {
                    // Replace with different splash screen
                    handleRepositionSplashScreen(selectedSplashId, actualPuzzleId);
                    // Move the old splash screen to unassigned
                    handleRepositionSplashScreen(splash.id, null);
                  }
                  // If selectedSplashId === splash.id, do nothing (same splash screen)
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="">No splash screen</option>
                {allSplashScreens.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} {
                      s.puzzle_id === actualPuzzleId ? '(current)' :
                      s.puzzle_id === null ? '(before puzzle 1)' :
                      s.puzzle_id === 'END' ? '(after last puzzle)' :
                      '(assigned elsewhere)'
                    }
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleRepositionSplashScreen(splash.id, null)}
                className="text-red-600 hover:text-red-700 p-1"
                title="Remove from position"
              >
                <X className="h-4 w-4" />
              </button>
              <a
                href={`#splash-management`}
                className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                title="Edit in Splash Screen Management"
              >
                Edit
              </a>
            </div>
          ))}
          
          {/* Add new splash screen to this position */}
          <div className="flex items-center space-x-2 p-2 border-2 border-dashed border-gray-300 rounded">
            <select
              value=""
              onChange={(e) => {
                const selectedSplashId = e.target.value;
                if (selectedSplashId) {
                  handleRepositionSplashScreen(selectedSplashId, actualPuzzleId);
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Add splash screen to this position...</option>
              {allSplashScreens.map((s) => {
                // Skip splash screens already assigned to this position
                if (s.puzzle_id === actualPuzzleId) return null;
                
                return (
                  <option key={s.id} value={s.id}>
                    {s.title} {
                      s.puzzle_id === null ? '(before puzzle 1)' :
                      s.puzzle_id === 'END' ? '(after last puzzle)' :
                      '(assigned elsewhere)'
                    }
                  </option>
                );
              })}
            </select>
            <span className="text-xs text-gray-500">Add</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading puzzles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Puzzle Management</h2>
          <p className="text-gray-600 mt-1">Create and manage puzzles for your games</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={!selectedGameId}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Puzzle</span>
        </button>
      </div>

      {/* Game Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Game to Manage Puzzles
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

      {/* Puzzle Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingPuzzle ? 'Edit Puzzle' : 'Create New Puzzle'}
          </h3>
          
          <form onSubmit={handleSubmit(handleSavePuzzle)} className="space-y-4">
            {!editingPuzzle && (
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
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
                Puzzle Title
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                placeholder="Enter puzzle title..."
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
              <ReactQuill
                value={puzzleDescription}
                onChange={setPuzzleDescription}
                theme="snow"
                className="bg-white"
                placeholder="Brief description of the puzzle..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'blockquote'],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean']
                  ]
                }}
              />
              {!puzzleDescription.trim() && (
                <p className="text-red-600 text-sm mt-1">Description is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Riddle/Challenge
              </label>
              <ReactQuill
                value={puzzleRiddle}
                onChange={setPuzzleRiddle}
                theme="snow"
                className="bg-white"
                placeholder="Enter the main puzzle or riddle..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'blockquote', 'code-block'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    ['clean']
                  ]
                }}
              />
              {!puzzleRiddle.trim() && (
                <p className="text-red-600 text-sm mt-1">Riddle is required</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puzzle Image URL (Optional)
              </label>
              <input
                {...register('image_url')}
                type="url"
                placeholder="https://example.com/puzzle-image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add an image to help illustrate the puzzle
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puzzle Video URL (Optional)
              </label>
              <input
                {...register('video_url')}
                type="url"
                placeholder="https://example.com/puzzle-video.mp4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Add a video to provide additional context or clues
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progressive Clues
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Clues are revealed when players submit wrong answers. Order matters!
              </p>
<div className="space-y-2">
  {fields.map((field, index) => (
    <div key={field.id} className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-500 w-12">
        #{index + 1}
      </span>
      <input
        {...register(`clues.${index}.value` as const)}
        type="text"
        placeholder={`Clue ${index + 1}...`}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      />
      {fields.length > 1 && (
        <button
          type="button"
          onClick={() => remove(index)}
          className="text-red-600 hover:text-red-700 p-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  ))}
  <button
    type="button"
    onClick={() => append({ value: '' })}
    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
  >
    <Plus className="h-3 w-3" />
    <span>Add Clue</span>
  </button>
</div>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer Type
              </label>
              <select
                {...register('answer_type', { required: 'Answer type is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="text">Text Input</option>
                <option value="dropdown">Dropdown Selection</option>
              </select>
              {errors.answer_type && (
                <p className="text-red-600 text-sm mt-1">{errors.answer_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer
              </label>
              <input
                {...register('answer', { required: 'Answer is required' })}
                type="text"
                placeholder="Enter the correct answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {errors.answer && (
                <p className="text-red-600 text-sm mt-1">{errors.answer.message}</p>
              )}
            </div>

            {watchAnswerType === 'dropdown' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Answer Options
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Add multiple answer options for players to choose from. The correct answer must be one of these options.
                </p>
                <div className="space-y-2">
                  {answerOptionFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 w-12">
                        #{index + 1}
                      </span>
                      <input
                        {...register(`answer_options.${index}.value` as const)}
                        type="text"
                        placeholder={`Option ${index + 1}...`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                      <div className="flex space-x-1">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveAnswerOption(index, index - 1)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                        )}
                        {index < answerOptionFields.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveAnswerOption(index, index + 1)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        )}
                        {answerOptionFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAnswerOption(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Remove option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendAnswerOption({ value: '' })}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Option</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!puzzleDescription.trim() || !puzzleRiddle.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingPuzzle ? 'Update Puzzle' : 'Create Puzzle'}
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

      {/* Puzzles List */}
      {selectedGameId && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900">
            Puzzles for {games.find(g => g.id === selectedGameId)?.title}
          </h3>
            <p className="text-gray-600 text-sm mt-1 flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              Location: {(games.find(g => g.id === selectedGameId) as any)?.cities?.name || 'No city assigned'}
            </p>
          </div>
          
          {/* Splash screens before first puzzle */}
          {renderSplashSection(null, 'Splashscreens')}
          
          {puzzles.length > 0 ? (
            <div className="space-y-4">
              {puzzles.map((puzzle, index) => (
                <div key={puzzle.id}>
                  {/* Splash screens between puzzles */}
                  {index > 0 && renderSplashSection(puzzle.id, 'Splashscreens')}
                  
                  {/* Puzzle */}
                  <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full font-medium">
                          #{puzzle.sequence_order}
                        </span>
                        <h4 className="text-lg font-bold text-gray-900">{puzzle.title}</h4>
                      </div>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600 text-sm mb-2"
                        dangerouslySetInnerHTML={{ __html: puzzle.description }}
                      />
                      <div 
                        className="prose prose-sm max-w-none text-gray-800 font-medium mb-2"
                        dangerouslySetInnerHTML={{ __html: puzzle.riddle }}
                      />
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{puzzle.clues.length} clues</span>
                        <span>Answer: {puzzle.answer}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {/* Sequence controls */}
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleMoveSequence(puzzle.id, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveSequence(puzzle.id, 'down')}
                          disabled={index === puzzles.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Edit/Delete controls */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEditPuzzle(puzzle)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Edit Puzzle"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePuzzle(puzzle.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Puzzle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Splash screens after last puzzle */}
              {renderSplashSection('END', 'Splashscreens')}
            </div>
          ) : (
            <div className="text-center py-8">
              <PuzzleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No puzzles created yet</p>
              <p className="text-gray-500 text-sm">Create your first puzzle to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};