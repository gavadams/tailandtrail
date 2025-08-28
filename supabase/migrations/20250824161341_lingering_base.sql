/*
  # Fix Access Codes RLS Policy

  1. New Policy
    - Add INSERT policy for `access_codes` table to allow public users to create access codes
    - This enables the purchase flow to generate access codes after successful payment

  2. Security
    - Maintains security by only allowing INSERT operations
    - Existing SELECT and UPDATE policies remain unchanged
*/

-- Add INSERT policy for access_codes table to allow public users to create access codes
CREATE POLICY "Allow public insert to access codes"
  ON access_codes
  FOR INSERT
  TO public
  WITH CHECK (true);