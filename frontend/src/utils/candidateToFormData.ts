/**
 * Mapeia dados extraídos de um candidato (parsed_json) para o formato do formulário de mesa
 */

export interface CandidateFormData {
  title?: string;
  description?: string;
  type?: string;
  modality?: string;
  price_type?: string;
  slots_total?: string;
  language?: string;
  publisher_role?: 'gm' | 'announcer';
  actual_gm_name?: string;
}

export function mapCandidateToFormData(parsed_json: any): CandidateFormData {
  if (!parsed_json) return {};

  const mapped: CandidateFormData = {};

  // Título
  if (parsed_json.title) {
    mapped.title = parsed_json.title;
  }

  // Descrição (synopsis)
  if (parsed_json.synopsis) {
    mapped.description = parsed_json.synopsis;
  }

  // Tipo de mesa (tentar inferir)
  if (parsed_json.type) {
    const typeMap: Record<string, string> = {
      'campanha': 'campanha',
      'oneshot': 'oneshot',
      'one-shot': 'oneshot',
      'aventura': 'oneshot',
    };
    const normalized = parsed_json.type.toLowerCase();
    mapped.type = typeMap[normalized] || 'campanha';
  }

  // Modalidade
  if (parsed_json.modality) {
    const modalityMap: Record<string, string> = {
      'online': 'online',
      'presencial': 'presencial',
      'híbrida': 'hibrida',
      'hibrida': 'hibrida',
    };
    const normalized = parsed_json.modality.toLowerCase();
    mapped.modality = modalityMap[normalized] || 'online';
  }

  // Preço
  if (parsed_json.isPaid !== undefined) {
    mapped.price_type = parsed_json.isPaid ? 'paga' : 'gratuita';
  } else if (parsed_json.priceText) {
    const priceText = parsed_json.priceText.toLowerCase();
    if (priceText.includes('grátis') || priceText.includes('gratuita') || priceText.includes('free')) {
      mapped.price_type = 'gratuita';
    } else if (priceText.includes('paga') || priceText.includes('paid') || priceText.match(/r\$|reais/)) {
      mapped.price_type = 'paga';
    }
  }

  // Vagas
  if (parsed_json.slots || parsed_json.maxPlayers) {
    const slots = parsed_json.slots || parsed_json.maxPlayers;
    mapped.slots_total = String(slots);
  }

  // Idioma
  if (parsed_json.language) {
    mapped.language = parsed_json.language;
  }

  // Publisher role e nome do mestre
  if (parsed_json.masterText) {
    mapped.publisher_role = 'announcer';
    mapped.actual_gm_name = parsed_json.masterText;
  } else {
    mapped.publisher_role = 'gm';
  }

  return mapped;
}

/**
 * Detecta se a mesa é do Covil do Lich
 */
export function isCovil(parsed_json: any): boolean {
  if (!parsed_json) return false;

  const textFields = [
    parsed_json.title,
    parsed_json.synopsis,
    parsed_json.masterText,
    parsed_json.signupText,
    parsed_json.source,
  ].filter(Boolean).join(' ').toLowerCase();

  return textFields.includes('covil do lich') || 
         textFields.includes('covillich') ||
         textFields.includes('covil');
}

/**
 * Detecta tipo de preço da mesa
 */
export function detectPriceType(parsed_json: any): 'free' | 'paid' | 'unidentified' {
  if (!parsed_json) return 'unidentified';

  // Verificação explícita
  if (parsed_json.isPaid === true) return 'paid';
  if (parsed_json.isPaid === false) return 'free';

  // Verificação por texto
  if (parsed_json.priceText) {
    const priceText = parsed_json.priceText.toLowerCase();
    if (priceText.includes('grátis') || priceText.includes('gratuita') || priceText.includes('free')) {
      return 'free';
    }
    if (priceText.includes('paga') || priceText.includes('paid') || priceText.match(/r\$|reais|€|usd|\$/)) {
      return 'paid';
    }
  }

  // Verificação por campos de preço
  if (parsed_json.price !== undefined && parsed_json.price !== null) {
    return parsed_json.price > 0 ? 'paid' : 'free';
  }

  return 'unidentified';
}
