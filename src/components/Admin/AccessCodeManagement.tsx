/**
 * Access code management component for generating and tracking codes
 * Allows admins to create codes and monitor usage
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Key, Copy, Eye, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Game, AccessCode, CodeUsageLog } from '../../types';

interface CodeGenerationForm {
  game_id: string;
  quantity: number;
}

export const AccessCodeManagement: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [usageLogs, setUsageLogs] = useState<CodeUsageLog[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CodeGenerationForm>();

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      loadAccessCodesForGame(selectedGameId);
    } else {
      setAccessCodes([]);
    }
  }, [selectedGameId]);

  const loadGames = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('*')
        .order('title');

      if (fetchError) throw fetchError;
      setGames(data || []);
    } catch (err) {
      setError('Failed to load games');
    }
  };

  const loadAccessCodesForGame = async (gameId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('access_codes')
        .select(`
          *,
          games (title)
        `)
        .eq('game_id', gameId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAccessCodes(data || []);

      // Load usage logs for these codes
      if (data && data.length > 0) {
        const codeIds = data.map(code => code.id);
        const { data: logs } = await supabase
          .from('code_usage_logs')
          .select('*')
          .in('access_code_id', codeIds)
          .order('timestamp', { ascending: false });
        
        setUsageLogs(logs || []);
      } else {
        setUsageLogs([]);
      }
    } catch (err) {
      setError('Failed to load access codes');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateCodes = async (data: CodeGenerationForm) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      const codesToInsert = [];
      const generatedCodes = [];

      for (let i = 0; i < data.quantity; i++) {
        let code;
        let isUnique = false;
        
        // Ensure code is unique
        while (!isUnique) {
          code = generateRandomCode();
          const { data: existingCode } = await supabase
            .from('access_codes')
            .select('id')
            .eq('code', code)
            .single();
          
          isUnique = !existingCode;
        }

        codesToInsert.push({
          code: code,
          game_id: data.game_id,
          is_active: true
        });
        generatedCodes.push(code);
      }

      const { error: insertError } = await supabase
        .from('access_codes')
        .insert(codesToInsert);

      if (insertError) throw insertError;

      setSuccess(`Generated ${data.quantity} access codes successfully!`);
      reset();
      loadAccessCodesForGame(selectedGameId);

    } catch (err) {
      setError('Failed to generate access codes');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to deactivate this access code?')) {
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('access_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (updateError) throw updateError;
      
      loadAccessCodesForGame(selectedGameId);
    } catch (err) {
      setError('Failed to deactivate code');
    }
  };

  const getCodeStatus = (code: AccessCode) => {
    if (!code.is_active) return { status: 'inactive', color: 'gray' };
    if (!code.activated_at) return { status: 'unused', color: 'blue' };
    
    const activatedTime = new Date(code.activated_at);
    const expiryTime = new Date(activatedTime.getTime() + 12 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now > expiryTime) return { status: 'expired', color: 'red' };
    return { status: 'active', color: 'green' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Access Code Management</h2>
        <p className="text-gray-600 mt-1">Generate and monitor access codes for your games</p>
      </div>

      {/* Game Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Game
        </label>
        <select
          value={selectedGameId}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">Choose a game...</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.title}
            </option>
          ))}
        </select>
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

      {/* Code Generation Form */}
      {selectedGameId && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Generate Access Codes for {games.find(g => g.id === selectedGameId)?.title}
          </h3>
          
          <form onSubmit={handleSubmit(handleGenerateCodes)} className="flex items-end space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Codes
              </label>
              <input
                {...register('quantity', { 
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Minimum 1 code' },
                  max: { value: 100, message: 'Maximum 100 codes at once' }
                })}
                type="number"
                min="1"
                max="100"
                defaultValue="1"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              {errors.quantity && (
                <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
              )}
            </div>
            
            <input type="hidden" {...register('game_id')} value={selectedGameId} />
            
            <button
              type="submit"
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              <span>{isGenerating ? 'Generating...' : 'Generate Codes'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Access Codes List */}
      {selectedGameId && accessCodes.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              Access Codes ({accessCodes.length})
            </h3>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {accessCodes.map((code) => {
                  const { status, color } = getCodeStatus(code);
                  return (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <code className="text-lg font-mono font-bold text-gray-900">
                            {code.code}
                          </code>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                            title="Copy to clipboard"
                          >
                            {copiedCode === code.code ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          color === 'gray' ? 'bg-gray-100 text-gray-800' :
                          color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          color === 'green' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.activated_at ? new Date(code.activated_at).toLocaleString() : 'Not used'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.expires_at ? new Date(code.expires_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDeactivateCode(code.id)}
                            disabled={!code.is_active}
                            className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed p-1"
                            title="Deactivate Code"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 p-4">
            {accessCodes.map((code) => {
              const { status, color } = getCodeStatus(code);
              return (
                <div key={code.id} className="bg-white rounded-lg shadow border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <code className="text-lg font-mono font-bold text-gray-900">
                          {code.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Copy to clipboard"
                        >
                          {copiedCode === code.code ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Copy className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                        color === 'gray' ? 'bg-gray-100 text-gray-800' :
                        color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        color === 'green' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeactivateCode(code.id)}
                        disabled={!code.is_active}
                        className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed p-2"
                        title="Deactivate Code"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Created:</span>
                      <br />
                      {new Date(code.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Activated:</span>
                      <br />
                      {code.activated_at ? new Date(code.activated_at).toLocaleString() : 'Not used'}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Expires:</span>
                      <br />
                      {code.expires_at ? new Date(code.expires_at).toLocaleString() : '-'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedGameId && accessCodes.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No access codes generated yet</p>
          <p className="text-gray-500">Generate your first codes to get started</p>
        </div>
      )}
    </div>
  );
};