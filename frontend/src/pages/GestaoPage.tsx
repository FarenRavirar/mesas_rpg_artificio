import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface SystemSuggestion {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  node_type: 'system' | 'edition' | 'variant' | 'subsystem';
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const GestaoPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SystemSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchSuggestions();
  }, [user, navigate, filter]);

  const fetchSuggestions = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const url = filter === 'all'
        ? `${API_BASE}/api/v1/admin/system-suggestions`
        : `${API_BASE}/api/v1/admin/system-suggestions?status=${filter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao buscar sugestões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    if (!confirm('Aprovar esta sugestão?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/system-suggestions/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Sugestão aprovada!');
        fetchSuggestions();
      } else {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao aprovar:', error);
      alert('Erro ao aprovar sugestão');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason || !token) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/system-suggestions/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('Sugestão rejeitada!');
        fetchSuggestions();
      } else {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao rejeitar:', error);
      alert('Erro ao rejeitar sugestão');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1A2E] via-[#1B2A4A] to-[#0F1A2E] py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-2">Gestão de Sugestões de Sistemas</h1>
        <p className="text-white/60 mb-8">Aprove ou rejeite sugestões enviadas pela comunidade</p>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'approved'
                ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Aprovadas
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'rejected'
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Rejeitadas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
          >
            Todas
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-white/50">Carregando...</div>
        ) : suggestions.length === 0 ? (
          <div className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-12 text-center">
            <p className="text-white/50">Nenhuma sugestão encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(suggestion.status)}
                      <h3 className="text-xl font-bold text-white">{suggestion.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                      <span className="font-semibold">Tipo:</span>
                      <span className="px-2 py-1 bg-white/5 rounded">{suggestion.node_type}</span>
                      <span className="font-semibold">Status:</span>
                      <span className={`font-semibold ${getStatusColor(suggestion.status)}`}>
                        {suggestion.status}
                      </span>
                    </div>

                    {suggestion.description && (
                      <p className="text-white/80 mb-3">{suggestion.description}</p>
                    )}

                    {suggestion.rejection_reason && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                        <p className="text-red-400 text-sm">
                          <strong>Motivo da rejeição:</strong> {suggestion.rejection_reason}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-white/40">
                      Criado em: {new Date(suggestion.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {suggestion.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(suggestion.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(suggestion.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
