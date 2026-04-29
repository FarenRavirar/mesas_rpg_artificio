# Tasks: Imagens, Banners e Placeholders

**Input**: Design documents from `specs/006-imagens-banners-placeholder/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Focused build/test validation is required after implementation. No RED-first test workflow was requested for this feature.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared contracts and current-state evidence before code changes.

- [x] T001 Review current image contracts in `specs/006-imagens-banners-placeholder/contracts/image-upload.md`
- [x] T002 Review current banner resolution contract in `specs/006-imagens-banners-placeholder/contracts/banner-resolution.md`
- [x] T003 Record implementation start and file scope in `sessoes/26-04-29_1_imagens-banners-placeholder.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared helper and backend image import capability needed by user stories.

- [x] T004 [P] Add URL upload/reupload support in `backend/src/services/cloudinary.ts`
- [x] T005 Add authenticated external URL import endpoint in `backend/src/routes/upload.ts`
- [x] T006 [P] Create canonical table image fallback helper in `frontend/src/utils/tableImage.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Preservar banners enviados por link (Priority: P1) MVP

**Goal**: External table banner URLs can be imported to durable hosting instead of being persisted as expiring direct links.

**Independent Test**: Submit an external banner URL and verify the saved value becomes a durable hosted URL when import succeeds.

- [x] T007 [US1] Integrate external URL import behavior into `frontend/src/components/ImageUploader.tsx`
- [x] T008 [US1] Preserve table payload compatibility in `frontend/src/features/create-table/utils/mapper.ts`
- [x] T009 [US1] Confirm backend table persistence still writes canonical `banner_url` in `backend/src/services/tableService.ts`

**Checkpoint**: User Story 1 should be independently functional.

---

## Phase 4: User Story 2 - Exibir o mesmo banner correto em todas as telas (Priority: P2)

**Goal**: A table with a valid banner displays the same image on home/catalog, master profile, dashboard and table detail.

**Independent Test**: Use a table with `banner_url` populated and `cover_url` null; confirm all affected surfaces show the real banner.

- [x] T010 [US2] Fix public master profile table image alias in `backend/src/routes/gm.ts`
- [x] T011 [US2] Keep public table route aliases aligned in `backend/src/routes/tables.ts`
- [x] T012 [US2] Keep GM panel table image alias aligned in `backend/src/routes/gmPanel.ts`
- [x] T013 [US2] Verify table view mapper consumes canonical cover URL in `frontend/src/features/table/mappers/tableViewMapper.ts`
- [x] T014 [US2] Verify master view mapper preserves mapped table images in `frontend/src/features/master/mappers/masterViewMapper.ts`

**Checkpoint**: User Story 2 should be independently functional.

---

## Phase 5: User Story 3 - Centralizar regras de placeholder e banner (Priority: P3)

**Goal**: Banner fallback logic lives in one reusable frontend utility instead of being duplicated across components.

**Independent Test**: Break a banner URL and confirm all affected components switch to the same placeholder behavior.

- [x] T015 [US3] Replace duplicated fallback in `frontend/src/components/TableCard.tsx`
- [x] T016 [US3] Replace duplicated fallback in `frontend/src/components/TableCardDashboard.tsx`
- [x] T017 [US3] Replace duplicated fallback in `frontend/src/components/mestre/MestreFeaturedTable.tsx`
- [x] T018 [US3] Replace duplicated fallback in `frontend/src/features/table/components/TableHero.tsx`
- [x] T019 [US3] Review master hero behavior in `frontend/src/components/mestre/MestreHero.tsx`

**Checkpoint**: User Story 3 should be independently functional.

---

## Phase 6: Profile Direct-Link Opt-Out

**Purpose**: Add the approved explicit profile exception without expanding it silently to table banners.

- [x] T020 Add `Manter link direto` control and tooltip copy in `frontend/src/components/AvatarUploader.tsx`
- [x] T021 Ensure profile URL behavior remains explicit in `frontend/src/components/AvatarUploader.tsx`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate, document and prepare handoff.

- [x] T022 Run `npm --prefix backend run build`
- [x] T023 Run `npm --prefix backend test -- --runInBand`
- [x] T024 Run `npm --prefix frontend run build`
- [x] T025 Run `git diff --check`
- [x] T026 Update `database/changelogs.json` if the user-facing change is included in this delivery
- [x] T027 Update `sessoes/26-04-29_1_imagens-banners-placeholder.md` with validation evidence and remaining rollout notes
- [ ] T028 After approved push/deploy to `dev`, validate home, catalog, master page, table page and master dashboard in beta using an anonymous browser window
- [x] T029 Add `Manter link direto` control to table banner URL input in `frontend/src/components/ImageUploader.tsx`
- [x] T030 Add `Manter link direto` control to profile manual URL inputs in `frontend/src/pages/ProfileEditPage.tsx`
- [x] T031 Centralize manual image URL import, opt-out flag and error handling in `frontend/src/hooks/useImageUrlImport.ts`
- [x] T032 Normalize legacy master profile list fields before editing to prevent panel crashes in `frontend/src/pages/Painel/EditGmProfileForm.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks user stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational; can be tested with existing data.
- **US3 (Phase 5)**: Depends on Foundational helper.
- **Profile Opt-Out (Phase 6)**: Depends on upload design decision; independent from table banner alias fix.
- **Polish (Phase 7)**: Depends on implemented scope.

### Parallel Opportunities

- T004 and T006 can run in parallel.
- T010, T011 and T012 are separate backend routes and can be reviewed independently.
- T015, T016, T017 and T018 touch separate frontend components after T006.

## Implementation Strategy

1. Complete T001-T006.
2. Deliver MVP with T007-T009.
3. Fix cross-surface display with T010-T014.
4. Centralize fallback with T015-T019.
5. Add profile opt-out with T020-T021.
6. Run local validation T022-T027.
7. Add regression fix T029 and redeploy to `dev` after approval.
8. After approved deploy to `dev`, run beta validation T028.
