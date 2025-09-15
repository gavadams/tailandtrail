/**
 * Purchase management and analytics for admin panel
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, Mail, Calendar, TrendingUp, Download, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Purchase, Game } from '../../types';

export const PurchaseManagement: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load games
      const { data: gamesData } = await supabase
        .from('games')
        .select('*');
      setGames(gamesData || []);

      // Load purchases with date filter
      let query = supabase
        .from('purchases')
        .select(`
          *,
          games (title),
          access_codes (code)
        `)
        .order('created_at', { ascending: false });

      if (selectedPeriod !== 'all') {
        const days = parseInt(selectedPeriod);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        query = query.gte('created_at', cutoffDate.toISOString());
      }

      const { data: purchasesData } = await query;
      setPurchases(purchasesData || []);

    } catch (error) {
      console.error('Failed to load purchase data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    totalRevenue: purchases.reduce((sum, p) => sum + (p.amount / 100), 0),
    totalPurchases: purchases.length,
    completedPurchases: purchases.filter(p => p.status === 'completed').length,
    averageOrderValue: purchases.length > 0 ? purchases.reduce((sum, p) => sum + (p.amount / 100), 0) / purchases.length : 0
  };

  const gameStats = games.map(game => {
    const gamePurchases = purchases.filter(p => p.game_id === game.id);
    return {
      game,
      purchases: gamePurchases.length,
      revenue: gamePurchases.reduce((sum, p) => sum + (p.amount / 100), 0)
    };
  }).sort((a, b) => b.revenue - a.revenue);

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Loading purchase data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Purchase Management</h2>
          <p className="text-gray-600 mt-1">Track sales and customer data</p>
        </div>
        
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">£{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Purchases</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPurchases}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalPurchases > 0 ? Math.round((stats.completedPurchases / stats.totalPurchases) * 100) : 0}%
              </p>
            </div>
            <Calendar className="h-10 w-10 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">£{stats.averageOrderValue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Game Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Game Performance</h3>
        <div className="space-y-4">
          {gameStats.map((stat) => (
            <div key={stat.game.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{stat.game.title}</h4>
                <p className="text-sm text-gray-500">{stat.game.theme}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">£{stat.revenue.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{stat.purchases} purchases</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Recent Purchases</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Game
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Code
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{purchase.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {(purchase as any).games?.title || 'Unknown Game'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      £{(purchase.amount / 100).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(purchase.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm font-mono text-gray-900">
                      {(purchase as any).access_codes?.code || 'N/A'}
                    </code>
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