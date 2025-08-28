/*
  # Add default content and settings

  1. Default site settings
    - Site name, description, contact info
    - Hero content for homepage
    - Game pricing and features

  2. Default pages
    - Privacy Policy
    - Terms of Service
    - FAQ page
    - Contact page

  3. Sample content
    - Default game with puzzles
    - Sample splash screens
*/

-- Insert default site settings
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
  ('site_name', 'Tale and Trail', 'text', 'general', 'Site Name', 'The name of your website'),
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
  ('privacy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information when you use our Tale and Trail games.</p><h3>Information We Collect</h3><p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p><h3>How We Use Your Information</h3><p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p><h3>Information Sharing</h3><p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p><h3>Contact Us</h3><p>If you have any questions about this privacy policy, please contact us at privacy@pubpuzzlecrawl.com.</p>', 'Learn about how we protect your privacy and handle your personal information.', true, true, 90),
  ('terms', 'Terms of Service', '<h2>Terms of Service</h2><p>Welcome to Tale and Trail! These terms of service govern your use of our website and games.</p><h3>Acceptance of Terms</h3><p>By accessing and using our service, you accept and agree to be bound by the terms and provision of this agreement.</p><h3>Game Access</h3><p>Access codes are valid for 12 hours from first use. Codes are non-transferable and non-refundable once activated.</p><h3>User Conduct</h3><p>You agree to use our service only for lawful purposes and in accordance with these terms.</p><h3>Limitation of Liability</h3><p>We shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p><h3>Contact</h3><p>For questions about these terms, contact us at legal@pubpuzzlecrawl.com.</p>', 'Read our terms of service and user agreement for using Tale and Trail.', true, true, 91),
  ('faq', 'Frequently Asked Questions', '<h2>Frequently Asked Questions</h2><h3>How long do I have to complete a game?</h3><p>Each access code is valid for 12 hours from the moment you first use it. You can take breaks and resume your progress anytime within this window.</p><h3>Can I play with friends?</h3><p>Absolutely! Our games are designed to be enjoyed solo or with a group. Share your screen or work together to solve the puzzles.</p><h3>What if I get stuck on a puzzle?</h3><p>Don''t worry! Our progressive clue system reveals helpful hints when you submit incorrect answers. Each wrong answer unlocks a new clue to guide you forward.</p><h3>Are the games mobile-friendly?</h3><p>Yes! Our games work perfectly on phones, tablets, and computers. Play anywhere, anytime within your 12-hour window.</p><h3>Can I get a refund?</h3><p>We offer refunds for unused access codes within 24 hours of purchase. Once a code is activated, it cannot be refunded.</p><h3>How do I contact support?</h3><p>Email us at support@pubpuzzlecrawl.com and we''ll get back to you within 24 hours.</p>', 'Find answers to common questions about Tale and Trail games and access codes.', true, true, 10),
  ('contact', 'Contact Us', '<h2>Contact Us</h2><p>We''d love to hear from you! Get in touch with any questions, feedback, or support needs.</p><h3>Email</h3><p>General inquiries: info@pubpuzzlecrawl.com<br>Support: support@pubpuzzlecrawl.com<br>Business: business@pubpuzzlecrawl.com</p><h3>Phone</h3><p>+1 (555) 123-4567<br>Available Monday-Friday, 9 AM - 6 PM EST</p><h3>Address</h3><p>Tale and Trail<br>123 Puzzle Street<br>Adventure City, AC 12345</p><h3>Response Time</h3><p>We typically respond to all inquiries within 24 hours during business days.</p>', 'Get in touch with the Tale and Trail team for support, questions, or feedback.', true, true, 92)
ON CONFLICT (slug) DO NOTHING;

-- Create a sample game with puzzles (only if no games exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM games LIMIT 1) THEN
    -- Insert sample game
    INSERT INTO games (id, title, description, theme) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'Mystery at the Old Tavern', 'A thrilling mystery adventure that takes you through the secrets of an ancient tavern. Solve puzzles, uncover clues, and discover the truth behind the mysterious disappearance.', 'mystery');
    
    -- Insert sample puzzles
    INSERT INTO puzzles (game_id, title, description, riddle, clues, answer, sequence_order) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'The Locked Door', 'You find yourself facing a mysterious locked door with strange symbols.', 'I have keys but no locks. I have space but no room. You can enter but not go inside. What am I?', ARRAY['Think about something you use every day', 'It has letters and numbers', 'You use it to type'], 'keyboard', 1),
      ('550e8400-e29b-41d4-a716-446655440000', 'The Bartender''s Riddle', 'The old bartender left behind a cryptic message about his secret recipe.', 'I am not alive, but I grow; I don''t have lungs, but I need air; I don''t have a mouth, but water kills me. What am I?', ARRAY['Think about something that consumes', 'It needs oxygen to survive', 'Water is its enemy'], 'fire', 2),
      ('550e8400-e29b-41d4-a716-446655440000', 'The Final Secret', 'The last clue leads you to the tavern''s greatest mystery.', 'The more you take, the more you leave behind. What am I?', ARRAY['Think about movement', 'You create them when you walk', 'They show where you''ve been'], 'footsteps', 3);
    
    -- Insert sample splash screens
    INSERT INTO splash_screens (game_id, title, content, sequence_order, puzzle_id) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'Welcome to the Old Tavern', '<p>The year is 1892, and you''ve just arrived at the Old Tavern, a mysterious establishment that has been closed for decades. Local legends speak of a treasure hidden within its walls, and strange disappearances that occurred here long ago.</p><p>As you push open the heavy wooden door, the hinges creak ominously. Dust particles dance in the dim light filtering through grimy windows. You''re here to solve the mystery that has puzzled the townspeople for generations.</p><p>Your adventure begins now...</p>', 1, NULL),
      ('550e8400-e29b-41d4-a716-446655440000', 'The Plot Thickens', '<p>Excellent work solving the first puzzle! As the locked door creaks open, you discover a dimly lit room filled with old furniture covered in white sheets. The air is thick with the scent of aged wood and forgotten memories.</p><p>On a dusty table, you notice an old journal left behind by the tavern''s last bartender. The pages are yellowed with age, but the writing is still legible. It speaks of a secret recipe that was more valuable than gold...</p><p>But someone—or something—doesn''t want you to find it.</p>', 2, '550e8400-e29b-41d4-a716-446655440001');
  END IF;
END $$;