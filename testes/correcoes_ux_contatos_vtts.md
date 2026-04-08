# Correções UX — Contatos e Logos VTT

## Problemas Identificados

### 1. "Como Participar" não está fazendo jus aos modelos apresentados

**Problema:** A seção de contatos está renderizando apenas ícones emoji e texto simples, sem seguir o design system Artifício.

**Localização:** `TableActionPanel.tsx` linhas 112-167

**Comportamento atual:**
- WhatsApp: renderizado como link simples com emoji 💬
- Discord: renderizado com username + instrução textual
- Outros canais: links simples com emoji

**Comportamento esperado (baseado nos modelos):**
- Botões estilizados com cores do design system
- Ícones apropriados (não apenas emojis)
- Links de apoio visíveis e destacados para WhatsApp e Discord
- Hierarquia visual clara

---

### 2. WhatsApp tem link de apoio

**Problema:** WhatsApp está sendo renderizado como link direto sem contexto ou link de apoio.

**Código atual (linha 152-163):**
```typescript
// Outros canais com link
return (
  <a
    key={idx}
    href={contact.value}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-sm text-white/80 hover:text-orange-400 transition"
  >
    <span className="text-lg">{getContactIcon(contact.channel)}</span>
    <span>{contact.label || contact.channel}</span>
  </a>
);
```

**Comportamento esperado:**
- Botão principal "Enviar mensagem no WhatsApp"
- Link de apoio/ajuda (ex: "Como funciona?")
- Formatação visual destacada

---

### 3. Discord também tem link de apoio

**Problema:** Discord tem tratamento especial (linhas 120-148) mas o link do servidor está escondido como link secundário pequeno.

**Código atual:**
```typescript
{contact.discord_server_url && (
  <a
    href={contact.discord_server_url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition"
  >
    🔗 Entrar no servidor Discord
  </a>
)}
```

**Comportamento esperado:**
- Link do servidor Discord deve ser mais proeminente
- Botão de ação primária se houver servidor
- Username como informação secundária

---

### 4. Logos dos VTTs não estão aparecendo

**Problema:** As logos existem em `/public/vtt-logos/` mas não estão sendo carregadas.

**Código atual (linha 80-89):**
```typescript
{vm.vttPlatform.logo_filename && (
  <img 
    src={`/vtt-logos/${vm.vttPlatform.logo_filename}`} 
    alt={vm.vttPlatform.name}
    className="h-8 w-auto object-contain"
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
)}
```

**Possíveis causas:**
1. Caminho incorreto (falta `/` inicial ou está duplicado)
2. Nome do arquivo no banco não corresponde ao arquivo físico
3. Build do Vite não está copiando os arquivos
4. CORS ou permissões de acesso

**Arquivos disponíveis:**
- `alchemy-rpg.webp`
- `dndbeyond-maps.webp`
- `fantasy-grounds-unity.webp`
- `foundry-vtt.webp`
- `owlbear-rodeo.webp`
- `quest-portal.webp`
- `roll20.webp`
- `tabletop-simulator.webp`
- `talespire.webp`

---

## Plano de Correção

### Correção 1: Redesenhar seção "Como Participar"

**Objetivo:** Criar componente dedicado `TableContactsBlock.tsx` com design system Artifício.

**Estrutura proposta:**
```
┌─────────────────────────────────────┐
│ 🎮 COMO PARTICIPAR                  │
├─────────────────────────────────────┤
│                                     │
│ [Botão WhatsApp - Verde]            │
│ 💬 Enviar mensagem                  │
│ ℹ️ Como funciona?                   │
│                                     │
│ [Botão Discord - Roxo]              │
│ 🎮 Entrar no servidor               │
│ Username: @mestre#1234              │
│                                     │
│ [Botão Formulário - Laranja]        │
│ 📝 Preencher formulário             │
│                                     │
└─────────────────────────────────────┘
```

**Características:**
- Botões full-width com cores semânticas
- Ícones do lucide-react (não emojis)
- Links de apoio visíveis
- Hierarquia clara (ação primária > contexto > ajuda)

---

### Correção 2: Implementar botões estilizados por canal

**Mapeamento de cores:**
```typescript
const channelStyles = {
  whatsapp: {
    bg: 'bg-green-600 hover:bg-green-700',
    icon: MessageCircle,
    label: 'Enviar mensagem no WhatsApp',
    helpText: 'Clique para abrir conversa direta'
  },
  discord: {
    bg: 'bg-indigo-600 hover:bg-indigo-700',
    icon: MessageSquare,
    label: 'Entrar no servidor Discord',
    helpText: 'Envie mensagem direta após entrar'
  },
  form: {
    bg: 'bg-orange-600 hover:bg-orange-700',
    icon: FileText,
    label: 'Preencher formulário',
    helpText: 'Formulário de inscrição'
  },
  email: {
    bg: 'bg-blue-600 hover:bg-blue-700',
    icon: Mail,
    label: 'Enviar e-mail',
    helpText: 'Contato por e-mail'
  }
};
```

---

### Correção 3: Corrigir carregamento de logos VTT

**Diagnóstico necessário:**
1. Verificar se `logo_filename` no banco corresponde aos arquivos físicos
2. Testar caminho absoluto vs relativo
3. Verificar se Vite está copiando `/public` corretamente

**Teste de caminho:**
```typescript
// Testar ambos os caminhos
src={`/vtt-logos/${vm.vttPlatform.logo_filename}`}
// vs
src={`${import.meta.env.BASE_URL}vtt-logos/${vm.vttPlatform.logo_filename}`}
```

**Fallback visual:**
```typescript
{vm.vttPlatform.logo_filename ? (
  <img 
    src={`/vtt-logos/${vm.vttPlatform.logo_filename}`} 
    alt={vm.vttPlatform.name}
    className="h-8 w-auto object-contain"
    onError={(e) => {
      // Mostrar nome em texto se imagem falhar
      e.currentTarget.style.display = 'none';
      const parent = e.currentTarget.parentElement;
      if (parent) {
        const textNode = document.createElement('span');
        textNode.textContent = vm.vttPlatform.name;
        textNode.className = 'text-white font-medium text-sm';
        parent.appendChild(textNode);
      }
    }}
  />
) : (
  <span className="text-white font-medium text-sm">{vm.vttPlatform.name}</span>
)}
```

---

## Arquivos a Modificar

### 1. [NEW] `frontend/src/features/table/components/TableContactsBlock.tsx`
Componente dedicado para renderizar contatos com design system completo.

### 2. [MODIFY] `frontend/src/features/table/components/TableActionPanel.tsx`
- Remover seção de contatos (linhas 112-167)
- Importar e usar `<TableContactsBlock vm={vm} />`

### 3. [MODIFY] `frontend/src/features/table/components/TableActionPanel.tsx`
- Corrigir carregamento de logos VTT (linhas 80-89)
- Adicionar fallback visual melhor

---

## Prioridade

1. **ALTA:** Logos VTT não aparecem (quebra visual crítica)
2. **ALTA:** Redesenhar "Como Participar" (UX principal de conversão)
3. **MÉDIA:** Links de apoio WhatsApp/Discord (melhoria incremental)

---

## Próximos Passos

1. Diagnosticar problema das logos VTT (verificar banco + caminho)
2. Criar componente `TableContactsBlock.tsx`
3. Integrar no `TableActionPanel.tsx`
4. Testar em ambiente beta
5. Validar com usuário real

---

## Referências

- Design system: `ARQUITETURA_PROJETO.md` §9
- Heurísticas de Nielsen: `ARQUITETURA_PROJETO.md` §14.5
- Logos VTT: `frontend/public/vtt-logos/`
- Tipos de contato: `frontend/src/types/tables.ts` linhas 7-15
