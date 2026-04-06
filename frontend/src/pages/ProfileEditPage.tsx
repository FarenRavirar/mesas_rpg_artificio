import { useState } from 'react';
import { useProfile, type PlayerProfile, type GmProfile } from '../hooks/useProfile';
import { UserSystemsSelector } from '../components/UserSystemsSelector';
import { LinksManager } from '../components/LinksManager';
import './ProfileEditPage.css';

/**
 * Página de edição de perfil com tabs
 * Tabs: Geral | Jogador | Mestre
 * Autosave com debounce 500ms
 */

type TabType = 'geral' | 'jogador' | 'mestre';

export default function ProfileEditPage() {
  const { profile, loading, saving, error } = useProfile();
  const [activeTab, setActiveTab] = useState<TabType>('geral');

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
        </div>
        {saving && (
          <div className="autosave-indicator">
            <span className="spinner-small"></span>
            <span>Salvando...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'geral' ? 'active' : ''}`}
          onClick={() => setActiveTab('geral')}
        >
          Geral
        </button>
        <button
          className={`tab ${activeTab === 'jogador' ? 'active' : ''}`}
          onClick={() => setActiveTab('jogador')}
        >
          Jogador
        </button>
        <button
          className={`tab ${activeTab === 'mestre' ? 'active' : ''}`}
          onClick={() => setActiveTab('mestre')}
        >
          Mestre
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'geral' && <TabGeral />}
        {activeTab === 'jogador' && <TabJogador />}
        {activeTab === 'mestre' && <TabMestre />}
      </div>
    </div>
  );
}

// =============================================================================
// TAB GERAL
// =============================================================================

function TabGeral() {
  const { profile, updateUser, updateProfile } = useProfile();
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
  const { profile, updatePlayer, addSystem, removeSystem } = useProfile();

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

function TabMestre() {
  const { profile, updateGm, addSystem, removeSystem } = useProfile();

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
        <h2>Discord</h2>
        {gmProfile.discord_connected ? (
          <div className="discord-connected">
            <p>✅ Conectado como {gmProfile.discord_username}</p>
            {gmProfile.covil_verified && (
              <div className="covil-badge">🏅 Mestre do Covil</div>
            )}
          </div>
        ) : (
          <div className="discord-disconnected">
            <p>Discord não conectado</p>
            <button className="btn-connect-discord">Conectar Discord</button>
          </div>
        )}
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
    </div>
  );
}
