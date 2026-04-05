/**
 * Parser de conteúdo de mensagens do Discord
 * Extrai campos estruturados do texto bruto
 */

export interface ParsedDiscordContent {
  title?: string;
  system?: string;
  type?: string;
  modality?: string;
  slots?: string;
  language?: string;
  starts_at?: string;
  frequency?: string;
  rules_notes?: string;
  price_type?: string;
  actual_gm_name?: string;
  // Campos de horário
  schedule?: string;
  day_of_week?: string;
  time?: string;
}

/**
 * Extrai valor de um campo usando regex
 */
const extractField = (content: string, patterns: RegExp[]): string | undefined => {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return undefined;
};

/**
 * Parse do conteúdo da mensagem do Discord
 */
export function parseDiscordContent(content: string): ParsedDiscordContent {
  if (!content) return {};

  const result: ParsedDiscordContent = {};

  // Título (primeira linha com # ou campo explícito)
  const titlePatterns = [
    /^#\s*([^\n]+)/m,
    /^#\s*T[ií]tulo:\s*([^\n]+)/im,
    /^T[ií]tulo:\s*([^\n]+)/im,
    /^\*\*T[ií]tulo:\*\*\s*([^\n]+)/im,
  ];
  result.title = extractField(content, titlePatterns);

  // Sistema
  const systemPatterns = [
    /▬\s*\*\*Sistema:\*\*\s*\*?([^\n*]+)\*?/i,
    /▬\s*Sistema:\s*([^\n]+)/i,
    /Sistema:\s*([^\n]+)/i,
    /\*\*Sistema:\*\*\s*([^\n]+)/i,
  ];
  result.system = extractField(content, systemPatterns);

  // Tipo de mesa
  const typePatterns = [
    /▬\s*Tipo:\s*([^\n]+)/i,
    /Tipo:\s*([^\n]+)/i,
    /\(?(Campanha|Oneshot|One-shot|Aventura)\)?/i,
  ];
  result.type = extractField(content, typePatterns);

  // Modalidade
  const modalityPatterns = [
    /▬\s*Local:\s*([^\n]+)/i,
    /Local:\s*([^\n]+)/i,
    /Modalidade:\s*([^\n]+)/i,
    /(Online|Presencial|H[ií]brida?)/i,
  ];
  result.modality = extractField(content, modalityPatterns);

  // Vagas
  const slotsPatterns = [
    /▬\s*Vagas?\s*(?:Totais?|Dispon[ií]veis?):\s*(\d+)/i,
    /Vagas?:\s*(\d+)/i,
    /(\d+)\s*vagas?/i,
  ];
  result.slots = extractField(content, slotsPatterns);

  // Idioma
  const languagePatterns = [
    /▬\s*Idioma:\s*([^\n]+)/i,
    /Idioma:\s*([^\n]+)/i,
  ];
  result.language = extractField(content, languagePatterns);

  // Data de início
  const datePatterns = [
    /▬\s*Data(?:\s*&\s*Hor[aá]rio)?:\s*([^\n]+)/i,
    /Data:\s*([^\n]+)/i,
    /In[ií]cio:\s*([^\n]+)/i,
  ];
  result.starts_at = extractField(content, datePatterns);

  // Horário/Schedule (captura dia da semana + horário)
  const schedulePatterns = [
    /(Segunda|Terça|Quarta|Quinta|Sexta|S[aá]bado|Domingo)s?(?:-feiras?)?\s+(?:das?\s+)?(\d{1,2}h?\d{0,2})/i,
    /▬\s*Dia\s*&\s*Hor[aá]rio:\s*([^\n]+)/i,
  ];
  result.schedule = extractField(content, schedulePatterns);

  // Frequência
  const frequencyPatterns = [
    /▬\s*Frequ[eê]ncia:\s*([^\n]+)/i,
    /Frequ[eê]ncia:\s*([^\n]+)/i,
    /(Semanal|Quinzenal|Mensal|Di[aá]ria)/i,
  ];
  result.frequency = extractField(content, frequencyPatterns);

  // Regras/Observações
  const rulesPatterns = [
    /▬\s*Regras?(?:\/Observa[çc][õo]es)?:\s*([^\n▬]+)/i,
    /Regras?:\s*([^\n▬]+)/i,
    /Observa[çc][õo]es:\s*([^\n▬]+)/i,
  ];
  result.rules_notes = extractField(content, rulesPatterns);

  // Preço
  const pricePatterns = [
    /▬\s*Mesa\s*Paga:\s*R\$\s*[\d,]+/i,
    /Mesa\s*Paga/i,
    /R\$\s*[\d,]+/,
  ];
  const priceMatch = extractField(content, pricePatterns);
  if (priceMatch) {
    result.price_type = 'paga';
  } else if (/grat[uú]it[ao]|free|sem custo/i.test(content)) {
    result.price_type = 'gratuita';
  }

  // Nome do mestre
  const gmPatterns = [
    /▬\s*Mestre:\s*<@(\d+)>/i,
    /Mestre:\s*([^\n]+)/i,
    /Narrador:\s*([^\n]+)/i,
  ];
  result.actual_gm_name = extractField(content, gmPatterns);

  return result;
}
