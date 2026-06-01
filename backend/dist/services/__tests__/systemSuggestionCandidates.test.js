"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const systemSuggestionCandidates_1 = require("../systemSuggestionCandidates");
describe('normalizeSystemName', () => {
    it('lower-cases, removes accents and commercial symbols', () => {
        const n = (0, systemSuggestionCandidates_1.normalizeSystemName)('Forgotten Realms™');
        expect(n.normalized).toBe('forgotten realms');
        expect(n.base).toBe('forgotten realms');
        expect(n.editionTokens).toEqual([]);
    });
    it('normalizes & to and', () => {
        const n = (0, systemSuggestionCandidates_1.normalizeSystemName)('Dungeons & Dragons');
        expect(n.normalized).toBe('dungeons and dragons');
        expect(n.base).toBe('dungeons and dragons');
    });
    it('detects year edition token and keeps base clean (D&D 5a edicao 2024)', () => {
        const n = (0, systemSuggestionCandidates_1.normalizeSystemName)('D&D 5ª edição 2024');
        // '5a' (PT ordinal) e '2024' sao tokens de edicao; 'edicao' e palavra de edicao removida
        expect(n.editionTokens).toEqual(expect.arrayContaining(['5a', '2024']));
        expect(n.base).toBe('d and d');
    });
    it('detects dotted version token (CAIN 1.3)', () => {
        const n = (0, systemSuggestionCandidates_1.normalizeSystemName)('CAIN 1.3');
        expect(n.editionTokens).toEqual(['1.3']);
        expect(n.base).toBe('cain');
    });
    it('detects edition like 5e', () => {
        const n = (0, systemSuggestionCandidates_1.normalizeSystemName)('Pathfinder 2e');
        expect(n.editionTokens).toEqual(['2e']);
        expect(n.base).toBe('pathfinder');
    });
    it('strips trailing generic RPG suffix for base (Pokemon RPG)', () => {
        const n = (0, systemSuggestionCandidates_1.normalizeSystemName)('Pokémon RPG');
        expect(n.base).toBe('pokemon');
        expect(n.editionTokens).toEqual([]);
    });
    it('returns safe empty result for blank input', () => {
        const n = (0, systemSuggestionCandidates_1.normalizeSystemName)('   ');
        expect(n.normalized).toBe('');
        expect(n.base).toBe('');
        expect(n.editionTokens).toEqual([]);
    });
});
const SYSTEMS = [
    { id: 'dd', name: 'Dungeons & Dragons', name_pt: null, slug: 'dungeons-dragons', path_slug: 'dungeons-dragons', node_type: 'system', parent_id: null },
    { id: 'dd5e', name: '5th Edition', name_pt: '5ª Edição', slug: '5e', path_slug: 'dungeons-dragons/5e', node_type: 'edition', parent_id: 'dd' },
    { id: 'cain', name: 'CAIN', name_pt: null, slug: 'cain', path_slug: 'cain', node_type: 'system', parent_id: null },
    { id: 'pokemon', name: 'Pokémon', name_pt: null, slug: 'pokemon', path_slug: 'pokemon', node_type: 'system', parent_id: null },
];
const ALIASES = [
    { system_id: 'dd', alias: 'D&D' },
    { system_id: 'dd5e', alias: 'D&D 5e' },
];
describe('scoreSystemCandidates', () => {
    it('matches an existing alias exactly and recommends merge', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('D&D', SYSTEMS, ALIASES);
        expect(r.candidates[0].system_id).toBe('dd');
        expect(r.candidates[0].reasons).toContain('alias_exact');
        expect(r.candidates[0].score).toBeGreaterThanOrEqual(0.97);
        expect(r.recommended_action).toBe('merge_existing');
    });
    it('matches exact system name and recommends merge', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('CAIN', SYSTEMS, ALIASES);
        expect(r.candidates[0].system_id).toBe('cain');
        expect(r.candidates[0].reasons).toContain('name_exact');
        expect(r.recommended_action).toBe('merge_existing');
    });
    it('flags base + edition token (CAIN 1.3) against the existing root, recommends child not new system', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('CAIN 1.3', SYSTEMS, ALIASES);
        expect(r.candidates[0].system_id).toBe('cain');
        expect(r.candidates[0].reasons).toContain('base_plus_edition');
        expect(r.recommended_action).toBe('create_child');
    });
    it('recognizes D&D 5e 2014. as edition context of existing Dungeons & Dragons, not a new root', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('D&D 5e 2014.', SYSTEMS, [{ system_id: 'dd', alias: 'DnD' }]);
        expect(r.candidates[0].system_id).toBe('dd');
        expect(r.candidates[0].reasons).toContain('base_plus_edition');
        expect(r.recommended_action).toBe('create_child');
    });
    it('matches Pokemon RPG to existing Pokemon by base', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('Pokémon RPG', SYSTEMS, ALIASES);
        expect(r.candidates[0].system_id).toBe('pokemon');
        expect(r.recommended_action).not.toBe('create_system');
    });
    it('recommends create_system when nothing is similar (On-Two-Six)', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('On-Two-Six', SYSTEMS, ALIASES);
        expect(r.recommended_action).toBe('create_system');
    });
    it('returns candidates sorted by score descending and de-duplicated by system', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('D&D 5e', SYSTEMS, ALIASES);
        const ids = r.candidates.map((c) => c.system_id);
        expect(new Set(ids).size).toBe(ids.length);
        for (let i = 1; i < r.candidates.length; i += 1) {
            expect(r.candidates[i - 1].score).toBeGreaterThanOrEqual(r.candidates[i].score);
        }
    });
    it('does not throw on empty catalog and recommends create_system', () => {
        const r = (0, systemSuggestionCandidates_1.scoreSystemCandidates)('Whatever', [], []);
        expect(r.candidates).toEqual([]);
        expect(r.recommended_action).toBe('create_system');
    });
});
