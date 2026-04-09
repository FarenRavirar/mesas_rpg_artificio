import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProfileContext } from '../contexts/ProfileContext';
import type { PlayerProfile, GmProfile } from '../hooks/useProfile';
import { UserSystemsSelector } from '../components/UserSystemsSelector';
import { LinksManager } from '../components/LinksManager';
import { showSuccess, showError } from '../utils/toast';
import { track } from '../services/analytics';
import './ProfileEditPage.css';

/**
 * Página de edição de perfil com tabs
 * Tabs: Geral | Jogador | Mestre
 * Autosave com debounce 500ms
 */

type TabType = 'geral' | 'jogador' | 'mestre';

const VALID_TABS: TabType[] = ['geral', 'jogador', 'mestre'];

const sanitizeTab = (tab: string | null): TabType => {
  return VALID_TABS.includes(tab as TabType) ? (tab as TabType) : 'geral';
};

export default function ProfileEditPage() {
  const { profile, loading, saving, error, refetch } = useProfileContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = sanitizeTab(searchParams.get('tab'));
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [showSaved, setShowSaved] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Sincronizar aba com URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    track('profile_tab_changed', { from: activeTab, to: tab });
  };

  // Feedback de autosave com timeout
  useEffect(() => {
    if (!saving && profile) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [saving, profile]);

  // Feedback de conexão Discord
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordStatus = params.get('discord');
    const reason = params.get('reason');
    
    if (discordStatus === 'connected') {
      showSuccess('Discord conectado com sucesso!');
      track('discord_connected');
      window.history.replaceState({}, '', '/perfil');
      refetch();
    } else if (discordStatus === 'error') {
      if (reason === 'no_gm_profile') {
        showError('Você precisa criar um perfil de Mestre antes de conectar o Discord.\n\nVá para a aba "Mestre" e preencha seus dados primeiro.', 6000);
      } else {
        showError('Erro ao conectar Discord. Tente novamente.');
      }
      track('discord_connection_failed', { error: reason });
      window.history.replaceState({}, '', '/perfil');
    }
  }, [refetch]);

  // Handler para desconexão Discord
  const handleDisconnectDiscord = useCallback(async () => {
    if (!window.confirm('Deseja desconectar sua conta Discord?')) return;
    
    setDisconnecting(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/auth/discord/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        showSuccess('Discord desconectado com sucesso!');
        track('discord_disconnected');
        await refetch();
      } else {
        showError('Erro ao desconectar Discord.');
        track('discord_disconnection_failed');
      }
    } catch (error) {
      console.error('Erro ao desconectar Discord:', error);
      showError('Erro ao desconectar Discord.');
      track('discord_disconnection_failed', { error: String(error) });
    } finally {
      setDisconnecting(false);
    }
  }, [refetch]);

  if (loading) {
    return (
      <div className="profile-edit-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-edit-page">
        <div className="error-state">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-edit-page">
        <div className="error-state">
          <p>Perfil não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-edit-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profile?.avatar_url ? (
            <img src={profile.profile.avatar_url} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder">
              {profile.profile?.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{profile.profile?.display_name || 'Sem nome'}</h1>
          <p className="profile-email">{profile.user.email}</p>
          {profile.user.username && (
            <p className="profile-username">@{profile.user.username}</p>
          )}
          {profile.gm?.slug && (
            <a 
              href={`/mestre/${profile.gm.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-public-link"
              title="Abrir perfil público"
            >
              🔗 {window.location.origin}/mestre/{profile.gm.slug}
            </a>
          )}
        </div>
        {saving ? (
          <div 
            className="autosave-indicator saving"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="spinner-small"></span>
            <span>Salvando alterações...</span>
          </div>
        ) : showSaved ? (
          <div 
            className="autosave-indicator saved"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span>✓</span>
            <span>Alterações salvas</span>
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div className="profile-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'geral'}
          aria-controls="tab-panel-geral"
          id="tab-geral"
          tabIndex={activeTab === 'geral' ? 0 : -1}
          className={`tab ${activeTab === 'geral' ? 'active' : ''}`}
          onClick={() => handleTabChange('geral')}
        >
          Geral
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'jogador'}
          aria-controls="tab-panel-jogador"
          id="tab-jogador"
          tabIndex={activeTab === 'jogador' ? 0 : -1}
          className={`tab ${activeTab === 'jogador' ? 'active' : ''}`}
          onClick={() => handleTabChange('jogador')}
        >
          Jogador
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'mestre'}
          aria-controls="tab-panel-mestre"
          id="tab-mestre"
          tabIndex={activeTab === 'mestre' ? 0 : -1}
          className={`tab ${activeTab === 'mestre' ? 'active' : ''}`}
          onClick={() => handleTabChange('mestre')}
        >
          Mestre
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'geral' && (
          <div
            id="tab-panel-geral"
            role="tabpanel"
            aria-labelledby="tab-geral"
          >
            <TabGeral />
          </div>
        )}
        {activeTab === 'jogador' && (
          <div
            id="tab-panel-jogador"
            role="tabpanel"
            aria-labelledby="tab-jogador"
          >
            <TabJogador />
          </div>
        )}
        {activeTab === 'mestre' && (
          <div
            id="tab-panel-mestre"
            role="tabpanel"
            aria-labelledby="tab-mestre"
          >
            <TabMestre 
              onDisconnectDiscord={handleDisconnectDiscord}
              disconnecting={disconnecting}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB GERAL
// =============================================================================

function TabGeral() {
  const { profile, updateUser, updateProfile } = useProfileContext();
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarError, setAvatarError] = useState(false);

  if (!profile) return null;

  const handleAvatarChange = (url: string) => {
    setAvatarPreview(url);
    setAvatarError(false);
    updateProfile({ avatar_url: url });
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // CORREÇÃO P12: Usar apenas profile.avatar_url (Google OAuth deve copiar para profiles)
  const currentAvatar = avatarPreview || profile.profile?.avatar_url || '';

  return (
    <div className="tab-geral">
      <section className="form-section">
        <h2>Informações Básicas</h2>

        <div className="form-group">
          <label htmlFor="avatar_url">Avatar</label>
          <div className="avatar-upload-container">
            <div className="avatar-preview">
              {currentAvatar && !avatarError ? (
                <img 
                  src={currentAvatar} 
                  alt="Preview do avatar" 
                  onError={handleAvatarError}
                />
              ) : (
                <div className="avatar-preview-placeholder">
                  {profile.profile?.display_name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="avatar-input-wrapper">
              <input
                type="url"
                id="avatar_url"
                defaultValue={profile.profile?.avatar_url || ''}
                onChange={(e) => handleAvatarChange(e.target.value)}
                placeholder="https://exemplo.com/avatar.jpg"
              />
              <small>Cole a URL de uma imagem hospedada (Imgur, Gravatar, etc.)</small>
              {avatarError && currentAvatar && (
                <small className="error-text">❌ Não foi possível carregar a imagem</small>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="display_name">Nome de Exibição</label>
          <input
            type="text"
            id="display_name"
            defaultValue={profile.profile?.display_name || ''}
            onChange={(e) => updateProfile({ display_name: e.target.value })}
            placeholder="Como você quer ser chamado?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username (URL pública)</label>
          <input
            type="text"
            id="username"
            defaultValue={profile.user.username || ''}
            onChange={(e) => updateUser({ username: e.target.value })}
            placeholder="seu-username"
            pattern="[a-zA-Z0-9_]+"
          />
          <small>Apenas letras, números e underscore. Será usado na URL do seu perfil.</small>
        </div>

        <div className="form-group">
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            defaultValue={profile.profile?.bio || ''}
            onChange={(e) => updateProfile({ bio: e.target.value })}
            placeholder="Conte um pouco sobre você..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Localização</label>
          <input
            type="text"
            id="location"
            defaultValue={profile.user.location || ''}
            onChange={(e) => updateUser({ location: e.target.value })}
            placeholder="Cidade, Estado"
          />
        </div>
      </section>
    </div>
  );
}

// =============================================================================
// TAB JOGADOR
// =============================================================================

function TabJogador() {
  const { profile, updatePlayer, addSystem, removeSystem } = useProfileContext();

  if (!profile) return null;

  const playerProfile = (profile.player || {}) as Partial<PlayerProfile>;

  return (
    <div className="tab-jogador">
      <section className="form-section">
        <h2>Perfil de Jogador</h2>

        <div className="form-group">
          <label htmlFor="experience_level">Nível de Experiência</label>
          <select
            id="experience_level"
            defaultValue={playerProfile.experience_level || ''}
            onChange={(e) =>
              updatePlayer({
                experience_level: e.target.value as 'iniciante' | 'intermediario' | 'veterano',
              })
            }
          >
            <option value="">Selecione...</option>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="veterano">Veterano</option>
          </select>
        </div>

        <div className="form-group">
          <label>Estilo de Jogo (1-5)</label>
          <div className="playstyle-grid">
            <div className="playstyle-item">
              <label htmlFor="combat">Combate</label>
              <input
                type="range"
                id="combat"
                min="1"
                max="5"
                defaultValue={playerProfile.playstyle?.combat || 3}
                onChange={(e) =>
                  updatePlayer({
                    playstyle: {
                      ...playerProfile.playstyle,
                      combat: parseInt(e.target.value),
                    },
                  })
                }
              />
              <span>{playerProfile.playstyle?.combat || 3}</span>
            </div>

            <div className="playstyle-item">
              <label htmlFor="roleplay">Roleplay</label>
              <input
                type="range"
                id="roleplay"
                min="1"
                max="5"
                defaultValue={playerProfile.playstyle?.roleplay || 3}
                onChange={(e) =>
                  updatePlayer({
                    playstyle: {
                      ...playerProfile.playstyle,
                      roleplay: parseInt(e.target.value),
                    },
                  })
                }
              />
              <span>{playerProfile.playstyle?.roleplay || 3}</span>
            </div>

            <div className="playstyle-item">
              <label htmlFor="exploration">Exploração</label>
              <input
                type="range"
                id="exploration"
                min="1"
                max="5"
                defaultValue={playerProfile.playstyle?.exploration || 3}
                onChange={(e) =>
                  updatePlayer({
                    playstyle: {
                      ...playerProfile.playstyle,
                      exploration: parseInt(e.target.value),
                    },
                  })
                }
              />
              <span>{playerProfile.playstyle?.exploration || 3}</span>
            </div>

            <div className="playstyle-item">
              <label htmlFor="strategy">Estratégia</label>
              <input
                type="range"
                id="strategy"
                min="1"
                max="5"
                defaultValue={playerProfile.playstyle?.strategy || 3}
                onChange={(e) =>
                  updatePlayer({
                    playstyle: {
                      ...playerProfile.playstyle,
                      strategy: parseInt(e.target.value),
                    },
                  })
                }
              />
              <span>{playerProfile.playstyle?.strategy || 3}</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="preferred_time">Horário Preferido</label>
          <select
            id="preferred_time"
            defaultValue={playerProfile.preferred_time || ''}
            onChange={(e) =>
              updatePlayer({ preferred_time: e.target.value as 'manha' | 'tarde' | 'noite' })
            }
          >
            <option value="">Selecione...</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="pricing_preference">Preferência de Preço</label>
          <select
            id="pricing_preference"
            defaultValue={playerProfile.pricing_preference || ''}
            onChange={(e) =>
              updatePlayer({ pricing_preference: e.target.value as 'free' | 'paid' | 'both' })
            }
          >
            <option value="">Selecione...</option>
            <option value="free">Apenas gratuitas</option>
            <option value="paid">Apenas pagas</option>
            <option value="both">Ambas</option>
          </select>
        </div>
      </section>

      <section className="form-section">
        <h2>Sistemas Favoritos</h2>
        <p className="section-description">
          Sistemas que você gosta de jogar
        </p>
        <UserSystemsSelector
          type="favorite"
          selectedSystemIds={profile.systems.favorite.map((s) => s.system_id)}
          onAdd={(systemId) => addSystem(systemId, 'favorite')}
          onRemove={(id) => {
            const system = profile.systems.favorite.find((s) => s.system_id === id);
            if (system) removeSystem(system.id);
          }}
        />
      </section>
    </div>
  );
}

// =============================================================================
// TAB MESTRE
// =============================================================================

function TabMestre({ 
  onDisconnectDiscord, 
  disconnecting 
}: { 
  onDisconnectDiscord: () => void;
  disconnecting: boolean;
}) {
  const { profile, updateGm, addSystem, removeSystem } = useProfileContext();
  const [connecting, setConnecting] = useState(false);

  if (!profile) return null;

  const gmProfile = (profile.gm || {}) as Partial<GmProfile>;

  return (
    <div className="tab-mestre">
      <section className="form-section">
        <h2>Perfil de Mestre</h2>

        <div className="form-group">
          <label htmlFor="experience_years">Anos de Experiência</label>
          <input
            type="number"
            id="experience_years"
            min="0"
            defaultValue={gmProfile.experience_years || ''}
            onChange={(e) => updateGm({ experience_years: parseInt(e.target.value) || null })}
            placeholder="Quantos anos você mestra?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="average_price">Preço Médio (R$)</label>
          <input
            type="number"
            id="average_price"
            min="0"
            step="0.01"
            defaultValue={gmProfile.average_price || ''}
            onChange={(e) => updateGm({ average_price: parseFloat(e.target.value) || null })}
            placeholder="Valor médio por sessão"
          />
        </div>

        <div className="form-group">
          <label htmlFor="bio_long">Bio Detalhada</label>
          <textarea
            id="bio_long"
            defaultValue={gmProfile.bio_long || ''}
            onChange={(e) => updateGm({ bio_long: e.target.value })}
            placeholder="Conte sobre sua experiência como mestre..."
            rows={6}
          />
        </div>
      </section>

      <section className="form-section">
        <h2>Sistemas que Mestra</h2>
        <p className="section-description">
          Sistemas que você tem experiência em mestrar
        </p>
        <UserSystemsSelector
          type="gm"
          selectedSystemIds={profile.systems.gm.map((s) => s.system_id)}
          onAdd={(systemId) => addSystem(systemId, 'gm')}
          onRemove={(id) => {
            const system = profile.systems.gm.find((s) => s.system_id === id);
            if (system) removeSystem(system.id);
          }}
        />
      </section>

      <section className="form-section">
        <LinksManager />
      </section>

      {/* Seção Discord */}
      <section className="form-section">
        <h2>Conexão Discord</h2>
        <p className="section-description">
          Conecte sua conta Discord para verificação e badges especiais
        </p>
        
        {profile?.gm?.discord_connected ? (
          <div className="discord-connected">
            <p>✅ Discord conectado</p>
            <p className="discord-username">
              🟣 {profile.gm.discord_username}
            </p>
            {profile.gm.covil_verified && (
              <div className="covil-badge">
                🏰 Membro Verificado do Covil
              </div>
            )}
            <button
              onClick={onDisconnectDiscord}
              className="btn-disconnect-discord"
              disabled={disconnecting} // CORREÇÃO P14: Desabilitar durante loading
            >
              {disconnecting ? '⏳ Desconectando...' : 'Desconectar Discord'}
            </button>
          </div>
        ) : (
          <div className="discord-disconnected">
            <p>Conecte sua conta Discord para:</p>
            <ul>
              <li>Verificar membro do servidor Covil</li>
              <li>Exibir badge no perfil público</li>
              <li>Futuras integrações comunitárias</li>
            </ul>
            <button
              onClick={async () => {
                setConnecting(true);
                try {
                  const token = localStorage.getItem('token');
                  const apiUrl = import.meta.env.VITE_API_URL || '';
                  const response = await fetch(`${apiUrl}/auth/discord/connect`, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  if (response.redirected) {
                    // Backend retornou redirect para Discord OAuth
                    window.location.href = response.url;
                  } else if (!response.ok) {
                    const data = await response.json();
                    showError(data.error || 'Erro ao conectar Discord');
                    setConnecting(false);
                  }
                } catch (error) {
                  console.error('Erro ao conectar Discord:', error);
                  showError('Erro ao conectar Discord');
                  setConnecting(false);
                }
              }}
              className="btn-connect-discord"
              disabled={connecting}
            >
              {connecting ? '⏳ Conectando...' : '🟣 Conectar Discord'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
