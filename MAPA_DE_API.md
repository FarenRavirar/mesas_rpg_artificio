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
| **GET** | `/google` | ✅ Em Uso | LoginPage.tsx, SiteHeader.tsx |
| **GET** | `/google/callback` | ✅ Em Uso | SiteHeader.tsx, LoginPage.tsx |
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
| **GET** | `/:slug` | ✅ Em Uso | useCreateTableForm.ts, uiHelpers.ts, MestrePage.tsx, PainelMestrePage.tsx |

### GMPANEL (`routes/gmPanel.ts`)
| Metodo | Endpoint | Status | Chamado por (Frontend) |
|---|---|---|---|
| **POST** | `/profile` | ❌ Pendente/Front | - |
| **PUT** | `/profile` | ❌ Pendente/Front | - |
| **GET** | `/me` | ✅ Em Uso | PainelMestrePage.tsx |
| **GET** | `/tables/:id` | ✅ Em Uso | PainelMestrePage.tsx |
| **POST** | `/tables` | ✅ Em Uso | useCreateTableForm.ts, PainelMestrePage.tsx |
| **PUT** | `/tables/:id` | ✅ Em Uso | useCreateTableForm.ts, PainelMestrePage.tsx |
| **GET** | `/tables` | ✅ Em Uso | PainelMestrePage.tsx |
| **PATCH** | `/tables/:id/status` | ✅ Em Uso | uiHelpers.ts |
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
| **POST** | `/` | ❌ Pendente/Front | - |
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
| **GET** | `/` | ✅ Em Uso | TableCard.tsx, uiHelpers.ts, useFetchTables.ts, GestaoPage.tsx, MesaPage.tsx, PainelMestrePage.tsx, catalogService.ts |
| **GET** | `/:slug` | ✅ Em Uso | TableCard.tsx, uiHelpers.ts, useFetchTables.ts, GestaoPage.tsx, MesaPage.tsx, PainelMestrePage.tsx, catalogService.ts |
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

