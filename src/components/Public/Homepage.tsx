/**
 * Homepage component with hero section and game information
 * Content is managed through the admin panel
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, ArrowRight } from 'lucide-react';
import { useContentStore } from '../../stores/contentStore';
import { SEOHead } from '../SEO/SEOHead';
import { getActiveCities } from '../../utils/sitemapGenerator';
import type { City } from '../../types';

export const Homepage: React.FC = () => {
  const { getSetting } = useContentStore();
  const [activeCities, setActiveCities] = useState<City[]>([]);

  useEffect(() => {
    // Load active cities for SEO
    getActiveCities().then(setActiveCities);
  }, []);

  // Get primary city (Newcastle upon Tyne or first active city)
  const primaryCity = activeCities.find(city => 
    city.name.toLowerCase().includes('newcastle')
  ) || activeCities[0];

  return (
    <>
      <SEOHead 
        title="Tale and Trail - Interactive Pub Crawl Mystery Games"
        description="Experience immersive mystery pub crawl games in Newcastle upon Tyne. Solve puzzles, follow clues, and uncover secrets in real-world locations. Perfect for groups, teams, and adventure seekers."
        canonicalUrl="https://tailandtrail.com"
        city={primaryCity}
      />
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

      {/* SEO Content Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Interactive Pub Crawl Games & Mystery Adventures
            </h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              Experience the ultimate location-based puzzle adventure in Newcastle upon Tyne. 
              Our immersive mystery pub crawl games combine real-world exploration with digital puzzle solving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Perfect for Groups & Team Building
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Team Building Activities:</strong> Our interactive mystery experiences are perfect for corporate team events, 
                  helping teams work together to solve puzzles and uncover secrets.
                </p>
                <p>
                  <strong>Group Entertainment:</strong> Whether you're planning a birthday party, bachelor/bachelorette party, 
                  or just a fun day out with friends, our pub crawl games provide unique group entertainment.
                </p>
                <p>
                  <strong>Date Night Activities:</strong> Looking for something different? Our mystery adventures offer 
                  the perfect date night activity that combines exploration, problem-solving, and fun.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Real-World Puzzle Adventures
              </h3>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Location-Based Gaming:</strong> Turn Newcastle upon Tyne into your playground with our 
                  GPS-enabled puzzle games that guide you through historic pubs and landmarks.
                </p>
                <p>
                  <strong>Mobile Mystery Games:</strong> All you need is your smartphone to access clues, 
                  solve puzzles, and track your progress through our progressive web app.
                </p>
                <p>
                  <strong>Digital Scavenger Hunts:</strong> Our QR code puzzle games and smartphone treasure hunts 
                  create an immersive experience that blends the digital and physical worlds.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why Choose Tale and Trail for Your Adventure?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Flexible Timing</h4>
                <p className="text-gray-700">
                  Start your adventure whenever you're ready. With a 12-hour window, you can take breaks, 
                  enjoy meals, and explore at your own pace.
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">No Special Equipment</h4>
                <p className="text-gray-700">
                  All you need is your smartphone and an internet connection. Our browser-based adventure games 
                  work on any device with a web browser.
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Local Experiences</h4>
                <p className="text-gray-700">
                  Discover hidden gems and historic locations in Newcastle upon Tyne while solving mysteries 
                  and completing interactive challenges.
                </p>
              </div>
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
    </>
  );
};