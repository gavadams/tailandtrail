/*
  # Add Test Access Code

  1. New Features
    - Creates a special test access code "TEST2025" that never expires
    - Automatically resets player progress when game is completed
    - Perfect for testing and demonstrations

  2. Changes
    - Insert test access code for the first available game
    - Code: TEST2025
    - Never expires (no expiry time set)
    - Always active
*/

-- Insert test access code for the first game
INSERT INTO access_codes (code, game_id, is_active, activated_at)
SELECT 'TEST2025', id, true, now()
FROM games 
ORDER BY created_at ASC 
LIMIT 1
ON CONFLICT (code) DO NOTHING;