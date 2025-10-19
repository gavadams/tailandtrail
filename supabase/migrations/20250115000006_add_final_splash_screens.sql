/*
  # Final Splash Screens Support
  
  This migration adds support for splash screens that appear after the last puzzle
  by allowing a special 'END' value in the puzzle_id field.
*/

-- First, we need to change the column type from UUID to TEXT to allow 'END' values
-- We'll do this by dropping the foreign key constraint, changing the column type, and adding a new constraint

-- Drop the existing foreign key constraint
ALTER TABLE splash_screens DROP CONSTRAINT IF EXISTS splash_screens_puzzle_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE splash_screens ALTER COLUMN puzzle_id TYPE TEXT;

-- Add a new constraint that allows either a valid UUID or the special 'END' value
ALTER TABLE splash_screens ADD CONSTRAINT splash_screens_puzzle_id_check 
  CHECK (puzzle_id IS NULL OR puzzle_id = 'END' OR puzzle_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

-- Add a comment to document the special 'END' value
COMMENT ON COLUMN splash_screens.puzzle_id IS 'UUID of puzzle this splash screen appears before, NULL for intro screens, or ''END'' for final screens after last puzzle';
