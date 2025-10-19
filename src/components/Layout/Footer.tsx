/**
 * Site footer with dynamic content and links
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Beer, Mail, Phone, MapPin, Instagram } from 'lucide-react';
import { useContentStore } from '../../stores/contentStore';

export const Footer: React.FC = () => {
  const { getSetting } = useContentStore();

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Beer className="h-6 w-6 text-gray-900" />
              </div>
              <h3 className="text-xl font-bold">
                {getSetting('site_name')}
              </h3>
            </div>
            <p className="text-yellow-300 mb-4 max-w-md">
              {getSetting('site_description', 'Experience the ultimate puzzle adventure through your favorite pubs. Solve mysteries, unlock clues, and compete with friends in this immersive gaming experience.')}
            </p>
            <div className="space-y-2">
              {getSetting('contact_email') && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{getSetting('contact_email')}</span>
                </div>
              )}
              {getSetting('contact_instagram') && (
                <div className="flex items-center space-x-2">
                  <Instagram className="h-4 w-4" />
                  <span className="text-sm">{getSetting('contact_instagram')}</span>
                </div>
              )}
              {getSetting('contact_address') && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{getSetting('contact_address')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/purchase" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  Purchase
                </Link>
              </li>
              <li>
                <Link to="/play" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  Play Game
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-yellow-300 hover:text-yellow-100 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-yellow-600 mt-8 pt-8 text-center">
          <p className="text-yellow-300">
            © {new Date().getFullYear()} {getSetting('site_name')}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};