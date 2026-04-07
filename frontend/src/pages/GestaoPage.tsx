import { useEffect, useMemo, useState } from 'react';
import bannerPlaceholder from '../assets/banner_placeholder.webp';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Edit, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { mapCandidateToFormData } from '../utils/candidateToFormData';
import { ScenarioEditModal } from '../components/ScenarioEditModal';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { SystemsPage } from '../modules/admin/systems/SystemsPage';

// CORREÇÃO DT-011: Fallback para dev local quando VITE_API_URL não está definida
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  publish_mode: 'manual_review' | 'auto_publish';
  parsed_json: Record<string, any>;
  confidence_score: number;
  rejection_reason: string | null;
  created_at: string;
  created_table_slug?: string | null; // Slug da mesa criada após aprovação
}

export const GestaoPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SystemSuggestion[]>([]);
  const [candidates, setCandidates] = useState<AggregatorCandidate[]>([]);
  const [systemsTree, setSystemsTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [activeTab, setActiveTab] = useState<'systems' | 'tables' | 'crud'>('crud');
  const [selectedCandidate, setSelectedCandidate] = useState<AggregatorCandidate | null>(null);
  const [showRawData, setShowRawData] = useState(false);
  
  // Estados de loading para spinners
  const [approvingSuggestionId, setApprovingSuggestionId] = useState<string | null>(null);
  const [rejectingSuggestionId, setRejectingSuggestionId] = useState<string | null>(null);
  const [rejectingCandidateId, setRejectingCandidateId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [approvingCandidateId, setApprovingCandidateId] = useState<string | null>(null);
  const [rejectingAll, setRejectingAll] = useState(false);
  const [undoingCandidateId, setUndoingCandidateId] = useState<string | null>(null);


  // Estados para CRUD
  const [crudSubTab, setCrudSubTab] = useState<'systems' | 'scenarios' | 'tables'>('systems');
  const [scenarioEditModal, setScenarioEditModal] = useState<any>(null);
  const [allScenarios, setAllScenarios] = useState<any[]>([]);
  const [allTables, setAllTables] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para filtros avançados
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');
  const [masterFilter, setMasterFilter] = useState<string>('');

  // Estados para seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectionLimit, setSelectionLimit] = useState<number>(100);

  // Estados para modal de confirmação de delete em lote
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteConfirmed, setBulkDeleteConfirmed] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // CORREÇÃO DT-09: State para edição de candidatos antes da aprovação
  const [editedCandidate, setEditedCandidate] = useState<any>(null);

  /** Mapeamento pré-computado: candidateId -> CandidateFormData */
  const candidateMappedData = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mapCandidateToFormData>>();
    for (const c of candidates) {
      map.set(c.id, mapCandidateToFormData(c.parsed_json, systemsTree));
    }
    return map;
  }, [candidates, systemsTree]);

  // Carregar filtros salvos do localStorage ao montar
  useEffect(() => {
    const savedFilters = localStorage.getItem('gestao_filters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.dateStart) setDateFilterStart(filters.dateStart);
        if (filters.dateEnd) setDateFilterEnd(filters.dateEnd);
        if (filters.master) setMasterFilter(filters.master);
        if (filters.selectionLimit) setSelectionLimit(filters.selectionLimit);
      } catch (error) {
        console.error('Erro ao carregar filtros salvos:', error);
      }
    }
  }, []);

  // Salvar filtros no localStorage quando mudarem
  useEffect(() => {
    const filters = {
      dateStart: dateFilterStart,
      dateEnd: dateFilterEnd,
      master: masterFilter,
      selectionLimit,
    };
    localStorage.setItem('gestao_filters', JSON.stringify(filters));
  }, [dateFilterStart, dateFilterEnd, masterFilter, selectionLimit]);

  // Filtrar candidatos com base nos filtros ativos
  const filteredCandidates = useMemo(() => {
    let result = candidates.filter(c => {
      // Filtro de status (existente)
      if (filter === 'pending') return c.editorial_status === 'awaiting_review';
      if (filter === 'approved') return c.editorial_status === 'accepted';
      if (filter === 'rejected') return c.editorial_status === 'rejected';
      return true;
    });

    // Filtro de data
    if (dateFilterStart || dateFilterEnd) {
      result = result.filter(c => {
        const createdAt = new Date(c.created_at);
        if (dateFilterStart && createdAt < new Date(dateFilterStart)) return false;
        if (dateFilterEnd) {
          const endDate = new Date(dateFilterEnd);
          endDate.setHours(23, 59, 59, 999); // Incluir o dia inteiro
          if (createdAt > endDate) return false;
        }
        return true;
      });
    }

    // Filtro de mestre
    if (masterFilter.trim()) {
      result = result.filter(c => {
        const enriched = c.parsed_json?.enrichedFields as Record<string, any> | undefined;
        const masterName = enriched?.master_display_name || 
                          c.parsed_json?.author?.username || 
                          c.parsed_json?.recruiterName || '';
        return masterName.toLowerCase().includes(masterFilter.toLowerCase());
      });
    }

    return result;
  }, [candidates, filter, dateFilterStart, dateFilterEnd, masterFilter]);

  // Contar filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateFilterStart || dateFilterEnd) count++;
    if (masterFilter.trim()) count++;
    return count;
  }, [dateFilterStart, dateFilterEnd, masterFilter]);

  // Limpar seleção quando o filtro de status mudar
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAll(false);
  }, [filter]);

  // Remover IDs selecionados que não estão mais visíveis após aplicar filtros
  useEffect(() => {
    const visibleIds = new Set(filteredCandidates.map(c => c.id));
    setSelectedIds(prev => {
      const newSet = new Set<string>();
      prev.forEach(id => {
        if (visibleIds.has(id)) {
          newSet.add(id);
        }
      });
      // Se removeu algum ID, desmarcar "Selecionar Todos"
      if (newSet.size !== prev.size && newSet.size < filteredCandidates.length) {
        setSelectAll(false);
      }
      return newSet;
    });
  }, [filteredCandidates]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    // Carregar árvore de sistemas uma vez ao montar
    fetchSystemsTree();

    if (activeTab === 'systems') {
      fetchSuggestions();
    } else if (activeTab === 'crud') {
      // Carregar dados da sub-aba CRUD selecionada
      if (crudSubTab === 'scenarios') {
        fetchAllScenarios();
      } else if (crudSubTab === 'tables') {
        fetchAllTables();
      }
      // Systems agora é gerenciado pelo módulo SystemsPage
    } else {
      fetchCandidates();
    }
  }, [user, navigate, filter, activeTab, crudSubTab]);

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

  // Funções CRUD
  const fetchAllScenarios = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/scenarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAllScenarios(data.data || []);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao buscar cenários:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTables = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/tables`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const handleDeleteScenario = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`Deletar cenário "${name}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/scenarios/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Cenário deletado!');
        fetchAllScenarios();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar cenário');
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao deletar cenário:', error);
      toast.error('Erro ao deletar cenário');
    }
  };

  const handleDeleteTable = async (id: string, title: string) => {
    if (!token) return;
    if (!confirm(`Deletar mesa "${title}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/gm/admin/tables/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Mesa deletada!');
        fetchAllTables();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar mesa');
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao deletar mesa:', error);
      toast.error('Erro ao deletar mesa');
    }
  };

  const handleToggleTableStatus = async (id: string, currentStatus: string, title: string) => {
    if (!token) return;
    // CORREÇÃO F04: 'inactive' não existe no enum — usar 'cancelled' para desativar
    const newStatus = currentStatus === 'active' ? 'cancelled' : 'active';
    const action = newStatus === 'active' ? 'ativar' : 'cancelar';
    
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} mesa "${title}"?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/gm/admin/tables/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Mesa ${action === 'ativar' ? 'ativada' : 'desativada'}!`);
        fetchAllTables();
      } else {
        const data = await response.json();
        toast.error(data.error || `Erro ao ${action} mesa`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao alterar status da mesa:', error);
      toast.error(`Erro ao ${action} mesa`);
    }
  };

  // Funções auxiliares para filtros
  const handleClearFilters = () => {
    setDateFilterStart('');
    setDateFilterEnd('');
    setMasterFilter('');
    toast.success('Filtros limpos');
  };

  // Funções auxiliares para seleção múltipla
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        // Verificar limite
        if (newSet.size >= selectionLimit) {
          toast.error(`Máximo de ${selectionLimit} candidatos por vez`);
          return prev;
        }
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      // Desmarcar todos
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      // Marcar todos (respeitando limite)
      const idsToSelect = filteredCandidates.slice(0, selectionLimit).map(c => c.id);
      setSelectedIds(new Set(idsToSelect));
      setSelectAll(true);
      if (filteredCandidates.length > selectionLimit) {
        toast(`Selecionados ${selectionLimit} de ${filteredCandidates.length} candidatos (limite atingido)`, {
          icon: 'ℹ️',
        });
      }
    }
  };

  // Função para deletar candidatos em lote
  const handleBulkDelete = async () => {
    if (!token || selectedIds.size === 0) return;

    setDeletingBulk(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (response.ok) {
        const data = await response.json();
        const deleted = data.data.deleted;
        const requested = data.data.requested;
        // CORREÇÃO: Tratar campo invalid (IDs malformados filtrados pelo backend)
        const invalid = data.data.invalid || 0;
        
        if (deleted === requested) {
          toast.success(`${deleted} candidato(s) deletado(s) permanentemente`);
        } else if (deleted > 0) {
          // CORREÇÃO: Diferenciar entre IDs inválidos e candidatos já removidos
          if (invalid > 0) {
            toast(`${deleted} candidato(s) deletado(s). ${invalid} ID(s) inválido(s) foram ignorados.`, {
              icon: '⚠️',
            });
          } else {
            toast(`${deleted} de ${requested} candidato(s) deletado(s). Alguns já haviam sido removidos.`, {
              icon: '⚠️',
            });
          }
        } else {
          // CORREÇÃO: Mensagem específica se todos os IDs eram inválidos
          if (invalid === requested) {
            toast.error('Nenhum candidato foi deletado. Todos os IDs eram inválidos.');
          } else {
            toast.error('Nenhum candidato foi deletado. Eles podem já ter sido removidos.');
          }
        }
        
        // Limpar seleção e fechar modal
        setSelectedIds(new Set());
        setSelectAll(false);
        setShowBulkDeleteModal(false);
        setBulkDeleteConfirmed(false);
        
        // Recarregar candidatos
        fetchCandidates();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar candidatos');
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao deletar candidatos em lote:', error);
      toast.error('Erro ao deletar candidatos');
    } finally {
      setDeletingBulk(false);
    }
  };

  // Carregar dados CRUD quando aba CRUD estiver ativa
  useEffect(() => {
    if (activeTab === 'crud' && token) {
      if (crudSubTab === 'scenarios') {
        fetchAllScenarios();
      } else if (crudSubTab === 'tables') {
        fetchAllTables();
      }
      // Systems agora é gerenciado pelo módulo SystemsPage
    }
  }, [activeTab, crudSubTab, token]);


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
      // Mapear filtro do frontend para status do backend
      let statusParam = '';
      if (filter !== 'all') {
        const backendStatus = filter === 'pending' ? 'awaiting_review' : filter === 'approved' ? 'accepted' : filter;
        statusParam = `?editorial_status=${backendStatus}`;
      }
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates${statusParam}`, {
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

  // CORREÇÃO DT-09, DT-10, DT-11: Aprovar candidato com dados editados, redirect e loading
  const handleApproveCandidate = async (id: string) => {
    if (!token) return;
    if (!confirm('Aprovar este candidato e criar mesa?')) return;

    // CORREÇÃO DT-11: Loading state
    setApprovingCandidateId(id);
    if (approvingCandidateId) console.log('[GestaoPage] Aprovando candidato:', approvingCandidateId);

    try {
      // CORREÇÃO DT-09: Enviar dados editados se houver
      let body: any = undefined;
      
      if (editedCandidate && Object.keys(editedCandidate).length > 0) {
        body = JSON.stringify(editedCandidate);
        console.log('[GestaoPage] Enviando overrides editados:', editedCandidate);
      }

      // CORREÇÃO A13: Rota backend é PATCH, não POST
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/${id}/accept`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Candidato aprovado com sucesso!');
        
        // CORREÇÃO A15: Ler created_table_slug do candidato retornado
        if (data.data?.created_table_slug) {
          toast.success(`Redirecionando para mesa criada...`, { duration: 2000 });
          setTimeout(() => {
            window.location.href = `/mesa/${data.data.created_table_slug}`;
          }, 2000);
        } else {
          fetchCandidates();
          setSelectedCandidate(null);
          setEditedCandidate(null);
        }
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao aprovar candidato:', error);
      toast.error('Erro ao aprovar candidato');
    } finally {
      // CORREÇÃO DT-11: Limpar loading state
      setApprovingCandidateId(null);
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

  const handleDeleteCandidate = async (id: string) => {
    if (!token) return;
    if (!confirm('⚠️ DELETAR PERMANENTEMENTE este candidato do banco de dados?\n\nEsta ação é IRREVERSÍVEL e não pode ser desfeita!')) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/aggregator/candidates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Candidato deletado permanentemente!');
        fetchCandidates();
        setSelectedCandidate(null);
      } else {
        const data = await response.json();
        toast.error(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('[GestaoPage] Erro ao deletar candidato:', error);
      toast.error('Erro ao deletar candidato');
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

        {/* Aba CRUD */}
        {activeTab === 'crud' && (
          <>
            {/* Sub-abas */}
            <div className="flex gap-3 mb-6 border-b border-white/10">
              <button
                onClick={() => setCrudSubTab('systems')}
                className={`px-4 py-2 font-semibold transition-all ${
                  crudSubTab === 'systems'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Sistemas
              </button>
              <button
                onClick={() => setCrudSubTab('scenarios')}
                className={`px-4 py-2 font-semibold transition-all ${
                  crudSubTab === 'scenarios'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Cenários
              </button>
              <button
                onClick={() => setCrudSubTab('tables')}
                className={`px-4 py-2 font-semibold transition-all ${
                  crudSubTab === 'tables'
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Mesas
              </button>
            </div>

            {/* Busca e botão adicionar (exceto para Systems que tem próprio) */}
            {crudSubTab !== 'systems' && (
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Buscar ${crudSubTab === 'scenarios' ? 'cenários' : 'mesas'}...`}
                  className="flex-1 px-4 py-2 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    if (crudSubTab === 'scenarios') setScenarioEditModal({});
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar
                </button>
              </div>
            )}

            {/* Conteúdo das sub-abas */}
            {loading ? (
              <div className="text-center py-12 text-white/50">Carregando...</div>
            ) : (
              <>
                {/* Lista de Sistemas */}
                {crudSubTab === 'systems' && <SystemsPage />}

                {/* Lista de Cenários */}
                {crudSubTab === 'scenarios' && (
                  <div className="space-y-3">
                    {allScenarios
                      .filter((scn) =>
                        searchQuery
                          ? scn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            scn.slug.toLowerCase().includes(searchQuery.toLowerCase())
                          : true
                      )
                      .map((scn) => (
                        <div
                          key={scn.id}
                          className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <h3 className="text-lg font-bold text-white">{scn.name}</h3>
                            <p className="text-sm text-white/60">
                              Slug: {scn.slug}
                              {scn.subgenres && scn.subgenres.length > 0 && (
                                <span> | Subgêneros: {scn.subgenres.join(', ')}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setScenarioEditModal(scn)}
                              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteScenario(scn.id, scn.name)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Lista de Mesas */}
                {crudSubTab === 'tables' && (
                  <div className="space-y-3">
                    {allTables
                      .filter((tbl) =>
                        searchQuery
                          ? tbl.title.toLowerCase().includes(searchQuery.toLowerCase())
                          : true
                      )
                      .map((tbl) => (
                        <div
                          key={tbl.id}
                          className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <h3 className="text-lg font-bold text-white">{tbl.title}</h3>
                            <p className="text-sm text-white/60">
                              Sistema: {tbl.system_name || 'Não informado'} | Status: {tbl.status}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={`/mesa/${tbl.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                              title="Ver mesa"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </a>
                            <a
                              href={`/painel-mestre?edit=${tbl.id}`}
                              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-5 h-5" />
                            </a>
                            <button
                              onClick={() => handleToggleTableStatus(tbl.id, tbl.status, tbl.title)}
                              className={`p-2 ${tbl.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg transition-colors`}
                              title={tbl.status === 'active' ? 'Desativar' : 'Ativar'}
                            >
                              {tbl.status === 'active' ? '⏸' : '▶'}
                            </button>
                            <button
                              onClick={() => handleDeleteTable(tbl.id, tbl.title)}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Deletar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

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

            {/* Filtros Avançados */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">Filtros Avançados</h3>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded border border-blue-500/50" title="Filtros ativos salvos automaticamente">
                      {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                    </span>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded border border-white/10 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro de Data Início */}
                <div>
                  <label className="block text-white/60 text-sm mb-2">Data Início</label>
                  <input
                    type="date"
                    value={dateFilterStart}
                    onChange={(e) => setDateFilterStart(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Filtro de Data Fim */}
                <div>
                  <label className="block text-white/60 text-sm mb-2">Data Fim</label>
                  <input
                    type="date"
                    value={dateFilterEnd}
                    onChange={(e) => setDateFilterEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Filtro de Mestre */}
                <div>
                  <label className="block text-white/60 text-sm mb-2">Buscar por Mestre</label>
                  <input
                    type="text"
                    value={masterFilter}
                    onChange={(e) => setMasterFilter(e.target.value)}
                    placeholder="Nome do mestre..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <p className="text-white/40 text-xs mt-3">
                💡 Os filtros são salvos automaticamente e permanecerão ativos entre sessões
              </p>
            </div>

            {/* Controles de Seleção Múltipla */}
            {filteredCandidates.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox Selecionar Todos */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleToggleSelectAll}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500/50"
                      />
                      <span className="text-white font-semibold">Selecionar Todos</span>
                    </label>

                    {/* Contador de Selecionados */}
                    {selectedIds.size > 0 && (
                      <span className="text-white/60">
                        {selectedIds.size} de {filteredCandidates.length} selecionados
                      </span>
                    )}

                    {/* Dropdown de Limite */}
                    <div className="flex items-center gap-2">
                      <label className="text-white/60 text-sm">Limite:</label>
                      <select
                        value={selectionLimit}
                        onChange={(e) => setSelectionLimit(Number(e.target.value))}
                        className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-500/50"
                      >
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={150}>150</option>
                      </select>
                    </div>
                  </div>

                  {/* Botão Deletar Selecionados */}
                  {selectedIds.size > 0 && (
                    <button
                      onClick={() => setShowBulkDeleteModal(true)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-lg border border-red-500/50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar Selecionados ({selectedIds.size})
                    </button>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-white/50">Carregando...</div>
            ) : filteredCandidates.length === 0 ? (
              <div className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-12 text-center">
                <p className="text-white/50">Nenhum candidato encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => {
                  const parsed = candidate.parsed_json || {};
                  // CORREÇÃO F06: Priorizar enrichedFields (parser Python) sobre campos raiz
                  const enriched = (parsed.enrichedFields as Record<string, any>) || {};
                  const title = enriched.title || parsed.title || 'Sem título';
                  const system = enriched.system_normalized || enriched.system || parsed.system || 'Sistema não identificado';
                  const masterText = enriched.master_display_name || enriched.recruiterName || parsed.masterText || parsed.recruiterName || parsed.author?.username || 'Não informado';
                  const confidence = Math.round((candidate.confidence_score || 0) * 100);
                  const mappedCandidate = candidateMappedData.get(candidate.id);

                  return (
                    <div
                      key={candidate.id}
                      className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Checkbox de Seleção */}
                        <div className="flex-shrink-0 pt-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(candidate.id)}
                            onChange={() => handleToggleSelect(candidate.id)}
                            className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                            title="Selecionar para ação em lote"
                          />
                        </div>

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
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                // CORREÇÃO DT-03 + DT-05: Inicializar com campos básicos + enrichedFields
                                const initialData = {
                                  // Campos básicos de parsed_json raiz
                                  title: candidate.parsed_json.title,
                                  synopsis: candidate.parsed_json.synopsis,
                                  slots_total: candidate.parsed_json.slotsTotal,
                                  // Campos avançados de enrichedFields
                                  ...(candidate.parsed_json.enrichedFields || {}),
                                };
                                setEditedCandidate(initialData);
                              }}
                              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
                            >
                              Revisar
                            </button>
                            <button
                              onClick={() => handleApproveCandidate(candidate.id)}
                              // CORREÇÃO F07: Desabilitar durante aprovação para evitar duplo-clique e mesa duplicada
                              disabled={approvingCandidateId === candidate.id}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                            >
                              {approvingCandidateId === candidate.id && (
                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                              )}
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
                            <button
                              onClick={() => handleDeleteCandidate(candidate.id)}
                              className="p-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                              title="Deletar permanentemente"
                            >
                              <Trash2 className="w-5 h-5" />
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
                            <button
                              onClick={() => handleDeleteCandidate(candidate.id)}
                              className="p-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                              title="Deletar permanentemente"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}

                        {candidate.editorial_status === 'accepted' && (
                          <div className="flex gap-2">
                            {candidate.created_table_slug && (
                              <button
                                onClick={() => window.open(`/mesa/${candidate.created_table_slug}`, '_blank')}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                title="Ver mesa criada"
                              >
                                Ver Mesa
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteCandidate(candidate.id)}
                              className="p-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors"
                              title="Deletar permanentemente"
                            >
                              <Trash2 className="w-5 h-5" />
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

                  {/* Dados brutos (JSON) */}
                  {showRawData && (
                    <div className="mt-4 pt-4 border-t border-blue-500/20">
                      <div className="space-y-3">
                        {/* Campos REQ-21 destacados */}
                        <div className="text-xs text-white/60 mb-2">
                          <strong className="text-white/80">Campos REQ-21:</strong> age_rating, table_level, game_platform, communication_platform, custom_scenario, style_tags, frequency
                        </div>
                        
                        {/* JSON formatado com scroll */}
                        <pre className="text-xs text-white/80 bg-black/40 p-4 rounded-lg overflow-x-auto max-h-96 border border-white/10">
                          {JSON.stringify(selectedCandidate.parsed_json, null, 2)}
                        </pre>
                        
                        {/* Metadados do candidato */}
                        <div className="grid grid-cols-2 gap-2 text-xs bg-black/20 p-3 rounded-lg">
                          <div>
                            <span className="text-white/50">ID:</span>
                            <span className="text-white/80 ml-2">{selectedCandidate.id}</span>
                          </div>
                          <div>
                            <span className="text-white/50">Confiança:</span>
                            <span className="text-white/80 ml-2">{selectedCandidate.confidence_score}%</span>
                          </div>
                          <div>
                            <span className="text-white/50">Status:</span>
                            <span className="text-white/80 ml-2">{selectedCandidate.editorial_status}</span>
                          </div>
                          <div>
                            <span className="text-white/50">Modo:</span>
                            <span className="text-white/80 ml-2">{selectedCandidate.publish_mode}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CORREÇÃO DT-09: Formulário de Edição Inline */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Título da Mesa *
                    </label>
                    {/* CORREÇÃO F08: value controlado + key para forçar remount ao trocar candidato */}
                    <input
                      key={`title-${selectedCandidate.id}`}
                      type="text"
                      value={editedCandidate?.title ?? selectedCandidate.parsed_json.title ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Digite o título da mesa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Descrição da Mesa * (Markdown/HTML suportado)
                    </label>
                    <MarkdownEditor
                      value={editedCandidate?.description || selectedCandidate.parsed_json.description || selectedCandidate.parsed_json.synopsis || ''}
                      onChange={(text: string) => setEditedCandidate((prev: any) => ({ ...prev, description: text }))}
                      placeholder="Descreva a mesa, campanha ou oneshot..."
                      height={400}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Sistema
                      </label>
                      {/* CORREÇÃO F08: value controlado + key para remount ao trocar candidato */}
                      <input
                        key={`system-${selectedCandidate.id}`}
                        type="text"
                        value={editedCandidate?.system ?? selectedCandidate.parsed_json.enrichedFields?.system ?? selectedCandidate.parsed_json.system ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, system: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Ex: D&D 5e"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Vagas
                      </label>
                      <input
                        type="number"
                        defaultValue={editedCandidate?.slots_total ?? candidateMappedData.get(selectedCandidate.id)?.slots_total ?? selectedCandidate.parsed_json.slots_total ?? selectedCandidate.parsed_json.slots ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, slots_total: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Tipo
                      </label>
                      {/* CORREÇÃO F02: Valores alinhados com enum do banco: campanha, one-shot, oneshot-serie, aberta */}
                      <select
                        key={`type-${selectedCandidate.id}`}
                        value={editedCandidate?.type ?? selectedCandidate.parsed_json.type ?? 'one-shot'}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditedCandidate((prev: any) => ({ ...prev, type: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="one-shot">One-shot</option>
                        <option value="campanha">Campanha</option>
                        <option value="oneshot-serie">Série de One-shots</option>
                        <option value="aberta">Mesa Aberta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Modalidade
                      </label>
                      {/* CORREÇÃO F03: 'hibrido' → 'hibrida' para alinhar com enum do banco */}
                      <select
                        key={`modality-${selectedCandidate.id}`}
                        value={editedCandidate?.modality ?? candidateMappedData.get(selectedCandidate.id)?.modality ?? selectedCandidate.parsed_json.modality ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditedCandidate((prev: any) => ({ ...prev, modality: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Selecione...</option>
                        <option value="online">Online</option>
                        <option value="presencial">Presencial</option>
                        <option value="hibrida">Híbrida</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Preço
                    </label>
                    <select
                      defaultValue={selectedCandidate.parsed_json.price_type || 'gratuita'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditedCandidate((prev: any) => ({ ...prev, price_type: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="gratuita">Gratuita</option>
                      <option value="paga">Paga</option>
                    </select>
                  </div>

                  {/* Campos Avançados (REQ-26 e REQ-28) */}
                  <div className="col-span-2 space-y-4 pt-4 border-t border-white/10">
                    <h4 className="text-sm font-bold text-white/90">Campos Avançados (Opcional)</h4>
                    
                    {/* Cenário e Estilos */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Cenário
                      </label>
                      <input
                        type="text"
                        value={editedCandidate?.setting_name ?? selectedCandidate.parsed_json.enrichedFields?.setting_name ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, setting_name: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Ex: Forgotten Realms, Eberron"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Estilos (separados por vírgula)
                      </label>
                      <input
                        type="text"
                        value={editedCandidate?.setting_styles ? (Array.isArray(editedCandidate.setting_styles) ? editedCandidate.setting_styles.join(', ') : editedCandidate.setting_styles) : (Array.isArray(selectedCandidate.parsed_json.enrichedFields?.setting_styles) ? selectedCandidate.parsed_json.enrichedFields.setting_styles.join(', ') : '')}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, setting_styles: e.target.value.split(',').map((s: string) => s.trim()).filter((s: string) => s) }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Ex: Fantasia Medieval, Combate Tático"
                      />
                    </div>

                    {/* Duração e Nível */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Duração da Campanha
                        </label>
                        <input
                          type="text"
                          value={editedCandidate?.campaign_length ?? selectedCandidate.parsed_json.enrichedFields?.campaign_length ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, campaign_length: e.target.value }))}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Ex: 6 meses, 12 sessões"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Faixa de Nível
                        </label>
                        <input
                          type="text"
                          value={editedCandidate?.level_range ?? selectedCandidate.parsed_json.enrichedFields?.level_range ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, level_range: e.target.value }))}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Ex: 1-5, 10-15"
                        />
                      </div>
                    </div>

                    {/* Requisitos Técnicos */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Requisitos Técnicos
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editedCandidate?.requires_pc ?? selectedCandidate.parsed_json.enrichedFields?.requires_pc ?? false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, requires_pc: e.target.checked }))}
                            className="h-4 w-4 rounded border-white/20 bg-white/10"
                          />
                          PC
                        </label>
                        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editedCandidate?.requires_camera ?? selectedCandidate.parsed_json.enrichedFields?.requires_camera ?? false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, requires_camera: e.target.checked }))}
                            className="h-4 w-4 rounded border-white/20 bg-white/10"
                          />
                          Câmera
                        </label>
                        <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editedCandidate?.requires_microphone ?? selectedCandidate.parsed_json.enrichedFields?.requires_microphone ?? false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, requires_microphone: e.target.checked }))}
                            className="h-4 w-4 rounded border-white/20 bg-white/10"
                          />
                          Microfone
                        </label>
                      </div>
                    </div>

                    {/* CORREÇÃO B09: Campo de texto de cobrança */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Texto de Cobrança
                      </label>
                      <input
                        type="text"
                        value={editedCandidate?.billing_text ?? selectedCandidate.parsed_json.enrichedFields?.billing_text ?? selectedCandidate.parsed_json.priceText ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, billing_text: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Ex: R$ 50/sessão, Gratuita, etc."
                      />
                    </div>

                    {/* CORREÇÃO B05: Campo de URL do banner */}
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        URL do Banner
                      </label>
                      <input
                        type="url"
                        value={editedCandidate?.banner_url ?? selectedCandidate.parsed_json.enrichedFields?.banner_url ?? selectedCandidate.parsed_json.imageUrl ?? selectedCandidate.parsed_json.banner ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedCandidate((prev: any) => ({ ...prev, banner_url: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="https://..."
                      />
                    </div>

                    {/* CORREÇÃO B08: Agenda (sessions) */}
                    {selectedCandidate.parsed_json.enrichedFields?.sessions && Array.isArray(selectedCandidate.parsed_json.enrichedFields.sessions) && selectedCandidate.parsed_json.enrichedFields.sessions.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Agenda (Sessões)
                        </label>
                        <div className="space-y-2">
                          {selectedCandidate.parsed_json.enrichedFields.sessions.map((session: any, index: number) => (
                            <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-white/50">Dia:</span>
                                  <span className="text-white ml-2">{session.day_of_week || 'Não informado'}</span>
                                </div>
                                <div>
                                  <span className="text-white/50">Horário:</span>
                                  <span className="text-white ml-2">
                                    {session.start_time || 'Não informado'}
                                    {session.end_time && ` - ${session.end_time}`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-white/50">Frequência:</span>
                                  <span className="text-white ml-2">{session.frequency || 'Não informado'}</span>
                                </div>
                                {session.slots_per_session && (
                                  <div>
                                    <span className="text-white/50">Vagas:</span>
                                    <span className="text-white ml-2">{session.slots_per_session}</span>
                                  </div>
                                )}
                                {session.notes && (
                                  <div className="col-span-2">
                                    <span className="text-white/50">Observações:</span>
                                    <span className="text-white ml-2">{session.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                          ⚠️ Edição de agenda não implementada. Para alterar, edite o parsed_json diretamente.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preview de Banner */}
                  {(editedCandidate?.banner_url || 
                    candidateMappedData.get(selectedCandidate.id)?.banner_url || 
                    selectedCandidate.parsed_json.imageUrl || 
                    selectedCandidate.parsed_json.banner || 
                    selectedCandidate.parsed_json.thumbnail) && (
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Preview do Banner
                      </label>
                      <img
                        src={
                          editedCandidate?.banner_url ||
                          candidateMappedData.get(selectedCandidate.id)?.banner_url ||
                          selectedCandidate.parsed_json.imageUrl || 
                          selectedCandidate.parsed_json.banner || 
                          selectedCandidate.parsed_json.thumbnail
                        }
                        alt="Banner da mesa"
                        className="w-full max-h-48 object-cover rounded border border-blue-500/30"
                        onError={(e) => { e.currentTarget.src = bannerPlaceholder; }}
                      />
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
                  <button
                    onClick={() => {
                      setSelectedCandidate(null);
                      setEditedCandidate(null);
                    }}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg border border-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleRejectCandidate(selectedCandidate.id)}
                    disabled={rejectingCandidateId === selectedCandidate.id}
                    className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-semibold rounded-lg border border-red-500/50 transition-colors flex items-center gap-2"
                  >
                    {rejectingCandidateId === selectedCandidate.id && (
                      <span className="inline-block w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></span>
                    )}
                    Rejeitar
                  </button>
                  <button
                    onClick={() => handleApproveCandidate(selectedCandidate.id)}
                    disabled={approvingCandidateId === selectedCandidate.id}
                    className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-green-400 font-semibold rounded-lg border border-green-500/50 transition-colors flex items-center gap-2"
                  >
                    {approvingCandidateId === selectedCandidate.id && (
                      <span className="inline-block w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin"></span>
                    )}
                    Aprovar e Publicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modais CRUD */}
      {/* SystemEditModal agora está no módulo SystemsPage */}


      {scenarioEditModal && (
        <ScenarioEditModal
          scenario={scenarioEditModal.id ? scenarioEditModal : null}
          token={token!}
          onClose={() => setScenarioEditModal(null)}
          onSuccess={() => {
            fetchAllScenarios();
          }}
        />
      )}

      {/* Modal de Confirmação de Delete em Lote */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1B2A4A] border border-white/20 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                ⚠️ Confirmar Deleção Permanente
              </h2>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-300 font-semibold mb-2">
                  Esta ação é irreversível!
                </p>
                <p className="text-white/70 text-sm">
                  Você está prestes a deletar permanentemente {selectedIds.size} candidato(s). 
                  Os dados não poderão ser recuperados.
                </p>
              </div>

              {/* Lista de candidatos que serão deletados */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">
                  Candidatos que serão deletados:
                </h3>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {Array.from(selectedIds).map(id => {
                    const candidate = candidates.find(c => c.id === id);
                    if (!candidate) return null;
                    const title = candidate.parsed_json?.title || 'Sem título';
                    const system = candidate.parsed_json?.system || 'Sistema não identificado';
                    return (
                      <div key={id} className="text-sm text-white/70 border-b border-white/5 pb-2 last:border-0">
                        <span className="font-semibold text-white">{title}</span>
                        <span className="text-white/50"> — {system}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkbox de Confirmação */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkDeleteConfirmed}
                  onChange={(e) => setBulkDeleteConfirmed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-white/20 bg-white/5 checked:bg-red-500 focus:ring-2 focus:ring-red-500/50 cursor-pointer"
                />
                <span className="text-white">
                  Confirmo que quero deletar permanentemente estes {selectedIds.size} candidato(s) e entendo que esta ação não pode ser desfeita.
                </span>
              </label>

              {/* Botões */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                    setBulkDeleteConfirmed(false);
                  }}
                  disabled={deletingBulk}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg border border-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={!bulkDeleteConfirmed || deletingBulk}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-semibold rounded-lg border border-red-500/50 transition-colors flex items-center gap-2"
                >
                  {deletingBulk && (
                    <span className="inline-block w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></span>
                  )}
                  Deletar Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
