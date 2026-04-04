import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const STORAGE_KEY = 'dev_admin_token';
const AUTH_TOKEN_KEY = '@ArtificioMesas:token';
const AUTH_USER_KEY = '@ArtificioMesas:user';

interface RouteTest {
  label: string;
  method: string;
  path: string;
  body?: object;
}

const QUICK_TESTS: RouteTest[] = [
  { label: 'GET /health', method: 'GET', path: '/api/v1/health' },
  { label: 'GET /me', method: 'GET', path: '/api/v1/me' },
  { label: 'GET /aggregator/sources', method: 'GET', path: '/api/v1/aggregator/sources' },
  { label: 'GET /candidates (awaiting_review)', method: 'GET', path: '/api/v1/aggregator/candidates?status=awaiting_review&limit=5' },
  { label: 'GET /candidates (accepted)', method: 'GET', path: '/api/v1/aggregator/candidates?status=accepted&limit=5' },
  { label: 'GET /exports/day', method: 'GET', path: '/api/v1/aggregator/exports/day' },
];

export function AdminDevToolsPage() {
  const { user, token: sessionToken } = useAuth();
  const [token, setToken] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{ status: number; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPath, setCustomPath] = useState('');

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

  const saveToken = (value: string) => {
    setToken(value);
    if (value.trim()) {
      localStorage.setItem(STORAGE_KEY, value.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const runTest = async (route: RouteTest) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}${route.path}`, {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token.trim() ? { Authorization: `Bearer ${token.trim()}` } : {}),
        },
        body: route.body ? JSON.stringify(route.body) : undefined,
      });
      const text = await res.text();
      let body: string;
      try {
        body = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        body = text;
      }
      setResult({ status: res.status, body });
    } catch (err: any) {
      setResult({ status: 0, body: `Erro de rede: ${err?.message ?? String(err)}` });
    } finally {
      setLoading(false);
    }
  };

  const runCustom = () => {
    const path = customPath.trim() || '/api/v1/health';
    runTest({ label: 'Custom', method: 'GET', path });
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
      // best effort: token já foi salvo; AuthContext validará no bootstrap
    }

    window.location.reload();
  };

  const statusColor = (status: number) => {
    if (status === 0) return '#ef4444';
    if (status < 300) return '#22c55e';
    if (status < 400) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #1B2A4A 60%, #0a1628 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '2rem',
      color: '#e2e8f0',
    }}>
      {/* Header */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🔐</span>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#f1f5f9',
            margin: 0,
          }}>
            Admin DevTools
          </h1>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: '#E8521A22',
            color: '#E8521A',
            border: '1px solid #E8521A44',
            borderRadius: 4,
            padding: '2px 8px',
          }}>
            DEV ONLY
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>
          Cole o JWT admin para testar rotas protegidas. Token salvo localmente no browser.
        </p>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0 0 2rem 0' }}>
          Sessão atual: <strong style={{ color: '#e2e8f0' }}>{user?.role ?? 'sem login'}</strong>
        </p>

        {/* Token input — padrão DCE: campo mascarado, revela ao focar */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
        }}>
          <label style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            display: 'block',
            marginBottom: '0.5rem',
          }}>
            🔑 JWT Token
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              id="admin-jwt-token-input"
              type={revealed ? 'text' : 'password'}
              value={token}
              onChange={(e) => saveToken(e.target.value)}
              onFocus={() => setRevealed(true)}
              onBlur={() => setRevealed(false)}
              placeholder="Cole aqui o JWT obtido via localStorage após login OAuth..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '0.65rem 1rem',
                color: '#f1f5f9',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
            <button
              onClick={() => { setToken(''); localStorage.removeItem(STORAGE_KEY); }}
              title="Limpar token"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '0.65rem 0.75rem',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: '0.85rem',
              }}
            >
              ✕
            </button>
          </div>
          {token && (
            <p style={{ fontSize: '0.7rem', color: '#22c55e', marginTop: '0.4rem', marginBottom: 0 }}>
              ✓ Token presente ({token.length} chars) — salvo no localStorage
            </p>
          )}
          <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.35rem', marginBottom: 0 }}>
            Como obter: faça login no beta → F12 → Console → <code style={{ color: '#93c5fd' }}>localStorage.getItem('token')</code>
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <button
              id="admin-apply-token-btn"
              onClick={applyTokenToSession}
              disabled={!token.trim()}
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.35)',
                borderRadius: 6,
                padding: '0.45rem 0.8rem',
                cursor: !token.trim() ? 'not-allowed' : 'pointer',
                color: '#86efac',
                fontSize: '0.75rem',
                opacity: !token.trim() ? 0.5 : 1,
              }}
            >
              Aplicar token na sessão
            </button>
          </div>
        </div>

        {/* Quick tests */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
        }}>
          <label style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#94a3b8',
            display: 'block',
            marginBottom: '0.75rem',
          }}>
            ⚡ Testes Rápidos
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {QUICK_TESTS.map((test) => (
              <button
                key={test.path}
                onClick={() => runTest(test)}
                disabled={loading}
                style={{
                  background: 'rgba(232,82,26,0.12)',
                  border: '1px solid rgba(232,82,26,0.3)',
                  borderRadius: 6,
                  padding: '0.4rem 0.75rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  color: '#fb923c',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  opacity: loading ? 0.5 : 1,
                  transition: 'background 0.15s',
                }}
              >
                {test.label}
              </button>
            ))}
          </div>

          {/* Custom path */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              id="admin-custom-path-input"
              type="text"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runCustom()}
              placeholder="/api/v1/..."
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '0.4rem 0.75rem',
                color: '#f1f5f9',
                fontSize: '0.8rem',
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
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 6,
                padding: '0.4rem 1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: '#93c5fd',
                fontSize: '0.8rem',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? '⏳' : 'GET →'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            border: `1px solid ${statusColor(result.status)}44`,
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{
                fontWeight: 700,
                fontSize: '0.85rem',
                color: statusColor(result.status),
                fontFamily: 'monospace',
              }}>
                HTTP {result.status || 'ERR'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {result.status >= 200 && result.status < 300 ? '✓ OK' :
                 result.status === 401 ? '— não autorizado' :
                 result.status === 403 ? '— sem permissão' :
                 result.status === 0 ? '— falha de rede' : '— erro'}
              </span>
            </div>
            <pre style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 400,
              overflowY: 'auto',
            }}>
              {result.body}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
