/**
 * Notepad toggle button component
 * Floating action button to open/close the notepad
 */

import React from 'react';
import { FileText, X } from 'lucide-react';
import { useGameStore } from '../../stores/gameStore';

export const NotepadToggle: React.FC = () => {
  const { isNotepadOpen, toggleNotepad, puzzleNotes, getNotesKey, currentPuzzle } = useGameStore();

  // Check if current puzzle has notes
  const hasNotes = currentPuzzle ? 
    puzzleNotes[getNotesKey(currentPuzzle.id)]?.trim().length > 0 : false;

  return (
    <button
      onClick={toggleNotepad}
      className={`
        fixed bottom-6 right-6 z-30
        w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-200 ease-in-out
        transform hover:scale-105 active:scale-95
        ${isNotepadOpen 
          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
        }
        ${hasNotes ? 'ring-2 ring-blue-300 ring-offset-2' : ''}
      `}
      title={isNotepadOpen ? 'Close notepad' : 'Open notepad'}
    >
      {isNotepadOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <FileText className="h-6 w-6" />
      )}
      
      {/* Badge indicator for notes */}
      {hasNotes && !isNotepadOpen && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </button>
  );
};
