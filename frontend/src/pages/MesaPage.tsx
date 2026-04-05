import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarClock, Compass, Crown, Edit, Globe, MapPin, Megaphone, ShieldCheck, Sparkles, Swords, Users } from 'lucide-react';
import { TableContacts } from '../components/TableContacts';
import type { TableDetail } from '../types/tables';
import { applySeo } from '../utils/seo';
import { useAuth } from '../contexts/AuthContext';

const modalityLabel: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
};

const experienceLabel: Record<string, string> = {
  todos: 'Todos os níveis',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  veterano: 'Veterano',
};

export const MesaPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [table, setTable] = useState<TableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadTable = async () => {
      if (!slug) {
        setError('Mesa inválida.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/tables/${slug}`, { signal: controller.signal });

        if (res.status === 404) {
          setError('Mesa não encontrada.');
          setTable(null);
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        setTable(json.data ?? null);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Não foi possível carregar esta mesa no momento.');
      } finally {
        setLoading(false);
      }
    };

    loadTable();
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    if (!table) {
      applySeo('Mesa | Artifício Mesas', 'Detalhes de uma mesa de RPG no portal Artifício Mesas.');
      return;
    }

    applySeo(
      `${table.title} | Artifício Mesas`,
      table.description?.slice(0, 150) || `Conheça os detalhes da mesa ${table.title} no Artifício Mesas.`
    );
  }, [table]);

  const slotsLeft = useMemo(() => {
    if (!table) return 0;
    return Math.max(0, table.slots_total - table.slots_filled);
  }, [table]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white flex items-center justify-center">
        <p className="animate-pulse text-white/70">Carregando aventura...</p>
      </main>
    );
  }

  if (error || !table) {
    return (
      <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white flex items-center justify-center px-6">
        <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Ops!</h1>
          <p className="text-white/70 mb-5">{error ?? 'Mesa não encontrada.'}</p>
          <Link
            to="/catalogo"
            id="mesa-link-voltar-catalogo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] transition-colors"
          >
            <Compass className="w-4 h-4" /> Voltar ao catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white pb-16">
      <header className="container mx-auto px-6 py-6 text-sm text-white/60">
        <nav aria-label="breadcrumb" className="flex items-center gap-2">
          <Link to="/" className="hover:text-white transition-colors" id="mesa-breadcrumb-home">Home</Link>
          <span>/</span>
          <Link to="/catalogo" className="hover:text-white transition-colors" id="mesa-breadcrumb-catalogo">Catálogo</Link>
          <span>/</span>
          <span className="text-white/85">{table.title}</span>
        </nav>
      </header>

      <section className="container mx-auto px-6">
        <article className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-5">
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden border border-white/10">
              {table.cover_url ? (
                <img src={table.cover_url} alt={table.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#2a3f6d] to-[#131f38]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#091427] via-[#091427]/45 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-2 py-1 rounded-md bg-black/35 border border-white/15 text-xs">{table.type}</span>
                  <span className="px-2 py-1 rounded-md bg-black/35 border border-white/15 text-xs">{table.audience}</span>
                  <span className="px-2 py-1 rounded-md bg-black/35 border border-white/15 text-xs">{table.system_name ?? 'Sistema livre'}</span>
                  {table.scenario_name && (
                    <span className="px-2 py-1 rounded-md bg-purple-500/20 border border-purple-300/40 text-purple-100 text-xs inline-flex items-center gap-1" id="mesa-badge-scenario">
                      <MapPin className="w-3.5 h-3.5" /> {table.scenario_name}
                    </span>
                  )}
                  {table.is_ddal && (
                    <span className="px-2 py-1 rounded-md bg-amber-500/20 border border-amber-300/40 text-amber-100 text-xs inline-flex items-center gap-1" id="mesa-badge-ddal">
                      <Sparkles className="w-3.5 h-3.5" /> DDAL
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">{table.title}</h1>
              </div>
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold mb-2">Sobre esta Mesa</h2>
              <p className="text-white/80 leading-relaxed">{table.description || 'Sem descrição detalhada.'}</p>
            </section>

            {table.is_ddal && (
              <section className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-5" id="mesa-ddal-metadata">
                <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2 text-amber-100">
                  <Sparkles className="w-5 h-5" /> Selo DDAL verificado
                </h2>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Código da aventura</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_code ?? 'Não informado'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Tier</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_tier ? `Tier ${table.ddal_tier}` : 'Não informado'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3 md:col-span-2">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Nome da aventura</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_name ?? 'Não informado'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Season</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_season ?? 'Não informado'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Duração esperada</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_duration ?? 'Não informado'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Formato</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_format ?? 'Não informado'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Organização / Código expandido</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_org_code ?? 'Não informado'}</p>
                  </div>
                  <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3 md:col-span-2">
                    <p className="text-amber-100/80 text-xs uppercase tracking-wide">Ambientação</p>
                    <p className="font-semibold text-white mt-1">{table.ddal_setting ?? 'Não informado'}</p>
                  </div>
                  {table.ddal_rules_notes && (
                    <div className="rounded-xl border border-amber-200/15 bg-[#13213f]/70 p-3 md:col-span-2">
                      <p className="text-amber-100/80 text-xs uppercase tracking-wide">Notas de regras da temporada</p>
                      <p className="text-white/85 mt-1 leading-relaxed">{table.ddal_rules_notes}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {table.publisher_role === 'announcer' && (
              <section className="rounded-2xl border border-slate-300/25 bg-slate-500/10 p-5" id="mesa-announcer-note">
                <h2 className="text-lg font-bold mb-2 inline-flex items-center gap-2 text-slate-100">
                  <Megaphone className="w-5 h-5" /> Publicado por anunciante
                </h2>
                <p className="text-sm text-slate-100/85 leading-relaxed">
                  Esta mesa foi publicada por um anunciante.
                  {table.actual_gm_name ? ` Mestre responsável: ${table.actual_gm_name}.` : ''}
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold mb-3">Segurança e Alertas</h2>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold mb-1">Content Warnings</p>
                  <p className="text-white/70">{table.content_warnings?.length ? table.content_warnings.join(', ') : 'Não informado.'}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="font-semibold mb-1">Safety Tools</p>
                  <p className="text-white/70">{table.safety_tools?.length ? table.safety_tools.join(', ') : 'Não informado.'}</p>
                </div>
              </div>
            </section>

            {table.schedules && table.schedules.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5" id="mesa-schedules">
                <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2">
                  <CalendarClock className="w-5 h-5" /> Horários das Sessões
                </h2>
                <div className="space-y-3">
                  {table.schedules.map((schedule) => {
                    const dayLabels: Record<string, string> = {
                      segunda: 'Segunda-feira',
                      terça: 'Terça-feira',
                      quarta: 'Quarta-feira',
                      quinta: 'Quinta-feira',
                      sexta: 'Sexta-feira',
                      sábado: 'Sábado',
                      domingo: 'Domingo',
                    };

                    const frequencyLabels: Record<string, string> = {
                      semanal: 'Semanal',
                      quinzenal: 'Quinzenal',
                      mensal: 'Mensal',
                      avulsa: 'Avulsa',
                    };

                    const startTime = schedule.start_time.substring(0, 5); // HH:MM
                    const endTime = schedule.end_time ? schedule.end_time.substring(0, 5) : null;

                    return (
                      <div
                        key={schedule.id}
                        className="rounded-xl border border-white/10 bg-[#13213f]/70 p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-1 rounded-md bg-[var(--color-artificio-orange)]/20 border border-[var(--color-artificio-orange)]/40 text-[var(--color-artificio-orange)] text-xs font-semibold">
                            {dayLabels[schedule.day_of_week] || schedule.day_of_week}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-white/10 border border-white/15 text-white/90 text-xs font-semibold">
                            {startTime}{endTime ? ` - ${endTime}` : ''}
                          </span>
                          <span className="px-2 py-1 rounded-md bg-blue-500/20 border border-blue-300/40 text-blue-100 text-xs">
                            {frequencyLabels[schedule.frequency] || schedule.frequency}
                          </span>
                          {schedule.is_ongoing && (
                            <span className="px-2 py-1 rounded-md bg-green-500/20 border border-green-300/40 text-green-100 text-xs">
                              Em andamento
                            </span>
                          )}
                        </div>

                        {schedule.slots_per_session && (
                          <p className="text-sm text-white/70">
                            <Users className="w-3.5 h-3.5 inline mr-1" />
                            {schedule.slots_per_session} vagas por sessão
                          </p>
                        )}

                        {schedule.notes && (
                          <p className="text-sm text-white/80 leading-relaxed">
                            {schedule.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Sinopse Narrativa (REQ-26) */}
            {table.synopsis && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Sinopse</h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.synopsis}</p>
                {/* CORREÇÃO: Exibir listing_excerpt quando diferente da sinopse */}
                {table.listing_excerpt && table.listing_excerpt !== table.synopsis && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs font-semibold text-white/60 mb-1">Resumo Curto</p>
                    <p className="text-sm text-white/80">{table.listing_excerpt}</p>
                  </div>
                )}
              </section>
            )}

            {/* REQ-28 Fase 7: Narrativa Principal */}
            {table.synopsis_narrative && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Sobre a História</h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.synopsis_narrative}</p>
              </section>
            )}

            {/* REQ-28 Fase 7: Benefícios e Diferenciais */}
            {table.benefits_text && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> O que você vai encontrar
                </h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.benefits_text}</p>
              </section>
            )}

            {/* REQ-28 Fase 7: Sobre o Mestre */}
            {table.gm_bio && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2">
                  <Crown className="w-5 h-5" /> Sobre o Mestre
                </h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.gm_bio}</p>
              </section>
            )}

            {/* Estilo de Jogo (REQ-26) */}
            {table.style_text && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Estilo de Jogo</h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.style_text}</p>
              </section>
            )}

            {/* Detalhes da Campanha (REQ-26) */}
            {(table.campaign_length || table.level_range) && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Detalhes da Campanha</h2>
                <div className="space-y-2">
                  {table.campaign_length && (
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-white/90">Duração:</span> {table.campaign_length}
                    </p>
                  )}
                  {table.level_range && (
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-white/90">Faixa de Nível:</span> {table.level_range}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Cobrança Detalhada (REQ-26) */}
            {(table.billing_text || table.session_zero_free) && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Informações de Cobrança</h2>
                <div className="space-y-2">
                  {table.billing_text && (
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.billing_text}</p>
                  )}
                  {table.session_zero_free && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-semibold">
                      ✓ Sessão zero gratuita
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Requisitos Técnicos (REQ-26) */}
            {(table.technical_requirements || table.requires_pc || table.requires_camera || table.requires_microphone) && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Requisitos Técnicos</h2>
                <div className="space-y-3">
                  {table.technical_requirements && (
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.technical_requirements}</p>
                  )}
                  {(table.requires_pc || table.requires_camera || table.requires_microphone) && (
                    <div className="flex flex-wrap gap-2">
                      {table.requires_pc && (
                        <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                          💻 Requer PC
                        </span>
                      )}
                      {table.requires_camera && (
                        <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold">
                          📹 Câmera obrigatória
                        </span>
                      )}
                      {table.requires_microphone && (
                        <span className="px-3 py-1.5 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-semibold">
                          🎤 Microfone obrigatório
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Cenário e Estilos (REQ-28) */}
            {(table.setting_name || (table.setting_styles && table.setting_styles.length > 0)) && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Cenário e Estilos</h2>
                <div className="space-y-3">
                  {table.setting_name && (
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-white/90">Cenário:</span> {table.setting_name}
                    </p>
                  )}
                  {/* CORREÇÃO DT-22: Validar se setting_styles é array válido antes de mapear */}
                  {table.setting_styles && Array.isArray(table.setting_styles) && table.setting_styles.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-white/60 mb-2">Estilos/Temáticas:</p>
                      <div className="flex flex-wrap gap-2">
                        {table.setting_styles.map((style, index) => (
                          <span
                            key={`${index}-${style}`}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Nome de Exibição do Mestre (REQ-26) */}
            {table.master_display_name && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Mestre</h2>
                <p className="text-white/80">
                  <span className="font-semibold text-white/90">Nome de Exibição:</span> {table.master_display_name}
                </p>
              </section>
            )}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 lg:sticky lg:top-6">
            <h2 className="text-lg font-bold">Resumo operacional</h2>

            <div className="space-y-2 text-sm text-white/80">
              <p className="flex items-center gap-2"><Users className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {table.slots_filled}/{table.slots_total} jogadores ({slotsLeft} vagas)</p>
              <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {modalityLabel[table.modality] ?? table.modality}</p>
              <p className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {table.starts_at ? new Date(table.starts_at).toLocaleString('pt-BR') : 'Data a combinar'}</p>
              <p className="flex items-center gap-2"><Swords className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {experienceLabel[table.experience_level] ?? table.experience_level}</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--color-artificio-orange)]" /> {table.city && table.state ? `${table.city} - ${table.state}` : 'Online / não informado'}</p>
              <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[var(--color-artificio-orange)]" /> Idioma: {table.language}</p>
            </div>

            {table.price_value && (
              <div className="rounded-xl border border-white/10 bg-[#13213f] p-4">
                <p className="text-xs text-white/60 mb-1">Investimento</p>
                <p className="font-bold text-lg text-[var(--color-artificio-orange)]">
                  R$ {table.price_value}
                </p>
                {table.price_frequency && <p className="text-xs text-white/60 mt-1">Cobrança por {table.price_frequency}</p>}
              </div>
            )}

            {table.gm_slug && table.origin !== 'imported' && (
              <Link
                to={`/mestre/${table.gm_slug}`}
                id="mesa-link-mestre"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/15 hover:border-[var(--color-artificio-orange)] hover:text-[var(--color-artificio-orange)] transition-colors"
              >
                <Crown className="w-4 h-4" /> Ver perfil do mestre
              </Link>
            )}

            {user?.role === 'admin' && table.id && (
              <Link
                to={`/painel-mestre?edit=${table.id}`}
                id="mesa-link-editar-admin"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white font-semibold transition-colors"
              >
                <Edit className="w-4 h-4" /> Editar Mesa (ADM)
              </Link>
            )}

            <TableContacts contacts={table.contacts ?? []} />
          </aside>
        </article>
      </section>
    </main>
  );
};
