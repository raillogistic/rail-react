# rail-react frontend refactor: multiphase technical implementation plan

This document converts `refactor_frontend.md` into an execution-ready,
multiphase implementation plan. You can use it as the delivery contract for
engineering work, code review gates, and CI rollout. It keeps current behavior
stable while moving the codebase to a reusable, project-manifest-driven
frontend architecture.

## Planning assumptions

This plan assumes the current app must stay shippable during migration. Every
phase therefore includes compatibility paths, incremental validation, and a
rollback boundary. You can run phases sequentially in one long-running branch
or as multiple smaller branches, but each phase must meet its exit criteria
before the next phase starts.

- Target repository root: `E:\Projects\libraries\rail-react`.
- Target runtime model: manifest-driven routes and navigation.
- Target layers: `app`, `processes`, `pages`, `widgets`, `features`,
  `entities`, `shared`.
- Constraint: no large "all-at-once" rewrites in one commit.

## Architecture guardrails

These guardrails are mandatory constraints for all implementation phases. If a
change violates one of these rules, treat it as out of plan and block merge
until resolved.

- Keep core runtime project-agnostic. Core modules in `src/app/*` must not
  directly import project pages.
- Generate route trees and navigation from project manifests only.
- Preserve behavior at each checkpoint through temporary compatibility layers.
- Maintain one GraphQL/API model in runtime after consolidation.
- Enforce one-way imports:
  `app -> processes -> pages -> widgets -> features -> entities -> shared`.

## Phase summary

This section gives you the implementation shape at a glance. The detailed phase
runbooks follow after this summary.

| Phase | Name | Duration | Primary outcome |
| --- | --- | --- | --- |
| 1 | Contracts and registry bootstrap | 1 to 1.5 weeks | Manifest contract and registry become available without behavior change. |
| 2 | Core manifest extraction | 1 week | Core route declarations move to `src/projects/core/manifest.ts`. |
| 3 | Shell and router ownership migration | 1.5 weeks | Composition ownership centralizes in `src/app/*`. |
| 4 | Domain module normalization | 2 weeks | Modules align to target layers with reference vertical slice. |
| 5 | GraphQL/API consolidation | 1 to 1.5 weeks | Duplicate GraphQL stacks converge into final boundary model. |
| 6 | Guardrails and hardening | 1 week | CI enforces architecture rules and compatibility debt is removed. |

## Phase 1: contracts and registry bootstrap

Phase 1 establishes the technical foundation for manifest-driven composition
while preserving the current route and navigation behavior. You do not remove
legacy paths here. You only introduce contracts and adapters so later phases
can migrate safely.

### Entry criteria

Before phase 1 starts, confirm prerequisites so regression triage stays clean.

- Current route/auth/navigation tests pass on the baseline branch.
- New route additions in `src/routes/links.tsx` are temporarily frozen.
- Team agrees to use manifest contract types for new route work.

### Workstreams

This phase has three workstreams that can run in parallel once contracts are
approved.

1. Define route and manifest contracts in `src/app/router/contracts.ts`.
2. Implement manifest auto-discovery in `src/app/router/manifestRegistry.ts`.
3. Add legacy adapter from `src/routes/links.tsx` to manifest output shape.

### Detailed implementation tasks

Use this sequence to reduce conflicts and keep the first integration branch
small.

1. Add contract types:
   `AppRouteConfig`, `NavigationEntry`, and `AppManifest`.
2. Add validation helpers to detect:
   duplicate route IDs, duplicate paths, missing defaults, and empty nav groups.
3. Implement eager manifest loading with:
   `import.meta.glob('@/projects/*/manifest.ts', { eager: true })`.
4. Expose registry selectors:
   `getAllRoutes`, `getNavigationGroups`, and `getDefaultRouteByProject`.
5. Build `legacyLinksAdapter` that transforms current links exports to
   `AppManifest`-compatible output.
6. Add feature flag for router source:
   `VITE_ROUTER_SOURCE=manifest|legacy`.

### Files expected in this phase

These file targets define scope and review boundaries.

- Add `src/app/router/contracts.ts`.
- Add `src/app/router/manifestValidation.ts`.
- Add `src/app/router/manifestRegistry.ts`.
- Add `src/app/router/legacyLinksAdapter.ts`.
- Update router entry wiring in current route composition modules.
- Add contract and registry tests in `src/app/router/__tests__/*`.

### Validation gates

Validation gates are phase blockers. Do not move to phase 2 if one fails.

- Route count parity between manifest mode and legacy mode.
- Navigation item parity for labels, grouping, and order.
- Auth guard parity for public and protected routes.
- Typecheck and unit tests pass for new router contract modules.

### Risks and mitigations

The largest risk in phase 1 is silent divergence between legacy and manifest
paths. Use explicit parity assertions to prevent hidden drift.

- Risk: dual-route source hides mismatched metadata.
  Mitigation: add parity diff test on route IDs, paths, and guards.
- Risk: non-deterministic manifest merge order.
  Mitigation: stable sort by project ID and route ID before export.

### Exit criteria

Phase 1 is complete when these criteria are true at merge time.

- Manifest registry is available and router can consume it.
- Legacy route definitions remain functional through adapter boundaries.
- No user-visible behavior changes in navigation or auth gating.

### Rollback boundary

If deployment risk appears, rollback remains low-cost at this stage.

- Set `VITE_ROUTER_SOURCE=legacy`.
- Keep contract files merged to avoid rework.
- Revert only router entrypoint wiring if needed.

## Phase 2: core manifest extraction

Phase 2 moves existing core route declarations into one canonical manifest.
Legacy exports remain for compatibility, but core route ownership shifts to
`src/projects/core/manifest.ts`.

### Entry criteria

Before phase 2 starts, ensure phase 1 outputs are stable in production-like
testing.

- Registry and adapter tests are green.
- Baseline route inventory is captured for parity comparison.
- Team confirms manifest contract fields are final for this migration window.

### Workstreams

This phase is organized around extraction, compatibility, and local extension
normalization.

1. Build `src/projects/core/manifest.ts` from current route declarations.
2. Reduce `src/routes/links.tsx` to compatibility wrappers only.
3. Convert `src/apps/routes.local.ts` to optional local manifest extension.

### Detailed implementation tasks

Follow this sequence to preserve compatibility.

1. Move route metadata and navigation groups from `src/routes/links.tsx` into
   `src/projects/core/manifest.ts`.
2. Keep page components lazy-loaded in manifest entries.
3. Define explicit `defaultRoute` in the core manifest.
4. Retain old exports in `src/routes/links.tsx` as wrappers and add deprecation
   comments.
5. Add import tracking that counts remaining runtime usages of legacy exports.
6. Normalize local route extension contract to optional manifest extension and
   ensure CI ignores local-only artifacts.

### Files expected in this phase

These files represent the minimum code movement expected in phase 2.

- Add `src/projects/core/manifest.ts`.
- Add `src/projects/core/index.ts`.
- Update `src/routes/links.tsx`.
- Add `src/routes/__tests__/links-compat.test.ts`.
- Add `src/app/router/localManifestExtension.ts` if local extension remains.

### Validation gates

Treat these checks as mandatory before moving to phase 3.

- Baseline and post-migration route lists match.
- Default route behavior is unchanged.
- Protected route list is unchanged.
- App boot is stable both with and without `routes.local.ts`.

### Risks and mitigations

Extraction can unintentionally change startup behavior if defaults drift. Keep
default route and auth constraints under explicit tests.

- Risk: default landing path changes after extraction.
  Mitigation: add startup route assertion tests.
- Risk: legacy wrappers persist and become permanent.
  Mitigation: add lint guard that blocks new runtime imports from wrappers.

### Exit criteria

Phase 2 is complete only when canonical ownership has moved.

- `src/projects/core/manifest.ts` is source of truth for core routes.
- `src/routes/links.tsx` is wrapper-only and marked deprecated.
- Registry path is default in runtime composition.

### Rollback boundary

Rollback remains straightforward and low-risk in this phase.

- Keep compatibility wrappers active.
- Route runtime can temporarily switch to legacy adapter source.

## Phase 3: shell and router ownership migration

Phase 3 resolves ownership ambiguity by moving composition concerns into
`src/app/*`. This phase does not redesign behavior. It only relocates runtime
composition boundaries and cleans provider indirection.

### Entry criteria

Start phase 3 only after core manifest extraction is stable.

- Phase 2 exit criteria are met.
- Current shell, router, and provider import consumers are inventoried.
- Integration tests exist for auth redirects and app shell rendering.

### Workstreams

This phase has three relocation streams.

1. Move shell modules from `src/layout/*` to `src/app/shell/*`.
2. Move route composition from `src/views/routes/*` to `src/app/router/*`.
3. Remove wrapper indirection from `src/views/providers/*`.

### Detailed implementation tasks

Execute path moves in small commits to reduce merge conflicts and isolate
regressions.

1. Move shell components and update imports in `src/App.tsx`.
2. Move `src/views/AuthDependentContent.tsx` into
   `src/app/bootstrap/AuthDependentContent.tsx`.
3. Move route assembly files from `src/views/routes/*` to `src/app/router/*`.
4. Update app bootstrap in `src/main.tsx` to consume canonical app-layer
   modules.
5. Replace `src/views/providers/*` runtime imports with canonical provider
   modules from current domain ownership.
6. Delete provider wrappers when import count reaches zero.

### Files expected in this phase

Use these paths as migration scope references.

- Move `src/layout/*` to `src/app/shell/*`.
- Move `src/views/routes/*` to `src/app/router/*`.
- Move `src/views/AuthDependentContent.tsx` to `src/app/bootstrap/*`.
- Update `src/App.tsx` and `src/main.tsx`.
- Remove runtime dependencies on `src/views/providers/*`.

### Validation gates

You need both behavioral and structural validation in this phase.

- Shell smoke tests pass on desktop and mobile layouts.
- Auth redirect scenarios are unchanged.
- Route transition tests are unchanged.
- Runtime search shows no imports from moved legacy paths.

### Risks and mitigations

Relocation phases often fail due import churn and provider order changes.

- Risk: provider order changes break context behavior.
  Mitigation: add provider-stack snapshot/integration test.
- Risk: path move introduces circular imports.
  Mitigation: run typecheck after each move batch and inspect import graph.

### Exit criteria

Phase 3 is complete when composition ownership is unified.

- Runtime shell/router/bootstrap ownership is in `src/app/*`.
- Legacy view-based router/provider paths are no longer runtime dependencies.

### Rollback boundary

Rollback remains bounded to composition entrypoints.

- Repoint entry modules to old paths if critical issues appear.
- Keep moved files committed so forward-fix remains quick.

## Phase 4: domain module normalization by layer

Phase 4 performs the largest structural migration. You classify and move modules
from mixed folders into target layers with one validated reference slice before
bulk moves.

### Entry criteria

Phase 4 requires stable app-layer composition from phase 3.

- Shell and router ownership migration is complete.
- Layer ownership rules are approved by maintainers.
- Migration matrix owner is assigned.

### Workstreams

This phase has three workstreams that reduce risk through incremental migration.

1. Build ownership matrix for mixed modules.
2. Migrate one vertical slice as a reference pattern.
3. Migrate remaining modules in bounded domain batches.

### Detailed implementation tasks

Use this run order to keep execution predictable.

1. Inventory modules under:
   `src/lib/*`, `src/views/settings/*`, and `src/auth/pages/*`.
2. Assign each module to one target layer based on responsibility.
3. Define migration matrix with:
   source path, target path, owners, and dependency constraints.
4. Select one slice (for example `model-import`) and migrate end-to-end using
   module template:
   `index.ts`, `ui/`, `model/`, `api/`, `lib/`, `__tests__/`.
5. Validate the slice as the canonical pattern.
6. Migrate remaining domains in sequence:
   auth, settings, import, and table/form related modules.
7. Use temporary re-export stubs from legacy paths during import rewrites.
8. Remove stubs as each batch reaches zero imports.

### Files expected in this phase

File movement is broad in this phase. Keep pull requests small and explicit.

- Migrate selected modules from `src/lib/*` into target layer folders.
- Migrate relevant modules from `src/views/settings/*` and `src/auth/pages/*`.
- Update route manifests for migrated page entrypoints.
- Add or update tests in migrated feature/page modules.

### Validation gates

Validation must run after each migration batch, not only at phase end.

- Full test suite passes after each batch.
- Layer import checks report only approved exceptions.
- Selected reference slice behavior matches baseline.
- Lazy chunk boundaries remain intact for migrated routes.

### Risks and mitigations

This phase is high-risk because it combines file moves, import rewrites, and
ownership decisions.

- Risk: merge conflict pressure from long-running branches.
  Mitigation: move in small PRs and merge frequently.
- Risk: inconsistent ownership assignments across reviewers.
  Mitigation: use signed-off migration matrix as source of truth.

### Exit criteria

Phase 4 is complete when most business modules align to target layers.

- Modules are primarily organized by ownership layers.
- Temporary stubs are limited to tracked exceptions with removal dates.
- Reference vertical slice is complete and reusable as migration template.

### Rollback boundary

Rollback must stay batch-scoped, never phase-scoped.

- Revert only the failing batch commit.
- Keep stubs active while forward-fixing moved imports.

## Phase 5: GraphQL/API consolidation

Phase 5 removes duplicated GraphQL responsibility and converges runtime behavior
to one API boundary model.

### Entry criteria

Start only when phase 4 has reduced ownership ambiguity.

- Most domain modules already sit in target layers.
- GraphQL call sites are inventoried.
- Apollo bootstrap ownership is agreed.

### Workstreams

This phase has three workstreams.

1. Establish final API boundary directories.
2. Migrate imports with temporary re-export shims.
3. Remove duplicate legacy GraphQL modules.

### Detailed implementation tasks

Follow this order to avoid breaking runtime API flows.

1. Keep Apollo client bootstrap in `src/shared/api/apollo/*`.
2. Move generic GraphQL composition helpers to `src/shared/api/graphql/*`.
3. Move auth-specific operations to `src/features/auth/api/*`.
4. Convert `src/graphql/*` and `src/lib/graphql/*` to temporary forward
   re-exports.
5. Migrate consumers in domain batches and track remaining legacy imports.
6. Delete legacy duplicate modules once runtime imports are zero.

### Files expected in this phase

Use these paths as scope boundaries.

- Update `src/shared/api/apollo/*`.
- Update `src/shared/api/graphql/*`.
- Update `src/features/auth/api/*`.
- Update and then retire `src/graphql/*` and `src/lib/graphql/*`.

### Validation gates

Run both functional and build-level checks before marking phase complete.

- Auth, metadata, and import integration tests pass.
- Production build succeeds with no legacy path imports.
- GraphQL boundary checks pass with one active runtime stack.

### Risks and mitigations

API consolidation can break low-visibility transitive imports.

- Risk: nested re-export chains hide unresolved dependencies.
  Mitigation: enforce forward-only shims and run import-graph checks.
- Risk: auth headers drift due duplicated utility ownership.
  Mitigation: keep one canonical auth-header utility and integration coverage.

### Exit criteria

Phase 5 is complete when duplicate runtime stacks no longer exist.

- One GraphQL/API boundary model is active in runtime.
- Legacy GraphQL roots are removed from runtime imports.

### Rollback boundary

Rollback is still possible without undoing earlier phases.

- Restore targeted re-export shims for blocked modules.
- Recover deleted legacy files from isolated commits if required.

## Phase 6: guardrails, CI enforcement, and hardening

Phase 6 finalizes architecture enforcement and removes temporary migration debt.
After this phase, architecture rules are enforced by automation rather than
review conventions.

### Entry criteria

Only start phase 6 once earlier phases are functionally complete.

- Phases 1 through 5 pass their exit criteria.
- Remaining exceptions are tracked and small.
- CI ownership for new checks is assigned.

### Workstreams

This final phase includes enforcement, quality gates, and debt removal.

1. Add lint and CI import-boundary enforcement.
2. Add manifest integrity checks.
3. Remove remaining compatibility wrappers from runtime paths.

### Detailed implementation tasks

Use this sequence for stable rollout.

1. Add layer import restrictions in `eslint.config.js`.
2. Add a CI script that fails forbidden cross-layer imports.
3. Roll out in warning mode, then move to fail mode.
4. Add manifest checks for:
   duplicate IDs, duplicate paths, missing defaults, and nav-route mismatch.
5. Delete temporary wrappers still on runtime paths in router/provider/API
   boundaries.
6. Run full regression suite and production build as final merge gate.

### Files expected in this phase

These files represent expected hardening changes.

- Update `eslint.config.js`.
- Add or update scripts under `scripts/` for layer and manifest checks.
- Update CI pipeline configuration.
- Delete runtime compatibility wrappers that are no longer needed.

### Validation gates

Treat these gates as non-negotiable for plan completion.

- CI blocks new forbidden imports.
- Manifest checks fail fast with actionable path-specific errors.
- Lint, tests, and production build are green.
- Runtime import scan confirms no deprecated wrappers.

### Risks and mitigations

Final enforcement phases can fail due false-positive checks and hidden
dependencies.

- Risk: over-broad lint rules create noise.
  Mitigation: include explicit allowlists for contracts and type-only imports.
- Risk: cleanup exposes hidden runtime dependencies.
  Mitigation: remove wrappers in isolated commits with immediate rollback path.

### Exit criteria

Phase 6 is complete when architecture constraints are enforceable and clean.

- Architecture guardrails are encoded in CI.
- Manifest quality gates are active.
- Compatibility debt is removed from runtime code paths.

### Rollback boundary

If emergency unblock is required, rollback must stay explicit and temporary.

- Downgrade failing checks to warning mode only for a short stabilization
  window.
- Restore specific wrappers behind tracked deprecation tasks.

## Cross-phase testing strategy

This migration remains safe only if you test continuously, not only at phase
boundaries. Run focused tests per batch and full regression at each phase exit.

- Per-commit:
  typecheck, affected-unit tests, and lint.
- Per-batch:
  route parity, auth redirects, and layer import checks.
- Per-phase:
  full test suite and production build.
- Pre-release:
  manifest integrity checks, route/nav parity checks, and runtime import scan
  for deprecated paths.

## Definition of done

The refactor is complete only when new project onboarding does not require core
runtime edits.

- A new project can be added through `src/projects/<project>/manifest.ts` and
  feature/page modules only.
- `src/main.tsx`, `src/App.tsx`, and core app shell/router files remain
  unchanged when adding a project.
- Routing and navigation are generated only from manifests.
- No runtime imports remain from compatibility wrappers.
- Lint, tests, manifest checks, and production build pass in CI.

## Recommended execution order

Use this order to start implementation immediately after plan approval.

1. Implement phases 1 and 2 to establish contracts and core manifest source of
   truth.
2. Execute phase 3 to centralize runtime ownership in `src/app/*`.
3. Run phase 4 with one reference vertical slice before broad module migration.
4. Complete phase 5 API consolidation.
5. Finalize phase 6 CI enforcement and debt cleanup.
