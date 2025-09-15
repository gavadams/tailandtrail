-- Add player_email column to player_sessions table
-- This allows us to store the customer's email from the purchase record

ALTER TABLE player_sessions 
ADD COLUMN player_email TEXT;

-- Add a comment to document the purpose
COMMENT ON COLUMN player_sessions.player_email IS 'Customer email from the associated purchase record';
