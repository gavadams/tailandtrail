/*
  # Add Theme Overlay Settings
  
  This migration adds settings to control a theme overlay feature
  that allows admins to apply transparent GIF overlays to all pages.
*/

-- Add theme overlay settings to site_settings table
INSERT INTO site_settings (key, value, type, category, label, description) VALUES
('theme_overlay_enabled', 'false', 'boolean', 'theme', 'Enable Theme Overlay', 'Enable or disable the theme overlay feature'),
('theme_overlay_url', '', 'text', 'theme', 'Overlay Image URL', 'URL to the transparent GIF overlay image'),
('theme_overlay_opacity', '0.3', 'number', 'theme', 'Overlay Opacity', 'Opacity of the overlay (0.0 to 1.0)'),
('theme_overlay_position', 'fixed', 'text', 'theme', 'Overlay Position', 'CSS position for the overlay (fixed, absolute)'),
('theme_overlay_z_index', '1000', 'number', 'theme', 'Overlay Z-Index', 'Z-index for the overlay layer');
