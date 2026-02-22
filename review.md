# rail-react code review

## Executive summary
This review was performed on the current working tree under `rail-react/`.
The project has strong test coverage and useful architecture guard scripts, but
the current quality baseline is blocked by lint debt, partial architecture
migration, and structural duplication. The largest improvement opportunity is to
stabilize standards first, then complete the migration from legacy `src/lib`
and compatibility wrappers into explicit feature/page/shared modules.

## Phase execution report (February 22, 2026)
This section records the results of executing the refactor phases and running
the associated checks in the current branch.

### What was implemented
- Added changed-file lint workflow (`lint`, `lint:changed`) and a full mode
  (`lint:full`).
- Added encoding guard script with phased behavior:
  changed-files by default, full-repo with `--full`.
- Added architecture full-scan script and migration map:
  `check:layers:full` and `check:architecture:full`.
- Added path-level migration overrides to keep layer checks actionable while
  legacy folders are still in transition.
- Added split test scripts:
  `test:unit`, `test:integration`, and `test:all`.
- Added shared reusable modules for brand/system config and user identity:
  `src/shared/config/branding.ts` and
  `src/shared/auth/userIdentity.ts`.
- Removed duplicated route string usage in edited files by using `ROUTES`.
- Reworked duplicated account menu components to share identity handling
  through prop-driven composition.
- Removed compatibility wrappers in:
  `src/auth/pages/*`,
  `src/auth/{LoginPage,ForgotPasswordPage,ResetPasswordPage}.tsx`,
  and `src/features/import/*`.
- Migrated route imports to canonical modules
  (`@/pages/auth/*` and `@/lib/import/pages/ModelImportPage`).
- Improved type safety in edited auth and router modules by removing unsafe
  casts in touched code paths.

### Validation results after implementation
Commands and latest outcomes:
- `npm run check:architecture`: passed.
- `npm run check:architecture:full`: passed with `0` mapped violations.
- `npm run check:encoding`: passed on changed-files scan.
- `npm run lint`: passed on changed-files scan.
- `npm run lint:full`: failed with baseline debt (`646` errors,
  `43` warnings).
- `npm run test:all`: passed (`102` unit test files, `8` integration test
  files).
- `npm run build`: failed due existing TypeScript debt outside this refactor
  scope.

### Phase-by-phase status
- **Phase 1 (stabilize quality gates):** mostly complete.
  Changed-file lint and encoding checks are active and passing. Full lint debt
  remains as expected baseline work.
- **Phase 2 (architecture migration map):** complete for current migration
  scope.
  Full scan and mapping now run clean with explicit top-folder and path-level
  migration rules.
- **Phase 3 (remove wrappers and duplication):** complete for auth/import
  wrapper targets.
  Wrapper layers were removed and route imports now use canonical module paths.
- **Phase 4 (type-safety hardening):** in progress.
  Typed improvements were made in touched auth/router files and test mocks.
  Repository-wide strictness targets are not yet met.
- **Phase 5 (modularization for reuse):** in progress.
  Brand and identity helpers are extracted and reusable shell components now
  depend on injected navigation/user contracts instead of app/auth internals.
- **Phase 6 (test and release hardening):** mostly complete for scripts and CI
  workflow shape. Unit/integration split is active and verified with full
  `test:all` runs.

## Scope and evidence
The review focused on:
- code quality and redundancy
- code consistency
- best practices
- structure for reuse in other projects with minimal change

Validation commands and outputs:
- `npm run check:architecture` passed (`check:layers` + `check:manifests`).
- `npm run lint` failed with `1114` errors and `41` warnings.
- `npm run test -- --run` passed (`110` test files, `457` tests).

Repository structure metrics:
- Total files under `src/`: `661`.
- Files in explicit layered folders (`app/processes/pages/widgets/features/entities/shared`): `50`.
- Files under `src/lib`: `474`.
- `scripts/check-layer-imports.mjs` reports `56` scanned files.

## Findings (ordered by severity)

### 1. High: lint baseline is not actionable
Evidence:
- `npm run lint` reports `1114` errors and `41` warnings.
- Top lint rules by count:
  - `@typescript-eslint/no-explicit-any`: `808`
  - `@typescript-eslint/no-unused-vars`: `158`
  - `react-refresh/only-export-components`: `87`
- `src/schema.ts:1` and `src/schema.ts:2` indicate generated content, while
  generated scalar mappings still emit `any` (`src/schema.ts:22`, `src/schema.ts:24`, `src/schema.ts:26`).
- ESLint ignores do not include generated files (`eslint.config.js:19` to `eslint.config.js:23`).

Impact:
- PR quality gates are noisy and hard to trust.
- Real regressions can be hidden by existing noise.

Recommendation:
- Establish a lint baseline policy:
  - exclude generated files or generate lint-safe output
  - enforce `no-explicit-any` only in hand-written code first
  - fail CI only on changed files until debt is reduced

### 2. High: architecture enforcement covers a minority of code
Evidence:
- Import-layer validation only checks these folders:
  `app/processes/pages/widgets/features/entities/shared`
  (`scripts/check-layer-imports.mjs:91` to `scripts/check-layer-imports.mjs:93`).
- The check reported `56` scanned files.
- Current `src/` contains `661` files, with only `50` in layered folders.

Impact:
- Architecture checks can pass while most runtime code remains unconstrained.
- Layering guarantees are currently partial.

Recommendation:
- Expand import boundary checks to include legacy domains (`auth`, `lib`,
  `graphql`, `utils`) during migration.
- Add a migration map from each legacy folder to its target layer.

### 3. High: migration layers are mostly compatibility wrappers
Evidence:
- `src/auth/pages/*.tsx` are one-line re-exports (`src/auth/pages/LoginPage.tsx:1`,
  `src/auth/pages/ForgotPasswordPage.tsx:1`, `src/auth/pages/index.ts:1`).
- `src/features/import/*` is mostly wrappers (`src/features/import/pages/ModelImportPage.tsx:1`,
  `src/features/import/api/index.ts:1`, `src/features/import/model/index.ts:1`).
- Routing imports both old and new paths:
  - `src/app/router/RouteBuilder.tsx:18` imports from `@/auth/pages`
  - `src/projects/core/manifest.tsx:68` and `src/projects/core/manifest.tsx:74`
    import from `@/pages/auth`

Impact:
- Adds indirection without reducing coupling.
- Increases maintenance overhead and confusion during onboarding.

Recommendation:
- Set a canonical source path for each module.
- Remove wrappers once consumers are migrated.
- Track wrapper removal in a dedicated deprecation checklist.

### 4. High: text encoding corruption exists in UI and generated artifacts
Evidence:
- Corrupted strings in UI:
  - `src/app/shell/AppNavbar.tsx:167`, `src/app/shell/AppNavbar.tsx:185`
  - `src/pages/auth/LoginPage.tsx:249`, `src/pages/auth/LoginPage.tsx:270`
  - `src/lib/components/user-nav.tsx:97`, `src/lib/components/user-nav.tsx:126`
- Corrupted comments in generated types:
  - `src/models.ts:6`, `src/models.ts:8`, `src/models.ts:20`

Impact:
- User-facing text quality is degraded.
- Reuse in other projects/locales is risky.

Recommendation:
- Normalize encoding to UTF-8 end-to-end in generators and editors.
- Add an automated check for mojibake patterns in CI.

### 5. Medium: duplicated user-menu implementations increase redundancy
Evidence:
- `src/lib/components/user-nav.tsx:32` (`UserNav`)
- `src/lib/components/nav-user.tsx:40` (`NavUser`)
- Both implement similar identity, avatar, and logout logic.

Impact:
- Behavior drift and duplicated bug fixes.

Recommendation:
- Keep one shared account-menu primitive and expose style variants via props.

### 6. Medium: route constants are not consistently used
Evidence:
- Hard-coded route strings in multiple components:
  - `src/lib/components/user-nav.tsx:88`, `src/lib/components/user-nav.tsx:95`,
    `src/lib/components/user-nav.tsx:102`
  - `src/lib/components/nav-user.tsx:135`, `src/lib/components/nav-user.tsx:141`
  - `src/lib/components/command-menu.tsx:196`, `src/lib/components/command-menu.tsx:204`
  - `src/auth/utils/authGuard.ts:58`, `src/auth/utils/authGuard.ts:64`
  - `src/shared/api/apollo/client.ts:362`

Impact:
- Route changes require broad string replacement and can break silently.

Recommendation:
- Use `ROUTES` everywhere (UI, guards, data clients, tests).
- Add a lint rule to disallow hard-coded app paths.

### 7. Medium: type-safety policy is inconsistent
Evidence:
- `tsconfig.app.json:28` has strict mode commented out.
- `tsconfig.app.json:30` and `tsconfig.app.json:31` disable unused checks.
- Explicit `any` in core auth path (`src/auth/context/ConnectedAuthProvider.tsx:23`).
- Approximate auth state mapping in `src/auth/hooks/useAuth.ts:27` and
  `src/auth/hooks/useAuth.ts:28`.

Impact:
- Higher runtime risk in auth/session paths.
- Type system provides less value than intended.

Recommendation:
- Enable stricter TS rules incrementally.
- Define explicit auth state discriminated unions.
- Replace `any` in auth and routing first.

### 8. Medium: large monolithic modules reduce reuse and maintainability
Evidence:
- Very large files:
  - `src/lib/table/components/DynamicModelTable.tsx` (`1209` lines)
  - `src/lib/details/builtInSections/ModelSection.tsx` (`1145` lines)
  - `src/lib/theme/themes.ts` (`3506` lines)
  - `src/lib/theme/ThemeProvider.tsx` (`627` lines)

Impact:
- Harder testing, slower review cycles, and lower portability.

Recommendation:
- Split by domain responsibilities (data hooks, state, rendering, actions).
- Extract pure utilities and typed interfaces to shared modules.

### 9. Low: dev perf cleanup interval is unmanaged at module scope
Evidence:
- `window.setInterval` is created in `src/main.tsx:20` without cleanup.

Impact:
- Can stack timers during repeated HMR cycles.

Recommendation:
- Guard with HMR disposal (`import.meta.hot?.dispose`) or move into a managed
  effect with cleanup.

### 10. Low: route config has dead or partially wired elements
Evidence:
- Manifest defines not-found route (`src/projects/core/manifest.tsx:105` and
  `src/projects/core/manifest.tsx:106`) but `RouteBuilder` does not wire
  `ROUTES.NOT_FOUND` (`src/app/router/RouteBuilder.tsx:30` to `src/app/router/RouteBuilder.tsx:58`).
- `ProtectedRoutes` is exported but unused (`src/app/router/RouteBuilder.tsx:72`).

Impact:
- Increases confusion and maintenance cost.

Recommendation:
- Remove dead route exports or complete wiring and tests.

## Recommendations by requested review subject

### Code quality and redundancy
- Baseline and reduce lint debt before feature work.
- Remove compatibility wrappers once import migration is done.
- Consolidate duplicate UI components (`UserNav` and `NavUser`).
- Split monolith files into testable, typed units.

### Code consistency
- Use one canonical import path per module.
- Enforce route constants (`ROUTES`) instead of inline strings.
- Standardize encoding and localization strategy.
- Align naming/style conventions between `auth`, `pages`, and `features`.

### Best practices
- Turn strict TS checks on incrementally and enforce for new code.
- Add generator-safe lint strategy for `schema.ts` and `models.ts`.
- Keep architecture checks and lint checks aligned with real folder usage.
- Separate fast unit tests from real-endpoint integration tests in scripts.

### Reusability in other projects with minimal changes
- Extract branding (names, logos, copy) into a runtime configuration module.
- Isolate project-specific manifests and feature toggles from shared shell code.
- Define stable public APIs for `shared` and feature packages.
- Keep domain text and route metadata in data/config, not component internals.

## Multi-phase technical refactor plan

### Phase 1: stabilize quality gates (1 to 2 weeks)
Goals:
- Make CI quality signals trustworthy.

Actions:
- Add generated-file lint policy.
- Introduce changed-files lint mode in CI.
- Add UTF-8 validation and mojibake scanner.

Exit criteria:
- CI fails only on actionable issues in edited code.
- Lint errors reduced by at least 60 percent from current baseline.

### Phase 2: complete architecture migration map (2 weeks)
Goals:
- Make architecture checks reflect real codebase boundaries.

Actions:
- Extend boundary checks to `auth/lib/graphql/utils`.
- Publish migration map from legacy folders to target layers.
- Mark wrappers as deprecated with removal deadlines.

Exit criteria:
- Boundary checker scans at least 80 percent of `src` files.
- Every wrapper has an owner and removal milestone.

### Phase 3: remove compatibility wrappers and duplicate modules (2 to 3 weeks)
Goals:
- Reduce redundancy and path ambiguity.

Actions:
- Migrate imports from wrapper paths to canonical modules.
- Delete one-line wrappers in `src/auth/pages` and `src/features/import`.
- Merge `UserNav` and `NavUser` into a single composable module.

Exit criteria:
- Wrapper count reduced to zero or only temporary audited exceptions.
- No dual-path imports for the same logical module.

### Phase 4: type-safety hardening (2 weeks)
Goals:
- Improve correctness in auth/routing and shared infrastructure.

Actions:
- Replace `any` in auth/session/routing paths.
- Introduce explicit auth state machine types.
- Enable `noUnusedLocals` and `noUnusedParameters` in staged mode.

Exit criteria:
- `no-explicit-any` violations reduced by at least 80 percent in hand-written
  code.
- Auth and routing modules compile under stricter TS rules.

### Phase 5: modularization for reuse (3 to 4 weeks)
Goals:
- Make UI shell and data features portable to other projects.

Actions:
- Extract branding and copy to configuration.
- Split large modules into presentation, state, and data layers.
- Define stable interfaces for reusable packages (`shared`, core features).

Exit criteria:
- Project branding can be swapped without editing shared components.
- Largest reusable modules are under 400 lines and covered by unit tests.

### Phase 6: test strategy and release hardening (1 to 2 weeks)
Goals:
- Keep test feedback fast and deterministic.

Actions:
- Split scripts into unit-only and integration-real-endpoint variants.
- Run endpoint tests in dedicated CI stage with explicit credentials.
- Add architecture, lint, and encoding checks to mandatory PR pipeline.

Exit criteria:
- Default local `npm test` remains fast and deterministic.
- Real-endpoint tests run only in explicit integration stage.

## Closing note
The project already has strong momentum: manifest validation, architecture
scripts, and broad tests are in place. The next step is to align quality gates
and structure so these controls cover the real code surface area, then remove
migration residue to make reuse straightforward.
