/**
 * Debug component to show current settings state
 */

import React from 'react';
import { useContentStore } from '../../stores/contentStore';

export const SettingsDebug: React.FC = () => {
  const { settings, isInitialized, refreshSettings } = useContentStore();

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Settings Debug</h4>
      <p>Initialized: {isInitialized ? 'Yes' : 'No'}</p>
      <p>Settings count: {Object.keys(settings).length}</p>
      <div className="mt-2 max-h-32 overflow-y-auto">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="mb-1">
            <strong>{key}:</strong> {value}
          </div>
        ))}
      </div>
      <button
        onClick={refreshSettings}
        className="mt-2 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
      >
        Refresh Settings
      </button>
    </div>
  );
};