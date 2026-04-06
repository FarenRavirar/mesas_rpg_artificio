import {
  getAggregatorCandidateById,
  listAggregatorCandidates,
  updateAggregatorCandidateEditorialStatus,
} from '../db/aggregator';
import { db } from '../db';
import type { AggregatorEditorialStatus, TableContactChannel } from '../db/types';

export interface ListCandidatesInput {
  editorialStatus?: AggregatorEditorialStatus;
  page?: number;
  limit?: number;
}

/**
 * Detecta se a mesa é do Covil do Lich pela análise textual do parsed_json.
 * Mesma lógica aplicada no frontend (isCovil em candidateToFormData.ts).
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

const readString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return null;
};

const readBoolean = (...values: unknown[]): boolean | null => {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return null;
};

/**
 * Normaliza canal de contato para tipo válido do banco
 */
const normalizeContactChannel = (channel: string): TableContactChannel => {
  const normalized = channel.toLowerCase().trim();
  const channelMap: Record<string, TableContactChannel> = {
    'whatsapp': 'whatsapp',
    'discord': 'discord',
    'phone': 'phone',
    'telefone': 'phone',
    'email': 'email',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'form': 'form',
    'formulario': 'form',
    'formulário': 'form',
  };
  return channelMap[normalized] || 'discord'; // fallback para discord
};

const readContacts = (...values: unknown[]): Array<{ channel: TableContactChannel; value: string; extra_url?: string | null }> => {
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    const contacts = value
      .filter((contact): contact is Record<string, unknown> => Boolean(contact) && typeof contact === 'object')
      .map((contact) => ({
        channel: normalizeContactChannel(typeof contact.channel === 'string' ? contact.channel : 'discord'),
        value: typeof contact.value === 'string' ? contact.value.trim() : '',
        extra_url: typeof contact.extra_url === 'string' ? contact.extra_url.trim() : null,
      }))
      .filter((contact) => contact.value.length > 0);

    if (contacts.length > 0) return contacts;
  }

  return [];
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

  async accept(candidateId: string, overrides?: Record<string, unknown> | null) {
    const candidate = await getAggregatorCandidateById(candidateId);
    if (!candidate) return null;

    const parsedJson = candidate.parsed_json as Record<string, unknown> | null;
    if (!parsedJson) {
      throw new Error('Candidato sem parsed_json válido');
    }

    
    // CORREÇÃO A02 + A14: Aplicar overrides em enrichedFields (deep merge)
    console.log('[candidateService.accept] Overrides recebidos:', overrides ? 'sim' : 'não');
    if (overrides) {
      console.log('[candidateService.accept] Campos com override:', Object.keys(overrides));
      
      // Merge deep: overrides vão para enrichedFields
      if (!parsedJson.enrichedFields) {
        parsedJson.enrichedFields = {};
      }
      
      // Aplicar overrides em enrichedFields (casting para evitar erro de tipo)
      Object.assign(parsedJson.enrichedFields as Record<string, unknown>, overrides);
    }

    // Extrair campos do parsed_json (agora com overrides aplicados)
    const enrichedFields = (parsedJson.enrichedFields ?? {}) as Record<string, unknown>;
    const title = readString(enrichedFields.title, parsedJson.title) || 'Anúncio importado';
    const synopsisNarrative = readString(
      enrichedFields.synopsis_narrative,
      parsedJson.synopsis_narrative,
      parsedJson.synopsisNarrative,
    );
    const description = readString(
      synopsisNarrative,
      enrichedFields.description,
      parsedJson.description,
      parsedJson.synopsis,
    );
    const synopsis = readString(parsedJson.synopsis, synopsisNarrative, description);
    const gmBio = readString(enrichedFields.gm_bio, parsedJson.gm_bio, parsedJson.gmBio);
    const benefitsText = readString(enrichedFields.benefits_text, parsedJson.benefits_text, parsedJson.benefitsText);
    const rulesNotes = readString(enrichedFields.rules_notes, parsedJson.rules_notes, parsedJson.rulesNotes);
    const masterText = readString(parsedJson.masterText, gmBio);
    const recruiterName = readString(enrichedFields.recruiter_name, parsedJson.recruiterName);
    const signupText = readString(
      enrichedFields.signup_text,
      parsedJson.signup_text,
      parsedJson.signupTextFromBlocks,
      parsedJson.signupText,
    );
    const parsedContacts = readContacts(enrichedFields.contacts, parsedJson.contacts);
    
    // banner_url: prioridade enrichedFields.banner_url > parsedJson.imageUrl/banner/thumbnail
    const bannerUrl = (
      typeof enrichedFields.banner_url === 'string' ? enrichedFields.banner_url :
      typeof parsedJson.imageUrl === 'string' ? parsedJson.imageUrl :
      typeof parsedJson.banner === 'string' ? parsedJson.banner :
      typeof parsedJson.thumbnail === 'string' ? parsedJson.thumbnail :
      null
    ) || null;

    // REQ-28: Cenário e estilos (com prioridade para overrides)
    const settingName = readString(enrichedFields.setting_name, parsedJson.setting_name, parsedJson.settingName);

    const settingStylesSource = Array.isArray(enrichedFields.setting_styles)
      ? enrichedFields.setting_styles
      : Array.isArray(parsedJson.setting_styles)
      ? parsedJson.setting_styles
      : Array.isArray(parsedJson.settingStyles)
      ? parsedJson.settingStyles
      : null;

    const settingStyles = Array.isArray(settingStylesSource)
      ? settingStylesSource.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      : null;

    // CORREÇÃO A02: Extrair campos técnicos do enrichedFields (REQ-28)
    const requiresCamera = readBoolean(enrichedFields.requires_camera, parsedJson.requires_camera, parsedJson.requiresCamera) ?? false;

    const requiresMicrophone = readBoolean(enrichedFields.requires_microphone, parsedJson.requires_microphone, parsedJson.requiresMicrophone) ?? false;

    const requiresPc = readBoolean(enrichedFields.requires_pc, parsedJson.requires_pc, parsedJson.requiresPc) ?? false;

    // CORREÇÃO A03: Extrair billing_text (priceText do parser)
    const billingText = readString(enrichedFields.priceText, parsedJson.priceText, parsedJson.billing_text, parsedJson.billingText);

    // CORREÇÃO DT-07: Extrair campaign_length e level_range (REQ-28)
    const campaignLength = readString(enrichedFields.campaign_length, parsedJson.campaign_length, parsedJson.campaignLength);

    const levelRange = readString(enrichedFields.level_range, parsedJson.level_range, parsedJson.levelRange);
    
    
    // CORREÇÃO A02: Extrair master_display_name
    const masterDisplayName = readString(
      enrichedFields.master_display_name,
      parsedJson.masterDisplayName,
      recruiterName,
    );

    // CORREÇÃO A14: Extrair avatarUrl do parser Python
    const avatarUrl = readString(enrichedFields.avatar_url, parsedJson.avatar_url, parsedJson.avatarUrl);

    const actualGmName = readString(enrichedFields.actual_gm_name, parsedJson.actual_gm_name, parsedJson.actualGmName);
    
    // Validar e normalizar tipo de mesa
    const rawTableType = readString(parsedJson.type, enrichedFields.type) || 'campanha';
    const tableType = (['campanha', 'one-shot', 'oneshot-serie', 'aberta'].includes(rawTableType) 
      ? rawTableType 
      : 'campanha') as 'campanha' | 'one-shot' | 'oneshot-serie' | 'aberta';
    
    // Validar e normalizar modalidade
    const rawModality = readString(parsedJson.modality, enrichedFields.modality) || 'online';
    const modality = (['online', 'presencial', 'hibrida'].includes(rawModality)
      ? rawModality
      : 'online') as 'online' | 'presencial' | 'hibrida';
    
    const isPaid = readBoolean(enrichedFields.is_paid, parsedJson.is_paid, parsedJson.isPaid);
    
    // Validar e normalizar tipo de preço
    const rawPriceType = readString(enrichedFields.price_type, parsedJson.price_type) || (isPaid === true ? 'paga' : 'gratuita');
    const priceType = (['gratuita', 'paga'].includes(rawPriceType)
      ? rawPriceType
      : 'gratuita') as 'gratuita' | 'paga';

    // Validar contatos obrigatórios
    if (!signupText && parsedContacts.length === 0) {
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
    const gmNickname = masterDisplayName || actualGmName || recruiterName || 'Mestre Externo';
    const gmSlug = `importado-${Date.now().toString(36)}`;

    const [gmProfile] = await db
      .insertInto('gm_profiles')
      .values({
        user_id: externalUser.id,
        slug: gmSlug,
        nickname: gmNickname,
        bio_long: gmBio || `Perfil temporário para mesa importada. Mestre: ${gmNickname}`,
        // CORREÇÃO A14: Persistir avatar extraído do Discord
        avatar_url: avatarUrl,
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
    const result = await db.transaction().execute(async (trx: any) => {
      const [newTable] = await trx
        .insertInto('tables')
        .values({
          slug: tableSlug,
          gm_id: gmProfile.id,
          origin: 'imported',
          source_id: candidate.source_id ?? null,
          title,
          description,
          synopsis,
          synopsis_narrative: synopsisNarrative,
          benefits_text: benefitsText,
          gm_bio: gmBio,
          rules_notes: rulesNotes,
          status: 'active',
          type: tableType,
          modality,
          price_type: priceType,
          banner_url: bannerUrl,
          is_covil: detectIsCovil(parsedJson),
          imported_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          setting_name: settingName,
          setting_styles: settingStyles,
          // CORREÇÃO A01: Persistir campos técnicos extraídos (REQ-28)
          requires_camera: requiresCamera,
          requires_microphone: requiresMicrophone,
          requires_pc: requiresPc,
          // CORREÇÃO DT-07: Persistir campaign_length e level_range (REQ-28)
          campaign_length: campaignLength,
          level_range: levelRange,
          billing_text: billingText,
          master_display_name: masterDisplayName,
        })
        .returning(['id', 'slug', 'title', 'origin', 'source_id', 'is_covil', 'imported_expires_at', 'created_at'])
        .execute();

      // Criar contatos importados (prioridade: contacts estruturados > signupText livre)
      const contactValues = parsedContacts.length > 0
        ? parsedContacts.map((contact, index) => ({
            table_id: newTable.id,
            channel: contact.channel,
            value: contact.value,
            label: 'Contato para inscrição',
            sort_order: index,
          }))
        : signupText
        ? [{
            table_id: newTable.id,
            channel: 'discord' as TableContactChannel,
            value: signupText,
            label: 'Contato para inscrição',
            sort_order: 0,
          }]
        : [];

      if (contactValues.length > 0) {
        await trx
          .insertInto('table_contacts')
          .values(contactValues)
          .execute();
      }

      // REQ-27: Criar schedules a partir de enrichedFields.sessions[]
      const sessions = Array.isArray(enrichedFields.sessions) ? enrichedFields.sessions : parsedJson.sessions;
      if (Array.isArray(sessions) && sessions.length > 0) {
        const scheduleValues = sessions
          .filter((session: any) => {
            // Validar campos obrigatórios
            return (
              session &&
              typeof session === 'object' &&
              typeof session.day_of_week === 'string' &&
              typeof session.start_time === 'string' &&
              typeof session.frequency === 'string'
            );
          })
          .map((session: any, index: number) => ({
            table_id: newTable.id,
            day_of_week: session.day_of_week,
            start_time: session.start_time,
            end_time: session.end_time ?? null,
            frequency: session.frequency,
            slots_per_session: typeof session.slots_per_session === 'number' ? session.slots_per_session : null,
            is_ongoing: session.is_ongoing === true,
            notes: typeof session.notes === 'string' ? session.notes : null,
            sort_order: index, // Preservar ordem do array
          }));

        if (scheduleValues.length > 0) {
          await trx
            .insertInto('table_schedules')
            .values(scheduleValues)
            .execute();
        }
      }

      return newTable;
    });

    // CORREÇÃO A07: Atualizar candidato e retornar com slug da mesa criada
    const updatedCandidate = await updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'accepted',
      rejectionReason: null,
      publishAt: new Date(),
      publishedTableId: result.id,
    });

    // CORREÇÃO A07: Adicionar slug da mesa ao retorno para redirect no frontend
    return {
      ...updatedCandidate,
      created_table_slug: result.slug,
    };
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

  async deleteById(candidateId: string) {
    const candidate = await getAggregatorCandidateById(candidateId);
    if (!candidate) return null;

    // Deletar candidato permanentemente do banco
    await db
      .deleteFrom('aggregator_import_candidates')
      .where('id', '=', candidateId)
      .execute();

    return true;
  },

  async deleteBulk(candidateIds: string[]) {
    // CORREÇÃO: Validar que array não está vazio (proteção adicional além da rota)
    if (candidateIds.length === 0) {
      return { deleted: 0, invalid: 0 };
    }

    // CORREÇÃO: Filtrar IDs inválidos (não-UUID) antes de executar query
    // Regex UUID v4: 8-4-4-4-12 caracteres hexadecimais
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validIds = candidateIds.filter(id => uuidRegex.test(id));
    const invalidCount = candidateIds.length - validIds.length;

    // Se nenhum ID válido, retornar 0 sem executar query
    if (validIds.length === 0) {
      return { deleted: 0, invalid: invalidCount };
    }

    // Deletar múltiplos candidatos permanentemente do banco
    const result = await db
      .deleteFrom('aggregator_import_candidates')
      .where('id', 'in', validIds)
      .executeTakeFirst();

    // CORREÇÃO: Retornar objeto com contadores separados
    return {
      deleted: Number(result?.numDeletedRows || 0n),
      invalid: invalidCount
    };
  },
};
