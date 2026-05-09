# T-RES-2 — Pesquisa: template Discord para anúncios de mesa (Fase 5.ε)

**Data:** 2026-05-09
**Decisão (mantenedor, 09/05/2026):** Implementar opção ε — template padronizado em canais Discord parceiros, com bot validador.
**Status:** Investigação inicial. Implementação depende de negociação com administradores de servidores parceiros (a iniciar pelo Covil do Lich).

---

## 1. Objetivo

Reduzir ambiguidade na fonte: posts seguindo formato fixo são **estruturados por contrato humano**, eliminando dependência de regex frágil ou LLM. Cobre cenários §5.3 (canal de anúncio) e §5.4 (chat) do spec 016 quando o canal aceitar template.

---

## 2. Recursos nativos do Discord para padronização

### 2.1 Forum Guidelines

Canais `GUILD_FORUM` (tipo 15) suportam **Forum Guidelines** — texto longo configurado pelo administrador, exibido para o usuário **antes** de criar um novo post. Aparece como instrução modal.

- **Configuração:** Server Settings → Channels → [forum] → Guidelines.
- **Texto:** Markdown, até 4096 chars.
- **Visualização:** modal "Welcome to #forum" com botão "Create Post".
- **Não bloqueante:** o usuário pode ignorar. Discord não rejeita posts.

**Aplicação para Mesas RPG:**
- Definir guideline contendo **template literal** que o usuário deve copiar e preencher.
- Bot valida posts e responde com correção quando estrutura faltar.

### 2.2 Forum Tags / Required Tags

Canais de fórum permitem **tags** que o autor seleciona ao criar post. Administrador pode marcar tags como obrigatórias. Discord rejeita post sem tag obrigatória.

- **Tags úteis para Mesas RPG:** `Sistema`, `Modalidade`, `Status` (recrutando/cheia/fechada), `Frequência`.
- **Vantagem:** parser não precisa adivinhar campo — vem como metadado da thread.

### 2.3 Slash Commands customizados

Bot registra `/anunciar-mesa` no servidor com parâmetros tipados:

```
/anunciar-mesa
  titulo:        Bares Longínquos
  sistema:       D&D 5e
  modalidade:    online | presencial | híbrida
  dia:           segunda...domingo
  horario:       19:00
  vagas:         5
  contato:       <link ou mention>
  descricao:     ...
```

Bot recebe parâmetros tipados via Discord Interaction API e cria draft direto, **sem passar pelo parser**.

**Vantagem:** elimina ingestão por scraping de mensagens; transforma em integração estruturada.
**Desvantagem:** depende de o usuário escolher comando em vez de mensagem livre.

### 2.4 Forum post template (UI)

Em 2025, Discord adicionou recurso **"Default reaction emoji"** e configurações de post default em fóruns. Não há ainda template texto pré-preenchido nativo — usuário começa com post vazio.

---

## 3. Estratégia proposta para o Covil do Lich

### 3.1 Fase imediata — Forum Guidelines + bot validador

1. Negociar com administrador do Covil para atualizar **Forum Guidelines** dos canais `📖┃campanhas` e `🎯┃one-shots` com template canônico:

```markdown
# Como anunciar uma mesa no Covil do Lich

Cole e preencha o template abaixo no seu post. O bot do Mesas RPG Artifício vai
ler automaticamente e criar a página da mesa para você.

---

**Sistema:** [ex.: D&D 5e, Pathfinder 2e, Tormenta20]
**Cenário:** [ex.: Forgotten Realms, Eberron] (opcional)
**Tipo:** [campanha | one-shot | aberta]
**Modalidade:** [online | presencial | híbrida]
**Dia:** [segunda…domingo]
**Horário:** [HH:MM]
**Frequência:** [semanal | quinzenal | mensal | avulsa]
**Vagas:** [número]
**Preço:** [gratuita | R$ XX por sessão]
**Contato:** [link Discord ou @mestre]

---

## Sobre a mesa

[Descrição livre da campanha, tom, expectativas, requisitos.]

## Sobre o mestre

[Apresentação opcional do mestre.]
```

2. Bot lê o post recém-criado, identifica template, extrai campos, **responde no thread** confirmando ("✅ Mesa criada: [link]") ou apontando campos faltando ("⚠️ Faltou indicar Vagas e Horário; edite o post e o bot tenta de novo em 5 min").

3. Posts que não seguem template caem para fluxo legado (regex ou LLM), com confidence visível na UI admin.

### 3.2 Fase intermediária — Required Tags

Adicionar tags obrigatórias `Sistema` e `Modalidade` aos canais de fórum. Tags ficam disponíveis como metadado da thread (`thread.applied_tags`), o ingestor pode usar diretamente.

### 3.3 Fase avançada — Slash Command

Implementar `/anunciar-mesa` no bot. Reduz fricção (ninguém precisa copiar markdown), aumenta precisão (campos tipados pela API Discord). Requer permissão de bot para registrar comando no servidor.

---

## 4. Pendências de negociação (não-técnicas)

| # | Pendência | Responsável |
|---|---|---|
| 1 | Identificar e contatar administrador do Covil do Lich | mantenedor |
| 2 | Apresentar proposta de Forum Guidelines + benefícios para a comunidade | mantenedor |
| 3 | Combinar comunicação com membros (anúncio "novo template") | admin do Covil |
| 4 | Definir período de transição (template novo vs posts antigos) | admin do Covil + mantenedor |
| 5 | Avaliar canais parceiros futuros (outros servidores RPG) | mantenedor |

---

## 5. Riscos

| Risco | Mitigação |
|---|---|
| Admin do Covil não topa template | Manter pipeline regex+LLM como solução paralela; ε se torna opcional |
| Membros ignoram template | Bot responde no thread com instrução clara; UI admin mostra "fora do template" |
| Discord muda API de Forum Guidelines | Texto fica no banco do servidor; rollback é editar de volta |
| Slash command exige escopo `applications.commands` no convite do bot | Reconvite do bot com escopo ampliado, autorizado por admin |
| Posts antigos (pré-template) não viram template magicamente | Backfill via LLM (Fase 5.δ) cobre o legado |

---

## 6. Critérios de sucesso

- Forum Guidelines atualizado em ambos os canais do Covil em < 7 dias após início da Fase 5.ε.
- Bot consegue identificar **>= 90% de novos posts** como "template-conformes" após 30 dias de adoção.
- Para posts conformes, parser regex extrai **>= 95% dos campos sem precisar de LLM**.

---

## 7. Próximos passos

1. **Mantenedor:** estabelecer canal de comunicação com admin Covil. Identificar tempo razoável para resposta (estimar 1–2 semanas).
2. **Agente:** implementar lógica de bot validador no backend assim que template for acordado.
3. **Conjunto:** acompanhar adoção via telemetria do painel admin.

Investigação fecha. Implementação detalhada em `plan.md` §Fase 5.ε no momento da execução.

---

## 8. Referências

- Discord Developer Portal — Forum Guidelines: <https://discord.com/developers/docs/resources/channel#channel-object>
- Discord Forum Channels guide: <https://support.discord.com/hc/en-us/articles/6208479917079>
- Spec 016 §7 (Opção ε) — <../spec.md>
