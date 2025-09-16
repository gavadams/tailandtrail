/**
 * Script to update the static sitemap.xml file
 * Run this script when cities are added/removed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This would normally connect to your Supabase database
// For now, we'll create a basic sitemap
const generateStaticSitemap = () => {
  const baseUrl = 'https://tailandtrail.com';
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

  // Active cities (you can update this list when cities change)
  const activeCities = [
    {
      name: 'newcastle-upon-tyne',
      lastmod: currentDate
    }
    // Add more cities here as you expand
  ];

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
const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
const sitemapXml = generateStaticSitemap();

fs.writeFileSync(sitemapPath, sitemapXml);
console.log('✅ Sitemap updated successfully!');
console.log(`📁 Location: ${sitemapPath}`);
console.log(`🌐 URL: https://tailandtrail.com/sitemap.xml`);
