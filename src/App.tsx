/**
 * Main App component that handles routing and authentication flow
 * Manages the overall application state and navigation
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { supabase } from './lib/supabase';
import { useGameStore } from './stores/gameStore';
import { useContentStore } from './stores/contentStore';

// Components
import { Navigation } from './components/Layout/Navigation';
import { Footer } from './components/Layout/Footer';
import { ThemeOverlay } from './components/Layout/ThemeOverlay';
import { Homepage } from './components/Public/Homepage';
import { PurchasePage } from './components/Public/PurchasePage';
import { AccessCodeInput } from './components/Player/AccessCodeInput';
import { PlayerGame } from './components/Player/PlayerGame';
import { AdminLogin } from './components/Admin/AdminLogin';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { TestGame } from './components/Admin/TestGame';
import { HowItWorksPage } from './components/Public/HowItWorksPage';
import { FAQPage } from './components/Public/FAQPage';
import { ContactPage } from './components/Public/ContactPage';
import { DynamicPage } from './components/Public/DynamicPage';

// Component to handle scroll to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { currentSession, error, setError, clearSession } = useGameStore();
  const { initialize } = useContentStore();

  useEffect(() => {
    // Check for existing admin session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAdminAuthenticated(!!session);
      setIsCheckingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdminAuthenticated(!!session);
      if (event === 'SIGNED_OUT') {
        setIsAdminAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize content store (loads settings and pages)
    initialize();
    
    // Load game data if session exists
    const { currentSession } = useGameStore.getState();
    if (currentSession) {
      loadGameData(currentSession);
    }
  }, []);

  const loadGameData = async (session: any) => {
    try {
      // Load game data
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('id', session.game_id)
        .single();
      
      if (gameData) {
        useGameStore.getState().setGame(gameData);
      }

      // Load puzzles
      const { data: puzzlesData } = await supabase
        .from('puzzles')
        .select('*')
        .eq('game_id', session.game_id)
        .order('sequence_order');
      
      if (puzzlesData) {
        useGameStore.getState().setPuzzles(puzzlesData);
      }

      // Load access code
      const { data: codeData } = await supabase
        .from('access_codes')
        .select('*')
        .eq('id', session.access_code_id)
        .single();
      
      if (codeData) {
        useGameStore.getState().setAccessCode(codeData);
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
    }
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-200 mx-auto mb-4"></div>
          <p className="text-yellow-200 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Navigation />
      <div className="App">
        {/* Global Error Display */}
        {error && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md">
            <div className="flex items-center justify-between">
              <p className="font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-200 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <Routes>
          {/* Player Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/purchase" element={<PurchasePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Dynamic pages from CMS */}
          <Route path="/privacy" element={<DynamicPage slug="privacy" />} />
          <Route path="/terms" element={<DynamicPage slug="terms" />} />
          <Route path="/:slug" element={<DynamicPage />} />
          
          <Route
            path="/play"
            element={
              currentSession ? (
                <PlayerGame />
              ) : (
                <AccessCodeInput />
              )
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              isAdminAuthenticated ? (
                <AdminDashboard onLogout={handleAdminLogout} />
              ) : (
                <AdminLogin onLogin={handleAdminLogin} />
              )
            }
          />

          {/* Test Game Route - Admin Only */}
          <Route
            path="/test-game/:gameId"
            element={
              isAdminAuthenticated ? (
                <TestGame />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
      <Footer />
      <ThemeOverlay />
      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

export default App;