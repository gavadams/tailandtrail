/**
 * SEO Head component for dynamic meta tags
 * Handles page titles, descriptions, Open Graph, and structured data
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import type { City } from '../../types';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  city?: City;
  structuredData?: object;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Tale and Trail - Interactive Pub Crawl Mystery Games',
  description = 'Experience immersive mystery pub crawl games in Newcastle upon Tyne. Solve puzzles, follow clues, and uncover secrets in real-world locations. Perfect for groups, teams, and adventure seekers.',
  keywords = [
    'pub crawl',
    'pub crawl games',
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
    'newcastle upon tyne pub crawl',
    'newcastle pub crawl games',
    'newcastle mystery adventures',
    'newcastle puzzle trails',
    'newcastle interactive experiences',
    'newcastle group activities',
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
  ],
  canonicalUrl,
  ogImage = 'https://www.taleandtrail.games/og-image.jpg',
  ogType = 'website',
  city,
  structuredData
}) => {
  // Generate city-specific title and description if city is provided
  const cityName = city?.name || 'Newcastle upon Tyne';
  const cityTitle = city 
    ? `${title} in ${cityName}`
    : title;
  
  const cityDescription = city
    ? `Experience immersive mystery pub crawl games in ${cityName}. Solve puzzles, follow clues, and uncover secrets in real-world locations. Perfect for groups, teams, and adventure seekers.`
    : description;

  // Generate city-specific keywords
  const cityKeywords = city
    ? [
        ...keywords,
        `${cityName.toLowerCase()} pub crawl`,
        `${cityName.toLowerCase()} pub crawl games`,
        `${cityName.toLowerCase()} mystery adventures`,
        `${cityName.toLowerCase()} puzzle trails`,
        `${cityName.toLowerCase()} interactive experiences`,
        `${cityName.toLowerCase()} group activities`
      ]
    : keywords;

  // Default structured data for local business
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Tale and Trail",
    "description": cityDescription,
    "url": canonicalUrl || "https://www.taleandtrail.games",
    "telephone": "+44-191-XXX-XXXX", // Update with actual phone
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressCountry": city?.country || "United Kingdom"
    },
    "geo": city?.latitude && city?.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": city.latitude,
      "longitude": city.longitude
    } : undefined,
    "openingHours": "Mo-Su 00:00-23:59", // 24/7 digital service
    "priceRange": "££",
    "serviceArea": {
      "@type": "City",
      "name": cityName
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Mystery Pub Crawl Games",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Interactive Mystery Pub Crawl",
            "description": "Location-based puzzle game experience"
          }
        }
      ]
    },
    "sameAs": [
      "https://www.taleandtrail.games"
    ],
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.taleandtrail.games/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{cityTitle}</title>
      <meta name="description" content={cityDescription} />
      <meta name="keywords" content={cityKeywords.join(', ')} />
      <meta name="author" content="Tale and Trail" />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={cityTitle} />
      <meta property="og:description" content={cityDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl || "https://www.taleandtrail.games"} />
      <meta property="og:site_name" content="Tale and Trail" />
      <meta property="og:locale" content="en_GB" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={cityTitle} />
      <meta name="twitter:description" content={cityDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#D97706" />
      <meta name="msapplication-TileColor" content="#D97706" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};
