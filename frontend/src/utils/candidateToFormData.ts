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
  system_id?: string;
  starts_at?: string;
  frequency?: string;
  frequency_custom?: string;
  rules_notes?: string;
  banner_url?: string;
  contacts?: Array<{
    channel: string;
    value: string;
    extra_url?: string;
  }>;
}

/**
 * Remove prefixos técnicos do Discord de campos de texto
 */
export function sanitizeText(text: string | undefined | null): string | undefined {
  if (!text) return undefined;

  // Remove prefixos comuns do Discord
  const prefixes = [
    /^#\s*Título:\s*/i,
    /^\*\*Título:\*\*\s*/i,
    /^Título:\s*/i,
    /^#\s*Sistema:\s*/i,
    /^\*\*Sistema:\*\*\s*/i,
    /^Sistema:\s*/i,
    /^#\s*Descrição:\s*/i,
    /^\*\*Descrição:\*\*\s*/i,
    /^Descrição:\s*/i,
    /^#\s*/,
    /^\*\*/,
  ];

  let sanitized = text.trim();
  
  for (const prefix of prefixes) {
    sanitized = sanitized.replace(prefix, '');
  }

  return sanitized.trim() || undefined;
}

/**
 * Busca inteligente de sistema na árvore hierárquica
 * Retorna o system_id se encontrado, null caso contrário
 */
export function findSystemId(
  systemName: string | undefined | null,
  systemsTree: any[]
): string | null {
  if (!systemName || !systemsTree || systemsTree.length === 0) {
    return null;
  }

  const normalized = systemName.toLowerCase().trim();

  // Busca recursiva na árvore
  function searchInTree(nodes: any[]): string | null {
    for (const node of nodes) {
      // Verifica nome do nó
      if (node.name && node.name.toLowerCase() === normalized) {
        return node.id;
      }

      // Verifica aliases
      if (node.aliases && Array.isArray(node.aliases)) {
        for (const alias of node.aliases) {
          if (alias.toLowerCase() === normalized) {
            return node.id;
          }
        }
      }

      // Busca fuzzy (contém)
      if (node.name && node.name.toLowerCase().includes(normalized)) {
        return node.id;
      }

      // Busca recursiva nos filhos
      if (node.children && node.children.length > 0) {
        const found = searchInTree(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  return searchInTree(systemsTree);
}

export function mapCandidateToFormData(
  parsed_json: any,
  systemsTree?: any[]
): CandidateFormData {
  if (!parsed_json) return {};

  const mapped: CandidateFormData = {};

  // Título (sanitizado)
  if (parsed_json.title) {
    mapped.title = sanitizeText(parsed_json.title);
  }

  // Descrição (synopsis, sanitizada)
  if (parsed_json.synopsis || parsed_json.description) {
    mapped.description = sanitizeText(parsed_json.synopsis || parsed_json.description);
  }

  // Sistema (busca inteligente na árvore)
  if (parsed_json.system && systemsTree) {
    const systemId = findSystemId(parsed_json.system, systemsTree);
    if (systemId) {
      mapped.system_id = systemId;
    }
  }

  // Tipo de mesa
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
  if (parsed_json.slots || parsed_json.maxPlayers || parsed_json.slots_total) {
    const slots = parsed_json.slots || parsed_json.maxPlayers || parsed_json.slots_total;
    mapped.slots_total = String(slots);
  }

  // Idioma
  if (parsed_json.language) {
    mapped.language = parsed_json.language;
  }

  // Data de início
  if (parsed_json.starts_at || parsed_json.startDate) {
    const dateStr = parsed_json.starts_at || parsed_json.startDate;
    // Tentar converter para formato ISO se necessário
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        mapped.starts_at = date.toISOString().split('T')[0]; // YYYY-MM-DD
      }
    } catch {
      // Se falhar, deixar como está
      mapped.starts_at = dateStr;
    }
  }

  // Frequência
  if (parsed_json.frequency) {
    const freqMap: Record<string, string> = {
      'semanal': 'semanal',
      'quinzenal': 'quinzenal',
      'mensal': 'mensal',
      'weekly': 'semanal',
      'biweekly': 'quinzenal',
      'monthly': 'mensal',
    };
    const normalized = parsed_json.frequency.toLowerCase();
    if (freqMap[normalized]) {
      mapped.frequency = freqMap[normalized];
    } else {
      mapped.frequency = 'outros';
      mapped.frequency_custom = parsed_json.frequency;
    }
  }

  // Regras/Observações
  if (parsed_json.rules_notes || parsed_json.rules || parsed_json.notes) {
    mapped.rules_notes = sanitizeText(
      parsed_json.rules_notes || parsed_json.rules || parsed_json.notes
    );
  }

  // Banner URL
  if (parsed_json.imageUrl || parsed_json.banner || parsed_json.thumbnail) {
    mapped.banner_url = parsed_json.imageUrl || parsed_json.banner || parsed_json.thumbnail;
  }

  // Publisher role e nome do mestre (SEMPRE announcer para candidatos importados)
  mapped.publisher_role = 'announcer';
  if (parsed_json.masterText || parsed_json.recruiterName || parsed_json.gmName) {
    mapped.actual_gm_name = sanitizeText(
      parsed_json.masterText || parsed_json.recruiterName || parsed_json.gmName
    );
  } else {
    mapped.actual_gm_name = 'Não informado';
  }

  // Contatos (Discord)
  if (parsed_json.authorUsername || parsed_json.authorHandle) {
    const discordValue = parsed_json.authorUsername || parsed_json.authorHandle;
    mapped.contacts = [
      {
        channel: 'discord',
        value: discordValue,
        extra_url: parsed_json.discordServerUrl || undefined,
      },
    ];
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

