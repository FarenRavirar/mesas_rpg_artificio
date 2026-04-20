import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SystemsAdminView } from './SystemsAdminView';
import { ScenariosAdminView } from './ScenariosAdminView';
import { PlatformsPage } from '../modules/admin/platforms/PlatformsPage';
import { ActivityPanel } from '../modules/admin/activity/components/ActivityPanel';
import { ScenarioEditModal } from '../components/ScenarioEditModal';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SystemSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [activeTab, setActiveTab] = useState<'systems' | 'crud' | 'activity'>('crud');
  const [crudSubTab, setCrudSubTab] = useState<'systems' | 'platforms' | 'scenarios' | 'tables'>('systems');
  const [scenarioEditModal, setScenarioEditModal] = useState<any>(null);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [approvingSuggestionId, setApprovingSuggestionId] = useState<string | null>(null);
  const [rejectingSuggestionId, setRejectingSuggestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (activeTab === 'systems') {
      fetchSuggestions();
    } else if (activeTab === 'crud') {
      if (crudSubTab === 'tables') {
        fetchAllTables();
      }
    }
  }, [user, navigate, filter, activeTab, crudSubTab]);

  const fetchSuggestions = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const url = filter === 'all'
        ? `${API_BASE}/api/v1/admin/system-suggestions`
        : `${API_BASE}/api/v1/admin/system-suggestions?status=${filter}`;

      const response = await fetch(url, {
        credentials: 'include',
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


  const fetchAllTables = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/tables`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAllTables(data.data || []);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao buscar mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, editedData?: { name: string; description: string | null }) => {
    if (!isAuthenticated) return;
    setApprovingSuggestionId(id);

    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/system-suggestions/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editedData || {}),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Novo contrato: { success: true, data: { suggestion_id, system_id, path_slug } }
        // Antigo contrato: { success: true }
        if (result.data && result.data.system_id) {
          toast.success(`Sistema aprovado! ID: ${result.data.system_id}`);
        } else {
          // Fallback retrocompatível
          toast.success('Sistema aprovado com sucesso!');
        }
        
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
    if (!reason || !isAuthenticated) return;

    setRejectingSuggestionId(id);

    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/system-suggestions/${id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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

  const handleDeleteTable = async (id: string, title: string) => {
    if (!isAuthenticated) return;
    if (!confirm(`Deletar mesa "${title}"? Esta ação não pode ser desfeita.`)) return;

    try {
      // CORREÇÃO DT-013: Rota correta é /api/v1/admin/tables/:id
      const response = await fetch(`${API_BASE}/api/v1/admin/tables/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Mesa deletada!');
        fetchAllTables();
      } else {
        // CORREÇÃO: Tratamento robusto de erro (pode retornar HTML em vez de JSON)
        let errorMessage = 'Erro ao deletar mesa';
        
        try {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text.slice(0, 200) || errorMessage;
          }
        } catch {
          // Se falhar ao parsear, usar mensagem padrão
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao deletar mesa:', error);
      toast.error('Erro ao deletar mesa');
    }
  };

  const handleToggleTableStatus = async (id: string, currentStatus: string, title: string) => {
    if (!isAuthenticated) return;
    const newStatus = currentStatus === 'active' ? 'cancelled' : 'active';
    const action = newStatus === 'active' ? 'ativar' : 'cancelar';
    
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} mesa "${title}"?`)) return;

    try {
      // CORREÇÃO DT-013: Rota correta é /api/v1/admin/tables/:id
      const response = await fetch(`${API_BASE}/api/v1/admin/tables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Mesa ${action === 'ativar' ? 'ativada' : 'desativada'}!`);
        fetchAllTables();
      } else {
        // CORREÇÃO: Tratamento robusto de erro (pode retornar HTML em vez de JSON)
        let errorMessage = `Erro ao ${action} mesa`;
        
        try {
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            errorMessage = text.slice(0, 200) || errorMessage;
          }
        } catch {
          // Se falhar ao parsear, usar mensagem padrão
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao alterar status da mesa:', error);
      toast.error(`Erro ao ${action} mesa`);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  const filteredTables = allTables.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1A2E] via-[#1B2A4A] to-[#0F1A2E] py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        <h1 className="text-3xl font-bold text-white mb-2">Gestão Administrativa</h1>
        <p className="text-white/60 mb-8">Aprove ou rejeite conteúdo enviado pela comunidade</p>

        {/* Abas de navegação */}
        <div className="flex gap-3 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('crud')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'crud'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Gerenciar Conteúdo
          </button>
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
            onClick={() => setActiveTab('activity')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'activity'
                ? 'text-white border-b-2 border-blue-500'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Atividades
          </button>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === 'crud' && (
          <div>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setCrudSubTab('systems')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  crudSubTab === 'systems'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Sistemas
              </button>
              <button
                onClick={() => setCrudSubTab('platforms')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  crudSubTab === 'platforms'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Plataformas
              </button>
              <button
                onClick={() => setCrudSubTab('scenarios')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  crudSubTab === 'scenarios'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Cenários
              </button>
              <button
                onClick={() => setCrudSubTab('tables')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  crudSubTab === 'tables'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Mesas
              </button>
            </div>

            {crudSubTab === 'systems' && (
              <SystemsAdminView />
            )}
            {crudSubTab === 'platforms' && <PlatformsPage />}

            {crudSubTab === 'scenarios' && (
              <ScenariosAdminView />
            )}

            {crudSubTab === 'tables' && (
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar mesas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                  />
                </div>
                {loading ? (
                  <div className="text-white/60 text-center py-8">Carregando...</div>
                ) : (
                  <div className="space-y-3">
                    {filteredTables.map((table) => (
                      <div key={table.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h3 className="text-white font-semibold">{table.title}</h3>
                          <p className="text-white/60 text-sm mt-1">
                            Status: {table.status} | Criada em: {new Date(table.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          {/* REQ-05: Checkbox Covil do Lich (admin only) */}
                          <label className="flex items-center gap-2 mt-2 text-sm text-white/80 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={table.is_covil || false}
                              onChange={async (e) => {
                                const newValue = e.target.checked;
                                try {
                                  const res = await fetch(`${API_BASE}/api/v1/admin/tables/${table.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ is_covil: newValue }),
                                  });
                                  if (!res.ok) throw new Error('Erro ao atualizar');
                                  toast.success(newValue ? 'Mesa marcada como Covil do Lich' : 'Marca Covil removida');
                                  fetchAllTables();
                                } catch (error) {
                                  toast.error('Erro ao atualizar mesa');
                                  console.error(error);
                                }
                              }}
                              className="w-4 h-4"
                            />
                            🏰 Covil do Lich
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleTableStatus(table.id, table.status, table.title)}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-white text-sm"
                          >
                            {table.status === 'active' ? 'Cancelar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id, table.title)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <ActivityPanel />
        )}

        {activeTab === 'systems' && (
          <div>
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Aprovadas
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'rejected'
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Rejeitadas
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Todas
              </button>
            </div>

            {loading ? (
              <div className="text-white/60 text-center py-8">Carregando...</div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-semibold">{suggestion.name}</h3>
                        {suggestion.description && (
                          <p className="text-white/60 text-sm mt-1">{suggestion.description}</p>
                        )}
                        <p className="text-white/40 text-xs mt-2">
                          Tipo: {suggestion.node_type} | Status: {suggestion.status}
                        </p>
                      </div>
                      {suggestion.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(suggestion.id)}
                            disabled={approvingSuggestionId === suggestion.id}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-white text-sm disabled:opacity-50"
                          >
                            {approvingSuggestionId === suggestion.id ? 'Aprovando...' : 'Aprovar'}
                          </button>
                          <button
                            onClick={() => handleReject(suggestion.id)}
                            disabled={rejectingSuggestionId === suggestion.id}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-white text-sm disabled:opacity-50"
                          >
                            {rejectingSuggestionId === suggestion.id ? 'Rejeitando...' : 'Rejeitar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {scenarioEditModal && (
        <ScenarioEditModal
          scenario={scenarioEditModal}
          onClose={() => setScenarioEditModal(null)}
          onSuccess={() => {
            setScenarioEditModal(null);
          }}
        />
      )}
    </div>
  );
};
