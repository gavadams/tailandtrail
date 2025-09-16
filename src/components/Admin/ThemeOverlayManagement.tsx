/**
 * Theme Overlay Management Component
 * Allows admin to configure theme overlay settings
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Eye, EyeOff, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useContentStore } from '../../stores/contentStore';

interface ThemeOverlayForm {
  theme_overlay_url: string;
  theme_overlay_enabled: boolean;
  theme_overlay_opacity: number;
}

interface ThemeImage {
  name: string;
  filename: string;
  url: string;
}

export const ThemeOverlayManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [, setSettingsExist] = useState<boolean | null>(null);
  const [isCustomUrl, setIsCustomUrl] = useState(false);
  const [themeImages, setThemeImages] = useState<ThemeImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  const { getSetting, refreshSettings } = useContentStore();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ThemeOverlayForm>();

  const watchedImageUrl = watch('theme_overlay_url');

  // Fetch theme images from GitHub API
  const fetchThemeImages = async () => {
    try {
      setLoadingImages(true);
      const response = await fetch('https://api.github.com/repos/gavadams/tailandtrail/contents/Images/Themes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch theme images');
      }
      
      const files = await response.json();
      
      // Filter for image files and create theme image objects
      const images: ThemeImage[] = files
        .filter((file: any) => {
          const extension = file.name.toLowerCase().split('.').pop();
          return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension);
        })
        .map((file: any) => {
          // Create a friendly name from filename
          const name = file.name
            .replace(/[-_]/g, ' ')
            .replace(/\.[^/.]+$/, '') // Remove extension
            .replace(/\b\w/g, (l: string) => l.toUpperCase()); // Capitalize words
          
          return {
            name: name,
            filename: file.name,
            url: file.download_url
          };
        });
      
      setThemeImages(images);
    } catch (err) {
      console.error('Error fetching theme images:', err);
      setError('Failed to load theme images from GitHub');
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    // Fetch theme images on component mount
    fetchThemeImages();
  }, []);

  useEffect(() => {
    // Load current settings
    const imageUrl = getSetting('theme_overlay_url', '');
    const enabled = getSetting('theme_overlay_enabled', 'false') === 'true';
    const opacity = parseFloat(getSetting('theme_overlay_opacity', '0.3'));
    
    // Check if current URL is a custom URL (not in our theme images)
    const isCustom = Boolean(imageUrl && !themeImages.some(img => img.url === imageUrl));
    setIsCustomUrl(isCustom);
    
    reset({
      theme_overlay_url: imageUrl,
      theme_overlay_enabled: enabled,
      theme_overlay_opacity: opacity
    });

    // Check if settings exist in database
    checkSettingsExist();
  }, [reset]); // Remove getSetting from dependencies to prevent infinite re-renders

  const checkSettingsExist = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key')
        .in('key', ['theme_overlay_url', 'theme_overlay_enabled', 'theme_overlay_opacity']);
      
      if (error) {
        console.error('Error checking settings:', error);
        return;
      }
      
      setSettingsExist(data?.length === 3);
    } catch (err) {
      console.error('Error checking settings:', err);
    }
  };

  useEffect(() => {
    // Clear messages after 5 seconds
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const onSubmit = async (data: ThemeOverlayForm) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Updating theme overlay settings:', data);

      // First, check if the settings exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('site_settings')
        .select('*')
        .in('key', ['theme_overlay_url', 'theme_overlay_enabled', 'theme_overlay_opacity']);

      console.log('Existing settings:', existingSettings);

      if (fetchError) throw fetchError;

      // Update or insert theme overlay image URL
      const urlSetting = existingSettings?.find(s => s.key === 'theme_overlay_url');
      if (urlSetting) {
        // Update existing setting
        const { data: urlData, error: urlError } = await supabase
          .from('site_settings')
          .update({ 
            value: data.theme_overlay_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', urlSetting.id)
          .select();

        console.log('URL update result:', { urlData, urlError });
        if (urlError) throw urlError;
      } else {
        // Insert new setting
        const { data: urlData, error: urlError } = await supabase
          .from('site_settings')
          .insert({
            key: 'theme_overlay_url',
            value: data.theme_overlay_url,
            type: 'text',
            category: 'theme_overlay',
            label: 'Theme Overlay Image URL',
            description: 'URL of the transparent GIF image to use as a site-wide overlay.'
          })
          .select();

        console.log('URL insert result:', { urlData, urlError });
        if (urlError) throw urlError;
      }

      // Update or insert theme overlay enabled status
      const enabledSetting = existingSettings?.find(s => s.key === 'theme_overlay_enabled');
      if (enabledSetting) {
        // Update existing setting
        const { data: enabledData, error: enabledError } = await supabase
          .from('site_settings')
          .update({ 
            value: data.theme_overlay_enabled.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', enabledSetting.id)
          .select();

        console.log('Enabled update result:', { enabledData, enabledError });
        if (enabledError) throw enabledError;
      } else {
        // Insert new setting
        const { data: enabledData, error: enabledError } = await supabase
          .from('site_settings')
          .insert({
            key: 'theme_overlay_enabled',
            value: data.theme_overlay_enabled.toString(),
            type: 'boolean',
            category: 'theme_overlay',
            label: 'Enable Theme Overlay',
            description: 'Toggle to enable or disable the site-wide theme overlay.'
          })
          .select();

        console.log('Enabled insert result:', { enabledData, enabledError });
        if (enabledError) throw enabledError;
      }

      // Update or insert theme overlay opacity
      const opacitySetting = existingSettings?.find(s => s.key === 'theme_overlay_opacity');
      if (opacitySetting) {
        const { error: opacityError } = await supabase
          .from('site_settings')
          .update({ 
            value: data.theme_overlay_opacity.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', opacitySetting.id)
          .select();

        if (opacityError) throw opacityError;
      } else {
        const { error: opacityError } = await supabase
          .from('site_settings')
          .insert({
            key: 'theme_overlay_opacity',
            value: data.theme_overlay_opacity.toString(),
            type: 'number',
            category: 'theme',
            label: 'Overlay Opacity',
            description: 'Opacity of the overlay (0.0 to 1.0)'
          })
          .select();

        if (opacityError) throw opacityError;
      }


      // Refresh the content store
      console.log('Refreshing content store...');
      await refreshSettings();

      setSuccess('Theme overlay settings updated successfully!');
    } catch (err) {
      console.error('Error updating theme overlay settings:', err);
      setError(`Failed to update theme overlay settings: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewToggle = () => {
    setPreviewMode(!previewMode);
    // Temporarily update the setting for preview
    if (!previewMode && watchedImageUrl) {
      setValue('theme_overlay_enabled', true);
    } else if (previewMode) {
      setValue('theme_overlay_enabled', false);
    }
  };

  const handleThemeImageSelect = (imageUrl: string) => {
    setValue('theme_overlay_url', imageUrl);
    setIsCustomUrl(false);
  };


  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Image className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Theme Overlay Management</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviewToggle}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              previewMode
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            disabled={!watchedImageUrl}
          >
            {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{previewMode ? 'Hide Preview' : 'Preview'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Enable Theme Overlay</h4>
            <p className="text-sm text-gray-500">
              Toggle to enable or disable the site-wide theme overlay
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register('theme_overlay_enabled')}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Theme Image Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme Overlay Image
          </label>
          
          {/* Toggle between dropdown and custom URL */}
          <div className="flex space-x-2 mb-3">
            <button
              type="button"
              onClick={() => setIsCustomUrl(false)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                !isCustomUrl
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              Choose from Themes
            </button>
            <button
              type="button"
              onClick={() => setIsCustomUrl(true)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                isCustomUrl
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              Custom URL
            </button>
          </div>

          {!isCustomUrl ? (
            /* Theme Images Dropdown */
            <div className="space-y-2">
              <select
                value={watchedImageUrl}
                onChange={(e) => handleThemeImageSelect(e.target.value)}
                disabled={loadingImages}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingImages ? 'Loading theme images...' : 'Select a theme image...'}
                </option>
                {themeImages.map((image) => (
                  <option key={image.url} value={image.url}>
                    {image.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">
                {loadingImages 
                  ? 'Loading theme images from GitHub...' 
                  : 'Choose from available theme images in the Images/Themes/ folder.'
                }
              </p>
            </div>
          ) : (
            /* Custom URL Input */
            <div>
              <input
                type="url"
                {...register('theme_overlay_url', {
                  required: 'Image URL is required when overlay is enabled',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL starting with http:// or https://'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/your-transparent-gif.gif"
              />
              {errors.theme_overlay_url && (
                <p className="mt-1 text-sm text-red-600">{errors.theme_overlay_url.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Enter the URL of a transparent background GIF image to use as a site-wide overlay.
              </p>
            </div>
          )}
        </div>

        {/* Opacity Control */}
        <div>
          <label htmlFor="theme_overlay_opacity" className="block text-sm font-medium text-gray-700 mb-2">
            Opacity
          </label>
          <input
            type="range"
            id="theme_overlay_opacity"
            min="0"
            max="1"
            step="0.1"
            {...register('theme_overlay_opacity', {
              required: 'Opacity is required',
              min: { value: 0, message: 'Opacity must be at least 0' },
              max: { value: 1, message: 'Opacity must be at most 1' }
            })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">{Math.round(watch('theme_overlay_opacity') * 100)}%</span>
            <span>100%</span>
          </div>
          {errors.theme_overlay_opacity && (
            <p className="mt-1 text-sm text-red-600">{errors.theme_overlay_opacity.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Adjust the transparency of the overlay. Lower values make it more subtle.
          </p>
        </div>

        {/* Image Preview */}
        {watchedImageUrl && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">Image Preview</h4>
            <div className="relative w-full h-32 bg-white border rounded-md overflow-hidden">
              <img
                src={watchedImageUrl}
                alt="Theme overlay preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'flex items-center justify-center h-full text-gray-500';
                  errorDiv.textContent = 'Failed to load image';
                  target.parentNode?.appendChild(errorDiv);
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Preview of your overlay image. The actual overlay will be semi-transparent and repeated across the site.
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Usage Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload your transparent GIF image to a hosting service (e.g., Cloudinary, AWS S3, or any CDN)</li>
          <li>• Copy the direct URL to your image and paste it above</li>
          <li>• Use the preview button to test how the overlay looks on your site</li>
          <li>• The overlay will appear on all pages when enabled</li>
          <li>• The overlay is semi-transparent and won't interfere with user interactions</li>
        </ul>
      </div>
    </div>
  );
};
