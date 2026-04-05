import { useEffect, useMemo, useState } from 'react';
import bannerPlaceholder from '../assets/banner_placeholder.webp';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
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
  const [systemsTree, setSystemsTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [activeTab, setActiveTab] = useState<'systems' | 'tables'>('systems');
  const [selectedCandidate, setSelectedCandidate] = useState<AggregatorCandidate | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  
  // Estados de loading para spinners
  const [approvingSuggestionId, setApprovingSuggestionId] = useState<string | null>(null);
  const [rejectingSuggestionId, setRejectingSuggestionId] = useState<string | null>(null);
  const [rejectingCandidateId, setRejectingCandidateId] = useState<string | null>(null);
  const [rejectingAll, setRejectingAll] = useState(false);
  const [undoingCandidateId, setUndoingCandidateId] = useState<string | null>(null);

  /** Mapeamento pré-computado: candidateId -> CandidateFormData */
  const candidateMappedData = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mapCandidateToFormData>>();
    for (const c of candidates) {
      map.set(c.id, mapCandidateToFormData(c.parsed_json, systemsTree));
    }
    return map;
  }, [candidates, systemsTree]);


  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar árvore de sistemas uma vez ao montar
    fetchSystemsTree();

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

  const fetchSystemsTree = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/systems?view=tree`);
      if (response.ok) {
        const data = await response.json();
        setSystemsTree(data.data || []);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao buscar árvore de sistemas:', error);
    }
  };

  const handleApprove = async (id: string, editedData?: { name: string; description: string | null }) => {
    if (!token) return;
    setApprovingSuggestionId(id);

    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/system-suggestions/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedData || {}),
      });

      if (response.ok) {
        toast.success('Sistema aprovado com sucesso!');
        fetchSuggestions();
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao aprovar:', error);
      toast.error('Erro ao aprovar sistema');
    } finally {
      setApprovingSuggestionId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Motivo da rejeição:');
    if (!reason || !token) return;

    setRejectingSuggestionId(id);

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
        toast.success('Sistema rejeitado!');
        fetchSuggestions();
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar sistema');
    } finally {
      setRejectingSuggestionId(null);
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
        toast.success('Candidato aprovado com sucesso!');
        fetchCandidates();
        setSelectedCandidate(null);
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao aprovar candidato:', error);
      toast.error('Erro ao aprovar candidato');
    }
  };

  const handleRejectCandidate = async (id: string) => {
    if (!token) return;
    if (!confirm('Rejeitar este candidato? Esta ação não pode ser desfeita.')) return;

    setRejectingCandidateId(id);

    try {
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Rejeitado pelo admin' }),
      });

      if (response.ok) {
        toast.success('Candidato rejeitado!');
        fetchCandidates();
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao rejeitar candidato:', error);
      toast.error('Erro ao rejeitar candidato');
    } finally {
      setRejectingCandidateId(null);
    }
  };

  const handleRejectAll = async () => {
    if (!token) return;
    
    const pendingCount = candidates.filter(c => c.editorial_status === 'awaiting_review').length;
    if (pendingCount === 0) {
      toast.error('Não há candidatos pendentes para rejeitar');
      return;
    }
    
    if (!confirm(`Rejeitar TODOS os ${pendingCount} candidatos pendentes? Esta ação não pode ser desfeita.`)) return;

    setRejectingAll(true);

    try {
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/reject-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.data.message);
        fetchCandidates();
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao rejeitar candidatos em lote:', error);
      toast.error('Erro ao rejeitar candidatos em lote');
    } finally {
      setRejectingAll(false);
    }
  };

  const handleUndoRejection = async (id: string) => {
    if (!token) return;
    if (!confirm('Desfazer rejeição? O candidato voltará para revisão.')) return;

    setUndoingCandidateId(id);

    try {
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/${id}/undo-rejection`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.data.message);
        fetchCandidates();
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao desfazer rejeição:', error);
      toast.error('Erro ao desfazer rejeição');
    } finally {
      setUndoingCandidateId(null);
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

  // Filtrar candidatos por status editorial
  const filteredCandidates = candidates.filter(candidate => {
    if (filter === 'all') return true;
    if (filter === 'pending') return candidate.editorial_status === 'awaiting_review';
    if (filter === 'approved') return candidate.editorial_status === 'accepted';
    if (filter === 'rejected') return candidate.editorial_status === 'rejected';
    return true;
  });

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
                        disabled={approvingSuggestionId === suggestion.id}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                      >
                        {approvingSuggestionId === suggestion.id && (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        )}
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(suggestion.id)}
                        disabled={rejectingSuggestionId === suggestion.id}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                      >
                        {rejectingSuggestionId === suggestion.id && (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        )}
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

              {/* Botão de rejeição em lote - visível apenas em "Pendentes" */}
              {filter === 'pending' && filteredCandidates.length > 0 && (
                <button
                  onClick={handleRejectAll}
                  disabled={rejectingAll}
                  className="ml-auto px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-semibold rounded-lg border border-red-500/50 transition-colors flex items-center gap-2"
                >
                  {rejectingAll && (
                    <span className="inline-block w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></span>
                  )}
                  Rejeitar Todas ({filteredCandidates.length})
                </button>
              )}
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
                  const mappedCandidate = candidateMappedData.get(candidate.id);

                  return (
                    <div
                      key={candidate.id}
                      className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white">{title}</h3>
                            {mappedCandidate?.is_covil && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-orange-900/50 text-orange-300 border border-orange-500/40 flex-shrink-0">
                                🏰 Covil do Lich
                              </span>
                            )}
                          </div>
                          
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
                              disabled={rejectingCandidateId === candidate.id}
                              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                              {rejectingCandidateId === candidate.id && (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              )}
                              Rejeitar
                            </button>
                          </div>
                        )}

                        {candidate.editorial_status === 'rejected' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUndoRejection(candidate.id)}
                              disabled={undoingCandidateId === candidate.id}
                              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                              {undoingCandidateId === candidate.id && (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              )}
                              Desfazer
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
                  {candidateMappedData.get(selectedCandidate.id)?.is_covil && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded-full text-xs font-bold bg-orange-900/50 text-orange-300 border border-orange-500/40">
                      🏰 Covil do Lich
                    </span>
                  )}
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-blue-300">Dados Extraídos Automaticamente</h3>
                    <button
                      onClick={() => setShowRawData(!showRawData)}
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      {showRawData ? 'Ocultar' : 'Ver'} dados brutos (JSON)
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-white/60">Título:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.title || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Sistema:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.system || 'Não identificado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Modalidade:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.modality || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Tipo:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.type || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Vagas:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.slots || selectedCandidate.parsed_json.maxPlayers || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Idioma:</span>
                      <span className="text-white ml-2">{selectedCandidate.parsed_json.language || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-white/60">Confiança:</span>
                      <span className="text-white ml-2">{Math.round((selectedCandidate.confidence_score || 0) * 100)}%</span>
                    </div>
                  </div>

                  {selectedCandidate.parsed_json.synopsis && (
                    <div className="text-sm mt-3 pt-3 border-t border-blue-500/20">
                      <span className="text-white/60">Descrição:</span>
                      <p className="text-white mt-1 line-clamp-3">{selectedCandidate.parsed_json.synopsis}</p>
                    </div>
                  )}

                  {/* Preview de Banner */}
                  {(selectedCandidate.parsed_json.imageUrl || selectedCandidate.parsed_json.banner || selectedCandidate.parsed_json.thumbnail) ? (
                    <div className="text-sm mt-3 pt-3 border-t border-blue-500/20">
                      <span className="text-white/60 block mb-2">Preview do Banner:</span>
                      <img
                        src={selectedCandidate.parsed_json.imageUrl || selectedCandidate.parsed_json.banner || selectedCandidate.parsed_json.thumbnail}
                        alt="Banner da mesa"
                        className="w-full max-h-48 object-cover rounded border border-blue-500/30"
                        onError={(e) => { e.currentTarget.src = bannerPlaceholder; }}
                      />
                    </div>
                  ) : (
                    <div className="text-sm mt-3 pt-3 border-t border-blue-500/20">
                      <span className="text-white/60 block mb-2">Preview do Banner:</span>
                      <img
                        src={bannerPlaceholder}
                        alt="Placeholder — sem banner"
                        className="w-full max-h-48 object-cover rounded border border-blue-500/30 opacity-50"
                      />
                      <p className="text-white/40 text-xs mt-1">Sem imagem detectada — placeholder padrão</p>
                    </div>
                  )}

                  {/* Dados brutos (JSON) */}
                  {showRawData && (
                    <div className="mt-4 pt-4 border-t border-blue-500/20">
                      <pre className="text-xs text-white/80 bg-black/30 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                        {JSON.stringify(selectedCandidate.parsed_json, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Formulário Editável */}
                <CreateTableForm
                  token={token!}
                  initialData={mapCandidateToFormData(selectedCandidate.parsed_json, systemsTree)}
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
