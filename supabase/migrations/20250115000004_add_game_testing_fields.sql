/*
  # Add Game Testing Fields
  
  This migration adds two boolean fields to the games table to track
  whether games and their content have been tested and confirmed good.
*/

-- Add game testing fields to games table
ALTER TABLE games 
ADD COLUMN game_tested BOOLEAN DEFAULT FALSE,
ADD COLUMN content_tested BOOLEAN DEFAULT FALSE;

-- Add comments to document the purpose of these fields
COMMENT ON COLUMN games.game_tested IS 'Indicates whether the game mechanics and flow have been tested and confirmed good';
COMMENT ON COLUMN games.content_tested IS 'Indicates whether all puzzles, clues, and content have been tested and confirmed good';
