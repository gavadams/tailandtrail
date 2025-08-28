/**
 * How It Works page explaining the game mechanics
 */

import React from 'react';
import { Play, Key, Trophy, Clock, Users, Lightbulb } from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-100 mb-6">
            How to Play Tale and Trail
          </h1>
          <p className="text-xl text-amber-200 mb-12">
            Your complete guide to the ultimate puzzle adventure experience
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 bg-amber-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-amber-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Key className="h-10 w-10 text-amber-100" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-4">1. Get Your Code</h3>
              <p className="text-amber-700 text-lg">
                Purchase your unique access code and receive it instantly via email. 
                Each code unlocks 12 hours of puzzle-solving adventure.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-amber-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="h-10 w-10 text-amber-100" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-4">2. Start Playing</h3>
              <p className="text-amber-700 text-lg">
                Enter your code to begin. Solve puzzles in sequence, with progressive 
                clues revealed when you need help. Resume anytime within your window.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-amber-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-amber-100" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-4">3. Complete & Win</h3>
              <p className="text-amber-700 text-lg">
                Work through all puzzles to complete your adventure. Each game 
                tells a unique story with immersive narrative elements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Game Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-amber-100 text-center mb-12">
            Game Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-amber-800 rounded-xl p-6 text-center">
              <Clock className="h-12 w-12 text-amber-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-amber-100 mb-3">12-Hour Access</h3>
              <p className="text-amber-200">
                Your code activates when first used and remains valid for 12 full hours
              </p>
            </div>

            <div className="bg-amber-800 rounded-xl p-6 text-center">
              <Lightbulb className="h-12 w-12 text-amber-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-amber-100 mb-3">Progressive Clues</h3>
              <p className="text-amber-200">
                Stuck? Wrong answers reveal helpful clues to guide you forward
              </p>
            </div>

            <div className="bg-amber-800 rounded-xl p-6 text-center">
              <Users className="h-12 w-12 text-amber-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-amber-100 mb-3">Team Friendly</h3>
              <p className="text-amber-200">
                Perfect for solo players or groups - work together to solve puzzles
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-amber-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-amber-900 text-center mb-8">
            Pro Tips for Success
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-amber-900 mb-3">📱 Mobile Friendly</h3>
              <p className="text-amber-800">
                Play on any device! The game works perfectly on phones, tablets, and computers.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-amber-900 mb-3">🧠 Think Outside the Box</h3>
              <p className="text-amber-800">
                Some puzzles require creative thinking. Don't be afraid to try unusual answers!
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-amber-900 mb-3">⏰ Take Your Time</h3>
              <p className="text-amber-800">
                You have 12 hours from first use. Take breaks, discuss with friends, and enjoy the journey.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold text-amber-900 mb-3">💡 Use the Clues</h3>
              <p className="text-amber-800">
                Don't worry about wrong answers - they unlock helpful clues that guide you to the solution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-green-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Get your access code and begin the ultimate puzzle experience today!
          </p>
          <a
            href="/purchase"
            className="bg-white text-green-700 hover:bg-green-50 font-bold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg inline-flex items-center space-x-2"
          >
            <Trophy className="h-5 w-5" />
            <span>Purchase Access Code</span>
          </a>
        </div>
      </section>
    </div>
  );
};