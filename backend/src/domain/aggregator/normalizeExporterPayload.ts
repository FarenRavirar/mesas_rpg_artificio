import type { NormalizedExporterMessage, NormalizedExporterPayload } from './types';
import { parseMessage as parsePythonMessage } from '../../services/aggregator/pythonParserService';

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const asBoolean = (value: unknown): boolean => value === true;

const toMessages = (value: unknown): unknown[] => {
  return Array.isArray(value) ? value : [];
};

const normalizeMessage = async (item: unknown): Promise<NormalizedExporterMessage | null> => {
  const record = asRecord(item);
  if (!record) return null;

  const id = asString(record.id);
  if (!id) return null;

  const author = asRecord(record.author);
  const rawAttachments = Array.isArray(record.attachments) ? record.attachments : [];
  const rawEmbeds = Array.isArray(record.embeds) ? record.embeds : [];
  const rawMentions = Array.isArray(record.mentions) ? record.mentions : [];

  const content = asString(record.content) ?? '';
  
  // Tentar parsing inteligente com Python
  let enrichedFields: Record<string, unknown> = {};
  if (content) {
    try {
      const metadata = {
        author_username: author ? asString(author.name) ?? undefined : undefined,
        author_handle: author ? asString(author.nickname) ?? undefined : undefined,
        timestamp: asString(record.timestamp) ?? undefined,
        message_id: id,
        attachments: rawAttachments, // Passar attachments para extrair banner_url
        author: author, // Passar author completo para extrair avatar_url
        embeds: rawEmbeds, // Passar embeds para extrair external_links
      };
      
      const parsed = await parsePythonMessage(content, metadata);
      enrichedFields = parsed as Record<string, unknown>;
      
      // Log detalhado dos campos extraídos (REQ-28)
      console.log(`[normalizeExporterPayload] Mensagem ${id} - Parser Python executado`);
      console.log(`[normalizeExporterPayload] Confidence: ${enrichedFields.confidence}`);
      console.log(`[normalizeExporterPayload] Campos extraídos:`, {
        setting_name: enrichedFields.setting_name || '(vazio)',
        setting_styles: enrichedFields.setting_styles || '(vazio)',
        banner_url: enrichedFields.banner_url || '(vazio)',
        avatar_url: enrichedFields.avatar_url || '(vazio)',
        is_paid: enrichedFields.is_paid ?? '(vazio)',
        priceText: enrichedFields.priceText || '(vazio)',
        requires_camera: enrichedFields.requires_camera ?? '(vazio)',
        requires_microphone: enrichedFields.requires_microphone ?? '(vazio)',
        is_ongoing: enrichedFields.is_ongoing ?? '(vazio)',
        external_links: enrichedFields.external_links || '(vazio)',
        reviewFlags: enrichedFields.reviewFlags || '(vazio)',
      });
      
    } catch (error) {
      console.warn(`[normalizeExporterPayload] Parser Python falhou para mensagem ${id}:`, error);
      console.warn(`[normalizeExporterPayload] Fallback: campos vazios, parsing TypeScript será usado`);
      // Fallback: campos vazios, o parser TS do frontend será usado
      enrichedFields = {};
    }
  }

  return {
    id,
    type: asString(record.type),
    timestamp: asString(record.timestamp),
    timestampEdited: asString(record.timestampEdited),
    content,
    enrichedFields, // Campos extraídos pelo parser Python
    author: {
      id: author ? asString(author.id) : null,
      name: author ? asString(author.name) : null,
      nickname: author ? asString(author.nickname) : null,
      isBot: author ? asBoolean(author.isBot) : false,
    },
    attachments: rawAttachments
      .map((attachment): NormalizedExporterMessage['attachments'][number] | null => {
        const safeAttachment = asRecord(attachment);
        if (!safeAttachment) return null;

        const fileSize = Number(safeAttachment.fileSizeBytes);

        return {
          id: asString(safeAttachment.id),
          url: asString(safeAttachment.url),
          fileName: asString(safeAttachment.fileName),
          fileSizeBytes: Number.isFinite(fileSize) ? fileSize : null,
        };
      })
      .filter((attachment): attachment is NonNullable<typeof attachment> => Boolean(attachment)),
    embeds: rawEmbeds
      .map((embed): NormalizedExporterMessage['embeds'][number] | null => {
        const safeEmbed = asRecord(embed);
        if (!safeEmbed) return null;

        const thumbnail = asRecord(safeEmbed.thumbnail);
        const images = Array.isArray(safeEmbed.images) ? safeEmbed.images : [];

        return {
          url: asString(safeEmbed.url),
          title: asString(safeEmbed.title),
          description: asString(safeEmbed.description),
          thumbnail: thumbnail
            ? {
                url: asString(thumbnail.url),
                proxyUrl: asString(thumbnail.proxyUrl),
                width: Number.isFinite(Number(thumbnail.width)) ? Number(thumbnail.width) : null,
                height: Number.isFinite(Number(thumbnail.height)) ? Number(thumbnail.height) : null,
                canonicalUrl: asString(thumbnail.canonicalUrl),
              }
            : null,
          images: images
            .map((image): NormalizedExporterMessage['embeds'][number]['images'][number] | null => {
              const safeImage = asRecord(image);
              if (!safeImage) return null;

              return {
                url: asString(safeImage.url),
                proxyUrl: asString(safeImage.proxyUrl),
                width: Number.isFinite(Number(safeImage.width)) ? Number(safeImage.width) : null,
                height: Number.isFinite(Number(safeImage.height)) ? Number(safeImage.height) : null,
              };
            })
            .filter((image): image is NonNullable<typeof image> => Boolean(image)),
        };
      })
      .filter((embed): embed is NonNullable<typeof embed> => Boolean(embed)),
    mentions: rawMentions
      .map((mention): NormalizedExporterMessage['mentions'][number] | null => {
        const safeMention = asRecord(mention);
        if (!safeMention) return null;

        return {
          id: asString(safeMention.id),
          name: asString(safeMention.name),
          nickname: asString(safeMention.nickname),
        };
      })
      .filter((mention): mention is NonNullable<typeof mention> => Boolean(mention)),
    rawPayload: item,
  };
};

export const normalizeExporterPayload = async (payload: unknown): Promise<NormalizedExporterPayload> => {
  const root = asRecord(payload);
  if (!root) {
    throw new Error('Payload inválido: o JSON exportado deve ser um objeto.');
  }

  const guild = asRecord(root.guild);
  const channel = asRecord(root.channel);

  const rawMessages = toMessages(root.messages);
  const messagePromises = rawMessages.map(normalizeMessage);
  const resolvedMessages = await Promise.all(messagePromises);
  
  const messages = resolvedMessages.filter((message): message is NormalizedExporterMessage => Boolean(message));

  if (messages.length === 0) {
    throw new Error('Payload inválido: nenhuma mensagem válida foi encontrada no export.');
  }

  return {
    guildId: guild ? asString(guild.id) : null,
    guildName: guild ? asString(guild.name) : null,
    channelId: channel ? asString(channel.id) : null,
    channelName: channel ? asString(channel.name) : null,
    exportedAt: asString(root.exportedAt),
    messages,
    rawPayload: payload,
  };
};
