/**
 * Location-specific page for SEO
 * Dynamically generates pages for each active city
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, Users, Trophy, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SEOHead } from '../SEO/SEOHead';
import type { City, Game } from '../../types';

export const LocationPage: React.FC = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [city, setCity] = useState<City | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (citySlug) {
      loadCityData(citySlug);
    }
  }, [citySlug]);

  const loadCityData = async (slug: string) => {
    try {
      setIsLoading(true);
      
      // Convert slug back to city name
      const cityName = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Get city data
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('name', cityName)
        .eq('is_active', true)
        .single();

      if (cityError || !cityData) {
        setError('City not found or not active');
        return;
      }

      setCity(cityData);

      // Get games for this city
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select(`
          *,
          cities (id, name, country)
        `)
        .eq('city_id', cityData.id)
        .eq('is_active', true);

      if (!gamesError && gamesData) {
        setGames(gamesData);
      }

    } catch (err) {
      setError('Failed to load city data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-yellow-200 text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">City Not Found</h1>
          <p className="text-gray-300 mb-6">The requested city is not available or not active.</p>
          <Link 
            to="/" 
            className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const cityKeywords = [
    `${city.name.toLowerCase()} pub crawl`,
    `${city.name.toLowerCase()} pub crawl games`,
    `${city.name.toLowerCase()} mystery adventures`,
    `${city.name.toLowerCase()} puzzle trails`,
    `${city.name.toLowerCase()} interactive experiences`,
    `${city.name.toLowerCase()} group activities`,
    'location based puzzle games',
    'mystery pub crawl',
    'interactive pub adventure',
    'puzzle adventure games',
    'mystery games for groups',
    'pub treasure hunt',
    'location based gaming',
    'real world puzzle games',
    'adventure pub crawl',
    'mystery solving games',
    'detective puzzle games',
    'group adventure activities',
    'interactive mystery experience',
    'escape room style pub crawl',
    'puzzle hunt games',
    'mystery trail games',
    'team building pub activities',
    'immersive puzzle experience',
    'mystery adventure walks',
    'historic pub mysteries',
    'city center puzzle games',
    'walking mystery tours',
    'urban adventure games',
    'mobile puzzle adventures',
    'smartphone treasure hunts',
    'digital scavenger hunts',
    'web app puzzle games',
    'browser based adventure games',
    'progressive web app games',
    'mobile mystery games',
    'team building activities',
    'date night activities',
    'group entertainment',
    'weekend adventures',
    'corporate team events',
    'birthday party activities',
    'bachelor bachelorette activities',
    'tourist attractions',
    'local experiences',
    'unique group activities',
    'location based entertainment',
    'mystery games'
  ];

  return (
    <>
      <SEOHead 
        title={`Mystery Pub Crawl Games in ${city.name} | Tale and Trail`}
        description={`Experience immersive mystery pub crawl games in ${city.name}. Solve puzzles, follow clues, and uncover secrets in real-world locations. Perfect for groups, teams, and adventure seekers.`}
        keywords={cityKeywords}
        canonicalUrl={`https://www.taleandtrail.games/locations/${citySlug}`}
        city={city}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <MapPin className="h-8 w-8 text-yellow-400 mr-3" />
              <span className="text-yellow-400 text-lg font-semibold">{city.name}</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-yellow-200 mb-6 leading-tight">
              Mystery Pub Crawl Games in {city.name}
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience immersive puzzle adventures in {city.name}. Solve mysteries, follow clues, and uncover secrets in real-world locations. Perfect for groups, teams, and adventure seekers.
            </p>
            
            <div className="bg-gray-800 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-yellow-200 mb-4">Why Choose {city.name} for Your Adventure?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-2">Historic Pubs & Landmarks</h3>
                  <p>Explore {city.name}'s most iconic locations while solving puzzles and uncovering hidden secrets.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-2">Perfect for Groups</h3>
                  <p>Whether you're planning a team building event, birthday party, or date night, our {city.name} adventures are ideal.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-2">Mobile-First Experience</h3>
                  <p>All you need is your smartphone to access clues and track your progress through {city.name}.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-2">Flexible Timing</h3>
                  <p>Start your {city.name} adventure whenever you're ready with our 12-hour flexible window.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/purchase"
                className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-gray-900 font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg inline-flex items-center justify-center space-x-2"
              >
                <Trophy className="h-5 w-5" />
                <span>Get Your Access Code</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Game Information */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600 flex flex-col items-center justify-center text-center">
                <Clock className="h-12 w-12 text-yellow-400 mb-4" />
                <div className="text-3xl font-bold text-yellow-200 mb-2">12hrs</div>
                <div className="text-yellow-300 text-sm">Game Duration</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600 flex flex-col items-center justify-center text-center">
                <Users className="h-12 w-12 text-yellow-400 mb-4" />
                <div className="text-3xl font-bold text-yellow-200 mb-2">1-6</div>
                <div className="text-yellow-300 text-sm">Players</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600 flex flex-col items-center justify-center text-center">
                <MapPin className="h-12 w-12 text-yellow-400 mb-4" />
                <div className="text-3xl font-bold text-yellow-200 mb-2">{city.name}</div>
                <div className="text-yellow-300 text-sm">Location</div>
              </div>
            </div>

            {/* Available Games */}
            {games.length > 0 && (
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-yellow-200 text-center mb-8">
                  Available Games in {city.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {games.map((game) => (
                    <div key={game.id} className="bg-gray-800 rounded-lg p-6 shadow-lg border border-yellow-600">
                      <h3 className="text-xl font-bold text-yellow-200 mb-3">{game.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {(game as any).difficulty && (
                          <span className="inline-block bg-amber-600 text-amber-100 text-xs px-2 py-1 rounded-full uppercase tracking-wide">
                            {(game as any).difficulty}
                          </span>
                        )}
                        {(game as any).walking_distance_miles !== null && (game as any).walking_distance_miles !== undefined && (
                          <span className="inline-block bg-gray-700 text-yellow-200 text-xs px-2 py-1 rounded-full">
                            {(game as any).walking_distance_miles} miles
                          </span>
                        )}
                        {(game as any).area && (
                          <span className="inline-block bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">
                            {(game as any).area}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-3">{game.description}</p>
                      <Link
                        to={`/purchase?city=${city.id}&game=${game.id}`}
                        className="bg-yellow-600 hover:bg-yellow-700 text-gray-900 font-bold px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-2"
                      >
                        <span>Play Now</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local SEO Content */}
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg border border-yellow-600">
              <h2 className="text-2xl font-bold text-yellow-200 mb-6 text-center">
                Why Choose Tale and Trail in {city.name}?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-3">Perfect for Groups</h3>
                  <p className="text-gray-300 mb-4">
                    Whether you're planning a team building event, birthday party, or just a fun day out with friends, 
                    our mystery pub crawl games in {city.name} provide the perfect interactive experience.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-3">Real-World Adventure</h3>
                  <p className="text-gray-300 mb-4">
                    Explore {city.name}'s historic pubs and landmarks while solving puzzles and uncovering mysteries. 
                    Our location-based games turn the city into your playground.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-3">Flexible Timing</h3>
                  <p className="text-gray-300 mb-4">
                    Start your adventure whenever you're ready. With a 12-hour window, you can take breaks, 
                    enjoy meals, and explore at your own pace throughout {city.name}.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-yellow-300 mb-3">Mobile-First Experience</h3>
                  <p className="text-gray-300 mb-4">
                    All you need is your smartphone to access clues, solve puzzles, and track your progress. 
                    No special equipment required for your {city.name} adventure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready for Your {city.name} Adventure?
            </h2>
            <p className="text-xl text-green-100 mb-8">
              Join thousands of players who have discovered the magic of location-based mystery games.
            </p>
            <Link
              to="/purchase"
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-gray-900 font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg inline-flex items-center space-x-2"
            >
              <Trophy className="h-5 w-5" />
              <span>Get Your Access Code</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};
