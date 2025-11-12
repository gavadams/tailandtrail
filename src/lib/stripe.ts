/**
 * Stripe payment integration
 * Handles payment processing for access code purchases
 */

import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export const getStripe = () => stripePromise;

export const createPaymentIntent = async (amount: number, gameId: string, email: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is not configured');
  }
  
  const requestBody = JSON.stringify({
    amount,
    game_id: gameId,
    email,
    currency: 'GBP'
  });
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create payment intent: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Unable to connect to payment service. Please check that the Supabase Edge Function is deployed and accessible.');
    }
    console.error('Error in createPaymentIntent:', error);
    throw error;
  }
};