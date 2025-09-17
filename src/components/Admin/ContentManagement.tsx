/**
 * Content management system for admin panel
 * Allows editing of site content, pages, and settings
 */

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, Save, Eye, Settings, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'quill/dist/quill.snow.css';
import { supabase } from '../../lib/supabase';
import { cleanReactQuillHtml, prepareHtmlForEditing } from '../../utils/htmlUtils';
import { ContentPage, SiteSettings } from '../../types';
import { useContentStore } from '../../stores/contentStore';
import { ThemeOverlayManagement } from './ThemeOverlayManagement';

type ContentView = 'pages' | 'settings' | 'splash-screens';

interface PageForm {
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  is_published: boolean;
  show_in_nav: boolean;
  nav_order: number;
}

interface SettingForm {
  key: string;
  value: string;
  label: string;
  description: string;
  category: string;
  type: 'text' | 'textarea' | 'html' | 'image' | 'boolean' | 'number';
}

export const ContentManagement: React.FC = () => {
  const [currentView, setCurrentView] = useState<ContentView>('pages');
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [editingSetting, setEditingSetting] = useState<SiteSettings | null>(null);
  const [showPageForm, setShowPageForm] = useState(false);
  const [showSettingForm, setShowSettingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register: registerPage, handleSubmit: handleSubmitPage, reset: resetPage, setValue: setPageValue, watch: watchPage, formState: { errors: pageErrors } } = useForm<PageForm>();
  const { register: registerSetting, handleSubmit: handleSubmitSetting, reset: resetSetting, setValue: setSettingValue, formState: { errors: settingErrors } } = useForm<SettingForm>();

  const [pageContent, setPageContent] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
  const { setPages: updateStorePages, setSettings: updateStoreSettings } = useContentStore();

  useEffect(() => {
    loadContent();
    // Clear messages after 5 seconds
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      // Load pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('content_pages')
        .select('*')
        .order('nav_order');

      if (pagesError) throw pagesError;
      setPages(pagesData || []);

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .order('category', { ascending: true });

      if (settingsError) throw settingsError;
      setSettings(settingsData || []);

      // Update store
      updateStorePages(pagesData || []);
      const settingsMap = (settingsData || []).reduce((acc, setting) => ({ ...acc, [setting.key]: setting.value }), {});
      updateStoreSettings(settingsMap);

    } catch (err) {
      setError('Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePage = async (data: PageForm) => {
    try {
      const pageData = {
        ...data,
        content: cleanReactQuillHtml(pageContent),
        slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
      };

      if (editingPage) {
        const { error: updateError } = await supabase
          .from('content_pages')
          .update({
            ...pageData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPage.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('content_pages')
          .insert(pageData);

        if (insertError) throw insertError;
      }

      setSuccess('Page saved successfully!');
      resetPage();
      setPageContent('');
      setEditingPage(null);
      setShowPageForm(false);
      loadContent();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Page save error:', err);
      setError('Failed to save page');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSaveSetting = async (data: SettingForm) => {
    try {
      if (editingSetting) {
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSetting.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('site_settings')
          .insert(data);

        if (insertError) throw insertError;
      }

      setSuccess('Setting saved successfully!');
      resetSetting();
      setEditingSetting(null);
      setShowSettingForm(false);
      loadContent();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Setting save error:', err);
      setError('Failed to save setting');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditPage = (page: ContentPage) => {
    setEditingPage(page);
    setPageValue('title', page.title);
    setPageValue('slug', page.slug);
    setPageValue('meta_description', page.meta_description || '');
    setPageValue('is_published', page.is_published);
    setPageValue('show_in_nav', page.show_in_nav);
    setPageValue('nav_order', page.nav_order);
    setPageContent(prepareHtmlForEditing(page.content));
    setShowPageForm(true);
    
    // Scroll to form after a brief delay to ensure it's rendered
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleEditSetting = (setting: SiteSettings) => {
    setEditingSetting(setting);
    setSettingValue('key', setting.key);
    setSettingValue('value', setting.value);
    setSettingValue('label', setting.label);
    setSettingValue('description', setting.description || '');
    setSettingValue('category', setting.category);
    setSettingValue('type', setting.type);
    setShowSettingForm(true);
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const { error } = await supabase
        .from('content_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
      loadContent();
    } catch (err) {
      setError('Failed to delete page');
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;

    try {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('id', settingId);

      if (error) throw error;
      loadContent();
    } catch (err) {
      setError('Failed to delete setting');
    }
  };

  const renderPageForm = () => (
    <div ref={formRef} className="bg-white rounded-lg shadow-lg p-6 border">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {editingPage ? 'Edit Page' : 'Create New Page'}
      </h3>
      
      <form onSubmit={handleSubmitPage(handleSavePage)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Title
            </label>
            <input
              {...registerPage('title', { required: 'Title is required' })}
              type="text"
              placeholder="Enter page title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {pageErrors.title && (
              <p className="text-red-600 text-sm mt-1">{pageErrors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <input
              {...registerPage('slug', { required: 'Slug is required' })}
              type="text"
              placeholder="url-slug-here"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {pageErrors.slug && (
              <p className="text-red-600 text-sm mt-1">{pageErrors.slug.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta Description
          </label>
          <textarea
            {...registerPage('meta_description')}
            rows={2}
            placeholder="Brief description for search engines..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <ReactQuill
            value={pageContent}
            onChange={setPageContent}
            theme="snow"
            className="bg-white"
            placeholder="Enter your page content here..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              {...registerPage('is_published')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Published</label>
          </div>

          <div className="flex items-center">
            <input
              {...registerPage('show_in_nav')}
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">Show in Navigation</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nav Order
            </label>
            <input
              {...registerPage('nav_order')}
              type="number"
              defaultValue={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{editingPage ? 'Update Page' : 'Create Page'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPageForm(false);
              setEditingPage(null);
              resetPage();
              setPageContent('');
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderSettingForm = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 border">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {editingSetting ? 'Edit Setting' : 'Create New Setting'}
      </h3>
      
      <form onSubmit={handleSubmitSetting(handleSaveSetting)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setting Key
            </label>
            <input
              {...registerSetting('key', { required: 'Key is required' })}
              type="text"
              placeholder="e.g., site_name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {settingErrors.key && (
              <p className="text-red-600 text-sm mt-1">{settingErrors.key.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              {...registerSetting('label', { required: 'Label is required' })}
              type="text"
              placeholder="e.g., Site Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {settingErrors.label && (
              <p className="text-red-600 text-sm mt-1">{settingErrors.label.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              {...registerSetting('type', { required: 'Type is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">Select type...</option>
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="html">HTML</option>
              <option value="image">Image URL</option>
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
            </select>
            {settingErrors.type && (
              <p className="text-red-600 text-sm mt-1">{settingErrors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              {...registerSetting('category', { required: 'Category is required' })}
              type="text"
              placeholder="e.g., general, contact, pricing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            {settingErrors.category && (
              <p className="text-red-600 text-sm mt-1">{settingErrors.category.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value
          </label>
          <textarea
            {...registerSetting('value', { required: 'Value is required' })}
            rows={3}
            placeholder="Enter the setting value..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          />
          {settingErrors.value && (
            <p className="text-red-600 text-sm mt-1">{settingErrors.value.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            {...registerSetting('description')}
            rows={2}
            placeholder="Brief description of what this setting controls..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
          />
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{editingSetting ? 'Update Setting' : 'Create Setting'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSettingForm(false);
              setEditingSetting(null);
              resetSetting();
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Content Management</h2>
          <p className="text-gray-600 mt-1">Manage your website content and settings</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button
            onClick={() => setCurrentView('pages')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              currentView === 'pages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="h-4 w-4 inline mr-2" />
            Pages
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              currentView === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Content */}
      {currentView === 'pages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Pages</h3>
            <button
              onClick={() => setShowPageForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Page</span>
            </button>
          </div>

          {showPageForm && renderPageForm()}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {pages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No pages created yet</p>
                <p className="text-gray-500">Create your first page to get started</p>
              </div>
            ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pages.map((page) => (
                      <tr key={page.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{page.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="text-sm text-gray-600">/{page.slug}</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              page.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {page.is_published ? 'Published' : 'Draft'}
                            </span>
                            {page.show_in_nav && (
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                In Nav
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditPage(page)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Edit Page"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePage(page.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                              title="Delete Page"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {pages.map((page) => (
                  <div key={page.id} className="bg-white rounded-lg shadow border p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 text-lg">{page.title}</h3>
                        <code className="text-sm text-gray-600">/{page.slug}</code>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPage(page)}
                          className="text-blue-600 hover:text-blue-700 p-2"
                          title="Edit Page"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Delete Page"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                        page.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                      {page.show_in_nav && (
                        <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                          In Nav
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
            )}
          </div>
        </div>
      )}

      {currentView === 'settings' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Site Settings</h3>
            <button
              onClick={() => setShowSettingForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Setting</span>
            </button>
          </div>

          {/* Theme Overlay Management */}
          <ThemeOverlayManagement />

          {showSettingForm && renderSettingForm()}

          {settings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No settings configured yet</p>
              <p className="text-gray-500">Create your first setting to customize your site</p>
            </div>
          ) : (
            /* Settings grouped by category */
            Object.entries(
              settings.reduce((acc, setting) => {
                if (!acc[setting.category]) acc[setting.category] = [];
                acc[setting.category].push(setting);
                return acc;
              }, {} as Record<string, SiteSettings[]>)
            ).map(([category, categorySettings]) => (
              <div key={category} className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                  {category.replace('_', ' ')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorySettings.map((setting) => (
                    <div key={setting.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{setting.label}</h5>
                          {setting.description && (
                            <p className="text-sm text-gray-500">{setting.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditSetting(setting)}
                            className="text-blue-600 hover:text-blue-700 p-1"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteSetting(setting.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">
                        <strong>{setting.key}:</strong> {setting.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};