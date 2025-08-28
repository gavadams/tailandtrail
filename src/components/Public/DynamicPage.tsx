/**
 * Dynamic page component that renders CMS-managed pages
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ContentPage } from '../../types';

interface DynamicPageProps {
  slug?: string;
}

export const DynamicPage: React.FC<DynamicPageProps> = ({ slug: propSlug }) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = propSlug || paramSlug;
  
  const [page, setPage] = useState<ContentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Page not found');
      setIsLoading(false);
      return;
    }

    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('content_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (fetchError || !data) {
        setError('Page not found');
        return;
      }

      setPage(data);
    } catch (err) {
      setError('Failed to load page');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-100 mx-auto mb-4"></div>
          <p className="text-amber-100 text-lg">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-amber-100 mb-4">Page Not Found</h1>
          <p className="text-amber-200 mb-8">The page you're looking for doesn't exist.</p>
          <a
            href="/"
            className="bg-amber-700 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-900">
      <div className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-amber-50 rounded-2xl shadow-2xl p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-6">
              {page.title}
            </h1>
            
            <div 
              className="prose prose-amber max-w-none text-amber-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};