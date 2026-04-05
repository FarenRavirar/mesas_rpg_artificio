/**
 * Mapeia dados extraídos de um candidato (parsed_json) para o formato do formulário de mesa
 */

import { parseDiscordContent } from './parseDiscordContent';

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
  gm_avatar_url?: string;   // URL do avatar Discord (apenas visual, não persiste no banco)
  is_covil?: boolean;       // Detectado pelo parser, editável pelo admin
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

  // Remove prefixos comuns do Discord (com e sem acento)
  const prefixes = [
    /^#\s*Título:\s*/i,
    /^#\s*Titulo:\s*/i,  // sem acento
    /^\*\*Título:\*\*\s*/i,
    /^\*\*Titulo:\*\*\s*/i,  // sem acento
    /^Título:\s*/i,
    /^Titulo:\s*/i,  // sem acento
    /^#\s*Sistema:\s*/i,
    /^\*\*Sistema:\*\*\s*/i,
    /^Sistema:\s*/i,
    /^#\s*Descrição:\s*/i,
    /^#\s*Descricao:\s*/i,  // sem acento
    /^\*\*Descrição:\*\*\s*/i,
    /^\*\*Descricao:\*\*\s*/i,  // sem acento
    /^Descrição:\s*/i,
    /^Descricao:\s*/i,  // sem acento
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

  // PRIORIDADE 1: enrichedFields do parser Python (backend)
  // Se o backend já fez o parsing com Python, usar esses dados
  let parsedContent: any = {};
  if (parsed_json.enrichedFields && Object.keys(parsed_json.enrichedFields).length > 0) {
    console.log('[candidateToFormData] Usando enrichedFields do parser Python');
    parsedContent = parsed_json.enrichedFields;
  } 
  // PRIORIDADE 2: Fallback para parser TS (frontend) se enrichedFields não existir
  else if (parsed_json.content && typeof parsed_json.content === 'string') {
    console.log('[candidateToFormData] Fallback: usando parser TS do frontend');
    parsedContent = parseDiscordContent(parsed_json.content);
  }

  // Merge: parsedContent tem prioridade sobre campos já existentes no parsed_json
  const enrichedJson = { ...parsed_json, ...parsedContent };

  // Título (sanitizado)
  if (enrichedJson.title) {
    mapped.title = sanitizeText(enrichedJson.title);
  }

  // Descrição (synopsis, sanitizada)
  if (enrichedJson.synopsis || enrichedJson.description) {
    mapped.description = sanitizeText(enrichedJson.synopsis || enrichedJson.description);
  }

  // Sistema (busca inteligente na árvore)
  if (enrichedJson.system && systemsTree) {
    const sanitizedSystem = sanitizeText(enrichedJson.system);
    console.log('[candidateToFormData] Sistema detectado:', sanitizedSystem, '| systemsTree length:', systemsTree?.length);
    const systemId = findSystemId(sanitizedSystem, systemsTree);
    console.log('[candidateToFormData] system_id encontrado:', systemId);
    if (systemId) {
      mapped.system_id = systemId;
    }
  } else {
    console.log('[candidateToFormData] Sistema não detectado ou systemsTree vazio:', {
      system: enrichedJson.system,
      hasSystemsTree: !!systemsTree,
      systemsTreeLength: systemsTree?.length
    });
  }

  // Tipo de mesa
  if (enrichedJson.type) {
    const typeMap: Record<string, string> = {
      'campanha': 'campanha',
      'oneshot': 'oneshot',
      'one-shot': 'oneshot',
      'aventura': 'oneshot',
    };
    const normalized = enrichedJson.type.toLowerCase();
    mapped.type = typeMap[normalized] || 'campanha';
  }

  // Modalidade
  if (enrichedJson.modality) {
    const modalityMap: Record<string, string> = {
      'online': 'online',
      'presencial': 'presencial',
      'híbrida': 'hibrida',
      'hibrida': 'hibrida',
    };
    const normalized = enrichedJson.modality.toLowerCase();
    mapped.modality = modalityMap[normalized] || 'online';
  }

  // Preço
  if (enrichedJson.isPaid !== undefined) {
    mapped.price_type = enrichedJson.isPaid ? 'paga' : 'gratuita';
  } else if (enrichedJson.price_type) {
    mapped.price_type = enrichedJson.price_type;
  } else if (enrichedJson.priceText) {
    const priceText = enrichedJson.priceText.toLowerCase();
    if (priceText.includes('grátis') || priceText.includes('gratuita') || priceText.includes('free')) {
      mapped.price_type = 'gratuita';
    } else if (priceText.includes('paga') || priceText.includes('paid') || priceText.match(/r\$|reais/)) {
      mapped.price_type = 'paga';
    }
  }

  // Vagas
  if (enrichedJson.slots || enrichedJson.maxPlayers || enrichedJson.slots_total) {
    const slots = enrichedJson.slots || enrichedJson.maxPlayers || enrichedJson.slots_total;
    mapped.slots_total = String(slots);
  }

  // Idioma
  if (enrichedJson.language) {
    mapped.language = enrichedJson.language;
  }

  // Data de início
  if (enrichedJson.starts_at || enrichedJson.startDate) {
    const dateStr = enrichedJson.starts_at || enrichedJson.startDate;
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
  if (enrichedJson.frequency) {
    const freqMap: Record<string, string> = {
      'semanal': 'semanal',
      'quinzenal': 'quinzenal',
      'mensal': 'mensal',
      'weekly': 'semanal',
      'biweekly': 'quinzenal',
      'monthly': 'mensal',
    };
    const normalized = enrichedJson.frequency.toLowerCase();
    if (freqMap[normalized]) {
      mapped.frequency = freqMap[normalized];
    } else {
      mapped.frequency = 'outros';
      mapped.frequency_custom = enrichedJson.frequency;
    }
  }

  // Regras/Observações
  if (enrichedJson.rules_notes || enrichedJson.rules || enrichedJson.notes) {
    mapped.rules_notes = sanitizeText(
      enrichedJson.rules_notes || enrichedJson.rules || enrichedJson.notes
    );
  }

  // Banner URL (prioridade: enrichedFields.banner_url > imageUrl > banner > thumbnail > image)
  // O parser Python persiste URLs de imagens em enrichedFields.banner_url
  if (parsedContent.banner_url) {
    mapped.banner_url = parsedContent.banner_url;
  } else if (enrichedJson.imageUrl || enrichedJson.banner || enrichedJson.thumbnail || enrichedJson.image) {
    mapped.banner_url =
      enrichedJson.imageUrl ||
      enrichedJson.banner ||
      enrichedJson.thumbnail ||
      enrichedJson.image;
  }

  // Avatar do mestre (apenas visual, não persiste no banco)
  if (parsedContent.avatar_url) {
    mapped.gm_avatar_url = parsedContent.avatar_url;
  }

  // Publisher role e nome do mestre (SEMPRE announcer para candidatos importados)
  mapped.publisher_role = 'announcer';
  if (enrichedJson.masterText || enrichedJson.recruiterName || enrichedJson.gmName || enrichedJson.actual_gm_name) {
    mapped.actual_gm_name = sanitizeText(
      enrichedJson.masterText || enrichedJson.recruiterName || enrichedJson.gmName || enrichedJson.actual_gm_name
    );
  } else {
    mapped.actual_gm_name = 'Não informado';
  }

  // Contatos (mapear TODOS os canais disponíveis no JSON)
  const contacts: Array<{ channel: string; value: string; extra_url?: string }> = [];

  // Discord (prioridade 1: sempre adicionar se houver autor)
  const discordValue = 
    enrichedJson.authorUsername || 
    enrichedJson.authorHandle || 
    enrichedJson.author?.username ||
    enrichedJson.author?.handle ||
    enrichedJson.author?.name ||
    enrichedJson.author?.nickname ||
    enrichedJson.discordUsername ||
    enrichedJson.discord_username ||
    parsed_json.author?.name ||
    parsed_json.author?.nickname;

  if (discordValue) {
    contacts.push({
      channel: 'discord',
      value: discordValue,
      extra_url: enrichedJson.discordServerUrl || enrichedJson.discord_server_url || undefined,
    });
  }

  // WhatsApp
  if (enrichedJson.whatsapp || enrichedJson.whatsappNumber || enrichedJson.phone) {
    contacts.push({
      channel: 'whatsapp',
      value: enrichedJson.whatsapp || enrichedJson.whatsappNumber || enrichedJson.phone,
    });
  }

  // Email
  if (enrichedJson.email || enrichedJson.contactEmail) {
    contacts.push({
      channel: 'email',
      value: enrichedJson.email || enrichedJson.contactEmail,
    });
  }

  // Telegram
  if (enrichedJson.telegram || enrichedJson.telegramUsername) {
    contacts.push({
      channel: 'telegram',
      value: enrichedJson.telegram || enrichedJson.telegramUsername,
    });
  }

  // Google Forms (detecção automática de forms.gle ou forms.google.com nos externalLinks)
  if (enrichedJson.externalLinks && Array.isArray(enrichedJson.externalLinks)) {
    const formsLink = enrichedJson.externalLinks.find((link: string) => 
      link.includes('forms.gle') || link.includes('forms.google.com')
    );
    if (formsLink) {
      contacts.push({
        channel: 'formulario',
        value: formsLink,
      });
    }
  }

  // Outros (genérico)
  if (enrichedJson.otherContact || enrichedJson.contact) {
    contacts.push({
      channel: 'outros',
      value: enrichedJson.otherContact || enrichedJson.contact,
    });
  }

  // Se encontrou algum contato, mapear
  if (contacts.length > 0) {
    mapped.contacts = contacts;
  }

  // Extrair imagem dos attachments do Discord se não houver banner_url
  if (!mapped.banner_url && parsed_json.attachments && Array.isArray(parsed_json.attachments)) {
    const imageAttachment = parsed_json.attachments.find((att: any) => 
      att.url && (
        att.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
        att.url?.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)
      )
    );
    if (imageAttachment?.url) {
      mapped.banner_url = imageAttachment.url;
    }
  }

  // Detecção automática de Covil do Lich
  mapped.is_covil = isCovil(parsedContent) || isCovil(parsed_json);

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

