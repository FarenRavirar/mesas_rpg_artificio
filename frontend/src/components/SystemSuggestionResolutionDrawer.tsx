import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '';

// --- Tipos locais (resposta da API tratada como unknown ate normalizar) ---

export interface ResolvableSuggestion {
  id: string;
  name: string;
  description: string | null;
  node_type: 'system' | 'edition' | 'variant' | 'subsystem';
  parent_id: string | null;
}

interface SystemOption {
  id: string;
  name: string;
  path_slug: string;
  node_type: string;
  depth: number;
}

type CandidateReason = string;

interface Candidate {
  system_id: string;
  name: string;
  path_slug: string | null;
  node_type: string;
  score: number;
  reasons: CandidateReason[];
}

type ResolutionType = 'create_alias' | 'create_child' | 'create_system' | 'merge_existing' | 'reject';

interface ResolveResultData {
  system_name?: string;
  pending_drafts?: Array<{ id: string; title: string | null }>;
}

// --- Normalizadores defensivos ---

const readString = (value: unknown): string => (typeof value === 'string' ? value : '');
const readNullableString = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const readNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const normalizeSystemOptions = (value: unknown): SystemOption[] => {
  if (!Array.isArray(value)) return [];
  const out: SystemOption[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const id = readString(row.id);
    const name = readString(row.name);
    if (!id || !name) continue;
    out.push({
      id,
      name,
      path_slug: readString(row.path_slug),
      node_type: readString(row.node_type) || 'system',
      depth: readNumber(row.depth),
    });
  }
  return out.sort((a, b) => a.path_slug.localeCompare(b.path_slug) || a.name.localeCompare(b.name));
};

const normalizeCandidates = (value: unknown): Candidate[] => {
  if (!Array.isArray(value)) return [];
  const out: Candidate[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const systemId = readString(row.system_id);
    if (!systemId) continue;
    const reasons = Array.isArray(row.reasons)
      ? row.reasons.filter((r): r is string => typeof r === 'string')
      : [];
    out.push({
      system_id: systemId,
      name: readString(row.name),
      path_slug: readNullableString(row.path_slug),
      node_type: readString(row.node_type) || 'system',
      score: readNumber(row.score),
      reasons,
    });
  }
  return out;
};

const REASON_LABELS: Record<string, string> = {
  name_exact: 'nome igual',
  name_pt_exact: 'nome PT igual',
  alias_exact: 'alias igual',
  base_match: 'mesmo nome base',
  base_plus_edition: 'nome base + edição',
  fuzzy_similar: 'parecido',
};

const RESOLUTION_OPTIONS: Array<{ value: ResolutionType; label: string }> = [
  { value: 'create_alias', label: 'Alias / nome alternativo' },
  { value: 'create_child', label: 'Edição / variante / subsistema' },
  { value: 'merge_existing', label: 'Mesclar (já existe)' },
  { value: 'create_system', label: 'Sistema novo (raiz)' },
  { value: 'reject', label: 'Rejeitar' },
];

const RECOMMENDED_LABELS: Record<string, string> = {
  merge_existing: 'Mesclar com existente',
  create_alias: 'Criar alias',
  create_child: 'Criar edição/variante',
  create_system: 'Criar sistema novo',
};

const slugifyPreview = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

interface Props {
  suggestion: ResolvableSuggestion;
  onClose: () => void;
  onResolved: (data: ResolveResultData) => void;
}

export const SystemSuggestionResolutionDrawer = ({ suggestion, onClose, onResolved }: Props) => {
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [recommended, setRecommended] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [resolutionType, setResolutionType] = useState<ResolutionType>('create_alias');
  const [targetSystemId, setTargetSystemId] = useState('');
  const [parentId, setParentId] = useState('');
  const [childNodeType, setChildNodeType] = useState<'edition' | 'variant' | 'subsystem'>('edition');
  const [name, setName] = useState(suggestion.name);
  const [editionName, setEditionName] = useState('');
  const [namePt, setNamePt] = useState('');
  const [description, setDescription] = useState(suggestion.description ?? '');
  const [aliasText, setAliasText] = useState(suggestion.name);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [forceNew, setForceNew] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [candRes, sysRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/admin/system-suggestions/${suggestion.id}/candidates`, {
            credentials: 'include',
          }),
          fetch(`${API_BASE}/api/v1/systems`, { credentials: 'include' }),
        ]);

        if (!cancelled && candRes.ok) {
          const json: unknown = await candRes.json();
          const data = json && typeof json === 'object' ? (json as Record<string, unknown>).data : null;
          const dataObj = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
          const cands = normalizeCandidates(dataObj.candidates);
          setCandidates(cands);
          const rec = readString(dataObj.recommended_action);
          setRecommended(rec);

          // Pré-seleciona a acao recomendada e o melhor candidato.
          if (rec === 'merge_existing') setResolutionType('merge_existing');
          else if (rec === 'create_alias') setResolutionType('create_alias');
          else if (rec === 'create_system') setResolutionType('create_system');
          if (cands[0]) {
            setTargetSystemId(cands[0].system_id);
            if (cands[0].node_type === 'system') setParentId(cands[0].system_id);
          }
        }

        if (!cancelled && sysRes.ok) {
          const json: unknown = await sysRes.json();
          const data = json && typeof json === 'object' ? (json as Record<string, unknown>).data : null;
          setSystems(normalizeSystemOptions(data));
        }
      } catch (error) {
        if (!cancelled) console.error('[ResolutionDrawer] erro ao carregar candidatos/sistemas', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [suggestion.id]);

  const rootSystems = useMemo(() => systems.filter((s) => s.node_type === 'system'), [systems]);
  const editionsAndSubsystems = useMemo(
    () => systems.filter((s) => s.node_type === 'edition' || s.node_type === 'subsystem'),
    [systems],
  );

  // Pais validos por tipo de filho (espelha VALID_PARENT do backend).
  const validParents = useMemo(() => {
    if (childNodeType === 'variant') return editionsAndSubsystems;
    return rootSystems; // edition e subsystem -> filhos de system
  }, [childNodeType, editionsAndSubsystems, rootSystems]);

  const targetSystem = systems.find((s) => s.id === targetSystemId) || null;
  const parentSystem = systems.find((s) => s.id === parentId) || null;

  const preview = useMemo(() => {
    switch (resolutionType) {
      case 'create_alias':
        return targetSystem
          ? `Alias "${aliasText.trim()}" → ${targetSystem.path_slug || targetSystem.name}`
          : 'Escolha o sistema alvo.';
      case 'merge_existing':
        return targetSystem
          ? `Marcar como coberta por ${targetSystem.path_slug || targetSystem.name} (nada novo é criado).`
          : 'Escolha o sistema alvo.';
      case 'create_child':
        return parentSystem
          ? `Novo ${childNodeType}: ${parentSystem.path_slug || parentSystem.name}/${slugifyPreview(name)}`
          : 'Escolha o sistema pai.';
      case 'create_system':
        return editionName.trim()
          ? `Novo sistema: ${slugifyPreview(name)} + edição ${slugifyPreview(name)}/${slugifyPreview(editionName)}`
          : `Novo sistema raiz: ${slugifyPreview(name)}`;
      case 'reject':
        return 'Rejeitar a sugestão.';
      default:
        return '';
    }
  }, [resolutionType, targetSystem, parentSystem, aliasText, childNodeType, name, editionName]);

  const splitEdition = () => {
    const m = name.trim().match(/^(.*?)[\s-]+(\d+(?:\.\d+)?|\d+e|\d+[ªaA]|(?:19|20)\d{2})$/);
    if (m && m[1].trim()) {
      setName(m[1].trim());
      setEditionName(m[2]);
      toast.success(`Separado: ${m[1].trim()} + ${m[2]}`);
    } else {
      toast.error('Nenhuma edição detectada no nome.');
    }
  };

  const buildBody = (): Record<string, unknown> => {
    switch (resolutionType) {
      case 'create_alias':
        return { resolution_type: 'create_alias', target_system_id: targetSystemId, alias: aliasText.trim(), notes: notes.trim() || undefined };
      case 'merge_existing':
        return { resolution_type: 'merge_existing', target_system_id: targetSystemId, notes: notes.trim() || undefined };
      case 'create_child':
        return {
          resolution_type: 'create_child',
          node_type: childNodeType,
          parent_id: parentId,
          name: name.trim(),
          name_pt: namePt.trim() || undefined,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
        };
      case 'create_system':
        return {
          resolution_type: 'create_system',
          name: name.trim(),
          name_pt: namePt.trim() || undefined,
          description: description.trim() || undefined,
          edition_name: editionName.trim() || undefined,
          notes: notes.trim() || undefined,
          force: forceNew || undefined,
        };
      case 'reject':
        return { resolution_type: 'reject', reason: reason.trim() || undefined };
      default:
        return {};
    }
  };

  const validate = (): string | null => {
    if (resolutionType === 'create_alias') {
      if (!targetSystemId) return 'Escolha o sistema alvo.';
      if (!aliasText.trim()) return 'Informe o texto do alias.';
    }
    if (resolutionType === 'merge_existing' && !targetSystemId) return 'Escolha o sistema alvo.';
    if (resolutionType === 'create_child') {
      if (!parentId) return 'Escolha o sistema pai.';
      if (!name.trim()) return 'Informe o nome.';
    }
    if (resolutionType === 'create_system' && !name.trim()) return 'Informe o nome.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/system-suggestions/${suggestion.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(buildBody()),
      });

      const json: unknown = await response.json().catch(() => ({}));
      const payload = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};

      if (response.ok) {
        const data = payload.data && typeof payload.data === 'object' ? (payload.data as ResolveResultData) : {};
        toast.success('Sugestão resolvida.');
        onResolved(data);
        return;
      }

      // NFR-001: backend bloqueia criar raiz quando ha candidato similar.
      if (response.status === 409 && readString(payload.recommended_action)) {
        setCandidates(normalizeCandidates(payload.candidates));
        setForceNew(false);
        toast.error('Há candidatos similares. Reveja antes de criar um sistema novo.');
        return;
      }

      toast.error(`Erro: ${readString(payload.error) || 'falha ao resolver'}`);
    } catch (error) {
      console.error('[ResolutionDrawer] erro ao resolver', error);
      toast.error('Erro ao resolver sugestão.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    if (!window.confirm(`Descartar a sugestão "${suggestion.name}"? Ela sai da fila pendente.`)) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/admin/system-suggestions/${suggestion.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolution_type: 'reject' }),
      });
      const json: unknown = await response.json().catch(() => ({}));
      const payload = json && typeof json === 'object' ? (json as Record<string, unknown>) : {};
      if (response.ok) {
        toast.success('Sugestão descartada.');
        onResolved({});
        return;
      }
      toast.error(`Erro: ${readString(payload.error) || 'falha ao descartar'}`);
    } catch (error) {
      console.error('[ResolutionDrawer] erro ao descartar', error);
      toast.error('Erro ao descartar sugestão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-[#0F1A2E] border-l border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Resolver sugestão</h2>
            <p className="text-white/60 text-sm mt-1">{suggestion.name}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none" aria-label="Fechar">
            ×
          </button>
        </div>

        {/* 1. Sugestao original */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 mb-4">
          <p className="text-white/40 text-xs uppercase tracking-wide">Sugestão original</p>
          <p className="text-white font-medium mt-1">{suggestion.name}</p>
          {suggestion.description && <p className="text-white/60 text-sm mt-1">{suggestion.description}</p>}
        </div>

        {/* 2. Candidatos */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <p className="text-white/80 font-semibold">Candidatos no catálogo</p>
            {recommended && RECOMMENDED_LABELS[recommended] && (
              <span className="text-xs px-2 py-1 rounded bg-blue-600/30 text-blue-200 border border-blue-500/40">
                Sugerido: {RECOMMENDED_LABELS[recommended]}
              </span>
            )}
          </div>
          {loading ? (
            <p className="text-white/50 text-sm mt-2">Calculando candidatos…</p>
          ) : candidates.length === 0 ? (
            <p className="text-white/50 text-sm mt-2">Nenhum candidato similar encontrado.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {candidates.map((c) => {
                const isSelected = targetSystemId === c.system_id || parentId === c.system_id;
                return (
                  <li
                    key={c.system_id}
                    className={`rounded-lg border p-2 transition-colors ${
                      isSelected ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{c.name}</p>
                        <p className="text-white/40 text-xs truncate">{c.path_slug ?? c.system_id}</p>
                        <p className="text-white/40 text-xs mt-0.5">
                          {Math.round(c.score * 100)}% · {c.reasons.map((r) => REASON_LABELS[r] ?? r).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setTargetSystemId(c.system_id);
                          if (c.node_type === 'system') setParentId(c.system_id);
                          toast.success(`Alvo: ${c.name}`);
                        }}
                        className={`shrink-0 text-xs px-2 py-1 rounded text-white ${
                          isSelected ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {isSelected ? '✓ Selecionado' : 'Usar'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 3. Acao escolhida */}
        <div className="mb-4">
          <p className="text-white/80 font-semibold mb-2">Ação</p>
          <div className="flex flex-wrap gap-2">
            {RESOLUTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setResolutionType(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  resolutionType === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formularios por tipo */}
        <div className="space-y-3 mb-4">
          {(resolutionType === 'create_alias' || resolutionType === 'merge_existing') && (
            <label className="block">
              <span className="text-white/70 text-sm">Sistema alvo</span>
              <select
                className="app-select w-full mt-1"
                value={targetSystemId}
                onChange={(e) => setTargetSystemId(e.target.value)}
              >
                <option value="">Selecione…</option>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {' '.repeat(s.depth * 2)}
                    {s.name} ({s.node_type})
                  </option>
                ))}
              </select>
            </label>
          )}

          {resolutionType === 'create_alias' && (
            <label className="block">
              <span className="text-white/70 text-sm">Texto do alias</span>
              <input
                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                value={aliasText}
                onChange={(e) => setAliasText(e.target.value)}
              />
            </label>
          )}

          {resolutionType === 'create_child' && (
            <>
              <label className="block">
                <span className="text-white/70 text-sm">Tipo</span>
                <select
                  className="app-select w-full mt-1"
                  value={childNodeType}
                  onChange={(e) => {
                    setChildNodeType(e.target.value as 'edition' | 'variant' | 'subsystem');
                    setParentId('');
                  }}
                >
                  <option value="edition">Edição</option>
                  <option value="subsystem">Subsistema</option>
                  <option value="variant">Variante</option>
                </select>
              </label>
              <label className="block">
                <span className="text-white/70 text-sm">Sistema pai</span>
                <select
                  className="app-select w-full mt-1"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">Selecione…</option>
                  {validParents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {' '.repeat(s.depth * 2)}
                      {s.name} ({s.node_type})
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {(resolutionType === 'create_child' || resolutionType === 'create_system') && (
            <>
              <label className="block">
                <span className="text-white/70 text-sm">Nome</span>
                <input
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-white/70 text-sm">Nome PT (opcional)</span>
                <input
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  value={namePt}
                  onChange={(e) => setNamePt(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-white/70 text-sm">Descrição (opcional)</span>
                <textarea
                  className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            </>
          )}

          {resolutionType === 'create_system' && (
            <label className="block">
              <span className="text-white/70 text-sm">Edição específica (opcional)</span>
              <div className="flex gap-2 mt-1">
                <input
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  value={editionName}
                  onChange={(e) => setEditionName(e.target.value)}
                  placeholder="ex.: 1.3, 5e, 2024"
                />
                <button
                  type="button"
                  onClick={splitEdition}
                  className="shrink-0 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm"
                >
                  Separar do nome
                </button>
              </div>
              <span className="text-white/40 text-xs mt-1 block">
                Cria a raiz e, se preenchido, uma edição abaixo dela (ex.: CAIN → CAIN/1.3).
              </span>
            </label>
          )}

          {resolutionType === 'create_system' && candidates.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-amber-300">
              <input type="checkbox" checked={forceNew} onChange={(e) => setForceNew(e.target.checked)} className="h-4 w-4" />
              Criar mesmo havendo candidatos similares
            </label>
          )}

          {resolutionType === 'reject' && (
            <label className="block">
              <span className="text-white/70 text-sm">Motivo (opcional)</span>
              <textarea
                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}

          {(resolutionType === 'create_alias' || resolutionType === 'merge_existing' || resolutionType === 'create_child' || resolutionType === 'create_system') && (
            <label className="block">
              <span className="text-white/70 text-sm">Notas internas (opcional)</span>
              <input
                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          )}
        </div>

        {/* 4. Previa */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 mb-4">
          <p className="text-white/40 text-xs uppercase tracking-wide">Prévia do efeito</p>
          <p className="text-white/80 text-sm mt-1 break-words">{preview}</p>
        </div>

        {/* 5. Acoes */}
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10">
            Cancelar
          </button>
          <button
            onClick={handleDiscard}
            disabled={submitting || loading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 mr-auto"
          >
            Descartar sugestão
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Resolvendo…' : 'Confirmar resolução'}
          </button>
        </div>
      </div>
    </div>
  );
};
