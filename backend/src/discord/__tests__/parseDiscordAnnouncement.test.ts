import { parseDiscordAnnouncement } from '../parseDiscordAnnouncement';
import type { DiscordRawMessage } from '../types';

function makeMessage(overrides: Partial<DiscordRawMessage>): DiscordRawMessage {
  return {
    source_kind: 'discord_bot',
    discord_message_id: '1000',
    discord_channel_id: '2000',
    discord_guild_id: '3000',
    discord_parent_channel_id: '4000',
    discord_thread_id: '1000',
    discord_thread_name: 'Dungeons & Dragons: Tomb of Annihilation',
    discord_author_id: '5000',
    discord_author_name: 'covildolich',
    discord_message_url: 'https://discord.com/channels/3000/2000/1000',
    content_raw: '',
    attachments: [],
    embeds: [],
    message_created_at: new Date('2026-05-01T12:00:00Z'),
    message_edited_at: null,
    ...overrides,
  };
}

describe('parseDiscordAnnouncement', () => {
  it('creates a reviewable draft from a forum starter with empty content using the thread name', () => {
    const draft = parseDiscordAnnouncement(
      makeMessage({
        discord_message_id: '1499747163977027634',
        discord_channel_id: '1499747163977027634',
        discord_thread_id: '1499747163977027634',
        discord_thread_name: 'Forgotten Realms™: Uma Campanha Sandbox',
      }),
    );

    expect(draft).not.toBeNull();
    expect(draft?.table.title).toBe('Uma Campanha Sandbox');
    expect(draft?.table.raw_system_hint).toBe('Forgotten Realms');
    expect(draft?.table.system_name).toBeNull();
    expect(draft?.missing_fields).toEqual(
      expect.arrayContaining(['system_name:unmatched_hint', 'description', 'contact_url']),
    );
  });

  it('creates drafts for real Covil forum starter titles even when only the thread name is available', () => {
    const titles = [
      'Forgotten Realms™: Uma Campanha Sandbox',
      'Dungeons & Dragons™: Deicídio',
      'Tormenta20™: A Libertação de Valkaria',
      'Planescape™: Legends of the Outer Planes',
      'Fundação 0: Lucro, Ossos e Reputação',
      'Crystal Heart™: O Último Manuscrito',
      'Dungeons & Dragons™: Wrath of the River King',
      'Mage: The Awakeking™: Pó de Osso e Água de Poço',
      'Dungeons & Dragons: Dragons Delves™',
      'Waterdeep: Dragon Heist™ + Dungeon of the Mad Mage™',
      'Doomed Forgotten Realms™: Rise and Fall of Vecna',
      'Dungeons & Dragons: Chains of Asmodeus™',
    ];

    const drafts = titles.map((threadName, index) =>
      parseDiscordAnnouncement(
        makeMessage({
          discord_message_id: `starter-${index}`,
          discord_channel_id: `starter-${index}`,
          discord_thread_id: `starter-${index}`,
          discord_thread_name: threadName,
          content_raw: '',
        }),
      ),
    );

    expect(drafts).toHaveLength(12);
    expect(drafts.every(Boolean)).toBe(true);
    expect(drafts.map((draft) => draft?.table.title)).toEqual([
      'Uma Campanha Sandbox',
      'Deicídio',
      'A Libertação de Valkaria',
      'Legends of the Outer Planes',
      'Lucro, Ossos e Reputação',
      'O Último Manuscrito',
      'Wrath of the River King',
      'The Awakeking: Pó de Osso e Água de Poço',
      'Dragons Delves',
      'Dragon Heist + Dungeon of the Mad Mage',
      'Rise and Fall of Vecna',
      'Chains of Asmodeus',
    ]);
  });

  it('extracts structured table fields from announcement text', () => {
    const draft = parseDiscordAnnouncement(
      makeMessage({
        content_raw: [
          'Sistema: Dungeons & Dragons',
          'Mesa: A Torre dos Tres Sabores',
          'Tipo: Campanha',
          'Modalidade: Online',
          'Preco: R$ 25',
          'Vagas: 4',
          'Dia: sexta',
          'Horario: 20:00',
          'Frequencia: semanal',
          'Contato: https://forms.gle/example',
          'Descricao: Uma aventura culinaria em uma torre magica.',
        ].join('\n'),
      }),
    );

    expect(draft?.table.title).toBe('A Torre dos Tres Sabores');
    expect(draft?.table.system_name).toBe('Dungeons & Dragons');
    expect(draft?.table.type).toBe('campanha');
    expect(draft?.table.modality).toBe('online');
    expect(draft?.table.price_type).toBe('paga');
    expect(draft?.table.price_value).toBe(25);
    expect(draft?.table.slots_total).toBe(4);
    expect(draft?.table.day_of_week).toBe('sexta');
    expect(draft?.table.start_time).toBe('20:00');
    expect(draft?.table.frequency).toBe('semanal');
    expect(draft?.table.contact_url).toBe('https://forms.gle/example');
    expect(draft?.missing_fields).not.toContain('title');
  });

  it('extracts Covil forum body fields with markdown labels and session-zero note', () => {
    const draft = parseDiscordAnnouncement(
      makeMessage({
        discord_thread_name: 'Forgotten Realms™: Uma Campanha Sandbox',
        content_raw: [
          '▬ **Sistema:** *Dungeons & Dragons 2024®*',
          '▬ **Nível:** 3 ao 20',
          '▬** Mestre:**',
          '- <@186160570133643265>',
          '▬ **Estilo/Temática:** Sandbox, aventura, sobrevivência, diplomacia, exploração e alta fantasia.',
          '▬ **Local:** Discord + Foundry VTT (Necessário ter PC).',
          '▬ **Data & Horários:**',
          'Quartas-feiras das 21h às 00h',
          '▬ **Vagas Totais:** 6',
          '▬ **Vagas Disponíveis:** 0',
          '▬ **Mesa Paga:** R$ 35,00 por sessão (Sessão Zero gratuita).',
          'Caso se interesse pela aventura, basta enviar um ticket em <#1295552443337281576>',
        ].join('\n'),
      }),
    );

    expect(draft?.table.system_name).toBe('Dungeons & Dragons 2024');
    expect(draft?.table.price_type).toBe('paga');
    expect(draft?.table.price_value).toBe(35);
    expect(draft?.table.slots_total).toBe(6);
    expect(draft?.table.slots_open).toBe(0);
    expect(draft?.table.day_of_week).toBe('quarta');
    expect(draft?.table.start_time).toBe('21:00');
    expect(draft?.missing_fields).not.toContain('slots_total');
  });

  it('matches systems by specific names before generic aliases and version suffixes', () => {
    const systems = [
      { id: 'gamma', name: 'Gamma World', name_pt: null, aliases: ['D&D'] },
      { id: 'dnd', name: 'Dungeons & Dragons', name_pt: null, aliases: ['D&D 5e'] },
      { id: 'tormenta', name: 'Tormenta', name_pt: null, aliases: [] },
    ];

    const dndDraft = parseDiscordAnnouncement(
      makeMessage({
        discord_thread_name: 'Planescape™: Legends of the Outer Planes',
        content_raw: '▬ Sistema: Dungeons & Dragons 5.5e\n▬ Vagas Totais: 5\nQuartas-feiras às 20h\nhttps://forms.gle/example',
      }),
      systems,
    );
    const tormentaDraft = parseDiscordAnnouncement(
      makeMessage({
        discord_thread_name: 'Tormenta20™: A Libertação de Valkaria',
        content_raw: '▬ Sistema: Tormenta20\n▬ Vagas Totais: 3\nQuartas-feiras às 20h\nhttps://forms.gle/example',
      }),
      systems,
    );

    expect(dndDraft?.table.system_id).toBe('dnd');
    expect(tormentaDraft?.table.system_id).toBe('tormenta');
  });

  it('uses Discord channel mentions as contact when no external URL exists', () => {
    const draft = parseDiscordAnnouncement(
      makeMessage({
        discord_thread_name: 'Dungeons & Dragons™: Wrath of the River King',
        content_raw: [
          '▬ Sistema: Dungeons & Dragons 5.5',
          '▬ Data & Horário:',
          '- Sextas-feiras das 19h30 às 23h',
          '▬ Vagas Totais: 6',
          '▬ Vagas Disponíveis: 6',
          '▬ Mesa Paga: R$ 25,00 por sessão',
          'Caso se interesse pela aventura, basta enviar um ticket em <#1295552443337281576>',
        ].join('\n'),
      }),
    );

    expect(draft?.table.contact_discord).toBe('<#1295552443337281576>');
    expect(draft?.missing_fields).not.toContain('contact_url');
  });

  it('suggests unknown systems from the explicit system field instead of thread scenario titles', () => {
    const draft = parseDiscordAnnouncement(
      makeMessage({
        discord_thread_name: 'Forgotten Realms™: Uma Campanha Sandbox',
        content_raw: [
          '▬ Sistema: One Two Six (Sistema Inédito)',
          '▬ Data & Horário:',
          '- Sextas-feiras das 18h às 21h',
          '▬ Vagas Totais: 6',
          '▬ Vagas Disponíveis: 6',
          '▬ Mesa Paga: R$ 20,00 por sessão',
          'Caso se interesse pela aventura, basta enviar um ticket em <#1295552443337281576>',
        ].join('\n'),
      }),
      [{ id: 'dnd', name: 'Dungeons & Dragons', name_pt: null, aliases: ['D&D'] }],
    );

    expect(draft?.table.raw_system_hint).toBe('One Two Six (Sistema Inédito)');
    expect(draft?.table.system_name).toBe('One Two Six (Sistema Inédito)');
    expect(draft?.missing_fields).toContain('system_name:unmatched_hint');
    expect(draft?.table.raw_system_hint).not.toBe('Forgotten Realms');
  });

  it('ignores empty non-starter replies so they do not create duplicate drafts', () => {
    const draft = parseDiscordAnnouncement(
      makeMessage({
        discord_message_id: 'reply-1',
        discord_thread_id: 'thread-1',
        discord_channel_id: 'thread-1',
        content_raw: '',
      }),
    );

    expect(draft).toBeNull();
  });
});
