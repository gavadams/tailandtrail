/**
 * Notepad component for players to take notes while solving puzzles
 * Mobile-first design with side panel layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, FileText } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';

interface NotepadProps {
  puzzleId: string;
}

export const Notepad: React.FC<NotepadProps> = ({ puzzleId }) => {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    puzzleNotes,
    isNotepadOpen,
    setPuzzleNote,
    clearPuzzleNotes,
    toggleNotepad,
    getNotesKey
  } = useGameStore();

  // Load notes when component mounts or puzzle changes
  useEffect(() => {
    const notesKey = getNotesKey(puzzleId);
    const savedContent = puzzleNotes[notesKey] || '';
    setContent(savedContent);
  }, [puzzleId, getNotesKey, puzzleNotes]);

  // Auto-save with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (content !== '') {
        setPuzzleNote(puzzleId, content);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [content, puzzleId, setPuzzleNote]);

  // Load from localStorage on mount
  useEffect(() => {
    const notesKey = getNotesKey(puzzleId);
    try {
      const savedContent = localStorage.getItem(`notepad_${notesKey}`);
      if (savedContent && !puzzleNotes[notesKey]) {
        setContent(savedContent);
        setPuzzleNote(puzzleId, savedContent);
      }
    } catch (error) {
      console.warn('Failed to load notepad from localStorage:', error);
    }
  }, [puzzleId, getNotesKey, setPuzzleNote, puzzleNotes]);

  const handleClear = () => {
    setContent('');
    clearPuzzleNotes(puzzleId);
  };


  const handleClose = () => {
    toggleNotepad();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };


  if (!isNotepadOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
        onClick={handleClose}
      />
      
      {/* Notepad Panel */}
      <div className={`
        fixed right-0 top-0 h-full bg-white shadow-2xl z-50
        flex flex-col
        transition-all duration-300 ease-in-out
        w-80 md:w-96
        ${isNotepadOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Notes</h3>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handleClear}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Clear notes"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Close notepad"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Type your thoughts, clues, and ideas here..."
              className="w-full h-full resize-none border-none outline-none text-sm leading-relaxed"
              style={{ minHeight: '200px' }}
              autoFocus
            />
          </div>
          
          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Auto-saves as you type
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
