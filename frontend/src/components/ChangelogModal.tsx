import { useEffect, useState } from 'react';
import { X, Zap, Calendar } from 'lucide-react';

interface Changelog {
  id: string;
  title: string;
  body: string;
  type: 'app' | 'dados';
  created_at: string;
}

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(false);
  // CORREÇÃO B02: Adicionar estado de erro
  const [error, setError] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  // CORREÇÃO FE-02: Função de retry que preserva estado do usuário
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/changelog');
      
      if (!res.ok) {
        throw new Error(`Erro ao carregar atualizações (HTTP ${res.status})`);
      }
      
      const json = await res.json();
      setLogs(json.data ?? []);
    } catch (err: any) {
      console.error('Erro ao buscar changelogs:', err);
      setError('Não foi possível carregar as atualizações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // CORREÇÃO C03: Adicionar AbortController para cleanup
      const controller = new AbortController();
      
      const fetchLogsWithAbort = async () => {
        try {
          setLoading(true);
          setError(null); // CORREÇÃO B02: Limpar erro anterior
          const res = await fetch('/api/v1/changelog', {
            signal: controller.signal, // CORREÇÃO C03: Passar signal
          });
          
          // CORREÇÃO B01: Validar resposta HTTP
          if (!res.ok) {
            throw new Error(`Erro ao carregar atualizações (HTTP ${res.status})`);
          }
          
          const json = await res.json();
          setLogs(json.data ?? []);
        } catch (err: any) {
          // CORREÇÃO C03: Ignorar erro de abort
          if (err.name === 'AbortError') return;
          
          console.error('Erro ao buscar changelogs:', err);
          // CORREÇÃO B02: Atualizar estado de erro
          setError('Não foi possível carregar as atualizações. Tente novamente mais tarde.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchLogsWithAbort();
      
      // CORREÇÃO C03: Cleanup para abortar fetch se modal fechar
      return () => controller.abort();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Agrupar por dia
  const groupedLogs = logs.reduce((acc: Record<string, Changelog[]>, log) => {
    const date = new Date(log.created_at).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-[var(--color-artificio-blue)] px-6 py-8 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[var(--color-artificio-orange)] text-white p-2 rounded-xl shadow-lg">
              <Zap size={24} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Novidades
            </h2>
          </div>
          <p className="text-white/60 text-sm font-medium">
            Confira as últimas melhorias e novidades do portal de mesas.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 bg-gray-50/30">
          {/* CORREÇÃO B05: Adicionar aria-live para leitores de tela */}
          {loading && (
            <div className="text-center py-8 text-gray-500" aria-live="polite">Carregando...</div>
          )}

          {/* CORREÇÃO B02: Renderizar estado de erro */}
          {!loading && error && (
            <div className="text-center py-8" role="alert">
              <p className="text-red-600 font-semibold mb-2">⚠️ Erro ao carregar atualizações</p>
              <p className="text-gray-600 text-sm">{error}</p>
              {/* CORREÇÃO FE-02: Retry interno ao invés de reload */}
              <button
                onClick={fetchLogs}
                className="mt-4 px-4 py-2 bg-[var(--color-artificio-orange)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* CORREÇÃO B04: Usar key única com index */}
          {!loading && !error && Object.entries(groupedLogs).map(([date, dailyLogs], dateIndex) => (
            <div key={`${date}-${dateIndex}`} className="relative pl-8">
              {/* Vertical line decoration */}
              <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gray-200"></div>
              
              <div className="flex items-center gap-2 mb-4 -ml-8">
                <div className="bg-white border-2 border-[var(--color-artificio-orange)] w-6 h-6 rounded-full flex items-center justify-center z-10">
                  <div className="w-2 h-2 bg-[var(--color-artificio-orange)] rounded-full"></div>
                </div>
                <span className="bg-orange-100 text-[var(--color-artificio-orange)] px-3 py-1 rounded-full text-[11px] font-black uppercase flex items-center gap-1">
                  <Calendar size={12} />
                  {date}
                </span>
              </div>

              <div className="space-y-4">
                {dailyLogs.map((log) => {
                  const isExpanded = expandedLogs[log.id];
                  // CORREÇÃO FE-01/INT-01: JSON tem \n literal, whitespace-pre-wrap renderiza corretamente
                  const shouldTruncate = log.body.length > 200;
                  
                  // CORREÇÃO FE-03: Truncate inteligente que não corta no meio de palavra
                  let displayBody = log.body;
                  if (shouldTruncate && !isExpanded) {
                    const truncated = log.body.slice(0, 200);
                    // Procurar último espaço ou quebra de linha
                    const lastSpace = Math.max(
                      truncated.lastIndexOf(' '),
                      truncated.lastIndexOf('\n')
                    );
                    displayBody = (lastSpace > 150 ? truncated.slice(0, lastSpace) : truncated) + '...';
                  }

                  return (
                    <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        log.type === 'dados' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {log.type === 'dados' ? 'CONTEÚDO' : 'SISTEMA'}
                      </span>
                      <h3 className="text-[var(--color-artificio-blue)] font-black text-base uppercase leading-tight mb-2 mt-2">
                        {log.title}
                      </h3>
                      <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                        {displayBody}
                      </div>
                      {/* CORREÇÃO B07: Adicionar aria-expanded */}
                      {shouldTruncate && (
                        <button
                          onClick={() => setExpandedLogs(prev => ({ ...prev, [log.id]: !isExpanded }))}
                          className="text-[var(--color-artificio-orange)] text-xs font-bold mt-2 hover:underline"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? 'Ver menos' : 'Ver detalhes'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma atualização disponível no momento.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-[var(--color-artificio-blue)] text-white px-8 py-3 rounded-xl font-bold uppercase hover:bg-opacity-90 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
