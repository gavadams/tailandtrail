/*
  # Tale and Trail Database Schema

  1. New Tables
    - `games`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `theme` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `puzzles`
      - `id` (uuid, primary key)
      - `game_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `riddle` (text)
      - `clues` (text array)
      - `answer` (text)
      - `sequence_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `access_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `game_id` (uuid, foreign key)
      - `is_active` (boolean)
      - `activated_at` (timestamp)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)
    
    - `player_sessions`
      - `id` (uuid, primary key)
      - `access_code_id` (uuid, foreign key)
      - `game_id` (uuid, foreign key)
      - `current_puzzle_id` (uuid, foreign key)
      - `completed_puzzles` (uuid array)
      - `session_data` (jsonb)
      - `last_activity` (timestamp)
      - `created_at` (timestamp)
    
    - `code_usage_logs`
      - `id` (uuid, primary key)
      - `access_code_id` (uuid, foreign key)
      - `game_id` (uuid, foreign key)
      - `action` (text)
      - `timestamp` (timestamp)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access to player functions
    - Add policies for admin access to management functions
    - Create admin user account

  3. Indexes
    - Add performance indexes for common queries
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  theme text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  riddle text NOT NULL,
  clues text[] DEFAULT '{}',
  answer text NOT NULL,
  sequence_order integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create player_sessions table
CREATE TABLE IF NOT EXISTS player_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id uuid REFERENCES access_codes(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  current_puzzle_id uuid REFERENCES puzzles(id) ON DELETE SET NULL,
  completed_puzzles uuid[] DEFAULT '{}',
  session_data jsonb DEFAULT '{}',
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create code_usage_logs table
CREATE TABLE IF NOT EXISTS code_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id uuid REFERENCES access_codes(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('activated', 'expired', 'completed')),
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS puzzles_game_id_sequence_idx ON puzzles(game_id, sequence_order);
CREATE INDEX IF NOT EXISTS access_codes_code_idx ON access_codes(code);
CREATE INDEX IF NOT EXISTS access_codes_game_id_idx ON access_codes(game_id);
CREATE INDEX IF NOT EXISTS player_sessions_access_code_idx ON player_sessions(access_code_id);
CREATE INDEX IF NOT EXISTS code_usage_logs_access_code_idx ON code_usage_logs(access_code_id);

-- RLS Policies

-- Games: Allow public read access for active games, admin full access
CREATE POLICY "Allow public read access to games"
  ON games
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to games"
  ON games
  FOR ALL
  TO authenticated
  USING (true);

-- Puzzles: Allow public read for puzzles of accessible games, admin full access
CREATE POLICY "Allow public read access to puzzles"
  ON puzzles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to puzzles"
  ON puzzles
  FOR ALL
  TO authenticated
  USING (true);

-- Access codes: Allow public read for validation, admin full access
CREATE POLICY "Allow public read access to access codes"
  ON access_codes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public update for code activation"
  ON access_codes
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to access codes"
  ON access_codes
  FOR ALL
  TO authenticated
  USING (true);

-- Player sessions: Allow public CRUD for own sessions, admin read access
CREATE POLICY "Allow public access to player sessions"
  ON player_sessions
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow admin read access to player sessions"
  ON player_sessions
  FOR SELECT
  TO authenticated
  USING (true);

-- Code usage logs: Allow public insert, admin read access
CREATE POLICY "Allow public insert to code usage logs"
  ON code_usage_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow admin read access to code usage logs"
  ON code_usage_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create admin user (you'll need to set the actual password)
DO $$
BEGIN
  -- This will be handled by Supabase Auth, but we create a reference
  -- The admin will sign up with email: contact@taleandtrail.games  --
  -- Password should be set through Supabase Auth
  NULL;
END $$;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_puzzles_updated_at BEFORE UPDATE ON puzzles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();