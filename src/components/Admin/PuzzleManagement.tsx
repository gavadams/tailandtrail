/**
 * Puzzle management component for creating and editing puzzles
 * Allows admins to manage puzzles for each game with sequencing
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Edit3, Trash2, Puzzle as PuzzleIcon, ArrowUp, ArrowDown, AlertCircle, MapPin, X } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import { cleanReactQuillHtml, prepareHtmlForEditing } from '../../utils/htmlUtils';
import { logActivity, logCreate, logUpdate, logDelete } from '../../utils/activityLogger';
import { getUserPrivileges } from '../../utils/permissions';
import type { Game, Puzzle, SplashScreen, AdminUser } from '../../types';


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
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  
  // Splash screen states
  const [splashScreens, setSplashScreens] = useState<SplashScreen[]>([]);
  const [removedSplashScreens, setRemovedSplashScreens] = useState<Set<string>>(new Set());

  // Rich text editor states
  const [puzzleDescription, setPuzzleDescription] = useState('');
  const [puzzleRiddle, setPuzzleRiddle] = useState('');
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Helper functions for HTML editing
  const insertHtmlTag = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = puzzleRiddle.substring(start, end);
    const newText = puzzleRiddle.substring(0, start) + openTag + selectedText + closeTag + puzzleRiddle.substring(end);
    
    setPuzzleRiddle(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openTag.length, end + openTag.length);
    }, 0);
  };

  const insertTable = () => {
    const tableHtml = `<table style="border-collapse: collapse; width: 100%;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th style="border: 1px solid #000; padding: 8px; text-align: left;">Header 1</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: left;">Header 2</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: left;">Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #000; padding: 8px;">Row 1, Cell 1</td>
      <td style="border: 1px solid #000; padding: 8px;">Row 1, Cell 2</td>
      <td style="border: 1px solid #000; padding: 8px;">Row 1, Cell 3</td>
    </tr>
    <tr>
      <td style="border: 1px solid #000; padding: 8px;">Row 2, Cell 1</td>
      <td style="border: 1px solid #000; padding: 8px;">Row 2, Cell 2</td>
      <td style="border: 1px solid #000; padding: 8px;">Row 2, Cell 3</td>
    </tr>
  </tbody>
</table>`;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = puzzleRiddle.substring(0, start) + tableHtml + puzzleRiddle.substring(start);
    setPuzzleRiddle(newText);
    
    // Focus textarea after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tableHtml.length, start + tableHtml.length);
    }, 0);
  };

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
    loadCurrentUser();
    loadGames();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.warn('No authenticated user');
        return;
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError) {
        console.warn('Could not load current user:', adminError.message);
        return;
      }

      setCurrentUser(adminUser);
    } catch (err) {
      console.warn('Error loading current user:', err);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      loadPuzzlesForGame(selectedGameId);
      loadSplashScreensForGame(selectedGameId);
      // Clear removed splash screens when switching games
      setRemovedSplashScreens(new Set());
    } else {
      setPuzzles([]);
      setSplashScreens([]);
      setRemovedSplashScreens(new Set());
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
        description: cleanReactQuillHtml(puzzleDescription),
        riddle: cleanReactQuillHtml(puzzleRiddle),
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
        
        // Log the update activity
        await logUpdate('puzzle', editingPuzzle.id, {
          title: data.title,
          description: puzzleData.description,
          riddle: puzzleData.riddle,
          clues: clues,
          answer: data.answer,
          answer_type: data.answer_type,
          answer_options: answerOptions,
          image_url: data.image_url,
          video_url: data.video_url,
          game_id: editingPuzzle.game_id,
          previous_title: editingPuzzle.title
        });
      } else {
        // Create new puzzle - get next sequence order
        const maxOrder = puzzles.length > 0 ? Math.max(...puzzles.map(p => p.sequence_order)) : 0;
        
        const { data: newPuzzle, error: insertError } = await supabase
          .from('puzzles')
          .insert({
            ...puzzleData,
            game_id: data.game_id,
            sequence_order: maxOrder + 1
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        // Log the creation activity
        await logCreate('puzzle', newPuzzle.id, {
          title: data.title,
          description: puzzleData.description,
          riddle: puzzleData.riddle,
          clues: clues,
          answer: data.answer,
          answer_type: data.answer_type,
          answer_options: answerOptions,
          image_url: data.image_url,
          video_url: data.video_url,
          game_id: data.game_id,
          sequence_order: maxOrder + 1
        });
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
    setPuzzleDescription(prepareHtmlForEditing(puzzle.description));
    setPuzzleRiddle(prepareHtmlForEditing(puzzle.riddle));
    setValue('answer', puzzle.answer);
    setValue('answer_type', puzzle.answer_type || 'text');
    setValue('answer_options', puzzle.answer_options ? puzzle.answer_options.map(option => ({ value: option })) : [{ value: '' }]);
    setValue('game_id', puzzle.game_id);
    setValue('image_url', puzzle.image_url || '');
    setValue('video_url', puzzle.video_url || '');
    setValue('clues', puzzle.clues.map(clue => ({ value: clue })));
    setShowForm(true);
    
    // Scroll to form after a brief delay to ensure it's rendered
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleDeletePuzzle = async (puzzleId: string) => {
    if (!confirm('Are you sure you want to delete this puzzle?')) {
      return;
    }

    try {
      // Get puzzle info before deleting for logging
      const puzzleToDelete = puzzles.find(p => p.id === puzzleId);
      
      const { error: deleteError } = await supabase
        .from('puzzles')
        .delete()
        .eq('id', puzzleId);

      if (deleteError) throw deleteError;
      
      // Log the deletion activity
      if (puzzleToDelete) {
        await logDelete('puzzle', puzzleId, {
          title: puzzleToDelete.title,
          game_id: puzzleToDelete.game_id,
          sequence_order: puzzleToDelete.sequence_order
        });
      }
      
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

      // Log the sequence reorder activity
      await logActivity({
        action: 'reorder_puzzle',
        resource_type: 'puzzle',
        resource_id: puzzleId,
        details: {
          puzzle_title: currentPuzzle.title,
          direction: direction,
          from_order: currentOrder,
          to_order: targetOrder,
          swapped_with: targetPuzzle.title,
          game_id: currentPuzzle.game_id
        }
      });

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
      
      if (newPuzzleId === null) {
        // Handle removal case - track as removed instead of updating database
        setRemovedSplashScreens(prev => new Set([...prev, splashScreenId]));
        console.log('Marked splash screen as removed:', splashScreenId);
        return;
      }
      
      // Handle assignment case - update database and remove from removed set
      const updateData = { puzzle_id: newPuzzleId };
      
      const { error } = await supabase
        .from('splash_screens')
        .update(updateData)
        .eq('id', splashScreenId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Remove from removed set if it was there
      setRemovedSplashScreens(prev => {
        const newSet = new Set(prev);
        newSet.delete(splashScreenId);
        return newSet;
      });
      
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
    const positionSplashScreens = splashScreens.filter(s => s.puzzle_id === actualPuzzleId && !removedSplashScreens.has(s.id));
    
    console.log(`Rendering section for ${actualPuzzleId}:`, positionSplashScreens.map(s => ({ id: s.id, title: s.title, puzzle_id: s.puzzle_id })));
    
    // Get all splash screens for dropdown options (including removed ones for reassignment)
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
                      removedSplashScreens.has(s.id) ? '(removed)' :
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
                      removedSplashScreens.has(s.id) ? '(removed)' :
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
        {currentUser && getUserPrivileges(currentUser.role).can_manage_puzzles && (
          <button
            onClick={() => setShowForm(true)}
            disabled={!selectedGameId}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Puzzle</span>
          </button>
        )}
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
        <div ref={formRef} className="bg-white rounded-lg shadow-lg p-6 border">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                Riddle/Challenge
              </label>
                <button
                  type="button"
                  onClick={() => setIsHtmlMode(!isHtmlMode)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  {isHtmlMode ? 'Switch to Rich Text' : 'Switch to HTML'}
                </button>
              </div>
              
              {/* Check if content contains complex HTML or user wants HTML mode */}
              {(puzzleRiddle && puzzleRiddle.includes('<table')) || isHtmlMode ? (
                <div className="space-y-3">
                  {puzzleRiddle && (
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-2">Preview of HTML content:</p>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: puzzleRiddle.replace(/<div>/g, '').replace(/<\/div>/g, '') }}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Edit HTML Content:
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                      💡 Tip: Select text and click formatting buttons, or use the Table button to insert a pre-formatted table
                    </p>
                    
                    {/* HTML Formatting Toolbar */}
                    <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-100 rounded-lg border">
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<strong>', '</strong>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 font-bold"
                        title="Bold"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<em>', '</em>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 italic"
                        title="Italic"
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<u>', '</u>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 underline"
                        title="Underline"
                      >
                        U
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h1>', '</h1>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        title="Heading 1"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h2>', '</h2>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<h3>', '</h3>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<p>', '</p>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        title="Paragraph"
                      >
                        P
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<br>', '')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        title="Line Break"
                      >
                        BR
                      </button>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => insertTable()}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        title="Insert Table"
                      >
                        Table
                      </button>
                      <button
                        type="button"
                        onClick={() => insertHtmlTag('<div style="text-align: center;">', '</div>')}
                        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        title="Center Text"
                      >
                        Center
                      </button>
                    </div>
                    
                    <textarea
                      ref={textareaRef}
                      value={puzzleRiddle.replace(/<div>/g, '').replace(/<\/div>/g, '')}
                      onChange={(e) => setPuzzleRiddle(e.target.value)}
                      className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                      placeholder="Enter HTML content or use the toolbar above..."
                    />
                  </div>
                </div>
              ) : (
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
                  formats={[
                    'header', 'bold', 'italic', 'underline', 'strike',
                    'list', 'bullet', 'link', 'blockquote', 'code-block',
                    'color', 'background', 'align'
                  ]}
              />
              )}
              
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
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full font-medium">
                          #{puzzle.sequence_order}
                        </span>
                        <h4 className="text-lg font-bold text-gray-900 truncate">{puzzle.title}</h4>
                      </div>
                      <div 
                        className="prose prose-sm max-w-none text-gray-600 text-sm mb-2 break-words overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: puzzle.description }}
                      />
                      <div 
                        className="prose prose-sm max-w-none text-gray-800 font-medium mb-2 break-words overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: puzzle.riddle }}
                      />
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{puzzle.clues.length} clues</span>
                        <span className="truncate">Answer: {puzzle.answer}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      {/* Sequence controls */}
                      {currentUser && getUserPrivileges(currentUser.role).can_manage_puzzles && (
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
                      )}
                      
                      {/* Edit/Delete controls */}
                      {currentUser && getUserPrivileges(currentUser.role).can_manage_puzzles && (
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
                      )}
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