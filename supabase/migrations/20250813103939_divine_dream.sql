/*
  # Add Media Support to Puzzles and Splash Screens

  1. New Columns
    - Add `image_url` and `video_url` to `puzzles` table
    - Add `video_url` to `splash_screens` table (image_url already exists)

  2. Features
    - Puzzles can now have images and videos
    - Splash screens can have both images and videos
    - Videos will take priority over images when both are present
*/

-- Add media columns to puzzles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'puzzles' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE puzzles ADD COLUMN image_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'puzzles' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE puzzles ADD COLUMN video_url text;
  END IF;
END $$;

-- Add video column to splash_screens table (image_url already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'splash_screens' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE splash_screens ADD COLUMN video_url text;
  END IF;
END $$;