/*
  # Enhanced Features Migration

  1. New Tables
    - `splash_screens` - Story elements between puzzles
    - `purchases` - Purchase tracking and analytics
    - `content_pages` - Dynamic page content management
    - `site_settings` - Site-wide configuration settings

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for public and admin access

  3. Sample Data
    - Default site settings
    - Sample content pages
*/

-- Splash Screens Table
CREATE TABLE IF NOT EXISTS splash_screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  sequence_order integer NOT NULL DEFAULT 1,
  puzzle_id uuid REFERENCES puzzles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE splash_screens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to splash screens"
  ON splash_screens
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public read access to splash screens"
  ON splash_screens
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX splash_screens_game_id_sequence_idx ON splash_screens(game_id, sequence_order);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  access_code_id uuid REFERENCES access_codes(id) ON DELETE CASCADE,
  amount integer NOT NULL, -- Amount in cents
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  opt_in_marketing boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to purchases"
  ON purchases
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public insert to purchases"
  ON purchases
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE INDEX purchases_email_idx ON purchases(email);
CREATE INDEX purchases_game_id_idx ON purchases(game_id);
CREATE INDEX purchases_created_at_idx ON purchases(created_at);

-- Content Pages Table
CREATE TABLE IF NOT EXISTS content_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  meta_description text,
  is_published boolean DEFAULT false,
  show_in_nav boolean DEFAULT false,
  nav_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to content pages"
  ON content_pages
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public read access to published pages"
  ON content_pages
  FOR SELECT
  TO public
  USING (is_published = true);

CREATE INDEX content_pages_slug_idx ON content_pages(slug);
CREATE INDEX content_pages_nav_order_idx ON content_pages(nav_order);

-- Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'textarea', 'html', 'image', 'boolean', 'number')),
  category text NOT NULL DEFAULT 'general',
  label text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access to site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public read access to site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

CREATE INDEX site_settings_category_idx ON site_settings(category);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_splash_screens_updated_at
  BEFORE UPDATE ON splash_screens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pages_updated_at
  BEFORE UPDATE ON content_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default site settings
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
  ('site_name', 'Tail and Trail Game', 'text', 'general', 'Site Name', 'The name of your website'),
  ('site_description', 'Experience the ultimate puzzle adventure through your favorite pubs. Solve mysteries, unlock clues, and compete with friends in this immersive gaming experience.', 'textarea', 'general', 'Site Description', 'Brief description of your site'),
  ('hero_title', 'The Ultimate Pub Puzzle Adventure', 'text', 'homepage', 'Hero Title', 'Main headline on homepage'),
  ('hero_subtitle', 'Solve mysteries, unlock clues, and compete with friends in an immersive puzzle experience that takes you through the best pubs in town.', 'textarea', 'homepage', 'Hero Subtitle', 'Subtitle text on homepage'),
  ('game_price', '29.99', 'text', 'pricing', 'Game Price', 'Price per game access code'),
  ('contact_email', 'info@pubpuzzlecrawl.com', 'text', 'contact', 'Contact Email', 'Main contact email address'),
  ('contact_phone', '+1 (555) 123-4567', 'text', 'contact', 'Contact Phone', 'Contact phone number'),
  ('contact_address', '123 Puzzle Street, Adventure City, AC 12345', 'text', 'contact', 'Contact Address', 'Physical address')
ON CONFLICT (key) DO NOTHING;

-- Insert default content pages
INSERT INTO content_pages (slug, title, content, meta_description, is_published, show_in_nav, nav_order) VALUES
  ('how-it-works', 'How It Works', '<h2>Getting Started</h2><p>Our pub puzzle crawl is designed to be easy to start but challenging to master. Here''s how it works:</p><ol><li><strong>Purchase Your Code:</strong> Buy a unique access code that gives you 12 hours of gameplay from first use.</li><li><strong>Start Playing:</strong> Enter your code and begin solving puzzles in sequence.</li><li><strong>Get Clues:</strong> Wrong answers reveal helpful clues to guide you forward.</li><li><strong>Complete the Adventure:</strong> Work through all puzzles to complete your journey.</li></ol>', 'Learn how our pub puzzle crawl game works', true, true, 1),
  ('faq', 'Frequently Asked Questions', '<h2>Common Questions</h2><h3>How long do I have to complete the game?</h3><p>Each access code is valid for 12 hours from first use. You can pause and resume anytime within this window.</p><h3>Can I play with friends?</h3><p>Absolutely! The game is designed for 1-6 players and is even more fun with a group.</p><h3>What if I get stuck?</h3><p>Our progressive clue system helps when you''re stuck. Submit wrong answers to reveal helpful hints.</p><h3>Do I need to download anything?</h3><p>No downloads required! Play directly in your web browser on any device.</p>', 'Frequently asked questions about our puzzle games', true, true, 2),
  ('contact', 'Contact Us', '<h2>Get in Touch</h2><p>Have questions or need support? We''re here to help!</p><p><strong>Email:</strong> info@pubpuzzlecrawl.com</p><p><strong>Phone:</strong> +1 (555) 123-4567</p><p><strong>Address:</strong> 123 Puzzle Street, Adventure City, AC 12345</p><h3>Support Hours</h3><p>Monday - Friday: 9:00 AM - 6:00 PM<br>Saturday - Sunday: 10:00 AM - 4:00 PM</p>', 'Contact information and support details', true, false, 0),
  ('privacy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p><h3>Information We Collect</h3><p>We collect only the information necessary to provide our services, including email addresses for purchase confirmation and game access codes.</p><h3>How We Use Your Information</h3><p>We use your information to process purchases, send access codes, and provide customer support. We do not sell or share your personal information with third parties.</p><h3>Data Security</h3><p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>', 'Our privacy policy and data protection practices', true, false, 0),
  ('terms', 'Terms of Service', '<h2>Terms of Service</h2><p>By using our service, you agree to these terms and conditions.</p><h3>Game Access</h3><p>Access codes are valid for 12 hours from first use and are non-transferable. Each code is for single use only.</p><h3>Refund Policy</h3><p>Refunds are available within 24 hours of purchase if the access code has not been used.</p><h3>User Conduct</h3><p>Users must not attempt to hack, reverse engineer, or otherwise compromise the game system.</p><h3>Limitation of Liability</h3><p>Our liability is limited to the purchase price of the game access code.</p>', 'Terms and conditions for using our service', true, false, 0)
ON CONFLICT (slug) DO NOTHING;