/**
 * Theme Overlay Component
 * Applies a transparent GIF overlay to all pages when enabled
 */

import React, { useState, useEffect } from 'react';
import { useContentStore } from '../../stores/contentStore';

export const ThemeOverlay: React.FC = () => {
  const { getSetting } = useContentStore();
  
  const adminEnabled = getSetting('theme_overlay_enabled', 'false') === 'true';
  const overlayUrl = getSetting('theme_overlay_url', '');
  const opacity = parseFloat(getSetting('theme_overlay_opacity', '0.3'));
  
  // Local state for user toggle (starts with admin setting)
  const [userEnabled, setUserEnabled] = useState(adminEnabled);
  
  // Update user setting when admin setting changes
  useEffect(() => {
    setUserEnabled(adminEnabled);
  }, [adminEnabled]);
  
  // Debug logging
  console.log('ThemeOverlay render:', { overlayUrl, adminEnabled, userEnabled, opacity });

  // Don't render if admin has disabled it or no URL provided
  if (!adminEnabled || !overlayUrl) {
    console.log('ThemeOverlay: Not rendering - admin disabled or no URL');
    return null;
  }

  console.log('ThemeOverlay: Rendering overlay with URL:', overlayUrl);

  return (
    <>
      {/* Theme Overlay - only show if user has it enabled */}
      {userEnabled && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${overlayUrl})`,
            backgroundRepeat: 'repeat',
            backgroundPosition: 'center',
            opacity: opacity,
            zIndex: 9999, // High z-index to ensure it's on top
            pointerEvents: 'none', // Allow clicks to pass through
          }}
          className="bg-cover sm:bg-contain md:bg-cover lg:bg-contain xl:bg-cover bg-center bg-no-repeat"
        />
      )}
      
      {/* Theme Toggle Switch - always show when admin has enabled theme overlay */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 10000,
        }}
        className="bg-black bg-opacity-60 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg"
      >
        <div className="flex items-center space-x-2">
          <span className="text-white text-xs font-medium">Theme</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={userEnabled}
              onChange={(e) => setUserEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      </div>
    </>
  );
};
