export interface ExporterAuthor {
  id: string | null;
  name: string | null;
  nickname: string | null;
  isBot: boolean;
}

export interface ExporterAttachment {
  id: string | null;
  url: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
}

export interface ExporterEmbedImage {
  url: string | null;
  proxyUrl: string | null;
  width: number | null;
  height: number | null;
}

export interface ExporterEmbedThumbnail {
  url: string | null;
  proxyUrl: string | null;
  width: number | null;
  height: number | null;
  canonicalUrl: string | null;
}

export interface ExporterEmbed {
  url: string | null;
  title: string | null;
  description: string | null;
  thumbnail: ExporterEmbedThumbnail | null;
  images: ExporterEmbedImage[];
}

export interface ExporterMention {
  id: string | null;
  name: string | null;
  nickname: string | null;
}

export interface NormalizedExporterMessage {
  id: string;
  type: string | null;
  timestamp: string | null;
  timestampEdited: string | null;
  content: string;
  enrichedFields?: Record<string, unknown>; // Campos extraídos pelo parser Python
  author: ExporterAuthor;
  attachments: ExporterAttachment[];
  embeds: ExporterEmbed[];
  mentions: ExporterMention[];
  rawPayload: unknown;
}

export interface NormalizedExporterPayload {
  guildId: string | null;
  guildName: string | null;
  channelId: string | null;
  channelName: string | null;
  exportedAt: string | null;
  messages: NormalizedExporterMessage[];
  rawPayload: unknown;
}

export type MediaLinkOrigin =
  | 'original_url'
  | 'embed_url'
  | 'thumbnail_canonical_url'
  | 'exported_local_name';

export interface ExtractedMediaLink {
  kind: 'attachment' | 'embed' | 'thumbnail';
  origin: MediaLinkOrigin;
  url: string;
  localName: string | null;
  fileName: string | null;
  label: string | null;
  isPublicUrl: boolean;
}

export interface ParsedMessageDraft {
  sourceMessageId: string;
  sourceChannelId: string | null;
  title: string | null;
  system: string | null;
  style: string | null;
  scheduleText: string | null;
  slotsText: string | null;
  ageRating: string | null;
  location: string | null;
  platforms: string | null;
  masterText: string | null;
  recruiterName: string | null;
  signupText: string | null;
  synopsis: string | null;
  isPaid: boolean;
  priceText: string | null;
  isCustomSystem: boolean;
  mediaLinks: ExtractedMediaLink[];
  externalLinks: string[];
  rawMentions: string[];
  needsReview: boolean;
  confidenceScore: number;
  editorialReason: string | null;
}

export interface ClassifiedSystemResult {
  systemId: string | null;
  systemName: string | null;
  isCustomSystem: boolean;
  confidence: number;
  needsReview: boolean;
}

export interface KnownSystemAlias {
  systemId: string;
  systemName: string;
  alias: string;
  aliasNormalized: string;
}
