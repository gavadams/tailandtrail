/**
 * Purchase page with Stripe payment integration
 * Handles game selection, payment processing, and code generation
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Mail, Shield, CheckCircle, AlertCircle, Loader, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Game, City } from '../../types';
import { useContentStore } from '../../stores/contentStore';
import { getStripe, createPaymentIntent } from '../../lib/stripe';

interface PurchaseForm {
  email: string;
  game_id: string;
  city_id: string;
  opt_in_marketing: boolean;
}

interface StripeCheckoutFormProps {
  selectedGame: Game;
  email: string;
  opt_in_marketing: boolean;
  clientSecret: string;
  setPurchaseComplete: (complete: boolean) => void;
  setAccessCode: (code: string) => void;
  setError: (error: string | null) => void;
  setIsProcessing: (processing: boolean) => void;
  isProcessing: boolean;
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  selectedGame,
  email,
  opt_in_marketing,
  clientSecret,
  setPurchaseComplete,
  setAccessCode,
  setError,
  setIsProcessing,
  isProcessing
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { getSetting } = useContentStore();

  // Stripe objects ready when not null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/purchase-success`,
        },
        redirect: 'if_required'
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Fallback: ensure newsletter capture post-payment as well
        try {
          if (opt_in_marketing && email) {
            const { error: nlError } = await supabase
              .from('newsletter_subscribers')
              .insert({ email, source: 'purchase', ip_address: undefined } as any, { onConflict: 'email', ignoreDuplicates: true });
            if (nlError) {
              console.warn('Post-payment newsletter insert error:', nlError);
            }
          }
        } catch (e) {
          console.warn('Post-payment newsletter capture failed', e);
        }
        // Payment successful - generate access code and create records
        await handleSuccessfulPayment(paymentIntent.id);
      } else {
        setError('Payment was not completed. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleSuccessfulPayment = async (paymentIntentId: string) => {
    try {
      // Generate unique access code
      let code;
      let isUnique = false;
      
      while (!isUnique) {
        code = generateAccessCode();
        const { data: existingCode } = await supabase
          .from('access_codes')
          .select('id')
          .eq('code', code)
          .single();
        
        isUnique = !existingCode;
      }

      // Create access code
      const { data: codeData, error: codeError } = await supabase
        .from('access_codes')
        .insert({
          code: code,
          game_id: selectedGame.id,
          is_active: true
        })
        .select()
        .single();

      if (codeError) throw codeError;

      // Create purchase record
      const gamePrice = getSetting('game_price', '29.99');
      const amount = Math.round(parseFloat(gamePrice) * 100);

      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          email: email,
          game_id: selectedGame.id,
          access_code_id: codeData.id,
          amount: amount,
          stripe_payment_intent_id: paymentIntentId,
          status: 'completed',
          opt_in_marketing: opt_in_marketing
        });

      if (purchaseError) throw purchaseError;

      // ✅ Send access code email via Edge Function (now Resend-powered)
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-access-code-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: email,
            accessCode: code,
            gameTitle: selectedGame.title,
            customerName: email.split('@')[0],
            startLocationLabel: (selectedGame as any).start_location_label || null,
            startLocationUrl: (selectedGame as any).start_location_maps_url || null
          })
        });

        if (!emailResponse.ok) {
          const emailError = await emailResponse.json();
          console.error('Failed to send access code email:', emailError);
          // Don't throw here - purchase was successful, email is secondary
        } else {
          console.log('Access code email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending access code email:', emailError);
        // Don't throw here - purchase was successful, email is secondary
      }
      setAccessCode(code!);
      setPurchaseComplete(true);

    } catch (error) {
      console.error('Post-payment processing failed:', error);
      setError('Payment succeeded but there was an issue generating your access code. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!stripe || !elements ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800">Loading payment form...</p>
        </div>
      ) : (
        <>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-amber-900 mb-2">Payment Details</h3>
            <PaymentElement />
          </div>

          <button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>Complete Purchase</span>
              </>
            )}
          </button>
        </>
      )}
    </form>
  );
};

export const PurchasePage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [accessCode, setAccessCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const { getSetting } = useContentStore();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PurchaseForm>({
    defaultValues: {
      opt_in_marketing: true
    }
  });
  const watchGameId = watch('game_id');
  const watchCityId = watch('city_id');
  const watchEmail = watch('email');
  const watchOptIn = watch('opt_in_marketing');

  const stripePromise = getStripe();
  const location = useLocation();

  // Stripe configured

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (watchCityId) {
      const city = cities.find(c => c.id === watchCityId);
      setSelectedCity(city || null);
      loadGames(city?.id);
    }
  }, [watchCityId, cities]);

  useEffect(() => {
    if (watchGameId) {
      const game = games.find(g => g.id === watchGameId);
      setSelectedGame(game || null);
    }
  }, [watchGameId, games]);

  // Preselect via URL params: ?city=...&game=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cityParam = params.get('city');
    const gameParam = params.get('game');

    if (cities.length > 0 && cityParam && !watchCityId) {
      const city = cities.find(c => c.id === cityParam);
      if (city) {
        setValue('city_id', city.id, { shouldValidate: true, shouldDirty: true });
        setSelectedCity(city);
        loadGames(city.id);
      }
    }

    if (games.length > 0 && gameParam && !watchGameId) {
      const game = games.find(g => g.id === gameParam);
      if (game) {
        setValue('game_id', game.id, { shouldValidate: true, shouldDirty: true });
        setSelectedGame(game);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, cities, games]);

  useEffect(() => {
    // Create payment intent when game and email are available
    const initializePayment = async () => {
      if (!selectedGame || !watchEmail) return;
      
      try {
        setIsLoadingPayment(true);
        setError(null);
        const gamePrice = getSetting('game_price', '29.99');
        const amount = Math.round(parseFloat(gamePrice) * 100); // Convert to cents

        const { client_secret } = await createPaymentIntent(amount, selectedGame.id, watchEmail);
        setClientSecret(client_secret);
      } catch (error) {
        console.error('Failed to initialize payment:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize payment. Please try again.');
      } finally {
        setIsLoadingPayment(false);
      }
    };

    if (showStripeForm && selectedGame && watchEmail) {
      initializePayment();
    }
  }, [showStripeForm, selectedGame, watchEmail, getSetting]);

  const loadCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Failed to load cities:', error);
      setError('Failed to load available cities');
    }
  };

  const loadGames = async (cityId?: string) => {
    try {
      let query = supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Failed to load games:', error);
      setError('Failed to load available games');
    }
  };

  const handleFormSubmit = async (_data: PurchaseForm) => {
    if (!selectedCity) {
      setError('Please select a city');
      return;
    }

    if (!selectedGame) {
      setError('Please select a game');
      return;
    }

    setError(null);
    // Capture newsletter subscription before payment if opted-in
    try {
      if (_data.opt_in_marketing && _data.email) {
        const ipAddress = undefined; // Optionally populate from server if desired
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert({ email: _data.email, source: 'purchase', ip_address: ipAddress } as any, { onConflict: 'email', ignoreDuplicates: true });
        if (error) {
          console.warn('Newsletter insert error:', error);
        }
      }
    } catch (e) {
      console.warn('Newsletter upsert failed', e);
      // Do not block checkout flow
    }
    setShowStripeForm(true);
  };

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-b from-green-50 to-green-100 rounded-2xl shadow-2xl p-8 border-4 border-green-600">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-green-900 mb-4">
                Purchase Successful!
              </h2>
              <p className="text-green-700 mb-6">
                Your payment has been processed and your access code has been generated.
              </p>

              {/* Delivery notice */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 p-4 rounded-md mb-6 text-left">
                <p className="font-semibold mb-1">Check your email for your access code</p>
                <p className="text-sm">If you don't see it within a few minutes, please check your spam or junk folder and mark the message as not spam.</p>
              </div>
              
              <div className="bg-green-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-green-900 mb-2">Your Access Code</h3>
                <div className="text-3xl font-mono font-bold text-green-800 tracking-wider">
                  {accessCode}
                </div>
                <p className="text-green-700 text-sm mt-2">
                  Valid for 12 hours from first use
                </p>
              </div>

              <div className="space-y-4">
                {(selectedGame as any)?.start_location_label || (selectedGame as any)?.start_location_maps_url ? (
                  <div className="rounded-xl p-5 border-2 border-green-600 bg-green-50 text-left shadow-sm">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-5 w-5 text-green-700 mr-2" />
                      <h3 className="font-extrabold text-green-900 tracking-wide uppercase text-sm">Starting Location</h3>
                    </div>
                    {(selectedGame as any)?.start_location_label && (
                      <p className="text-green-900 font-semibold mb-1">{(selectedGame as any).start_location_label}</p>
                    )}
                    {(selectedGame as any)?.start_location_maps_url && (
                      <a
                        className="inline-block mt-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                        href={(selectedGame as any).start_location_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                ) : null}
                <a
                  href="/play"
                  className="block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Start Playing Now
                </a>
                <p className="text-green-700 text-sm text-center">
                  Save this code! You can also find it in your email receipt.
                </p>
                <a
                  href="/"
                  className="block text-green-700 hover:text-green-800 font-medium"
                >
                  Return to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-amber-100 mb-4">
            Purchase Your Adventure
          </h1>
          <p className="text-xl text-amber-200">
            Choose your game and get instant access to hours of puzzle fun
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Game Selection */}
          <div className="bg-amber-50 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-900 mb-6">Select Your Game</h2>
            
            {!showStripeForm ? (
              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Choose City
                  </label>
                  <select
                    {...register('city_id', { required: 'Please select a city' })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Select a city...</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}, {city.country}
                      </option>
                    ))}
                  </select>
                  {errors.city_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.city_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Choose Game
                  </label>
                  <select
                    {...register('game_id', { required: 'Please select a game' })}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                    disabled={!selectedCity}
                  >
                    <option value="">
                      {selectedCity ? 'Select a game...' : 'Please select a city first'}
                    </option>
                    {games.map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.title} - £{getSetting('game_price', '20.00')}
                      </option>
                    ))}
                  </select>
                  {errors.game_id && (
                    <p className="text-red-600 text-sm mt-1">{errors.game_id.message}</p>
                  )}
                  {selectedCity && games.length === 0 && (
                    <p className="text-amber-600 text-sm mt-1">
                      No games available in {selectedCity.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-900 mb-2">
                    Email Address
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    {...register('opt_in_marketing')}
                    type="checkbox"
                    id="marketing"
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-amber-300 rounded"
                  />
                  <label htmlFor="marketing" className="ml-2 text-sm text-amber-800">
                    Subscribe to our newsletter for updates and special offers
                  </label>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedGame}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Proceed to Payment</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-100 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 mb-2">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Game:</span>
                      <span className="font-medium">{selectedGame?.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{watchEmail}</span>
                    </div>
                    <div className="flex justify-between border-t border-amber-300 pt-2 font-bold">
                      <span>Total:</span>
                      <span>£{getSetting('game_price', '20.00')}</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                )}


            {/* Loading Payment */}
            {isLoadingPayment && (
              <div className="text-center py-8">
                <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-600" />
                <p className="text-amber-800">Initializing secure payment...</p>
              </div>
            )}

            {/* Payment Error */}
            {!isLoadingPayment && !clientSecret && showStripeForm && (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
                <p className="text-red-800">Unable to initialize payment. Please refresh and try again.</p>
              </div>
            )}

            {/* Stripe Payment Form */}
            {!isLoadingPayment && clientSecret && clientSecret.length > 0 && selectedGame && watchEmail && stripePromise && (
              <>
                <Elements 
                  stripe={stripePromise}
                  options={{
                    clientSecret: clientSecret
                  }}
                >
                  <StripeCheckoutForm
                    selectedGame={selectedGame}
                    email={watchEmail}
                    opt_in_marketing={watchOptIn || false}
                    clientSecret={clientSecret}
                    setPurchaseComplete={setPurchaseComplete}
                    setAccessCode={setAccessCode}
                    setError={setError}
                    setIsProcessing={setIsProcessing}
                    isProcessing={isProcessing}
                  />
                </Elements>
              </>
            )}

                <button
                  onClick={() => setShowStripeForm(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Game Selection
                </button>
              </div>
            )}
          </div>

          {/* Game Details */}
          <div className="space-y-6">
            {selectedGame ? (
              <div className="bg-amber-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-2xl font-bold text-amber-100 mb-4">
                  {selectedGame.title}
                </h3>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="inline-block bg-amber-600 text-amber-100 text-xs px-2 py-1 rounded-full uppercase tracking-wide">
                    {selectedGame.theme}
                  </span>
                  {(selectedGame as any).difficulty && (
                    <span className="inline-block bg-amber-500 text-amber-100 text-xs px-2 py-1 rounded-full uppercase tracking-wide">
                      {(selectedGame as any).difficulty}
                    </span>
                  )}
                  {/* City derived from game.city_id */}
                  {(() => {
                    const cityForGame = cities.find(c => c.id === selectedGame.city_id);
                    return cityForGame ? (
                      <span className="inline-flex items-center gap-1 bg-amber-700/60 text-amber-100 text-xs px-2 py-1 rounded-full">
                        <MapPin className="h-3 w-3" />
                        {cityForGame.name}
                      </span>
                    ) : null;
                  })()}
                  {(selectedGame as any).area && (
                    <span className="inline-block bg-blue-900 text-blue-200 text-xs px-2 py-1 rounded-full">
                      {(selectedGame as any).area}
                    </span>
                  )}
                  {(selectedGame as any).walking_distance_miles !== null && (selectedGame as any).walking_distance_miles !== undefined && (
                    <span className="inline-block bg-amber-700 text-amber-100 text-xs px-2 py-1 rounded-full">
                      {(selectedGame as any).walking_distance_miles} miles
                    </span>
                  )}
                </div>
                <p className="text-amber-200 mb-6">
                  {selectedGame.description}
                </p>
                <div className="text-3xl font-bold text-amber-100">
                  £{getSetting('game_price', '20.00')}
                </div>
              </div>
            ) : (
              <div className="bg-amber-800 rounded-xl p-6 shadow-xl text-center">
                <p className="text-amber-200">
                  Select a game to see details
                </p>
              </div>
            )}

            {/* Features */}
            <div className="bg-amber-50 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-amber-900 mb-4">What's Included</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">12 hours of gameplay from first use</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Progressive clue system</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Resume anytime within window</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Mobile and desktop compatible</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-amber-800">Instant access after payment</span>
                </li>
              </ul>
            </div>

            {/* Security */}
            <div className="bg-green-50 rounded-xl p-6 shadow-xl">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-bold text-green-900">Secure Payment</h3>
              </div>
              <p className="text-green-800 text-sm">
                Your payment is processed securely through Stripe. We never store your payment information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};