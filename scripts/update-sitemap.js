/**
 * Script to update the static sitemap.xml file
 * Automatically fetches active cities from Supabase database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const generateStaticSitemap = async () => {
  const baseUrl = 'https://www.taleandtrail.games';
  const currentDate = new Date().toISOString().split('T')[0];

  // Static pages
  const staticPages = [
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
  let activeCities = [];
  try {
    console.log('🔍 Fetching active cities from database...');
    const { data: cities, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error fetching cities:', error);
      // Fallback to default cities
      activeCities = [
        {
          name: 'newcastle-upon-tyne',
          lastmod: currentDate
        }
      ];
    } else {
      activeCities = (cities || []).map(city => ({
        name: city.name.toLowerCase().replace(/\s+/g, '-'),
        lastmod: city.updated_at ? new Date(city.updated_at).toISOString().split('T')[0] : currentDate
      }));
      console.log(`✅ Found ${activeCities.length} active cities:`, activeCities.map(c => c.name));
    }
  } catch (err) {
    console.error('❌ Error connecting to database:', err);
    // Fallback to default cities
    activeCities = [
      {
        name: 'newcastle-upon-tyne',
        lastmod: currentDate
      }
    ];
  }

  const cityPages = activeCities.map(city => ({
    loc: `${baseUrl}/locations/${city.name}`,
    lastmod: city.lastmod,
    changefreq: 'weekly',
    priority: 0.9
  }));

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

// Update the sitemap file
const updateSitemap = async () => {
  try {
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    const sitemapXml = await generateStaticSitemap();

    fs.writeFileSync(sitemapPath, sitemapXml);
    console.log('✅ Sitemap updated successfully!');
    console.log(`📁 Location: ${sitemapPath}`);
    console.log(`🌐 URL: https://www.taleandtrail.games/sitemap.xml`);
  } catch (error) {
    console.error('❌ Error updating sitemap:', error);
    process.exit(1);
  }
};

updateSitemap();
