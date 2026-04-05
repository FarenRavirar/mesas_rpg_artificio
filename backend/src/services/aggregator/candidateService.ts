import {
  getAggregatorCandidateById,
  listAggregatorCandidates,
  updateAggregatorCandidateEditorialStatus,
} from '../../db/aggregator';
import { db } from '../../db';
import type { AggregatorEditorialStatus } from '../../db/types';

export interface ListCandidatesInput {
  editorialStatus?: AggregatorEditorialStatus;
  page?: number;
  limit?: number;
}

/**
 * Detecta se a mesa u00e9 do Covil do Lich pela anu00e1lise textual do parsed_json.
 * Mesma lu00f3gica aplicada no frontend (isCovil em candidateToFormData.ts).
 */
const detectIsCovil = (parsedJson: Record<string, unknown>): boolean => {
  const enriched = parsedJson.enrichedFields as Record<string, unknown> | null | undefined;
  const textFields = [
    parsedJson.title,
    parsedJson.synopsis,
    parsedJson.masterText,
    parsedJson.signupText,
    parsedJson.source,
    enriched?.title,
    enriched?.synopsis,
  ]
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
    .toLowerCase();

  return (
    textFields.includes('covil do lich') ||
    textFields.includes('covillich') ||
    textFields.includes('covil')
  );
};

const sanitizePage = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value as number));
};

const sanitizeLimit = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(1, Math.floor(value as number)));
};

export const candidateService = {
  async list(input: ListCandidatesInput) {
    return listAggregatorCandidates({
      editorialStatus: input.editorialStatus,
      page: sanitizePage(input.page),
      limit: sanitizeLimit(input.limit),
    });
  },

  async getById(candidateId: string) {
    return getAggregatorCandidateById(candidateId);
  },

  async accept(candidateId: string) {
    const candidate = await getAggregatorCandidateById(candidateId);
    if (!candidate) return null;

    const parsedJson = candidate.parsed_json as Record<string, unknown> | null;
    if (!parsedJson) {
      throw new Error('Candidato sem parsed_json válido');
    }

    // Extrair campos do parsed_json
    const enrichedFields = (parsedJson.enrichedFields ?? {}) as Record<string, unknown>;
    const rawTitle = typeof parsedJson.title === 'string' ? parsedJson.title.trim() : '';
    const title = rawTitle || 'Anúncio importado';
    const description = typeof parsedJson.synopsis === 'string' ? parsedJson.synopsis.trim() : null;
    const masterText = typeof parsedJson.masterText === 'string' ? parsedJson.masterText.trim() : null;
    const recruiterName = typeof parsedJson.recruiterName === 'string' ? parsedJson.recruiterName.trim() : null;
    const signupText = typeof parsedJson.signupText === 'string' ? parsedJson.signupText.trim() : null;
    // banner_url: prioridade enrichedFields.banner_url > parsedJson.imageUrl/banner/thumbnail
    const bannerUrl = (
      typeof enrichedFields.banner_url === 'string' ? enrichedFields.banner_url :
      typeof parsedJson.imageUrl === 'string' ? parsedJson.imageUrl :
      typeof parsedJson.banner === 'string' ? parsedJson.banner :
      typeof parsedJson.thumbnail === 'string' ? parsedJson.thumbnail :
      null
    ) || null;

    // Validar contatos obrigatórios
    if (!signupText) {
      throw new Error('Candidato sem informação de contato. Edite o candidato e adicione ao menos um canal de contato antes de aprovar.');
    }

    // Buscar user genérico mestre_externo
    const externalUser = await db
      .selectFrom('users')
      .select('id')
      .where('google_id', '=', 'external_gm_system')
      .executeTakeFirst();

    if (!externalUser) {
      throw new Error('User genérico mestre_externo não encontrado. Execute migration_08_external_gm.sql');
    }

    // Criar GM Profile temporário
    const gmNickname = masterText || recruiterName || 'Mestre Externo';
    const gmSlug = `importado-${Date.now().toString(36)}`;

    const [gmProfile] = await db
      .insertInto('gm_profiles')
      .values({
        user_id: externalUser.id,
        slug: gmSlug,
        nickname: gmNickname,
        bio_long: `Perfil temporário para mesa importada. Mestre: ${gmNickname}`,
      })
      .returning(['id', 'slug'])
      .execute();

    // Gerar slug da mesa
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 80);
    const tableSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Criar mesa com transação
    const result = await db.transaction().execute(async (trx) => {
      const [newTable] = await trx
        .insertInto('tables')
        .values({
          slug: tableSlug,
          gm_id: gmProfile.id,
          origin: 'imported',
          source_id: candidate.source_id ?? null,
          title,
          description,
          status: 'active',
          type: 'campanha',
          modality: 'online',
          price_type: parsedJson.isPaid === true ? 'paga' : 'gratuita',
          banner_url: bannerUrl,
          is_covil: detectIsCovil(parsedJson),
          imported_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning(['id', 'slug', 'title', 'origin', 'source_id', 'is_covil', 'imported_expires_at', 'created_at'])
        .execute();

      // Criar contato básico com signupText
      await trx
        .insertInto('table_contacts')
        .values({
          table_id: newTable.id,
          channel: 'discord',
          value: signupText,
          label: 'Contato para inscrição',
          sort_order: 0,
        })
        .execute();

      return newTable;
    });

    return updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'accepted',
      rejectionReason: null,
      publishAt: new Date(),
      publishedTableId: result.id,
    });
  },

  async reject(candidateId: string, rejectionReason: string) {
    return updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'rejected',
      rejectionReason,
      publishAt: null,
      publishedTableId: null,
    });
  },

  async review(candidateId: string, reason?: string | null) {
    return updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'awaiting_review',
      rejectionReason: reason ?? null,
      publishAt: null,
      publishedTableId: null,
    });
  },

  async update(candidateId: string, updatedParsedJson: Record<string, unknown>) {
    const candidate = await getAggregatorCandidateById(candidateId);
    if (!candidate) return null;

    // Atualizar parsed_json do candidato
    await db
      .updateTable('aggregator_import_candidates')
      .set({
        parsed_json: updatedParsedJson,
        updated_at: new Date(),
      })
      .where('id', '=', candidateId)
      .execute();

    return getAggregatorCandidateById(candidateId);
  },
};
