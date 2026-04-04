import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/suggestions.css';

interface SystemSuggestion {
  id: string;
  name: string;
  node_type: string;
  parent_id: string | null;
  parent_name: string | null;
  description: string | null;
  aliases: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  user_name: string;
  user_email: string;
  reviewed_by: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export const GestaoPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'log'>('pending');
  const [suggestions, setSuggestions] = useState<SystemSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    aliases: '',
  });
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSuggestions();
    }
  }, [user, activeTab]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('@ArtificioMesas:token');
      const status = activeTab === 'pending' ? 'pending' : '';
      const res = await fetch(`/api/v1/admin/system-suggestions?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (suggestion: SystemSuggestion) => {
    setEditingId(suggestion.id);
    setEditForm({
      name: suggestion.name,
      description: suggestion.description || '',
      aliases: suggestion.aliases?.join(', ') || '',
    });
  };

  const handleQuickApprove = async (id: string) => {
    if (!confirm('Aprovar esta sugestão sem editar?')) return;

    try {
      const token = localStorage.getItem('@ArtificioMesas:token');
      const res = await fetch(`/api/v1/admin/system-suggestions/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        alert('Sugestão aprovada com sucesso!');
        fetchSuggestions();
      } else {
        const data = await res.json();
        alert(`Erro: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Erro ao aprovar: ${err.message}`);
    }
  };

  const handleApproveWithEdits = async (id: string) => {
    if (!confirm('Aprovar esta sugestão com as edições feitas?')) return;

    try {
      const token = localStorage.getItem('@ArtificioMesas:token');
      const res = await fetch(`/api/v1/admin/system-suggestions/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          edited_name: editForm.name.trim(),
          edited_description: editForm.description.trim() || null,
          edited_aliases: editForm.aliases.trim() 
            ? editForm.aliases.split(',').map(a => a.trim()) 
            : null,
        }),
      });

      if (res.ok) {
        alert('Sugestão aprovada com sucesso!');
        setEditingId(null);
        fetchSuggestions();
      } else {
        const data = await res.json();
        alert(`Erro: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Erro ao aprovar: ${err.message}`);
    }
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('É necessário fornecer um motivo para a rejeição.');
      return;
    }

    try {
      const token = localStorage.getItem('@ArtificioMesas:token');
      const res = await fetch(`/api/v1/admin/system-suggestions/${rejectingId}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rejection_reason: rejectionReason.trim(),
        }),
      });

      if (res.ok) {
        alert('Sugestão rejeitada com sucesso!');
        setRejectingId(null);
        setRejectionReason('');
        fetchSuggestions();
      } else {
        const data = await res.json();
        alert(`Erro: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Erro ao rejeitar: ${err.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="container">
        <div className="alert alert-error">
          ❌ Acesso negado. Esta página é restrita a administradores.
        </div>
      </div>
    );
  }

  return (
    <div className="container gestao-page">
      <h1>🛠️ Gestão</h1>
      <p className="subtitle">Aprovação de sugestões e gerenciamento administrativo</p>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Sugestões Pendentes
          {suggestions.filter(s => s.status === 'pending').length > 0 && (
            <span className="badge">{suggestions.filter(s => s.status === 'pending').length}</span>
          )}
        </button>
        <button
          className={`tab ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          Log de Aprovações/Rejeições
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          {activeTab === 'pending' && (
            <div className="suggestions-list">
              {suggestions.filter(s => s.status === 'pending').length === 0 ? (
                <div className="empty-state">
                  ✅ Nenhuma sugestão pendente no momento.
                </div>
              ) : (
                suggestions
                  .filter(s => s.status === 'pending')
                  .map(suggestion => (
                    <div key={suggestion.id} className="suggestion-card">
                      {editingId === suggestion.id ? (
                        <div className="edit-form">
                          <h3>Revisar Sugestão</h3>
                          
                          <div className="form-group">
                            <label>Nome</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>

                          <div className="form-group">
                            <label>Descrição</label>
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              rows={3}
                            />
                          </div>

                          <div className="form-group">
                            <label>Aliases (separados por vírgula)</label>
                            <input
                              type="text"
                              value={editForm.aliases}
                              onChange={(e) => setEditForm({ ...editForm, aliases: e.target.value })}
                            />
                          </div>

                          <div className="suggestion-actions">
                            <button
                              onClick={() => handleApproveWithEdits(suggestion.id)}
                              className="btn-success"
                            >
                              ✅ Aprovar e Publicar
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-secondary"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="suggestion-header">
                            <h3>{suggestion.name}</h3>
                            <span className="badge badge-type">{suggestion.node_type}</span>
                          </div>

                          <div className="suggestion-meta">
                            <span>👤 Sugerido por: <strong>{suggestion.user_name}</strong></span>
                            <span>📅 {formatDate(suggestion.created_at)}</span>
                          </div>

                          {suggestion.parent_name && (
                            <div className="suggestion-parent">
                              📂 Filho de: <strong>{suggestion.parent_name}</strong>
                            </div>
                          )}

                          {suggestion.description && (
                            <div className="suggestion-description">
                              {suggestion.description}
                            </div>
                          )}

                          {suggestion.aliases && suggestion.aliases.length > 0 && (
                            <div className="suggestion-aliases">
                              🏷️ Aliases: {suggestion.aliases.join(', ')}
                            </div>
                          )}

                          <div className="suggestion-actions">
                            <button
                              onClick={() => handleEdit(suggestion)}
                              className="btn-primary"
                            >
                              ✏️ Editar e Aprovar
                            </button>
                            <button
                              onClick={() => handleQuickApprove(suggestion.id)}
                              className="btn-success"
                            >
                              ✅ Aprovar
                            </button>
                            <button
                              onClick={() => handleReject(suggestion.id)}
                              className="btn-danger"
                            >
                              ❌ Rejeitar
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'log' && (
            <div className="log-table-container">
              <table className="log-table">
                <thead>
                  <tr>
                    <th>Sistema</th>
                    <th>Tipo</th>
                    <th>Ação</th>
                    <th>Admin</th>
                    <th>Data/Hora</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions
                    .filter(s => s.status !== 'pending')
                    .map(log => (
                      <tr key={log.id}>
                        <td>{log.name}</td>
                        <td>
                          <span className="badge badge-type">{log.node_type}</span>
                        </td>
                        <td>
                          {log.status === 'approved' ? (
                            <span className="badge badge-success">✅ Aprovado</span>
                          ) : (
                            <span className="badge badge-danger">❌ Rejeitado</span>
                          )}
                        </td>
                        <td>{log.reviewer_name || '—'}</td>
                        <td>{log.reviewed_at ? formatDateTime(log.reviewed_at) : '—'}</td>
                        <td>{log.rejection_reason || '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal de Rejeição */}
      {rejectingId && (
        <div className="modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rejeitar Sugestão</h3>
              <button onClick={() => setRejectingId(null)} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <div className="alert alert-warning">
                ⚠️ O usuário será notificado sobre a rejeição.
              </div>

              <div className="form-group">
                <label htmlFor="rejectionReason">Motivo da rejeição (obrigatório)</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explique o motivo da rejeição..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setRejectingId(null)} className="btn-secondary">
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                className="btn-danger"
                disabled={!rejectionReason.trim()}
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
