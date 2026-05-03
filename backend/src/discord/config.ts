/**
 * Configurações do módulo Discord.
 * Todas as vars são lidas sob demanda (lazy) — ausência não bloqueia boot da API.
 * Variáveis obrigatórias para o bot (Fase 7) lançam erro apenas no primeiro uso real.
 */
export const discordConfig = {
  get botToken(): string | undefined {
    return process.env.DISCORD_BOT_TOKEN;
  },

  get guildId(): string | undefined {
    return process.env.DISCORD_GUILD_ID;
  },

  get covilInviteUrl(): string | undefined {
    return process.env.DISCORD_COVIL_INVITE_URL;
  },

  get syncEnabled(): boolean {
    return process.env.DISCORD_SYNC_ENABLED === 'true';
  },

  get syncIntervalMinutes(): number {
    const val = parseInt(process.env.DISCORD_SYNC_INTERVAL_MINUTES ?? '15', 10);
    return isNaN(val) ? 15 : val;
  },

  get allowedChannelIds(): string[] {
    const raw = process.env.DISCORD_SYNC_ALLOWED_CHANNEL_IDS ?? '';
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  },

  get defaultGmId(): string | undefined {
    return process.env.DISCORD_IMPORT_DEFAULT_GM_ID;
  },

  /** Lança se o bot token não estiver configurado — usar apenas nas funções que requerem o bot. */
  requireBotToken(): string {
    const token = this.botToken;
    if (!token) throw new Error('NOT IMPLEMENTED: DISCORD_BOT_TOKEN não configurado');
    return token;
  },
};
