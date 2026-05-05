"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseDiscordAnnouncement_1 = require("../parseDiscordAnnouncement");
function makeMessage(overrides) {
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
        const draft = (0, parseDiscordAnnouncement_1.parseDiscordAnnouncement)(makeMessage({
            discord_message_id: '1499747163977027634',
            discord_channel_id: '1499747163977027634',
            discord_thread_id: '1499747163977027634',
            discord_thread_name: 'Forgotten Realms™: Uma Campanha Sandbox',
        }));
        expect(draft).not.toBeNull();
        expect(draft?.table.title).toBe('Uma Campanha Sandbox');
        expect(draft?.table.raw_system_hint).toBe('Forgotten Realms');
        expect(draft?.table.system_name).toBeNull();
        expect(draft?.missing_fields).toEqual(expect.arrayContaining(['system_name:unmatched_hint', 'description', 'contact_url']));
    });
    it('extracts structured table fields from announcement text', () => {
        const draft = (0, parseDiscordAnnouncement_1.parseDiscordAnnouncement)(makeMessage({
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
        }));
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
    it('ignores empty non-starter replies so they do not create duplicate drafts', () => {
        const draft = (0, parseDiscordAnnouncement_1.parseDiscordAnnouncement)(makeMessage({
            discord_message_id: 'reply-1',
            discord_thread_id: 'thread-1',
            discord_channel_id: 'thread-1',
            content_raw: '',
        }));
        expect(draft).toBeNull();
    });
});
