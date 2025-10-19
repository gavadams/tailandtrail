/**
 * Analytics Dashboard for admin panel
 * Provides detailed insights into player behavior and puzzle performance
 */

import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  BarChart3, 
  Users, 
  Clock, 
  Target, 
  Download,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getUserPrivileges } from '../../utils/permissions';
import type { Game, AdminUser } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalyticsData {
  playerBehavior: {
    hintUsage: { hintIndex: number; count: number; percentage: number }[];
    averageSolveTime: number;
    totalPlayers: number;
    activePlayers: number;
  };
  puzzlePerformance: {
    puzzleId: string;
    puzzleTitle: string;
    successRate: number;
    averageSolveTime: number;
    totalAttempts: number;
    dropOffPoints: { hintLevel: number; count: number }[];
  }[];
  overallStats: {
    totalGames: number;
    totalPuzzles: number;
    totalSessions: number;
    averageSessionDuration: number;
  };
}

export const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadGames();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.warn('No authenticated user');
        return;
      }

      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminError) {
        console.warn('Could not load current user:', adminError.message);
        return;
      }

      setCurrentUser(adminUser);
    } catch (err) {
      console.warn('Error loading current user:', err);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      loadAnalyticsData();
    }
  }, [selectedGameId, dateRange]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('title');
      
      if (error) throw error;
      setGames(data || []);
      if (data && data.length > 0) {
        setSelectedGameId(data[0].id);
      }
    } catch (err) {
      setError('Failed to load games');
    }
  };

  const loadAnalyticsData = async () => {
    if (!selectedGameId) return;
    
    setIsLoading(true);
    try {
      // Use the new analytics function to get real-time data
      const { data: analyticsData, error } = await supabase
        .rpc('get_game_analytics', {
          game_uuid: selectedGameId,
          start_date: dateRange.start,
          end_date: dateRange.end
        });

      if (error) {
        console.error('Analytics function error:', error);
        throw error;
      }

      // Load puzzle details for titles
      const { data: puzzles } = await supabase
        .from('puzzles')
        .select('id, title')
        .eq('game_id', selectedGameId);

      // Process the analytics data
      const puzzlePerformance = analyticsData?.map((puzzle: any) => ({
        puzzleId: puzzle.puzzle_id,
        puzzleTitle: puzzle.puzzle_title,
        successRate: Number(puzzle.success_rate) || 0,
        averageSolveTime: Number(puzzle.avg_solve_time) || 0,
        totalAttempts: Number(puzzle.total_attempts) || 0,
        dropOffPoints: [] // Will be populated from hint_usage if needed
      })) || [];

      // Process hint usage from the analytics data
      const hintUsageMap = new Map<number, number>();
      analyticsData?.forEach((puzzle: any) => {
        if (puzzle.hint_usage && typeof puzzle.hint_usage === 'object') {
          Object.entries(puzzle.hint_usage).forEach(([hintIndex, count]) => {
            const index = parseInt(hintIndex);
            const currentCount = hintUsageMap.get(index) || 0;
            hintUsageMap.set(index, currentCount + Number(count));
          });
        }
      });

      const totalHints = Array.from(hintUsageMap.values()).reduce((sum: number, count: number) => sum + count, 0);
      const hintUsage = Array.from(hintUsageMap.entries())
        .map(([hintIndex, count]) => ({
          hintIndex,
          count,
          percentage: totalHints > 0 ? Math.round((count / totalHints) * 100) : 0
        }))
        .sort((a, b) => a.hintIndex - b.hintIndex);

      // Calculate overall stats
      const totalPlayers = analyticsData?.reduce((sum: number, puzzle: any) => sum + Number(puzzle.total_players), 0) || 0;
      const avgSolveTime = analyticsData?.length > 0 
        ? analyticsData.reduce((sum: number, puzzle: any) => sum + Number(puzzle.avg_solve_time), 0) / analyticsData.length 
        : 0;

      const overallStats = {
        totalGames: games.length,
        totalPuzzles: puzzles?.length || 0,
        totalSessions: totalPlayers,
        averageSessionDuration: avgSolveTime
      };

      setAnalyticsData({
        playerBehavior: {
          hintUsage,
          averageSolveTime: avgSolveTime,
          totalPlayers,
          activePlayers: analyticsData?.filter((puzzle: any) => Number(puzzle.total_players) > 0).length || 0
        },
        puzzlePerformance,
        overallStats
      });
    } catch (err) {
      console.error('Analytics error:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!analyticsData) return;
    
    const csvData = [
      ['Puzzle Title', 'Success Rate (%)', 'Average Solve Time (s)', 'Total Attempts'],
      ...analyticsData.puzzlePerformance.map(puzzle => [
        puzzle.puzzleTitle,
        puzzle.successRate.toString(),
        puzzle.averageSolveTime.toString(),
        puzzle.totalAttempts.toString()
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedGameId}-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Analytics Dashboard'
      },
    },
  };

  // Check permissions
  if (currentUser && !getUserPrivileges(currentUser.role).can_view_analytics) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">You don't have permission to view analytics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Player behavior and puzzle performance insights</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Game</label>
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {games.map(game => (
                <option key={game.id} value={game.id}>{game.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Puzzles</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.overallStats.totalPuzzles}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Players</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.playerBehavior.totalPlayers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Solve Time</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(analyticsData.playerBehavior.averageSolveTime)}s</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Players</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.playerBehavior.activePlayers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hint Usage Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hint Usage Distribution</h3>
              {analyticsData.playerBehavior.hintUsage.length > 0 ? (
                <Bar
                  data={{
                    labels: analyticsData.playerBehavior.hintUsage.map(h => `Hint ${h.hintIndex + 1}`),
                    datasets: [{
                      label: 'Usage Count',
                      data: analyticsData.playerBehavior.hintUsage.map(h => h.count),
                      backgroundColor: 'rgba(59, 130, 246, 0.5)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: false
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No hint usage data available</p>
              )}
            </div>

            {/* Puzzle Success Rates */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Puzzle Success Rates</h3>
              {analyticsData.puzzlePerformance.length > 0 ? (
                <Bar
                  data={{
                    labels: analyticsData.puzzlePerformance.map(p => p.puzzleTitle.length > 20 ? p.puzzleTitle.substring(0, 20) + '...' : p.puzzleTitle),
                    datasets: [{
                      label: 'Success Rate (%)',
                      data: analyticsData.puzzlePerformance.map(p => p.successRate),
                      backgroundColor: 'rgba(34, 197, 94, 0.5)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 1
                    }]
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      title: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No puzzle performance data available</p>
              )}
            </div>
          </div>

          {/* Puzzle Performance Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Puzzle Performance Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puzzle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Solve Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Attempts</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analyticsData.puzzlePerformance.map((puzzle, index) => (
                    <tr key={puzzle.puzzleId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {puzzle.puzzleTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          puzzle.successRate >= 80 ? 'bg-green-100 text-green-800' :
                          puzzle.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {puzzle.successRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(puzzle.averageSolveTime)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {puzzle.totalAttempts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
