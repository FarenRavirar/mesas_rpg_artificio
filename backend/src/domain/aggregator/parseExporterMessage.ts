import { classifyPayment } from './classifyPayment';
import { classifySystem } from './classifySystem';
import { extractMediaLinks } from './extractMediaLinks';
import { resolveMasterRecruiter } from './resolveMasterRecruiter';
import type { KnownSystemAlias, NormalizedExporterMessage, ParsedMessageDraft } from './types';

const URL_REGEX = /https?:\/\/[^\s)]+/gi;

const cleanValue = (value: string): string => {
  return value.replace(/[*_`~]/g, '').replace(/\s+/g, ' ').trim();
};

const sanitizeExtracted = (value: string | null): string | null => {
  if (!value) return null;
  const normalized = cleanValue(value);
  return normalized.length > 0 ? normalized : null;
};

const extractHeadingTitle = (content: string): string | null => {
  const heading = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^#{1,3}\s+/.test(line));

  if (heading) {
    return sanitizeExtracted(heading.replace(/^#{1,3}\s+/, ''));
  }

  const firstLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return sanitizeExtracted(firstLine ?? null);
};

const stripPrefix = (line: string): string => {
  return line
    .replace(/^[\-•▬*]+\s*/, '')
    .replace(/^\*+\s*/, '')
    .replace(/\*+$/g, '')
    .trim();
};

const lineValueByMatchers = (content: string, matchers: RegExp[]): string | null => {
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = stripPrefix(rawLine);

    for (const matcher of matchers) {
      const match = line.match(matcher);
      if (!match) continue;

      const candidate = sanitizeExtracted(match[1] ?? null);
      if (candidate) return candidate;
    }
  }

  return null;
};

const extractSchedule = (content: string): string | null => {
  const matchers = [
    /(?:data\s*[&e]?\s*hor[aá]rios?|data\s*e\s*hora)\s*[:\-]\s*(.+)$/i,
    /(?:hor[aá]rios?)\s*[:\-]\s*(.+)$/i,
  ];

  const direct = lineValueByMatchers(content, matchers);
  if (direct) return direct;

  const lines = content.split(/\r?\n/).map((line) => line.trim());
  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index];
    if (!/data\s*[&e]?\s*hor[aá]rios?|data\s*e\s*hora|hor[aá]rios?/i.test(current)) continue;

    const next = lines[index + 1] ?? '';
    const cleaned = sanitizeExtracted(stripPrefix(next));
    if (cleaned) return cleaned;
  }

  return null;
};

const extractSynopsis = (content: string): string | null => {
  const lines = content.split(/\r?\n/);
  const synopsisStart = lines.findIndex((line) => /sinopse|sobre\s+a\s+hist[oó]ria|sobre\s+esta\s+mesa/i.test(line));

  if (synopsisStart >= 0) {
    const snippet = lines
      .slice(synopsisStart + 1)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 6)
      .join(' ');

    return sanitizeExtracted(snippet);
  }

  const fallback = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 40)
    .slice(0, 2)
    .join(' ');

  return sanitizeExtracted(fallback);
};

const extractRawMentions = (message: NormalizedExporterMessage): string[] => {
  const mentionFromContent = Array.from(message.content.matchAll(/@([\w.-]{2,})/g)).map((match) => match[1].trim());
  const mentionFromPayload = message.mentions
    .map((mention) => mention.nickname ?? mention.name ?? null)
    .filter((value): value is string => Boolean(value))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const deduped = new Set<string>([...mentionFromContent, ...mentionFromPayload]);
  return Array.from(deduped.values());
};

const extractExternalLinks = (message: NormalizedExporterMessage): string[] => {
  const links = new Set<string>();

  for (const match of message.content.match(URL_REGEX) ?? []) {
    links.add(match.trim());
  }

  for (const embed of message.embeds) {
    if (embed.url) links.add(embed.url.trim());

    if (embed.thumbnail?.canonicalUrl) {
      links.add(embed.thumbnail.canonicalUrl.trim());
    }

    if (embed.thumbnail?.url) {
      links.add(embed.thumbnail.url.trim());
    }

    for (const image of embed.images) {
      if (image.url) links.add(image.url.trim());
    }
  }

  return Array.from(links.values()).filter((item) => /^https?:\/\//i.test(item));
};

const extractSignupText = (content: string): string | null => {
  const lines = content.split(/\r?\n/).map((line) => line.trim());

  const candidate = lines.find((line) => {
    return /mand(ar|e)\s+(mensagem|dm)|interessad[oa]|inscri[cç][aã]o|formul[aá]rio|contato/i.test(line);
  });

  return sanitizeExtracted(candidate ?? null);
};

export interface ParseExporterMessageInput {
  message: NormalizedExporterMessage;
  sourceChannelId: string | null;
  knownSystemAliases: KnownSystemAlias[];
}

export const parseExporterMessage = (input: ParseExporterMessageInput): ParsedMessageDraft => {
  const { message, sourceChannelId, knownSystemAliases } = input;

  // Priorizar dados do parser Python (enrichedFields) quando disponíveis
  const enriched = (message.enrichedFields || {}) as Record<string, any>;

  const title = enriched.title ?? extractHeadingTitle(message.content);
  const systemText = enriched.system ?? lineValueByMatchers(message.content, [
    /sistema\s*[:\-]\s*(.+)$/i,
    /system\s*[:\-]\s*(.+)$/i,
  ]);

  const style = enriched.style ?? lineValueByMatchers(message.content, [
    /estilo(?:\/tem[aá]tica)?\s*[:\-]\s*(.+)$/i,
    /tem[aá]tica\s*[:\-]\s*(.+)$/i,
  ]);

  const scheduleText = enriched.scheduleText ?? extractSchedule(message.content);
  const slotsText = enriched.slotsText ?? lineValueByMatchers(message.content, [
    /vagas?\s+dispon[íi]veis?[:\s]+(\d+)/i,  // "Vagas disponíveis: 2"
    /(?:n[ºo]\s*de\s*)?vagas?\s*[:\-]\s*(.+)$/i,
    /(\d+\s*\/\s*\d+\.?)/i,
    /(\d+)\s*vagas?/i,
  ]);

  const ageRating = enriched.ageRating ?? lineValueByMatchers(message.content, [
    /classifica[cç][aã]o\s*[:\-]\s*(.+)$/i,
    /faixa\s+et[aá]ria\s*[:\-]\s*(.+)$/i,
  ]);

  const location = enriched.location ?? lineValueByMatchers(message.content, [
    /local\s*(?:do\s+jogo)?\s*[:\-]\s*(.+)$/i,
  ]);

  const platforms = enriched.platforms ?? lineValueByMatchers(message.content, [
    /plataformas?\s*[:\-]\s*(.+)$/i,
  ]);

  const masterText = enriched.masterText ?? lineValueByMatchers(message.content, [
    /mestre\s*[:\-]\s*(.+)$/i,
  ]);

  const payment = classifyPayment(message.content);
  const systemClassification = classifySystem(systemText, message.content, knownSystemAliases);

  const rawMentions = extractRawMentions(message);
  const recruiterResolution = resolveMasterRecruiter({
    recruiterName: enriched.recruiterName ?? message.author.nickname ?? message.author.name,
    masterText,
    rawMentions,
  });

  const mediaLinks = extractMediaLinks(message);
  const externalLinks = extractExternalLinks(message);
  const signupText = enriched.signupText ?? extractSignupText(message.content);
  const synopsis = enriched.synopsis ?? extractSynopsis(message.content);
  
  // Novos campos opcionais do parser Python
  const levelRange = enriched.level_range ?? null;
  const sessionDuration = enriched.session_duration ?? null;
  const campaignLength = enriched.campaign_length ?? null;
  const experienceRequired = enriched.experience_required ?? null;
  const tags = Array.isArray(enriched.tags) ? enriched.tags : [];
  const requiresPc = enriched.requires_pc ?? false;
  const externalLinksFromParser = Array.isArray(enriched.external_links) ? enriched.external_links : [];
  
  // Merge external links do parser com os extraídos pelo TS
  const allExternalLinks = Array.from(new Set([
    ...externalLinksFromParser,
    ...externalLinks
  ]));
  
  // Fase B: Múltiplos horários e vagas detalhadas
  const sessions = Array.isArray(enriched.sessions) ? enriched.sessions : [];
  const slotsTotal = enriched.slots_total ?? null;
  const slotsAvailable = enriched.slots_available ?? null;
  const slotsFilled = enriched.slots_filled ?? null;
  
  // Fase B: Sistema de classificação
  const systemRaw = enriched.system_raw ?? null;
  const systemNormalized = enriched.system_normalized ?? null;
  const systemClassificationValue = enriched.system_classification ?? null;
  const isHomebrew = enriched.is_homebrew ?? false;
  const isCustom = enriched.is_custom ?? false;
  const paymentClassification = enriched.payment_classification ?? null;
  const candidateKind = enriched.candidate_kind ?? null;

  
  // Fase B: Separação mestre vs anunciante
  const masterDisplayName = enriched.master_display_name ?? null;
  const publisherRole = enriched.publisher_role ?? null;
  const isSamePerson = enriched.is_same_person ?? true;
  
  // REQ-28: Importação Inteligente - Novos campos
  const bannerUrl = enriched.banner_url ?? null;
  const avatarUrl = enriched.avatar_url ?? null;
  const isPaidFromParser = enriched.is_paid ?? null;
  const priceTextFromParser = enriched.priceText ?? null;
  const requiresCamera = enriched.requires_camera ?? false;
  const requiresMicrophone = enriched.requires_microphone ?? false;
  const isOngoing = enriched.is_ongoing ?? false;
  const settingName = enriched.setting_name ?? null;
  const settingStyles = Array.isArray(enriched.setting_styles) ? enriched.setting_styles : [];
  
  // REQ-28 Fase 2: Campos editoriais separados
  const synopsisNarrative = enriched.synopsis_narrative ?? null;
  const rulesNotes = enriched.rules_notes ?? null;
  const signupTextFromBlocks = enriched.signup_text ?? null;
  const benefitsText = enriched.benefits_text ?? null;
  const gmBio = enriched.gm_bio ?? null;
  const description = enriched.description ?? null;
  
  // Log de priorização (REQ-28)
  console.log(`[parseExporterMessage] Mensagem ${message.id} - Priorizando enrichedFields`);
  console.log(`[parseExporterMessage] setting_name: ${settingName ? 'Parser Python' : 'vazio'}`);
  console.log(`[parseExporterMessage] setting_styles: ${settingStyles.length > 0 ? 'Parser Python' : 'vazio'}`);
  console.log(`[parseExporterMessage] banner_url: ${bannerUrl ? 'Parser Python' : 'vazio'}`);
  console.log(`[parseExporterMessage] is_paid: ${isPaidFromParser !== null ? 'Parser Python' : 'fallback TypeScript'}`);
  console.log(`[parseExporterMessage] requires_camera: ${requiresCamera ? 'Parser Python' : 'false'}`);
  console.log(`[parseExporterMessage] requires_microphone: ${requiresMicrophone ? 'Parser Python' : 'false'}`);
  console.log(`[parseExporterMessage] is_ongoing: ${isOngoing ? 'Parser Python' : 'false'}`);
  
  // Metadados do parser Python
  const parserMissingFields = Array.isArray(enriched.missingFields) ? enriched.missingFields : [];
  const parserReviewFlags = Array.isArray(enriched.reviewFlags) ? enriched.reviewFlags : [];
  const parserConfidenceByField = enriched.confidence_by_field ?? {};



  const requiredSignals = [title, systemText ?? systemClassification.systemName, scheduleText, slotsText, location ?? platforms];
  const availableSignals = requiredSignals.filter((item) => Boolean(item)).length;
  const structuralConfidence = Math.min(1, availableSignals / requiredSignals.length);

  const confidenceScore = Number(
    Math.max(
      0,
      Math.min(
        1,
        structuralConfidence * 0.5
          + payment.confidence * 0.2
          + systemClassification.confidence * 0.25
          + (recruiterResolution.isAmbiguous ? 0.0 : 0.05)
      )
    ).toFixed(2)
  );

  const needsReview =
    systemClassification.needsReview
    || recruiterResolution.isAmbiguous
    || confidenceScore < 0.7
    || !title
    || (!systemText && !systemClassification.systemName);

  return {
    sourceMessageId: message.id,
    sourceChannelId,
    title,
    system: systemClassification.systemName ?? systemText,
    style,
    scheduleText,
    slotsText,
    ageRating,
    location,
    platforms,
    masterText: recruiterResolution.masterText,
    recruiterName: recruiterResolution.recruiterName,
    signupText,
    synopsis,
    isPaid: isPaidFromParser !== null ? isPaidFromParser : payment.isPaid,
    priceText: priceTextFromParser ?? payment.priceText,
    isCustomSystem: systemClassification.isCustomSystem,
    mediaLinks,
    externalLinks: allExternalLinks,
    rawMentions,
    needsReview,
    confidenceScore,
    editorialReason: null,
    
    // Novos campos do parser Python
    levelRange,
    sessionDuration,
    campaignLength,
    experienceRequired,
    tags,
    requiresPc,
    
    // REQ-28: Importação Inteligente - Novos campos
    bannerUrl,
    avatarUrl,
    requiresCamera,
    requiresMicrophone,
    isOngoing,
    settingName,
    settingStyles,
    
    // REQ-28 Fase 2: Campos editoriais separados
    synopsisNarrative,
    rulesNotes,
    signupTextFromBlocks,
    benefitsText,
    gmBio,
    description,
    
    // Fase B: Múltiplos horários e vagas detalhadas
    sessions,
    slotsTotal,
    slotsAvailable,
    slotsFilled,
    
    // Fase B: Sistema de classificação
    systemRaw,
    systemNormalized,
    systemClassification: systemClassificationValue,
    isHomebrew,
    isCustom,
    paymentClassification,
    candidateKind,
    
    // Fase B: Separação mestre vs anunciante
    masterDisplayName,
    publisherRole,
    isSamePerson,
    
    // Metadados do parser
    parserMissingFields,
    parserReviewFlags,
    parserConfidenceByField,
  };
};
