/**
 * Location management component for admin panel
 * Allows admins to manage cities and their settings
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Edit3, Trash2, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { City } from '../../types';

interface CityForm {
  name: string;
  country: string;
  state_province: string;
  latitude: string;
  longitude: string;
  timezone: string;
  is_active: boolean;
}

export const LocationManagement: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CityForm>({
    defaultValues: {
      country: 'United Kingdom',
      timezone: 'Europe/London',
      is_active: true
    }
  });

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('cities')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;
      setCities(data || []);
    } catch (err) {
      setError('Failed to load cities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCity = async (data: CityForm) => {
    try {
      const cityData = {
        name: data.name,
        country: data.country,
        state_province: data.state_province || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        timezone: data.timezone,
        is_active: data.is_active,
        updated_at: new Date().toISOString()
      };

      if (editingCity) {
        // Update existing city
        const { error: updateError } = await supabase
          .from('cities')
          .update(cityData)
          .eq('id', editingCity.id);

        if (updateError) throw updateError;
      } else {
        // Create new city
        const { error: insertError } = await supabase
          .from('cities')
          .insert(cityData);

        if (insertError) throw insertError;
      }

      handleCancelEdit();
      loadCities();
    } catch (err) {
      setError('Failed to save city');
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setValue('name', city.name);
    setValue('country', city.country);
    setValue('state_province', city.state_province || '');
    setValue('latitude', city.latitude?.toString() || '');
    setValue('longitude', city.longitude?.toString() || '');
    setValue('timezone', city.timezone || 'Europe/London');
    setValue('is_active', city.is_active);
    setShowForm(true);
  };

  const handleDeleteCity = async (cityId: string) => {
    if (!confirm('Are you sure you want to delete this city? This will also deactivate all games in this city.')) {
      return;
    }

    try {
      // First, deactivate all games in this city
      await supabase
        .from('games')
        .update({ is_active: false })
        .eq('city_id', cityId);

      // Then delete the city
      const { error: deleteError } = await supabase
        .from('cities')
        .delete()
        .eq('id', cityId);

      if (deleteError) throw deleteError;
      loadCities();
    } catch (err) {
      setError('Failed to delete city');
    }
  };

  const handleCancelEdit = () => {
    setEditingCity(null);
    setShowForm(false);
    reset({
      country: 'United Kingdom',
      timezone: 'Europe/London',
      is_active: true
    });
  };

  const toggleCityStatus = async (city: City) => {
    try {
      const { error } = await supabase
        .from('cities')
        .update({ 
          is_active: !city.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', city.id);

      if (error) throw error;
      loadCities();
    } catch (err) {
      setError('Failed to update city status');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading cities...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Location Management</h2>
          <p className="text-gray-600 mt-1">Manage cities and their settings</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New City</span>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* City Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingCity ? 'Edit City' : 'Create New City'}
          </h3>
          
          <form onSubmit={handleSubmit(handleSaveCity)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name *
                </label>
                <input
                  {...register('name', { required: 'City name is required' })}
                  type="text"
                  placeholder="e.g., London"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <input
                  {...register('country')}
                  type="text"
                  placeholder="United Kingdom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province
                </label>
                <input
                  {...register('state_province')}
                  type="text"
                  placeholder="e.g., England, Scotland, Wales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  {...register('timezone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Dublin">Europe/Dublin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  {...register('latitude')}
                  type="number"
                  step="any"
                  placeholder="51.5074"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  {...register('longitude')}
                  type="number"
                  step="any"
                  placeholder="-0.1278"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                {...register('is_active')}
                type="checkbox"
                id="is_active"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active (visible to users)
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingCity ? 'Update City' : 'Create City'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cities List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Cities ({cities.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cities.map((city) => (
                <tr key={city.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{city.name}</div>
                        <div className="text-sm text-gray-500">{city.timezone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {city.state_province && `${city.state_province}, `}{city.country}
                    {city.latitude && city.longitude && (
                      <div className="text-xs text-gray-400">
                        {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleCityStatus(city)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        city.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {city.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditCity(city)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCity(city.id)}
                        className="text-red-600 hover:text-red-700"
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
      </div>
    </div>
  );
};
