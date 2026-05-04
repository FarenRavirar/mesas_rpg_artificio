import type { DiscordRawMessage, DiscordTableDraft, DiscordTableDraftTable, TableDraftType, TableDraftModality, TableDraftPriceType } from './types';

export interface SystemEntry {
  id: string;
  name: string;
  name_pt: string | null;
  aliases: string[];
}

// Remove sufixo ™ / ® de strings
function cleanTrademark(s: string): string {
  return s.replace(/[™®]/g, '').trim();
}

// Normaliza string para comparação: remove acentos, lowercase, colapsa espaços
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detecta o sistema a partir do texto usando a lista de sistemas do banco.
 * Testa: name, name_pt e todos os aliases de cada entrada.
 * Retorna o primeiro match encontrado.
 */
function matchSystem(text: string, systems: SystemEntry[]): SystemEntry | null {
  const normText = normalize(text);

  for (const system of systems) {
    const candidates = [
      system.name,
      ...(system.name_pt ? [system.name_pt] : []),
      ...system.aliases,
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const normCandidate = normalize(candidate);
      // Busca palavra(s) inteira(s): deve aparecer como token no texto
      // Usa boundary de espaço/início/fim para evitar falsos positivos curtos
      if (normCandidate.length < 2) continue;
      const pattern = new RegExp(`(?:^|[\\s,;:])${normCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:[\\s,;:]|$)`);
      if (pattern.test(` ${normText} `)) {
        return system;
      }
    }
  }
  return null;
}

// Tenta extrair "sistema: titulo" do nome do thread
function splitThreadName(threadName: string): { systemHint: string | null; title: string } {
  const colonIdx = threadName.indexOf(':');
  if (colonIdx > 0 && colonIdx < threadName.length - 2) {
    const beforeColon = cleanTrademark(threadName.slice(0, colonIdx).trim());
    const afterColon = cleanTrademark(threadName.slice(colonIdx + 1).trim());
    if (beforeColon.length > 0 && afterColon.length > 0) {
      return { systemHint: beforeColon, title: afterColon };
    }
  }
  return { systemHint: null, title: cleanTrademark(threadName) };
}

// Extrai modalidade do texto
function extractModality(text: string): TableDraftModality | null {
  const lower = text.toLowerCase();
  if (/\bpresencial\b/.test(lower)) return 'presencial';
  if (/\bh[íi]brida?\b|\bonline\s*e\s*presencial\b/.test(lower)) return 'hibrida';
  if (/\bonline\b/.test(lower)) return 'online';
  return null;
}

// Extrai tipo de campanha do texto
function extractType(text: string): TableDraftType | null {
  const lower = text.toLowerCase();
  if (/\bone[\s-]?shot\b/.test(lower)) return 'one-shot';
  if (/\bcampanha\b/.test(lower)) return 'campanha';
  if (/\baberta\b|\bdrop[\s-]?in\b/.test(lower)) return 'aberta';
  return null;
}

// Extrai informações de preço do texto
function extractPrice(text: string): { priceType: TableDraftPriceType; priceValue: number | null } {
  const lower = text.toLowerCase();
  if (/\bgratuita?\b|\bfree\b|\bsem\s+custo\b/.test(lower)) {
    return { priceType: 'gratuita', priceValue: null };
  }
  const priceMatch = text.match(/R\$\s*(\d+(?:[,.]\d{1,2})?)/i)
    ?? text.match(/(\d+(?:[,.]\d{1,2})?)\s*reais/i);
  if (priceMatch) {
    const value = parseFloat(priceMatch[1].replace(',', '.'));
    if (!isNaN(value) && value > 0) {
      return { priceType: 'paga', priceValue: value };
    }
  }
  return { priceType: 'gratuita', priceValue: null };
}

// Extrai número de vagas do texto
function extractSlots(text: string): { total: number | null; open: number | null } {
  const slashMatch = text.match(/(\d+)\s*\/\s*(\d+)\s*vagas?/i);
  if (slashMatch) {
    const filled = parseInt(slashMatch[1], 10);
    const total = parseInt(slashMatch[2], 10);
    return { total, open: Math.max(0, total - filled) };
  }
  const match = text.match(/(\d+)\s*vagas?/i)
    ?? text.match(/vagas?\s*(?:disponíveis?)?\s*[:=]\s*(\d+)/i);
  if (match) {
    const n = parseInt(match[1], 10);
    return { total: n, open: n };
  }
  return { total: null, open: null };
}

// Extrai dia da semana do texto
function extractDayOfWeek(text: string): string | null {
  const days: Record<string, string> = {
    segunda: 'segunda', 'segunda-feira': 'segunda',
    terça: 'terça', 'terça-feira': 'terça', terca: 'terça',
    quarta: 'quarta', 'quarta-feira': 'quarta',
    quinta: 'quinta', 'quinta-feira': 'quinta',
    sexta: 'sexta', 'sexta-feira': 'sexta',
    sábado: 'sábado', sabado: 'sábado',
    domingo: 'domingo',
  };
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(days)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

// Extrai horário do texto: "19h", "19:00", "às 20h30"
function extractStartTime(text: string): string | null {
  const match = text.match(/\b(\d{1,2})[hH:](\d{0,2})\b/)
    ?? text.match(/\bàs\s+(\d{1,2})[hH](\d{0,2})/i);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = (match[2] || '00').padStart(2, '0');
    return `${h}:${m}`;
  }
  return null;
}

// Extrai URL de contato (discord invite, forms, etc.)
function extractContactUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s<>"']+/);
  return urlMatch ? urlMatch[0] : null;
}

// Calcula confiança com base nos campos preenchidos
function calcConfidence(table: DiscordTableDraftTable): number {
  const fields: Array<keyof DiscordTableDraftTable> = [
    'title', 'system_name', 'type', 'modality', 'price_type',
    'slots_total', 'day_of_week', 'start_time', 'description',
  ];
  const filled = fields.filter((f) => table[f] != null).length;
  return Math.round((filled / fields.length) * 100) / 100;
}

/**
 * Parseia uma mensagem Discord importada e retorna um DiscordTableDraft.
 *
 * @param message    Mensagem bruta do banco discord_import_messages
 * @param systems    Lista de sistemas+aliases carregada do banco (systems + system_aliases).
 *                   Deve incluir o array `aliases` por sistema (nome + name_pt + alias strings).
 *                   Se omitida, a detecção de sistema não será feita.
 */
export function parseDiscordAnnouncement(
  message: DiscordRawMessage,
  systems: SystemEntry[] = [],
): DiscordTableDraft {
  const threadName = message.discord_thread_name ?? '';
  const body = message.content_raw ?? '';
  const fullText = `${threadName}\n${body}`.trim();

  // Título e dica de sistema (a partir do nome do thread)
  const { systemHint, title } = splitThreadName(threadName || body.split('\n')[0] || 'Mesa sem título');

  // Detecção de sistema via banco de dados
  let matchedSystem: SystemEntry | null = null;
  if (systems.length > 0) {
    // Tenta primeiro na parte antes do ":" (systemHint) — mais preciso
    if (systemHint) matchedSystem = matchSystem(systemHint, systems);
    // Fallback: busca no texto completo
    if (!matchedSystem) matchedSystem = matchSystem(fullText, systems);
  }

  const systemName = matchedSystem?.name ?? null;
  const systemId = matchedSystem?.id ?? null;

  // Campos extraídos do corpo
  const modality = extractModality(body) ?? 'online';
  const type = extractType(fullText) ?? (threadName ? 'campanha' : null);
  const { priceType, priceValue } = extractPrice(body);
  const { total: slotsTotal, open: slotsOpen } = extractSlots(body);
  const dayOfWeek = extractDayOfWeek(body);
  const startTime = extractStartTime(body);
  const contactUrl = extractContactUrl(body);
  const description = body.trim() || null;

  const missingFields: string[] = [];
  if (!systemName) missingFields.push('system_name');
  if (!dayOfWeek) missingFields.push('day_of_week');
  if (!startTime) missingFields.push('start_time');
  if (!slotsTotal) missingFields.push('slots_total');
  if (!contactUrl) missingFields.push('contact_url');
  if (!description) missingFields.push('description');

  const table: DiscordTableDraftTable = {
    title: title || threadName || null,
    system_name: systemName,
    system_id: systemId,
    type,
    modality,
    price_type: priceType,
    price_value: priceValue,
    slots_total: slotsTotal,
    slots_filled: slotsTotal && slotsOpen != null ? slotsTotal - slotsOpen : null,
    slots_open: slotsOpen,
    day_of_week: dayOfWeek,
    start_time: startTime,
    frequency: dayOfWeek ? 'semanal' : null,
    description,
    contact_discord: null,
    contact_url: contactUrl,
  };

  return {
    source: {
      guild_id: message.discord_guild_id,
      channel_id: message.discord_channel_id,
      message_id: message.discord_message_id,
      message_url: message.discord_message_url ?? '',
      author_id: message.discord_author_id ?? undefined,
      author_name: message.discord_author_name ?? undefined,
    },
    table,
    confidence: calcConfidence(table),
    missing_fields: missingFields,
  };
}
