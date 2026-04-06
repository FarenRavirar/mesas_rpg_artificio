import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Compass, Crown, Megaphone, Sparkles } from 'lucide-react';
import type { TableDetail } from '../types/tables';
import { applySeo } from '../utils/seo';
import { useTableViewModel } from '../features/table/hooks/useTableViewModel';
import { TableActionPanel } from '../features/table/components/TableActionPanel';
import { TableHero } from '../features/table/components/TableHero';
import { TableSchedules } from '../features/table/components/TableSchedules';

export const MesaPage = () => {
  const { slug } = useParams<{ slug: string }>();
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

  // Fase 1: ViewModel (isola lógica, UI ainda usa table)
  const vm = table ? useTableViewModel(table) : null;

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
            {/* Fase 2.2: TableHero (substituindo hero section de 74 linhas) */}
            {vm && <TableHero vm={vm} variant="full" />}

            {/* Fase 2.3: TableSchedules (substituindo schedules section de 68 linhas) */}
            {vm && <TableSchedules vm={vm} />}

            {/* 2. SOBRE A MESA */}
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-bold mb-2">Sobre esta Mesa</h2>
              <p className="text-white/80 leading-relaxed">{table.description || 'Sem descrição detalhada.'}</p>
            </section>

            {/* 3. HISTÓRIA (sinopse + narrativa agrupadas) */}
            {(table.synopsis || table.synopsis_narrative) && (
              <div className="space-y-5">
                {table.synopsis && (
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-bold mb-3">Sinopse</h2>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.synopsis}</p>
                    {table.listing_excerpt && table.listing_excerpt !== table.synopsis && (
                      <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs font-semibold text-white/60 mb-1">Resumo Curto</p>
                        <p className="text-sm text-white/80">{table.listing_excerpt}</p>
                      </div>
                    )}
                  </section>
                )}
                {table.synopsis_narrative && (
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-bold mb-3">Sobre a História</h2>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.synopsis_narrative}</p>
                  </section>
                )}
              </div>
            )}

            {/* 4. O QUE ESPERAR (benefícios + estilo agrupados) */}
            {(table.benefits_text || table.style_text) && (
              <div className="space-y-5">
                {table.benefits_text && (
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> O que você vai encontrar
                    </h2>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.benefits_text}</p>
                  </section>
                )}
                {table.style_text && (
                  <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-bold mb-3">Estilo de Jogo</h2>
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.style_text}</p>
                  </section>
                )}
              </div>
            )}

            {/* 5. MESTRE */}
            {table.gm_bio && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2">
                  <Crown className="w-5 h-5" /> Sobre o Mestre
                </h2>
                <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{table.gm_bio}</p>
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

            {/* 6. SEGURANÇA */}
            {((table.content_warnings && table.content_warnings.length > 0) || (table.safety_tools && table.safety_tools.length > 0)) && (
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
            )}

            {/* 7. DETALHES TÉCNICOS */}
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

            {(table.setting_name || (table.setting_styles && table.setting_styles.length > 0)) && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Cenário e Estilos</h2>
                <div className="space-y-3">
                  {table.setting_name && (
                    <p className="text-sm text-white/80">
                      <span className="font-semibold text-white/90">Cenário:</span> {table.setting_name}
                    </p>
                  )}
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

            {table.master_display_name && (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-bold mb-3">Mestre</h2>
                <p className="text-white/80">
                  <span className="font-semibold text-white/90">Nome de Exibição:</span> {table.master_display_name}
                </p>
              </section>
            )}

            {/* 8. DDAL (FINAL - detalhe técnico) */}
            {table.is_ddal && (
              <section className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-5" id="mesa-ddal-metadata">
                <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2 text-amber-100">
                  <Sparkles className="w-5 h-5" /> 📜 Detalhes da aventura (DDAL)
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

          {/* Fase 2: TableActionPanel (substituindo aside de 72 linhas) */}
          {vm && <TableActionPanel vm={vm} />}
        </article>
      </section>
    </main>
  );
};
