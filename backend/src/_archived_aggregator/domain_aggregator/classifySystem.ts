import type { ClassifiedSystemResult, KnownSystemAlias } from './types';

const CUSTOM_SYSTEM_PATTERNS: RegExp[] = [
  /\bhomebrew\b/i,
  /\bsistema\s+pr[oó]pri[oa]\b/i,
  /\bsistema\s+autoral\b/i,
  /\bsistema\s+caseir[oa]\b/i,
  /\bsistema\s+inventad[oa]\b/i,
  /\bsistema\s+experimental\b/i,
];

const normalize = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const scoreAliasMatch = (input: string, alias: string): number => {
  if (input === alias) return 1;

  if (input.startsWith(`${alias} `) || input.endsWith(` ${alias}`) || input.includes(` ${alias} `)) {
    return Math.min(0.95, 0.65 + Math.min(alias.length, 30) / 100);
  }

  if (input.includes(alias)) {
    return Math.min(0.9, 0.55 + Math.min(alias.length, 30) / 120);
  }

  return 0;
};

export const classifySystem = (
  systemText: string | null,
  fullContent: string,
  knownAliases: KnownSystemAlias[]
): ClassifiedSystemResult => {
  const mergedText = [systemText ?? '', fullContent].join(' ');
  const normalizedInput = normalize(mergedText);

  if (!normalizedInput) {
    return {
      systemId: null,
      systemName: null,
      isCustomSystem: false,
      confidence: 0.2,
      needsReview: true,
    };
  }

  const customHits = CUSTOM_SYSTEM_PATTERNS.filter((pattern) => pattern.test(mergedText)).length;

  let bestMatch: { systemId: string; systemName: string; score: number } | null = null;

  for (const alias of knownAliases) {
    if (!alias.aliasNormalized) continue;

    const score = scoreAliasMatch(normalizedInput, alias.aliasNormalized);
    if (score <= 0) continue;

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        systemId: alias.systemId,
        systemName: alias.systemName,
        score,
      };
    }
  }

  if (bestMatch) {
    return {
      systemId: bestMatch.systemId,
      systemName: bestMatch.systemName,
      isCustomSystem: customHits > 0,
      confidence: bestMatch.score,
      needsReview: bestMatch.score < 0.72,
    };
  }

  return {
    systemId: null,
    systemName: null,
    isCustomSystem: customHits > 0,
    confidence: customHits > 0 ? 0.7 : 0.35,
    needsReview: true,
  };
};

export const normalizeSystemAlias = (value: string): string => normalize(value);
