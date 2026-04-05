import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { CreateTableForm } from './PainelMestrePage';
import { mapCandidateToFormData } from '../utils/candidateToFormData';

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

interface AggregatorCandidate {
  id: string;
  source_id: string | null;
  editorial_status: 'accepted' | 'rejected' | 'awaiting_review';
  parsed_json: Record<string, any>;
  confidence_score: number;
  rejection_reason: string | null;
  created_at: string;
}

export const GestaoPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SystemSuggestion[]>([]);
  const [candidates, setCandidates] = useState<AggregatorCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [activeTab, setActiveTab] = useState<'systems' | 'tables'>('systems');
  const [selectedCandidate, setSelectedCandidate] = useState<AggregatorCandidate | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (activeTab === 'systems') {
      fetchSuggestions();
    } else {
      fetchCandidates();
    }
  }, [user, navigate, filter, activeTab]);

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

  const fetchCandidates = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const status = filter === 'all' ? '' : `?editorial_status=${filter === 'pending' ? 'awaiting_review' : filter}`;
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.data || []);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao buscar candidatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCandidate = async (id: string) => {
    if (!token) return;
    if (!confirm('Aprovar este candidato e criar mesa?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/${id}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert('Candidato aprovado! Mesa criada com sucesso.');
        fetchCandidates();
      } else {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao aprovar candidato:', error);
      alert('Erro ao aprovar candidato');
    }
  };

  const handleRejectCandidate = async (id: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason || !token) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        alert('Candidato rejeitado!');
        fetchCandidates();
      } else {
        const data = await response.json();
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao rejeitar candidato:', error);
      alert('Erro ao rejeitar candidato');
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
        <h1 className="text-3xl font-bold text-white mb-2">Gestão Administrativa</h1>
        <p className="text-white/60 mb-8">Aprove ou rejeite conteúdo enviado pela comunidade</p>

        {/* Abas de navegação */}
        <div className="flex gap-3 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('systems')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'systems'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Sugestões de Sistemas
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'tables'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Mesas Importadas
          </button>
        </div>

        {activeTab === 'systems' && (
          <>
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
          </>
        )}

        {activeTab === 'tables' && (
          <>
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
            ) : candidates.length === 0 ? (
              <div className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-12 text-center">
                <p className="text-white/50">Nenhum candidato encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => {
                  const parsed = candidate.parsed_json || {};
                  const title = parsed.title || 'Sem título';
                  const system = parsed.system || 'Sistema não identificado';
                  const masterText = parsed.masterText || parsed.recruiterName || 'Não informado';
                  const confidence = Math.round((candidate.confidence_score || 0) * 100);

                  return (
                    <div
                      key={candidate.id}
                      className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-3">
                            <span><strong>Sistema:</strong> {system}</span>
                            <span><strong>Mestre:</strong> {masterText}</span>
                            <span><strong>Confiança:</strong> <span className={confidence >= 70 ? 'text-green-400' : 'text-yellow-400'}>{confidence}%</span></span>
                          </div>

                          {parsed.synopsis && (
                            <p className="text-white/80 mb-3 line-clamp-2">{parsed.synopsis}</p>
                          )}

                          {candidate.rejection_reason && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                              <p className="text-red-400 text-sm">
                                <strong>Motivo da rejeição:</strong> {candidate.rejection_reason}
                              </p>
                            </div>
                          )}

                          <div className="text-xs text-white/40">
                            Importado em: {new Date(candidate.created_at).toLocaleString('pt-BR')}
                          </div>
                        </div>

                        {candidate.editorial_status === 'awaiting_review' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedCandidate(candidate)}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                            >
                              Revisar
                            </button>
                            <button
                              onClick={() => handleApproveCandidate(candidate.id)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleRejectCandidate(candidate.id)}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
                            >
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Modal de Revisão com Formulário Editável */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 overflow-y-auto">
            <div className="bg-[#1B2A4A] border border-white/20 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto my-6">
              <div className="sticky top-0 bg-[#1B2A4A] border-b border-white/10 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-white">Revisar e Editar Mesa</h2>
                  <p className="text-sm text-white/60 mt-1">Corrija os dados extraídos e aprove para publicação</p>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6">
                {/* Informações do Candidato */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-blue-300 mb-2">Dados Extraídos Automaticamente</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-white/60">Título:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.title || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Sistema:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.system || 'Não identificado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Confiança:</span>
                      <span className="text-white ml-2">{Math.round((selectedCandidate.confidence_score || 0) * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Formulário Editável */}
                <CreateTableForm
                  token={token!}
                  initialData={mapCandidateToFormData(selectedCandidate.parsed_json)}
                  mode="review"
                  candidateId={selectedCandidate.id}
                  onSuccess={() => {
                    setSelectedCandidate(null);
                    fetchCandidates();
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
