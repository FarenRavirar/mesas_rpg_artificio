import type { ParsedMessageDraft } from './types';

export interface DailyExportItem {
  candidateId: string;
  externalId: string;
  sourceName: string | null;
  messageCreatedAt: Date | null;
  parsedJson: ParsedMessageDraft;
}

const asDateLabel = (value: Date | null): string => {
  if (!value) return 'horário não informado';

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
};

const renderOne = (item: DailyExportItem, index: number): string => {
  const draft = item.parsedJson;

  const lines: string[] = [];
  lines.push(`### ${index + 1}. ${draft.title ?? 'Título não identificado'}`);
  lines.push(`- Origem: ${item.sourceName ?? 'source não identificada'}`);
  lines.push(`- Mensagem: ${item.externalId}`);
  lines.push(`- Horário: ${asDateLabel(item.messageCreatedAt)}`);
  lines.push(`- Sistema: ${draft.system ?? 'não identificado'}`);

  if (draft.style) lines.push(`- Estilo: ${draft.style}`);
  if (draft.scheduleText) lines.push(`- Agenda: ${draft.scheduleText}`);
  if (draft.slotsText) lines.push(`- Vagas: ${draft.slotsText}`);
  if (draft.location || draft.platforms) lines.push(`- Local/Plataformas: ${draft.location ?? draft.platforms}`);
  if (draft.ageRating) lines.push(`- Classificação: ${draft.ageRating}`);

  if (draft.isPaid) {
    lines.push(`- Preço: ${draft.priceText ?? 'mesa paga (detalhe não identificado)'}`);
  } else {
    lines.push('- Preço: gratuita ou não informado');
  }

  if (draft.signupText) lines.push(`- Contato: ${draft.signupText}`);
  if (draft.synopsis) lines.push(`- Resumo: ${draft.synopsis}`);

  const publicMedia = draft.mediaLinks.filter((media) => media.isPublicUrl).map((media) => media.url);
  if (publicMedia.length > 0) {
    lines.push(`- Mídia: ${publicMedia.join(' | ')}`);
  }

  const links = draft.externalLinks.filter((link) => /^https?:\/\//i.test(link));
  if (links.length > 0) {
    lines.push(`- Links: ${links.join(' | ')}`);
  }

  return lines.join('\n');
};

export const formatForPublication = (items: DailyExportItem[], date: string): string => {
  const header: string[] = [];
  header.push(`# Exportação diária do Aggregator (${date})`);
  header.push('');
  header.push(`Total de anúncios aceitos: ${items.length}`);
  header.push('');

  if (items.length === 0) {
    header.push('Nenhum anúncio aceito para esta data.');
    return header.join('\n');
  }

  const body = items.map((item, index) => renderOne(item, index)).join('\n\n');

  return `${header.join('\n')}\n${body}\n`;
};
