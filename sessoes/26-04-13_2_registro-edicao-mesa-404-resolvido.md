# Registro Técnico - Resolução do Erro 404 na Edição de Mesas

## Data
13/04/2026

## Problema Original
Erro 404 ocorrendo ao tentar editar mesas existentes via `/api/v1/gm/tables/{uuid}` no frontend.

## Diagnóstico
- Frontend chamava `GET /api/v1/gm/tables/:id` para carregar dados da mesa para edição
- Backend não possuía endpoint correspondente para esta funcionalidade
- Resultava em 404 Not Found antes do form de edição poder ser preenchido

## Solução Implementada
1. **Adicionado endpoint `GET /api/v1/gm/tables/:id` no backend** (`gmPanel.ts`)
2. **Implementação completa com:**
   - Validação de autenticação via `authMiddleware`
   - Verificação de propriedade da mesa pelo GM
   - Retorno de todos os dados necessários para o form de edição
   - Inclusão de contatos, schedules e campos avançados
3. **Correções para compatibilidade do Kysely:**
   - Uso de expressões SQL adequadas (`sql``campo``.as('nome')`) para aliases
   - Resolução de erros estruturais com colchetes extras
4. **Atualização da documentação** (`MAPA_DE_API.md`)

## Componentes Afetados
- `backend/src/routes/gmPanel.ts` - Adição do GET /api/v1/gm/tables/:id
- `MAPA_DE_API.md` - Documentação do novo endpoint
- `PainelMestrePage.tsx` - Funcionalidade já existente agora opera com sucesso

## Status
[CONCLUÍDO] Funcionalidade de edição de mesas agora opera corretamente

## Validacão
- Endpoint responde corretamente com dados da mesa
- Permissão é verificada adequadamente
- Frontend pode carregar, editar e salvar mesas existentes

## Teste Realizado
- Validação bem-sucedida da funcionalidade de carga para edição
- Teste de permissão e autenticação funcionando
- Compilação do backend completa sem erros
