# Mapa Canônico da API (backend/src/routes) vs Frontend

> **OBRIGATÓRIO:** Toda nova rota adicionada ou removida da API **deve** ser refletida neste documento. Agentes de IA estão proibidos de concluir tarefas de backend sem atualizar este arquivo.

### ADMINPROFILE (`routes/adminProfile.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/users` | ❌ Pendente/Front | - |

### ADMINSETTINGSUGGESTIONS (`routes/adminSettingSuggestions.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ❌ Pendente/Front | - |
| **POST** | `/` | ❌ Pendente/Front | - |
| **PUT** | `/:id` | ❌ Pendente/Front | - |
| **DELETE** | `/:id` | ❌ Pendente/Front | - |

### AUTH (`routes/auth.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/google` | ✅ Em Uso | auth.ts (helper), LoginPage.tsx, SiteHeader.tsx — Query opcional: `frontend_redirect` (URL validada por allowlist no backend via `FRONTEND_URL`/`FRONTEND_URLS`) |
| **GET** | `/google/callback` | ✅ Em Uso | Fluxo OAuth do navegador (redirecionamento do Google) — seta cookie `am_session` e redireciona para frontend permitido |
| **POST** | `/logout` | ✅ Em Uso | AuthContext.tsx |

### CHANGELOG (`routes/changelog.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ✅ Em Uso | ChangelogModal.tsx |

### DISCORD (`routes/discord.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/discord/connect` | ❌ Pendente/Front | - |
| **GET** | `/discord/callback` | ❌ Pendente/Front | - |
| **DELETE** | `/discord/disconnect` | ❌ Pendente/Front | - |
| **POST** | `/discord/verify-covil` | ❌ Pendente/Front | - |

### GM (`routes/gm.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/:slug` | ✅ Em Uso | useCreateTableForm.ts, uiHelpers.ts, MestrePage.tsx, PainelMestrePage.tsx — perfil retorna `gm.banner_url`; mesas públicas neste endpoint usam `cover_url` (legado) |

### GMPANEL (`routes/gmPanel.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **POST** | `/profile` | ✅ Em Uso | PainelMestrePage.tsx (CreateGmProfileForm) |
| **PUT** | `/profile` | ❌ Pendente/Front | - (sem consumidor ativo no frontend) |
| **GET** | `/me` | ✅ Em Uso | PainelMestrePage.tsx |
| **GET** | `/tables/:id` | ✅ Em Uso | PainelMestrePage.tsx — retorno atual inclui `banner_url` e campos legados da tabela (incluindo `cover_url`), sem alias `image_url`; integração de edição usa fallback `banner_url ?? image_url` no mapper |
| **POST** | `/tables` | ✅ Em Uso | useCreateTableForm.ts, PainelMestrePage.tsx — submit corrigido em 15/04 para `${API_BASE}/api/v1/gm/tables` |
| **PUT** | `/tables/:id` | ✅ Em Uso | useCreateTableForm.ts, PainelMestrePage.tsx — submit corrigido em 15/04 para `${API_BASE}/api/v1/gm/tables/:id` |
| **GET** | `/tables` | ✅ Em Uso | PainelMestrePage.tsx — retorna `image_url` (alias de `banner_url`) para cards do painel |
| **PATCH** | `/tables/:id/status` | ✅ Em Uso | PainelMestrePage.tsx (handleToggleTableStatus) - **Aceita apenas:** 'active', 'full', 'cancelled', 'ended' |
| **DELETE** | `/tables/:id` | ✅ Em Uso | uiHelpers.ts, PainelMestrePage.tsx |
| **POST** | `/tables/:slug/view` | ❌ Pendente/Front | - |
| **POST** | `/tables/:id/click` | ❌ Pendente/Front | - |
| **POST** | `/tables/:id/contact` | ❌ Pendente/Front | - |
| **POST** | `/tables/:id/favorite` | ❌ Pendente/Front | - |

### ADMIN (`routes/adminTables.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **PUT** | `/admin/tables/:id` | ✅ Em Uso | GestaoPage.tsx, PainelMestrePage.tsx |
| **DELETE** | `/admin/tables/:id` | ✅ Em Uso | GestaoPage.tsx |

### LINKS (`routes/links.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/links` | ❌ Pendente/Front | - |
| **POST** | `/links` | ❌ Pendente/Front | - |
| **DELETE** | `/links/:id` | ❌ Pendente/Front | - |
| **PATCH** | `/links/reorder` | ❌ Pendente/Front | - |

### ME (`routes/me.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ✅ Em Uso | AuthContext.tsx, OnboardingPage.tsx |
| **GET** | `/options` | ✅ Em Uso | AuthContext.tsx, OnboardingPage.tsx |
| **PUT** | `/preferences` | ✅ Em Uso | AuthContext.tsx, OnboardingPage.tsx |

### NOTIFICATIONS (`routes/notifications.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ✅ Em Uso | NotificationBell.tsx |
| **PATCH** | `/:id/read` | ✅ Em Uso | NotificationBell.tsx |

### PROFILE (`routes/profile.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/me` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **PATCH** | `/me` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **PATCH** | `/me/profile` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **PATCH** | `/me/player` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **PATCH** | `/player` | ✅ Em Uso | useProfileQuery.ts, PlayerPage.tsx |
| **PATCH** | `/me/gm` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **PATCH** | `/gm` | ✅ Em Uso | useProfileQuery.ts, PlayerPage.tsx |
| **POST** | `/me/systems` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **POST** | `/systems` | ✅ Em Uso | useProfileQuery.ts, PlayerPage.tsx |
| **DELETE** | `/me/systems/:id` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **DELETE** | `/systems/:id` | ✅ Em Uso | useProfileQuery.ts, PlayerPage.tsx |
| **GET** | `/me/discord` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **POST** | `/me/connect/discord` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |
| **DELETE** | `/me/connect/discord` | ✅ Em Uso | useProfile.ts, useProfileQuery.ts, PlayerPage.tsx |

### SCENARIOS (`routes/scenarios.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ✅ Em Uso | ScenarioEditModal.tsx, ScenarioSelector.tsx, CreateTableForm.tsx, GestaoPage.tsx |
| **GET** | `/:id` | ✅ Em Uso | ScenarioEditModal.tsx, ScenarioSelector.tsx, CreateTableForm.tsx, GestaoPage.tsx |
| **POST** | `/admin` | ✅ Em Uso | ScenarioEditModal.tsx, ScenarioSelector.tsx, CreateTableForm.tsx, GestaoPage.tsx |
| **PUT** | `/admin/:id` | ✅ Em Uso | ScenarioEditModal.tsx, ScenarioSelector.tsx, CreateTableForm.tsx, GestaoPage.tsx |
| **DELETE** | `/admin/:id` | ✅ Em Uso | ScenarioEditModal.tsx, ScenarioSelector.tsx, CreateTableForm.tsx, GestaoPage.tsx |

### SETTINGS (`routes/settings.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/suggest-styles` | ✅ Em Uso | SettingStylesField.tsx |

### SYSTEMS (`routes/systems.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ✅ Em Uso | SystemEditModal.tsx, UserSystemsSelector.tsx, CreateTableForm.tsx, SystemsPage.tsx, SystemsTree.tsx, useSystems.ts, CatalogoPage.tsx |
| **POST** | `/admin` | ✅ Em Uso | SystemEditModal.tsx, UserSystemsSelector.tsx, CreateTableForm.tsx, SystemsPage.tsx, SystemsTree.tsx, useSystems.ts, CatalogoPage.tsx |
| **PUT** | `/admin/:id` | ✅ Em Uso | SystemEditModal.tsx, UserSystemsSelector.tsx, CreateTableForm.tsx, SystemsPage.tsx, SystemsTree.tsx, useSystems.ts, CatalogoPage.tsx |
| **DELETE** | `/admin/:id` | ✅ Em Uso | SystemEditModal.tsx, UserSystemsSelector.tsx, CreateTableForm.tsx, SystemsPage.tsx, SystemsTree.tsx, useSystems.ts, CatalogoPage.tsx |

### SYSTEMSUGGESTIONS (`routes/systemSuggestions.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **POST** | `/` | ✅ Em Uso | SystemSuggestionModal.tsx, StepSystem.tsx |
| **GET** | `/mine` | ❌ Pendente/Front | - |

### SCENARIOSUGGESTIONS (`routes/scenarioSuggestions.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **POST** | `/` | ✅ Em Uso | ScenarioSuggestionModal.tsx, StepSystem.tsx |
| **GET** | `/mine` | ❌ Pendente/Front | - |

### SYSTEMSUGGESTIONSADMIN (`routes/systemSuggestionsAdmin.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/system-suggestions` | ❌ Pendente/Front | - |
| **PATCH** | `/system-suggestions/:id/approve` | ❌ Pendente/Front | - |
| **PATCH** | `/system-suggestions/:id/reject` | ❌ Pendente/Front | - |

### TABLES (`routes/tables.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ✅ Em Uso | TableCard.tsx, uiHelpers.ts, useFetchTables.ts, GestaoPage.tsx, MesaPage.tsx, PainelMestrePage.tsx, catalogService.ts — retorna `cover_url` (alias de `banner_url` em `routes/tables.ts`) |
| **GET** | `/:slug` | ✅ Em Uso | TableCard.tsx, uiHelpers.ts, useFetchTables.ts, GestaoPage.tsx, MesaPage.tsx, PainelMestrePage.tsx, catalogService.ts — retorna `cover_url` (alias de `banner_url` em `routes/tables.ts`) |
| **POST** | `/:slug/view` | ✅ Em Uso | TableCard.tsx, useFetchTables.ts, GestaoPage.tsx, MesaPage.tsx, PainelMestrePage.tsx, catalogService.ts |
| **POST** | `/:slug/click` | ✅ Em Uso | TableCard.tsx, uiHelpers.ts, useFetchTables.ts, GestaoPage.tsx, MesaPage.tsx, PainelMestrePage.tsx, catalogService.ts |

### TABLESCHEDULES (`routes/tableSchedules.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/:tableId/schedules` | ❌ Pendente/Front | - |
| **POST** | `/:tableId/schedules` | ❌ Pendente/Front | - |
| **PUT** | `/:tableId/schedules/:id` | ❌ Pendente/Front | - |
| **DELETE** | `/:tableId/schedules/:id` | ❌ Pendente/Front | - |

### VTTPLATFORMS (`routes/vttPlatforms.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **GET** | `/` | ❌ Pendente/Front | - |
| **POST** | `/suggest` | ❌ Pendente/Front | - |

### UPLOAD (`routes/upload.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **POST** | `/` | ✅ Em Uso | ImageUploader.tsx — upload de imagem via backend com Cloudinary signed (substitui upload direto unsigned) |

