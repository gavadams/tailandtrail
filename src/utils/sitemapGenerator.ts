/**
 * Dynamic sitemap generator that includes active cities
 * Updates automatically when cities are activated/deactivated
 */

import { supabase } from '../lib/supabase';
import type { City } from '../types';

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://tailandtrail.com';
  const currentDate = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages: SitemapUrl[] = [
    {
      loc: `${baseUrl}/`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/contact`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      loc: `${baseUrl}/privacy`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.5
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: currentDate,
      changefreq: 'yearly',
      priority: 0.5
    }
  ];

  // Get active cities from database
  let cityPages: SitemapUrl[] = [];
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && cities) {
      cityPages = cities.map((city: City) => ({
        loc: `${baseUrl}/locations/${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        lastmod: city.updated_at ? new Date(city.updated_at).toISOString().split('T')[0] : currentDate,
        changefreq: 'weekly' as const,
        priority: 0.9
      }));
    }
  } catch (error) {
    console.error('Error fetching cities for sitemap:', error);
  }

  // Combine all URLs
  const allUrls = [...staticPages, ...cityPages];

  // Generate XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemapXml;
};

export const getActiveCities = async (): Promise<City[]> => {
  try {
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return cities || [];
  } catch (error) {
    console.error('Error fetching active cities:', error);
    return [];
  }
};
