/**
 * Splash screen component for story narrative between puzzles
 * Displays rich content with images and story elements
 */

import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { SplashScreen as SplashScreenType } from '../../types';

interface SplashScreenProps {
  splashScreen: SplashScreenType;
  onContinue: () => void;
  isLastInSequence?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ splashScreen, onContinue, isLastInSequence = false }) => {
  const handleContinue = () => {
    // Scroll to top before continuing
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onContinue();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-b from-gray-100 to-gray-50 rounded-2xl shadow-2xl overflow-hidden border-4 border-yellow-600">
          {/* Media Section */}
          {(splashScreen.image_url || splashScreen.video_url) && (
            <div className="bg-gray-900">
              {splashScreen.video_url ? (
                <video 
                  className="w-full h-auto object-contain"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={splashScreen.video_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img 
                  src={splashScreen.image_url} 
                  alt={splashScreen.title}
                  className="w-full h-auto object-contain"
                />
              )}
            </div>
          )}

          {/* Title Section - Now below media */}
          {(splashScreen.image_url || splashScreen.video_url) && (
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {splashScreen.title}
              </h1>
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12">
            {!splashScreen.image_url && !splashScreen.video_url && (
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
                {splashScreen.title}
              </h1>
            )}

            <div 
              className="prose prose-gray max-w-none text-gray-800 text-lg leading-relaxed mb-8"
              dangerouslySetInnerHTML={{ __html: splashScreen.content }}
            />

            <div className="text-center">
              <button
                onClick={handleContinue}
                className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-yellow-100 font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg inline-flex items-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>{isLastInSequence ? 'Continue Adventure' : 'Continue'}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};