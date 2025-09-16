/**
 * Theme Overlay Component
 * Applies a transparent GIF overlay to all pages when enabled
 */

import React from 'react';
import { useContentStore } from '../../stores/contentStore';

export const ThemeOverlay: React.FC = () => {
  const { getSetting } = useContentStore();
  
  const isEnabled = getSetting('theme_overlay_enabled', 'false') === 'true';
  const overlayUrl = getSetting('theme_overlay_url', '');
  const opacity = parseFloat(getSetting('theme_overlay_opacity', '0.3'));
  const position = getSetting('theme_overlay_position', 'fixed');
  const zIndex = parseInt(getSetting('theme_overlay_z_index', '1000'));
  
  // Debug logging
  console.log('ThemeOverlay render:', { overlayUrl, isEnabled, opacity, position, zIndex });

  // Don't render if disabled or no URL provided
  if (!isEnabled || !overlayUrl) {
    console.log('ThemeOverlay: Not rendering - disabled or no URL');
    return null;
  }

  console.log('ThemeOverlay: Rendering overlay with URL:', overlayUrl);

  return (
    <div
      style={{
        position: position as 'fixed' | 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${overlayUrl})`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto',
        backgroundPosition: 'center',
        opacity: opacity,
        zIndex: zIndex,
        pointerEvents: 'none', // Allow clicks to pass through
      }}
    />
  );
};
