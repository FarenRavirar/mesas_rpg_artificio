import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const STORAGE_KEY = 'dev_admin_token';
const AUTH_TOKEN_KEY = '@ArtificioMesas:token';
const AUTH_USER_KEY = '@ArtificioMesas:user';

interface RouteTest {
  id: string;
  label: string;
  description: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT';
  path: string;
  requiresAuth?: boolean;
  body?: object;
}

interface QuickTestResult {
  state: 'idle' | 'running' | 'success' | 'error';
  status: number | null;
  detail: string;
  checkedAt: string | null;
}

const QUICK_TESTS: RouteTest[] = [
  {
    id: 'health',
    label: 'API online',
    description: 'Verifica se o servidor está respondendo.',
    method: 'GET',
    path: '/api/v1/health',
    requiresAuth: false,
  },
  {
    id: 'me',
    label: 'Token admin válido',
    description: 'Confere se o token atual pertence a uma sessão válida.',
    method: 'GET',
    path: '/api/v1/me',
    requiresAuth: true,
  },
  {
    id: 'sources',
    label: 'Leitura de fontes',
    description: 'Valida acesso à lista de canais/fonte do Aggregator.',
    method: 'GET',
    path: '/api/v1/aggregator/sources',
    requiresAuth: true,
  },
  {
    id: 'candidates_review',
    label: 'Fila aguardando revisão',
    description: 'Valida leitura da fila editorial pendente.',
    method: 'GET',
    path: '/api/v1/aggregator/candidates?editorial_status=awaiting_review&limit=5',
    requiresAuth: true,
  },
  {
    id: 'candidates_accepted',
    label: 'Fila aceita',
    description: 'Valida leitura de anúncios já aceitos.',
    method: 'GET',
    path: '/api/v1/aggregator/candidates?editorial_status=accepted&limit=5',
    requiresAuth: true,
  },
  {
    id: 'exports_day',
    label: 'Exportação diária',
    description: 'Confere geração do pacote diário de exportação.',
    method: 'GET',
    path: '/api/v1/aggregator/exports/day',
    requiresAuth: true,
  },
];

const createInitialQuickResults = (): Record<string, QuickTestResult> => {
  const results: Record<string, QuickTestResult> = {};
  for (const test of QUICK_TESTS) {
    results[test.id] = {
      state: 'idle',
      status: null,
      detail: 'Aguardando execução',
      checkedAt: null,
    };
  }
  return results;
};

const IMPORT_CHUNK_SIZE = 1000;

const prettyJson = (raw: string): string => {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
};

const parseDiscordChannelLink = (value: string): { serverId: string; channelId: string } | null => {
  const normalized = value.trim();
  if (!normalized) return null;

  const patterns = [
    /discord\.com\/channels\/(\d+)\/(\d+)(?:\/\d+)?/i,
    /discord:\/\/(?:-\/)?channels\/(\d+)\/(\d+)(?:\/\d+)?/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        serverId: match[1],
        channelId: match[2],
      };
    }
  }

  return null;
};

const getPayloadMessageCount = (payload: unknown): number => {
  if (!payload || typeof payload !== 'object') return 0;
  const messages = (payload as { messages?: unknown }).messages;
  return Array.isArray(messages) ? messages.length : 0;
};

const splitPayloadForImport = (payload: unknown, chunkSize: number): unknown[] => {
  if (!payload || typeof payload !== 'object') return [payload];

  const root = payload as Record<string, unknown>;
  const messages = Array.isArray(root.messages) ? root.messages : null;

  if (!messages || messages.length <= chunkSize) {
    return [payload];
  }

  const chunks: unknown[] = [];
  for (let index = 0; index < messages.length; index += chunkSize) {
    chunks.push({
      ...root,
      messages: messages.slice(index, index + chunkSize),
    });
  }

  return chunks;
};

const aggregateImportSummaries = (summaries: any[], dryRun: boolean) => {
  return summaries.reduce(
    (acc, current) => {
      acc.totalMessages += Number(current?.totalMessages ?? 0);
      acc.imported += Number(current?.imported ?? 0);
      acc.accepted += Number(current?.accepted ?? 0);
      acc.awaitingReview += Number(current?.awaitingReview ?? 0);
      acc.rejected += Number(current?.rejected ?? 0);
      acc.failed += Number(current?.failed ?? 0);
      acc.results = acc.results.concat(Array.isArray(current?.results) ? current.results : []);
      return acc;
    },
    {
      totalMessages: 0,
      imported: 0,
      accepted: 0,
      awaitingReview: 0,
      rejected: 0,
      failed: 0,
      dryRun,
      chunks: summaries.length,
      results: [] as any[],
    }
  );
};

const summarizePayload = (payload: any): string[] => {
  if (!payload || typeof payload !== 'object') {
    return ['Arquivo lido, mas não foi possível reconhecer a estrutura JSON.'];
  }

  const lines: string[] = [];
  const messageCount = Array.isArray(payload.messages) ? payload.messages.length : null;
  const guildName = typeof payload.guild?.name === 'string' ? payload.guild.name : null;
  const channelName = typeof payload.channel?.name === 'string' ? payload.channel.name : null;

  if (messageCount !== null) lines.push(`Mensagens encontradas: ${messageCount}`);
  if (guildName) lines.push(`Servidor detectado: ${guildName}`);
  if (channelName) lines.push(`Canal detectado: ${channelName}`);

  if (messageCount !== null && messageCount > IMPORT_CHUNK_SIZE) {
    const chunks = Math.ceil(messageCount / IMPORT_CHUNK_SIZE);
    lines.push(`Split automático ativo: ${chunks} lote(s) de até ${IMPORT_CHUNK_SIZE} mensagens.`);
  }

  if (lines.length === 0) lines.push('Arquivo carregado. Estrutura fora do padrão esperado do exporter, mas pode ser testada no import.');

  return lines;
};

export function AdminDevToolsPage() {
  const { user, token: sessionToken } = useAuth();

  const [token, setToken] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [customPath, setCustomPath] = useState('');
  const [result, setResult] = useState<{ status: number; body: string } | null>(null);

  const [quickResults, setQuickResults] = useState<Record<string, QuickTestResult>>(createInitialQuickResults);
  const [runningQuickTests, setRunningQuickTests] = useState(false);

  const [channelUrl, setChannelUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceCreateFeedback, setSourceCreateFeedback] = useState<string | null>(null);
  const [sourceCreateError, setSourceCreateError] = useState<string | null>(null);
  const [creatingSource, setCreatingSource] = useState(false);

  const [importSourceId, setImportSourceId] = useState('');
  const [importDryRun, setImportDryRun] = useState(true);
  const [fileName, setFileName] = useState('');
  const [payloadPreview, setPayloadPreview] = useState<string[]>([]);
  const [parsedPayload, setParsedPayload] = useState<unknown>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [importingJson, setImportingJson] = useState(false);

  const autoRunTokenRef = useRef('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setToken(saved);
      return;
    }

    if (sessionToken) {
      setToken(sessionToken);
    }
  }, [sessionToken]);

  const parsedChannelLink = useMemo(() => parseDiscordChannelLink(channelUrl), [channelUrl]);

  const saveToken = (value: string) => {
    setToken(value);
    const trimmed = value.trim();

    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      autoRunTokenRef.current = '';
      setQuickResults(createInitialQuickResults());
    }
  };

  const executeRouteTest = async (route: RouteTest): Promise<{ status: number; body: string }> => {
    const trimmedToken = token.trim();
    if (route.requiresAuth && !trimmedToken) {
      return {
        status: 0,
        body: 'Token ausente. Cole um JWT admin para executar este teste.',
      };
    }

    try {
      const res = await fetch(`${API_BASE}${route.path}`, {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          ...(trimmedToken ? { Authorization: `Bearer ${trimmedToken}` } : {}),
        },
        body: route.body ? JSON.stringify(route.body) : undefined,
      });

      const text = await res.text();
      return {
        status: res.status,
        body: prettyJson(text),
      };
    } catch (err: any) {
      return {
        status: 0,
        body: `Erro de rede: ${err?.message ?? String(err)}`,
      };
    }
  };

  const runSingleTest = async (route: RouteTest) => {
    setLoading(true);
    setResult(null);

    const response = await executeRouteTest(route);
    setResult(response);

    setLoading(false);
  };

  const runAllQuickTests = async () => {
    setRunningQuickTests(true);

    for (const test of QUICK_TESTS) {
      setQuickResults((prev) => ({
        ...prev,
        [test.id]: {
          ...prev[test.id],
          state: 'running',
          detail: 'Executando...',
        },
      }));

      const response = await executeRouteTest(test);
      const success = response.status >= 200 && response.status < 300;

      setQuickResults((prev) => ({
        ...prev,
        [test.id]: {
          state: success ? 'success' : 'error',
          status: response.status,
          detail: response.body,
          checkedAt: new Date().toLocaleTimeString('pt-BR'),
        },
      }));
    }

    setRunningQuickTests(false);
  };

  useEffect(() => {
    const trimmed = token.trim();
    if (!trimmed) return;
    if (autoRunTokenRef.current === trimmed) return;

    autoRunTokenRef.current = trimmed;
    runAllQuickTests();
  }, [token]);

  const runCustom = async () => {
    const path = customPath.trim() || '/api/v1/health';
    await runSingleTest({
      id: 'custom',
      label: 'Custom',
      description: 'Teste customizado',
      method: 'GET',
      path,
      requiresAuth: path.startsWith('/api/v1/aggregator') || path.startsWith('/api/v1/me'),
    });
  };

  const applyTokenToSession = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;

    localStorage.setItem(AUTH_TOKEN_KEY, trimmed);

    try {
      const res = await fetch(`${API_BASE}/api/v1/me`, {
        headers: { Authorization: `Bearer ${trimmed}` },
      });

      if (res.ok) {
        const meJson = await res.json();
        const apiUser = meJson?.data?.user;
        const profile = meJson?.data?.profile;

        if (apiUser?.id && apiUser?.role) {
          localStorage.setItem(
            AUTH_USER_KEY,
            JSON.stringify({
              id: apiUser.id,
              role: apiUser.role,
              name: profile?.display_name,
              avatar_url: profile?.avatar_url,
            })
          );
        }
      }
    } catch {
      // best effort
    }

    window.location.reload();
  };

  const loadJsonFile = async (file: File) => {
    setImportError(null);
    setImportFeedback(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      setFileName(file.name);
      setParsedPayload(parsed);
      setPayloadPreview(summarizePayload(parsed));
    } catch {
      setParsedPayload(null);
      setPayloadPreview([]);
      setFileName(file.name);
      setImportError('Não foi possível ler este arquivo como JSON válido.');
    }
  };

  const handleImportFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await loadJsonFile(file);
  };

  const importChunkInfo = useMemo(() => {
    const totalMessages = getPayloadMessageCount(parsedPayload);
    if (totalMessages === 0) return null;

    return {
      totalMessages,
      chunkCount: Math.max(1, Math.ceil(totalMessages / IMPORT_CHUNK_SIZE)),
    };
  }, [parsedPayload]);

  const createSourceFromChannelLink = async () => {
    setSourceCreateFeedback(null);
    setSourceCreateError(null);

    const ids = parseDiscordChannelLink(channelUrl);
    if (!ids) {
      setSourceCreateError('Link inválido. Use o formato: https://discord.com/channels/SERVIDOR/CANAL');
      return;
    }

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setSourceCreateError('Cole um token admin antes de criar a source.');
      return;
    }

    setCreatingSource(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/aggregator/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${trimmedToken}`,
        },
        body: JSON.stringify({
          name: sourceName.trim() || `Canal ${ids.channelId}`,
          serverId: ids.serverId,
          channelId: ids.channelId,
          enabled: true,
          allowPaid: false,
          publishMode: 'manual_review',
        }),
      });

      const text = await res.text();
      const body = text ? JSON.parse(text) : null;

      if (!res.ok) {
        setSourceCreateError(body?.error ?? 'Falha ao criar source.');
        return;
      }

      const createdId = body?.data?.id as string | undefined;
      if (createdId) {
        setImportSourceId(createdId);
      }

      setSourceCreateFeedback(`Source criada com sucesso${createdId ? ` (ID: ${createdId})` : ''}.`);
    } catch (err: any) {
      setSourceCreateError(`Falha de rede ao criar source: ${err?.message ?? String(err)}`);
    } finally {
      setCreatingSource(false);
    }
  };

  const importJsonPayload = async () => {
    setImportFeedback(null);
    setImportError(null);
    setImportResult(null);

    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setImportError('Cole um token admin antes de importar JSON.');
      return;
    }

    if (!parsedPayload) {
      setImportError('Selecione um arquivo JSON válido antes de importar.');
      return;
    }

    setImportingJson(true);

    try {
      const payloadChunks = splitPayloadForImport(parsedPayload, IMPORT_CHUNK_SIZE);
      const chunkSummaries: any[] = [];

      for (let index = 0; index < payloadChunks.length; index += 1) {
        if (payloadChunks.length > 1) {
          setImportFeedback(`Importando lote ${index + 1}/${payloadChunks.length}...`);
        }

        const res = await fetch(`${API_BASE}/api/v1/aggregator/import/file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${trimmedToken}`,
          },
          body: JSON.stringify({
            sourceId: importSourceId.trim() || undefined,
            dryRun: importDryRun,
            payload: payloadChunks[index],
          }),
        });

        const text = await res.text();
        let body: any = null;

        try {
          body = text ? JSON.parse(text) : null;
        } catch {
          body = null;
        }

        if (!res.ok) {
          setImportError(body?.error ?? `Falha ao importar o lote ${index + 1}.`);
          return;
        }

        chunkSummaries.push(body?.data ?? null);
      }

      const aggregated = aggregateImportSummaries(chunkSummaries, importDryRun);
      setImportResult(aggregated);

      if (chunkSummaries.length > 1) {
        setImportFeedback(importDryRun
          ? `Dry-run concluído em ${chunkSummaries.length} lotes. Nenhum dado foi persistido.`
          : `Importação concluída em ${chunkSummaries.length} lotes com persistência no banco.`);
      } else {
        setImportFeedback(importDryRun
          ? 'Dry-run concluído. Nenhum dado foi persistido.'
          : 'Importação concluída com persistência no banco.');
      }
    } catch (err: any) {
      setImportError(`Falha de rede no import: ${err?.message ?? String(err)}`);
    } finally {
      setImportingJson(false);
    }
  };

  const getQuickBadgeStyle = (state: QuickTestResult['state']) => {
    if (state === 'success') {
      return {
        color: '#22c55e',
        border: '1px solid rgba(34,197,94,0.35)',
        background: 'rgba(34,197,94,0.15)',
        text: '🟢 VERDE',
      };
    }

    if (state === 'error') {
      return {
        color: '#ef4444',
        border: '1px solid rgba(239,68,68,0.35)',
        background: 'rgba(239,68,68,0.15)',
        text: '🔴 VERMELHO',
      };
    }

    if (state === 'running') {
      return {
        color: '#f59e0b',
        border: '1px solid rgba(245,158,11,0.35)',
        background: 'rgba(245,158,11,0.15)',
        text: '🟡 RODANDO',
      };
    }

    return {
      color: '#94a3b8',
      border: '1px solid rgba(148,163,184,0.35)',
      background: 'rgba(148,163,184,0.12)',
      text: '⚪ Aguardando',
    };
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #152238 0%, #0a0f1e 45%, #070b16 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem',
        color: '#e2e8f0',
      }}
    >
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🛠️</span>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Admin DevTools — Aggregator Discord</h1>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: '#E8521A22',
                color: '#E8521A',
                border: '1px solid #E8521A44',
                borderRadius: 6,
                padding: '2px 8px',
              }}
            >
              Admin only
            </span>
          </div>
          <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
            Esta tela foi feita para operação real: criar source por link de canal, testar API automaticamente e importar JSON com resumo amigável.
          </p>
          <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.75rem' }}>
            Sessão atual: <strong style={{ color: '#e2e8f0' }}>{user?.role ?? 'sem login'}</strong>
          </p>
        </header>

        <section
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12,
            padding: '1rem 1.2rem',
            marginBottom: '1rem',
          }}
        >
          <label
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              display: 'block',
              marginBottom: '0.55rem',
            }}
          >
            🔑 JWT Admin (nosso app)
          </label>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              id="admin-jwt-token-input"
              type={revealed ? 'text' : 'password'}
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              onFocus={() => setRevealed(true)}
              onBlur={() => setRevealed(false)}
              placeholder="Cole aqui o JWT admin"
              style={{
                flex: 1,
                minWidth: 300,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '0.65rem 0.9rem',
                color: '#f1f5f9',
                fontSize: '0.84rem',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />

            <button
              id="admin-clear-token-btn"
              onClick={() => saveToken('')}
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '0.62rem 0.85rem',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: '0.8rem',
              }}
            >
              Limpar
            </button>

            <button
              id="admin-apply-token-btn"
              onClick={applyTokenToSession}
              disabled={!token.trim()}
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.35)',
                borderRadius: 8,
                padding: '0.62rem 0.85rem',
                cursor: !token.trim() ? 'not-allowed' : 'pointer',
                color: '#86efac',
                fontSize: '0.8rem',
                opacity: !token.trim() ? 0.5 : 1,
              }}
            >
              Aplicar na sessão
            </button>
          </div>

          <p style={{ margin: '0.55rem 0 0 0', color: '#64748b', fontSize: '0.72rem' }}>
            Dica rápida: faça login no beta e rode no console: <code style={{ color: '#93c5fd' }}>localStorage.getItem('token')</code>
          </p>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '0.8rem',
            marginBottom: '1rem',
          }}
        >
          <article
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 12,
              padding: '0.9rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '0.88rem', color: '#bfdbfe' }}>🤖 Token do Bot (recomendado)</h2>
            <ol style={{ margin: '0.55rem 0 0 1rem', padding: 0, color: '#dbeafe', fontSize: '0.76rem', lineHeight: 1.45 }}>
              <li>
                <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                  Abra o portal de desenvolvedor do Discord
                </a>.
              </li>
              <li>Entre na aplicação do bot e clique em <strong>Bot</strong>.</li>
              <li>Use <strong>Reset Token</strong> para gerar um novo token.</li>
              <li>Ative <strong>Message Content Intent</strong>.</li>
              <li>Guarde o token em local seguro (nunca no frontend).</li>
            </ol>
            <p style={{ margin: '0.45rem 0 0 0', color: '#93c5fd', fontSize: '0.72rem' }}>
              ℹ️ O bot precisa ter permissão <strong>Read Message History</strong> no canal. Não precisa ser administrador do servidor.
            </p>
          </article>

          <article
            style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 12,
              padding: '0.9rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '0.88rem', color: '#fde68a' }}>👤 Token de conta pessoal (alto risco)</h2>
            <ol style={{ margin: '0.55rem 0 0 1rem', padding: 0, color: '#fef3c7', fontSize: '0.76rem', lineHeight: 1.45 }}>
              <li>
                <a href="https://discord.com/app" target="_blank" rel="noopener noreferrer" style={{ color: '#fcd34d', textDecoration: 'underline' }}>
                  Abra o Discord no navegador
                </a> e faça login.
              </li>
              <li>Pressione <strong>Ctrl + Shift + I</strong> (ou <strong>F12</strong>) para abrir o DevTools.</li>
              <li>Clique na aba <strong>Network</strong> (Rede).</li>
              <li>Atualize a página (<strong>F5</strong>) e troque de canal.</li>
              <li>Na lista de requisições, procure por <strong>messages</strong> ou <strong>channels</strong>.</li>
              <li>Clique em uma requisição e vá até <strong>Headers</strong> (Cabeçalhos).</li>
              <li>Procure o campo <strong>authorization</strong> e copie o valor (começa com token longo).</li>
            </ol>
            <p style={{ margin: '0.45rem 0 0 0', color: '#fbbf24', fontSize: '0.72rem' }}>
              ⚠️ Use só para referência/diagnóstico. Pode violar os termos do Discord e resultar em banimento da conta.
            </p>
          </article>
        </section>

        <section
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '1rem 1.2rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc' }}>⚡ Testes rápidos automáticos</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.74rem' }}>
                Rodam automaticamente quando o token muda. Verde = OK. Vermelho = precisa corrigir.
              </p>
            </div>

            <button
              id="admin-run-all-tests-btn"
              onClick={runAllQuickTests}
              disabled={runningQuickTests}
              style={{
                background: 'rgba(232,82,26,0.14)',
                border: '1px solid rgba(232,82,26,0.35)',
                borderRadius: 8,
                padding: '0.5rem 0.8rem',
                cursor: runningQuickTests ? 'not-allowed' : 'pointer',
                color: '#fdba74',
                fontSize: '0.78rem',
                opacity: runningQuickTests ? 0.6 : 1,
              }}
            >
              {runningQuickTests ? 'Executando...' : 'Reexecutar testes'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.65rem', marginTop: '0.85rem' }}>
            {QUICK_TESTS.map((test) => {
              const current = quickResults[test.id];
              const badge = getQuickBadgeStyle(current?.state ?? 'idle');

              return (
                <article
                  key={test.id}
                  style={{
                    borderRadius: 10,
                    border: badge.border,
                    background: badge.background,
                    padding: '0.72rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '0.78rem', color: '#f1f5f9' }}>{test.label}</strong>
                    <span style={{ fontSize: '0.66rem', fontWeight: 700, color: badge.color }}>{badge.text}</span>
                  </div>
                  <p style={{ margin: '0.35rem 0 0 0', color: '#cbd5e1', fontSize: '0.71rem' }}>{test.description}</p>
                  <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                    {test.method} {test.path}
                  </p>
                  <p style={{ margin: '0.3rem 0 0 0', color: '#64748b', fontSize: '0.67rem' }}>
                    {current?.checkedAt ? `Última execução: ${current.checkedAt} | HTTP ${current.status ?? 'ERR'}` : 'Ainda não executado'}
                  </p>
                </article>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
            <input
              id="admin-custom-path-input"
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runCustom()}
              placeholder="Teste customizado: /api/v1/..."
              style={{
                flex: 1,
                minWidth: 260,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                color: '#f1f5f9',
                fontSize: '0.76rem',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              id="admin-run-custom-btn"
              onClick={runCustom}
              disabled={loading}
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.35)',
                borderRadius: 8,
                padding: '0.5rem 0.85rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#93c5fd',
                fontSize: '0.76rem',
                opacity: loading ? 0.6 : 1,
              }}
            >
              GET custom
            </button>
          </div>
        </section>

        <section
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '1rem 1.2rem',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc' }}>🔗 Criar source por link de canal Discord</h2>
          <p style={{ margin: '0.25rem 0 0.7rem 0', color: '#94a3b8', fontSize: '0.74rem' }}>
            Cole o link de um canal de anúncios. O sistema extrai Server ID e Channel ID automaticamente.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem' }}>
            <input
              id="admin-source-channel-link-input"
              type="text"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="https://discord.com/channels/123/456"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                color: '#f1f5f9',
                fontSize: '0.76rem',
                outline: 'none',
              }}
            />

            <input
              id="admin-source-name-input"
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Nome amigável da source (opcional)"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                color: '#f1f5f9',
                fontSize: '0.76rem',
                outline: 'none',
              }}
            />

            <button
              id="admin-create-source-from-link-btn"
              onClick={createSourceFromChannelLink}
              disabled={creatingSource}
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: 8,
                padding: '0.5rem 0.85rem',
                cursor: creatingSource ? 'not-allowed' : 'pointer',
                color: '#6ee7b7',
                fontSize: '0.76rem',
                opacity: creatingSource ? 0.65 : 1,
              }}
            >
              {creatingSource ? 'Criando...' : 'Criar source'}
            </button>
          </div>

          <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.7rem' }}>
            IDs detectados: {parsedChannelLink ? `server ${parsedChannelLink.serverId} | canal ${parsedChannelLink.channelId}` : 'aguardando link válido'}
          </p>

          {sourceCreateFeedback && <p style={{ margin: '0.35rem 0 0 0', color: '#22c55e', fontSize: '0.72rem' }}>{sourceCreateFeedback}</p>}
          {sourceCreateError && <p style={{ margin: '0.35rem 0 0 0', color: '#ef4444', fontSize: '0.72rem' }}>{sourceCreateError}</p>}
        </section>

        <section
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '1rem 1.2rem',
            marginBottom: '1rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '0.92rem', color: '#f8fafc' }}>📥 Importar JSON do Discord</h2>
          <p style={{ margin: '0.25rem 0 0.7rem 0', color: '#94a3b8', fontSize: '0.74rem' }}>
            Funciona com botão e arrastar/soltar. O resumo mostra o que foi processado.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <input
              id="admin-import-source-id-input"
              type="text"
              value={importSourceId}
              onChange={(e) => setImportSourceId(e.target.value)}
              placeholder="Source ID (opcional, mas recomendado)"
              style={{
                flex: 1,
                minWidth: 300,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '0.5rem 0.75rem',
                color: '#f1f5f9',
                fontSize: '0.76rem',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <input
                id="admin-import-dryrun-checkbox"
                type="checkbox"
                checked={importDryRun}
                onChange={(e) => setImportDryRun(e.target.checked)}
              />
              Dry-run (simulação)
            </label>
          </div>

          <div
            id="admin-json-dropzone"
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={async (event) => {
              event.preventDefault();
              setDragActive(false);
              const file = event.dataTransfer.files?.[0];
              if (!file) return;
              await loadJsonFile(file);
            }}
            style={{
              borderRadius: 10,
              border: dragActive ? '1px dashed rgba(59,130,246,0.8)' : '1px dashed rgba(148,163,184,0.4)',
              background: dragActive ? 'rgba(59,130,246,0.12)' : 'rgba(15,23,42,0.5)',
              padding: '0.8rem',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.74rem' }}>Arraste o JSON aqui ou use o botão abaixo</p>
            <input id="admin-json-file-input" type="file" accept="application/json,.json" onChange={handleImportFileInput} style={{ marginTop: '0.5rem' }} />
          </div>

          {fileName && (
            <div style={{ marginTop: '0.65rem' }}>
              <p style={{ margin: 0, color: '#93c5fd', fontSize: '0.73rem' }}>Arquivo: {fileName}</p>
              {payloadPreview.map((line) => (
                <p key={line} style={{ margin: '0.22rem 0 0 0', color: '#cbd5e1', fontSize: '0.72rem' }}>{line}</p>
              ))}
            </div>
          )}

          {importChunkInfo && importChunkInfo.totalMessages > IMPORT_CHUNK_SIZE && (
            <p style={{ margin: '0.5rem 0 0 0', color: '#fbbf24', fontSize: '0.71rem' }}>
              Este arquivo será importado em <strong>{importChunkInfo.chunkCount}</strong> lotes automáticos de até {IMPORT_CHUNK_SIZE} mensagens.
            </p>
          )}

          <div style={{ marginTop: '0.7rem' }}>
            <button
              id="admin-import-json-btn"
              onClick={importJsonPayload}
              disabled={importingJson || !parsedPayload}
              style={{
                background: 'rgba(232,82,26,0.16)',
                border: '1px solid rgba(232,82,26,0.35)',
                borderRadius: 8,
                padding: '0.52rem 0.9rem',
                cursor: importingJson || !parsedPayload ? 'not-allowed' : 'pointer',
                color: '#fdba74',
                fontSize: '0.78rem',
                opacity: importingJson || !parsedPayload ? 0.6 : 1,
              }}
            >
              {importingJson ? 'Importando...' : 'Importar JSON agora'}
            </button>
          </div>

          {importFeedback && <p style={{ margin: '0.45rem 0 0 0', color: '#22c55e', fontSize: '0.73rem' }}>{importFeedback}</p>}
          {importError && <p style={{ margin: '0.45rem 0 0 0', color: '#ef4444', fontSize: '0.73rem' }}>{importError}</p>}

          {importResult && (
            <div
              style={{
                marginTop: '0.75rem',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 10,
                padding: '0.8rem',
              }}
            >
              <p style={{ margin: 0, color: '#86efac', fontSize: '0.76rem', fontWeight: 700 }}>Resumo da importação</p>
              <p style={{ margin: '0.3rem 0 0 0', color: '#cbd5e1', fontSize: '0.73rem' }}>
                Lotes: {importResult.chunks ?? 1} | Total: {importResult.totalMessages ?? '-'} | Processadas: {importResult.imported ?? '-'} | Aceitas: {importResult.accepted ?? '-'}
              </p>
              <p style={{ margin: '0.18rem 0 0 0', color: '#cbd5e1', fontSize: '0.73rem' }}>
                Em revisão: {importResult.awaitingReview ?? '-'} | Rejeitadas: {importResult.rejected ?? '-'} | Falhas: {importResult.failed ?? '-'}
              </p>
            </div>
          )}
        </section>

        {result && (
          <section
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(148,163,184,0.35)',
              borderRadius: 12,
              padding: '1rem 1.2rem',
            }}
          >
            <p style={{ margin: 0, color: '#f8fafc', fontSize: '0.8rem', fontWeight: 700 }}>
              Resultado do teste manual (HTTP {result.status || 'ERR'})
            </p>
            <pre
              style={{
                margin: '0.6rem 0 0 0',
                fontSize: '0.74rem',
                color: '#cbd5e1',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 360,
                overflowY: 'auto',
              }}
            >
              {result.body}
            </pre>
          </section>
        )}
      </div>
    </div>
  );
}
