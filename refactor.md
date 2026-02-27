# rail-react refactor plan (library boundary + fsd hardening)

## Execution status (February 27, 2026)

This plan has now been executed end-to-end in the repository. The architecture
constraints, build pipeline, and test suite all pass on the current head.

- Architecture checks:
  - `npm run check:layers` -> pass
  - `npm run check:layers:full` -> pass
  - `npm run check:manifests` -> pass
- Build validation:
  - `npm run build` -> pass
- Test validation:
  - `npm run test -- --run` -> pass (`110` files, `502` tests)

## Completion summary

The following workstreams from this document are complete in code:

1. Remove test-to-page coupling.
2. Decouple `shared/api/apollo` from `features/auth`.
3. Move metadata query contracts out of feature/widget ownership.
4. Invert `entities/model-metadata` type dependency.
5. Decouple `shared/ui/theme` from auth context.
6. Establish library entry boundary.
7. Retire migration overrides and enforce strict checks.

## Decisions resolved during implementation

The implementation resolved the open decisions from this plan:

1. Library entry strategy:
   - Root-level curated library boundary is in place and excludes consumer
     composition layers (`src/pages`, `src/app`, and `src/projects`).
2. Auth adapter model:
   - Shared/auth integration now uses shared contracts and compatibility-safe
     boundaries instead of direct feature-layer dependencies.
3. Metadata contract ownership:
   - Metadata query contracts are owned at lower layers and consumed from shared
     infrastructure without `shared -> widgets/features` coupling.

This plan converts the current architecture into a clean, reusable library core.
The focus is to remove cross-layer coupling, retire temporary layer overrides, and
make `src/shared` through `src/widgets` publishable without `src/app` or
`src/pages` dependencies.

## Objectives

This section defines the outcomes we must achieve before calling the refactor
complete.

- Enforce one-way FSD dependencies across `shared -> entities -> features ->
  widgets -> pages -> app`.
- Remove temporary `pathOverrides` used to mask violations in
  `scripts/layer-migration-map.json`.
- Establish a stable library entry point that excludes consumer app code.
- Preserve behavior while refactoring by validating architecture checks and tests
  after each phase.

## Non-goals

This section prevents scope creep during the refactor.

- No UI redesign or feature behavior changes.
- No backend API schema changes.
- No broad rewrite of routing or authentication flows unless required to decouple
  imports.

## Current violations (validated in code)

These are concrete violations currently present and targeted by this plan.

1. `src/shared` depends on `src/features`:
   - `src/shared/api/apollo/client.ts` imports `@/features/auth/utils/*`.
   - `src/shared/ui/theme/ThemeProvider.tsx` imports
     `@/features/auth/context`.
   - `src/shared/api/graphql/graphql/metadata/{persisted-cache,warmup}.ts`
     imports `@/features/model-table/filtering/queries`.
2. `src/entities` depends on `src/widgets`:
   - `src/entities/model-metadata/types.ts` imports widget-owned types.
3. `src/features` tests depend on `src/pages`:
   - `src/features/auth/pages/__tests__/*` imports `@/pages/auth/*`.
4. Layer overrides currently hide these issues:
   - `shared/api/apollo -> features`
   - `shared/api/graphql/graphql -> widgets`
   - `shared/ui/theme -> features`
   - `entities/model-metadata -> widgets`
   - additional temporary overrides in `scripts/layer-migration-map.json`

## Target architecture

The desired state separates reusable library code from app composition code.

- `src/shared` contains transport primitives, generic hooks, UI primitives, and
  no feature imports.
- `src/entities` owns domain contracts and types consumed by features/widgets.
- `src/features` composes entities/shared but does not depend on pages.
- `src/widgets` composes features/entities/shared and remains page-agnostic.
- `src/pages`, `src/app`, and `src/projects` become consumer composition layers.
- A public export entry (for example `src/index.ts`) exposes library-safe
  modules only.

## Refactor workstreams

Each workstream is independently deliverable and should land in small PRs.

### 1) Remove test-to-page coupling

This is the lowest-risk start and reduces false dependencies quickly.

1. Move `src/features/auth/pages/__tests__/*` into `src/pages/auth/__tests__/`
   or `src/test/` integration scope.
2. Keep auth feature unit tests in `src/features/auth` but mock page-level
   composition.
3. Update import paths and test setup to avoid `features -> pages` coupling.

### 2) Decouple `shared/api/apollo` from `features/auth`

This workstream establishes a shared auth adapter contract.

1. Create `src/shared/api/auth` contracts for token access, CSRF handling, and
   auth error dispatching.
2. Replace direct imports from `@/features/auth/utils/*` with injected adapters
   or shared implementations.
3. Keep refresh logic in shared transport, but route feature-specific side
   effects through callbacks/interfaces.

### 3) Move metadata query contracts out of feature/widget ownership

This workstream removes shared metadata cache dependencies on upper layers.

1. Relocate `FILTER_METADATA_QUERY` and `GET_MODEL_SCHEMA` ownership to a lower
   layer (`entities/model-metadata` or `shared/api/graphql/contracts`).
2. Update `persisted-cache.ts` and `warmup.ts` to consume new lower-layer query
   exports.
3. Keep backward-compatible re-exports temporarily, then remove once call sites
   are migrated.

### 4) Invert `entities/model-metadata` type dependency

This workstream establishes entities as the source of truth for metadata types.

1. Move or redefine `ModelTableType`, `ModelSchema`, and permission snapshot
   types under `entities/model-metadata`.
2. Update widgets to consume entity-owned contracts.
3. Remove `entities -> widgets` type imports.

### 5) Decouple `shared/ui/theme` from auth context

This workstream removes hidden feature coupling from UI infrastructure.

1. Replace direct `useAuthContext` usage in `ThemeProvider` with a minimal shared
   user/session provider contract.
2. Let feature/app layers wire auth state into theme synchronization.
3. Keep local-storage behavior unchanged during migration.

### 6) Establish library entry boundary

This workstream prepares rail-react for package-style consumption.

1. Add explicit library export entry (`src/index.ts`) with curated exports from
   shared/entities/features/widgets.
2. Exclude `src/pages`, `src/app`, and `src/projects` from library exports.
3. Align build/package config to the new entry when packaging begins.

### 7) Retire migration overrides

This workstream turns temporary mapping into enforceable architecture rules.

1. Remove path overrides incrementally from
   `scripts/layer-migration-map.json` as each workstream completes.
2. Run architecture checks after every override removal.
3. Keep `check-layer-imports-full` strict in CI once all overrides are removed.

## Execution sequence

This sequence minimizes risk and reduces merge conflicts.

1. Workstream 1 (tests).
2. Workstream 4 (entity contract ownership).
3. Workstream 3 (metadata query ownership).
4. Workstream 2 (apollo/auth adapter split).
5. Workstream 5 (theme/auth decoupling).
6. Workstream 6 (library exports).
7. Workstream 7 (override cleanup + strict enforcement).

## Validation checklist

Run this checklist after each workstream PR and again before final merge.

1. `npm run check:layers`
2. `npm run check:layers:full`
3. `npm run check:manifests`
4. `npm run test -- --run`
5. Build smoke check for consumer app entry (`npm run build`)

## Definition of done

The refactor is complete only when all conditions below are true.

- `scripts/layer-migration-map.json` has no temporary overrides for shared,
  entities, or feature paths used in this refactor.
- No `shared -> features/widgets/pages` imports remain.
- No `entities -> widgets/pages/app` imports remain.
- No `features -> pages` imports remain (including tests in feature folders).
- A library entry point exists and excludes consumer app/page code.
- Architecture checks and tests pass in CI.

## Remaining follow-up (non-blocking)

Refactor completion criteria are satisfied. Remaining improvements are optional:

1. Split oversized production chunks reported by Vite warnings.
2. Remove transitional type-compat shims once downstream code is tightened.
