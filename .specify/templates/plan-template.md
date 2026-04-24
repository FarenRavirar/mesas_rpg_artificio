# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [e.g., library/cli/web-service/mobile-app/compiler/desktop-app or NEEDS CLARIFICATION]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Adjust the structure below based on which modules this feature affects.
  Remove sections that are not relevant to this specific feature.
-->

```text
backend/
├── src/
│   ├── db/              # Database connection (Kysely query builder)
│   ├── domain/          # Business entities and types
│   ├── middleware/      # Express middleware (auth, rate-limit, error handling)
│   ├── repositories/    # Data access layer
│   ├── routes/          # HTTP route handlers
│   ├── services/        # Business logic layer
│   ├── utils/           # Shared utilities
│   ├── validators/      # Zod schemas for request validation
│   └── server.ts        # Express server entry point
├── migrations/          # SQL migrations (if not in database/)
└── package.json         # Backend dependencies (Express, Kysely, JWT, etc.)

frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts
│   ├── features/        # Feature-specific modules
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Route pages
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # API client services
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Shared utilities
└── package.json         # Frontend dependencies (React, Vite, TailwindCSS, etc.)

database/
└── migration_NNN_*.sql  # PostgreSQL migrations (sequential numbering)

scripts/
└── [deployment and maintenance scripts]
```

**Structure Decision**: This project uses a **monorepo with separated frontend/backend/database** modules. Features typically span multiple modules (e.g., API endpoint in backend + UI in frontend + schema change in database).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
