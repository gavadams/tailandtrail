/**
 * Standardized messaging constants
 * Ensures consistency across the application
 */

export const MESSAGING = {
  // Call-to-Action (CTA) buttons
  CTAs: {
    START_ADVENTURE: 'Start Your Adventure',
    GET_ACCESS_CODE: 'Get Your Access Code',
    PLAY_NOW: 'Play Now',
    BUY_NOW: 'Buy Now',
    PURCHASE_ACCESS_CODE: 'Purchase Access Code',
    COMPLETE_PURCHASE: 'Complete Purchase',
    SEND_MESSAGE: 'Send Message',
    SUBMIT: 'Submit',
    CONTINUE: 'Continue',
    CANCEL: 'Cancel',
  },

  // Standardized terminology
  TERMS: {
    GAME: 'Game',
    GAMES: 'Games',
    ACCESS_CODE: 'Access Code',
    ACCESS_CODES: 'Access Codes',
    PURCHASE: 'Purchase',
    CITY: 'City',
    CITIES: 'Cities',
  },

  // Error messages
  ERRORS: {
    GENERIC: 'An error occurred. Please try again.',
    NETWORK: 'Network error. Please check your connection and try again.',
    VALIDATION: 'Please check your input and try again.',
    PAYMENT_FAILED: 'Payment failed. Please try again.',
    INVALID_ACCESS_CODE: 'Invalid access code. Please check your code and try again.',
  },

  // Success messages
  SUCCESS: {
    PURCHASE_COMPLETE: 'Purchase completed successfully!',
    MESSAGE_SENT: 'Message sent successfully! We\'ll get back to you soon.',
    CODE_GENERATED: 'Access code generated successfully!',
  },

  // Loading states
  LOADING: {
    PROCESSING: 'Processing...',
    LOADING: 'Loading...',
    SUBMITTING: 'Submitting...',
    SENDING: 'Sending...',
    LOADING_PAYMENT: 'Loading payment form...',
  },
} as const;

// Helper function to get consistent CTA text
export const getCTA = (key: keyof typeof MESSAGING.CTAs): string => {
  return MESSAGING.CTAs[key];
};

// Helper function to get consistent term (singular/plural)
export const getTerm = (key: keyof typeof MESSAGING.TERMS, plural: boolean = false): string => {
  if (plural && key === 'GAME') return MESSAGING.TERMS.GAMES;
  if (plural && key === 'ACCESS_CODE') return MESSAGING.TERMS.ACCESS_CODES;
  if (plural && key === 'CITY') return MESSAGING.TERMS.CITIES;
  return MESSAGING.TERMS[key];
};

