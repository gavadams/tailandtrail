/**
 * Sitemap page component that generates XML sitemap
 * Accessible at /sitemap.xml
 */

import React, { useEffect, useState } from 'react';
import { generateSitemap } from '../../utils/sitemapGenerator';

export const SitemapPage: React.FC = () => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSitemap = async () => {
      try {
        const sitemap = await generateSitemap();
        setSitemapXml(sitemap);
      } catch (error) {
        console.error('Error generating sitemap:', error);
        setSitemapXml('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://www.taleandtrail.games/</loc><lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>');
      } finally {
        setIsLoading(false);
      }
    };

    loadSitemap();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-yellow-200 text-xl">Generating sitemap...</div>
      </div>
    );
  }

  // Set content type to XML
  useEffect(() => {
    document.title = 'Sitemap - Tale and Trail';
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-yellow-200 mb-6">Sitemap</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
            {sitemapXml}
          </pre>
        </div>
        <div className="mt-6 text-gray-400 text-sm">
          <p>This sitemap is automatically generated and updates when cities are activated/deactivated.</p>
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};
