import type { NormalizedExporterMessage, NormalizedExporterPayload } from './types';

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

const normalizeMessage = (item: unknown): NormalizedExporterMessage | null => {
  const record = asRecord(item);
  if (!record) return null;

  const id = asString(record.id);
  if (!id) return null;

  const author = asRecord(record.author);
  const rawAttachments = Array.isArray(record.attachments) ? record.attachments : [];
  const rawEmbeds = Array.isArray(record.embeds) ? record.embeds : [];
  const rawMentions = Array.isArray(record.mentions) ? record.mentions : [];

  return {
    id,
    type: asString(record.type),
    timestamp: asString(record.timestamp),
    timestampEdited: asString(record.timestampEdited),
    content: asString(record.content) ?? '',
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

export const normalizeExporterPayload = (payload: unknown): NormalizedExporterPayload => {
  const root = asRecord(payload);
  if (!root) {
    throw new Error('Payload inválido: o JSON exportado deve ser um objeto.');
  }

  const guild = asRecord(root.guild);
  const channel = asRecord(root.channel);

  const messages = toMessages(root.messages)
    .map(normalizeMessage)
    .filter((message): message is NormalizedExporterMessage => Boolean(message));

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
