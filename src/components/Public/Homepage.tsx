/**
 * Homepage component with hero section and game information
 * Content is managed through the admin panel
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, ArrowRight } from 'lucide-react';
import { useContentStore } from '../../stores/contentStore';

export const Homepage: React.FC = () => {
  const { getSetting } = useContentStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-200 mb-6 leading-tight">
            {getSetting('hero_title', 'The Ultimate Pub Puzzle Adventure')}
          </h1>
          <p className="text-xl md:text-2xl text-yellow-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {getSetting('hero_subtitle', 'Solve mysteries, unlock clues, and compete with friends in an immersive puzzle experience that takes you through the best pubs in town.')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              to="/purchase"
              className="bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-yellow-100 font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Start Your Adventure</span>
            </Link>
            <Link
              to="/play"
              className="border-2 border-yellow-400 text-yellow-200 hover:bg-gray-800 font-bold px-8 py-4 rounded-lg transition-all duration-200 text-lg flex items-center space-x-2"
            >
              <span>Have a Code? Play Now</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">12hrs</div>
              <div className="text-yellow-300 text-sm">Game Duration</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">1-6</div>
              <div className="text-yellow-300 text-sm">Players</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">Many UK</div>
              <div className="text-yellow-300 text-sm">Locations</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600 flex flex-col items-center justify-center text-center">
              <div className="text-3xl font-bold text-yellow-200 mb-2">★★★★★</div>
              <div className="text-yellow-300 text-sm">Rated</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Get ready for an unforgettable adventure in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-yellow-600">
                <span className="text-2xl font-bold text-yellow-200">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Purchase Your Code</h3>
              <p className="text-gray-700">
                Buy your unique access code and receive it instantly via email. Each code is valid for 12 hours from first use.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-yellow-600">
                <span className="text-2xl font-bold text-yellow-200">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Start Playing</h3>
              <p className="text-gray-700">
                Enter your code to begin the adventure. Solve puzzles in sequence, with helpful clues revealed when you need them.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-yellow-600">
                <span className="text-2xl font-bold text-yellow-200">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Complete & Win</h3>
              <p className="text-gray-700">
                Work through all puzzles to complete your adventure. Resume anytime within your 12-hour window.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-100 mb-6">
            Ready for Your Adventure?
          </h2>
          <p className="text-xl text-yellow-200 mb-8">
            Join thousands of players who have already experienced the thrill of our puzzle adventures.
          </p>
          <Link
            to="/purchase"
            className="bg-yellow-100 text-green-800 hover:bg-yellow-50 font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg inline-flex items-center space-x-2"
          >
            <Trophy className="h-5 w-5" />
            <span>Get Your Access Code</span>
          </Link>
        </div>
      </section>
    </div>
  );
};