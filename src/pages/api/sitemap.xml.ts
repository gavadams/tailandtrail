/**
 * Dynamic sitemap API route
 * Generates sitemap.xml based on active cities
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { generateSitemap } from '../../utils/sitemapGenerator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sitemap = await generateSitemap();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
