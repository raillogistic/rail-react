#!/usr/bin/env python3
"""
Multi-phase technical implementation plan for rail-react frontend refactor.

Source: refactor_frontend.md
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass


TextList = tuple[str, ...]


@dataclass(frozen=True)
class WorkItem:
    id: str
    title: str
    steps: TextList
    files: TextList
    validation: TextList
    risks: TextList = ()
    mitigations: TextList = ()


@dataclass(frozen=True)
class Phase:
    number: int
    name: str
    objective: str
    duration: str
    dependencies: TextList
    deliverables: TextList
    work_items: tuple[WorkItem, ...]
    exit_criteria: TextList
    rollback: TextList


GUARDRAILS: TextList = (
    "Do not import project pages directly from core runtime in src/app/*.",
    "Generate navigation and routing from src/projects/*/manifest.ts only.",
    "Keep migration backward-compatible with temporary wrappers until each phase exits.",
    "Consolidate GraphQL ownership into shared API foundations and feature-specific domain APIs.",
    "Enforce one-way layer imports: app -> processes -> pages -> widgets -> features -> entities -> shared.",
)


PHASES: tuple[Phase, ...] = (
    Phase(
        number=1,
        name="Contracts and registry bootstrap",
        objective="Create a manifest contract and registry while preserving current behavior.",
        duration="1 to 1.5 weeks",
        dependencies=(
            "Current route and navigation tests pass before phase start.",
            "Route additions in src/routes/links.tsx are frozen during the phase.",
        ),
        deliverables=(
            "Typed manifest contract for routes and navigation.",
            "Manifest registry auto-loading src/projects/*/manifest.ts.",
            "Legacy adapter bridging src/routes/links.tsx to new registry consumers.",
        ),
        work_items=(
            WorkItem(
                id="P1-W1",
                title="Define contract and validation",
                steps=(
                    "Add AppRouteConfig, NavigationEntry, and AppManifest in src/app/router/contracts.ts.",
                    "Add runtime checks for duplicate route ids and duplicate paths.",
                    "Expose typed builders so future manifests stay consistent.",
                ),
                files=(
                    "src/app/router/contracts.ts",
                    "src/app/router/manifestValidation.ts",
                    "src/app/router/__tests__/contracts.test.ts",
                ),
                validation=(
                    "Typecheck with zero contract errors.",
                    "Unit tests cover duplicate/missing contract field cases.",
                ),
                risks=("Validation may block local iteration if too strict.",),
                mitigations=("Keep warn mode in development and fail mode in CI/prod.",),
            ),
            WorkItem(
                id="P1-W2",
                title="Create manifest registry",
                steps=(
                    "Implement import.meta.glob discovery in src/app/router/manifestRegistry.ts.",
                    "Normalize and sort manifests and routes for deterministic output.",
                    "Export selectors for routes, navigation groups, and default routes.",
                ),
                files=(
                    "src/app/router/manifestRegistry.ts",
                    "src/app/router/__tests__/manifestRegistry.test.ts",
                ),
                validation=(
                    "Registry snapshots are stable across builds.",
                    "Every discovered manifest is parsed and validated.",
                ),
                risks=("Manifest merge order could drift across environments.",),
                mitigations=("Sort by project id and route id before export.",),
            ),
            WorkItem(
                id="P1-W3",
                title="Wire compatibility adapter",
                steps=(
                    "Create legacyLinksAdapter to map existing links to manifest shape.",
                    "Update router assembly to read registry output with legacy fallback.",
                    "Gate runtime source with VITE_ROUTER_SOURCE=manifest|legacy.",
                ),
                files=(
                    "src/app/router/legacyLinksAdapter.ts",
                    "src/views/routes/* or new router entry module",
                    "src/routes/links.tsx",
                ),
                validation=(
                    "Manifest mode and legacy mode produce equivalent route counts.",
                    "Sidebar labels and auth guard behavior remain unchanged.",
                ),
                risks=("Dual sources can hide route mismatches.",),
                mitigations=("Add route diff tests between legacy and manifest outputs.",),
            ),
        ),
        exit_criteria=(
            "Registry is the preferred runtime source.",
            "Legacy declarations are consumed through adapters only.",
            "No user-facing regression in routing/navigation flows.",
        ),
        rollback=(
            "Set VITE_ROUTER_SOURCE=legacy.",
            "Restore prior router imports while keeping contract files for retry.",
        ),
    ),
    Phase(
        number=2,
        name="Core manifest extraction",
        objective="Move current project route declarations into src/projects/core/manifest.ts.",
        duration="1 week",
        dependencies=(
            "Phase 1 registry is merged and used by router entrypoint.",
            "Route inventory baseline is captured for parity tests.",
        ),
        deliverables=(
            "Core route/navigation declaration in one manifest file.",
            "src/routes/links.tsx reduced to compatibility wrappers.",
            "Local extension path converted to optional manifest extension contract.",
        ),
        work_items=(
            WorkItem(
                id="P2-W1",
                title="Create core manifest",
                steps=(
                    "Move route metadata and nav groups from links.tsx into src/projects/core/manifest.ts.",
                    "Use lazy imports for page components in manifest entries.",
                    "Set explicit defaultRoute in the manifest.",
                ),
                files=(
                    "src/projects/core/manifest.ts",
                    "src/projects/core/index.ts",
                    "src/routes/links.tsx",
                ),
                validation=(
                    "Route parity test matches baseline path list.",
                    "Default route and protected route checks pass.",
                ),
                risks=("Default landing page could change unintentionally.",),
                mitigations=("Add tests for default route and auth-required routes.",),
            ),
            WorkItem(
                id="P2-W2",
                title="Convert links.tsx to wrapper-only module",
                steps=(
                    "Replace concrete declarations with re-exports/adapters.",
                    "Add deprecation markers and usage warnings for runtime imports.",
                    "Track import count of legacy wrapper references.",
                ),
                files=(
                    "src/routes/links.tsx",
                    "src/routes/__tests__/links-compat.test.ts",
                ),
                validation=(
                    "No router assembly path imports direct declarations from links.tsx.",
                    "Compatibility imports still satisfy existing call sites.",
                ),
                risks=("Wrappers may become permanent if not enforced.",),
                mitigations=("Block new imports via lint/CI rule after migration.",),
            ),
            WorkItem(
                id="P2-W3",
                title="Standardize local override mechanism",
                steps=(
                    "Adapt src/apps/routes.local.ts to output optional local manifest extension.",
                    "Ensure production and CI builds do not depend on local-only files.",
                    "Document manifest-only extension policy for shared projects.",
                ),
                files=(
                    "src/apps/routes.local.ts (if present)",
                    "src/app/router/localManifestExtension.ts",
                ),
                validation=(
                    "App boots with and without local routes file.",
                    "CI artifacts are deterministic.",
                ),
                risks=("Developers may keep adding shared behavior to local files.",),
                mitigations=("Add review/lint checks for local-file import boundaries.",),
            ),
        ),
        exit_criteria=(
            "src/projects/core/manifest.ts is source of truth for core routes.",
            "links.tsx is wrapper-only and deprecated.",
            "Manifest registry is default runtime path.",
        ),
        rollback=(
            "Switch router source to legacy adapter and restore old imports.",
            "Keep extracted manifest for iterative retry.",
        ),
    ),
    Phase(
        number=3,
        name="Shell, bootstrap, and router ownership migration",
        objective="Move composition concerns from mixed folders into stable src/app boundaries.",
        duration="1.5 weeks",
        dependencies=(
            "Phase 2 extraction complete.",
            "Import consumers for layout/routes/providers are inventoried.",
        ),
        deliverables=(
            "src/layout/* moved to src/app/shell/*.",
            "src/views/routes/* moved to src/app/router/*.",
            "Auth-dependent bootstrap moved to src/app/bootstrap/*.",
            "Provider wrappers in src/views/providers/* retired.",
        ),
        work_items=(
            WorkItem(
                id="P3-W1",
                title="Move shell components",
                steps=(
                    "Relocate src/layout/* to src/app/shell/* with minimal behavior change.",
                    "Update src/App.tsx and dependent imports to new shell paths.",
                    "Keep shell free of project-specific page imports.",
                ),
                files=("src/layout/* -> src/app/shell/*", "src/App.tsx"),
                validation=(
                    "Desktop/mobile layout smoke tests pass.",
                    "No imports remain from src/layout/* in runtime files.",
                ),
                risks=("Path move churn can create import regressions.",),
                mitigations=("Move in small batches and run typecheck per batch.",),
            ),
            WorkItem(
                id="P3-W2",
                title="Move router/bootstrap ownership",
                steps=(
                    "Move src/views/routes/* to src/app/router/*.",
                    "Move src/views/AuthDependentContent.tsx to src/app/bootstrap/AuthDependentContent.tsx.",
                    "Bind auth guards directly to manifest route metadata fields.",
                ),
                files=(
                    "src/views/routes/* -> src/app/router/*",
                    "src/views/AuthDependentContent.tsx -> src/app/bootstrap/AuthDependentContent.tsx",
                    "src/main.tsx",
                ),
                validation=(
                    "Auth redirect and route transition tests pass.",
                    "Router entrypoint imports only src/app/router and registry APIs.",
                ),
                risks=("Auth guard logic could drift while moving files.",),
                mitigations=("Lock guard behavior with integration tests before move.",),
            ),
            WorkItem(
                id="P3-W3",
                title="Retire provider compatibility wrappers",
                steps=(
                    "Map each src/views/providers wrapper to canonical provider source.",
                    "Update bootstrap to import canonical provider modules directly.",
                    "Delete wrappers once import usage reaches zero.",
                ),
                files=("src/views/providers/*", "src/main.tsx", "src/auth/context/*"),
                validation=(
                    "Provider order snapshot test passes.",
                    "No runtime imports remain from src/views/providers/*.",
                ),
                risks=("Provider order regressions may break context assumptions.",),
                mitigations=("Freeze provider order in a dedicated integration test.",),
            ),
        ),
        exit_criteria=(
            "Shell/router/bootstrap ownership sits in src/app/*.",
            "views-based routing/providing wrappers are removed from runtime.",
        ),
        rollback=(
            "Repoint entry modules to old imports temporarily.",
            "Keep moved files and reintroduce wrappers only for blocked flows.",
        ),
    ),
    Phase(
        number=4,
        name="Module normalization by layer",
        objective="Reclassify modules into pages/widgets/features/entities/shared and migrate incrementally.",
        duration="2 weeks",
        dependencies=(
            "Phase 3 app ownership is stable.",
            "Layer rules are agreed by maintainers.",
        ),
        deliverables=(
            "Ownership matrix for src/lib, src/views/settings, and src/auth/pages modules.",
            "Reference vertical slice migrated using standard module template.",
            "Remaining modules migrated in bounded batches with temporary stubs.",
        ),
        work_items=(
            WorkItem(
                id="P4-W1",
                title="Build ownership matrix",
                steps=(
                    "Inventory modules under src/lib/*, src/views/settings/*, src/auth/pages/*.",
                    "Assign each module to target layer by responsibility.",
                    "Define migration batches and dependency order.",
                ),
                files=("src/lib/*", "src/views/settings/*", "src/auth/pages/*"),
                validation=(
                    "Each module has exactly one target owner layer.",
                    "Review sign-off captured before moving files.",
                ),
                risks=("Ownership disputes can stall migration.",),
                mitigations=("Use tie-break rule: highest reusable layer with least business coupling.",),
            ),
            WorkItem(
                id="P4-W2",
                title="Migrate one vertical slice as template",
                steps=(
                    "Choose one slice (for example model-import) and move page/feature/entity/shared responsibilities.",
                    "Use module contract: index.ts, ui/, model/, api/, lib/, __tests__/.",
                    "Ensure UI components do not embed raw GraphQL strings directly.",
                ),
                files=(
                    "selected slice modules under src/pages, src/features, src/entities, src/shared",
                    "route manifest entries for migrated pages",
                ),
                validation=(
                    "Slice behavior matches baseline tests.",
                    "Lazy-loaded bundle boundary remains intact.",
                ),
                risks=("Template may overfit a single slice.",),
                mitigations=("Generalize only patterns reused by a second slice.",),
            ),
            WorkItem(
                id="P4-W3",
                title="Migrate remaining modules in batches",
                steps=(
                    "Move domains in sequence: auth, settings, import, table/form related modules.",
                    "Use temporary re-export stubs in old paths while imports are being updated.",
                    "Delete stubs once each batch reaches zero legacy imports.",
                ),
                files=(
                    "src/lib/* -> target layer folders",
                    "consumer imports across app/features/tests",
                ),
                validation=(
                    "Full tests and lint pass after each batch.",
                    "Layer import check reports only tracked exceptions.",
                ),
                risks=("Large moves increase merge conflicts.",),
                mitigations=("Use small PRs with per-batch checklists.",),
            ),
        ),
        exit_criteria=(
            "Most modules live in layer-aligned directories.",
            "Temporary stubs are limited to known exceptions with removal plans.",
        ),
        rollback=(
            "Revert only the failing batch commit.",
            "Keep compatibility stubs while fixing import breaks.",
        ),
    ),
    Phase(
        number=5,
        name="GraphQL/API consolidation",
        objective="Unify duplicate GraphQL stacks into one shared + feature-owned API model.",
        duration="1 to 1.5 weeks",
        dependencies=(
            "Phase 4 ownership migration is mostly complete.",
            "All GraphQL consumers and entrypoints are inventoried.",
        ),
        deliverables=(
            "Apollo bootstrap centralized in src/shared/api/apollo.",
            "Shared query utilities in src/shared/api/graphql.",
            "Auth API operations in src/features/auth/api.",
            "Legacy src/graphql and src/lib/graphql removed after import migration.",
        ),
        work_items=(
            WorkItem(
                id="P5-W1",
                title="Define final API boundaries",
                steps=(
                    "Keep Apollo client setup in src/shared/api/apollo.",
                    "Move generic query composition helpers to src/shared/api/graphql.",
                    "Move auth-specific operations to src/features/auth/api.",
                ),
                files=(
                    "src/shared/api/apollo/*",
                    "src/shared/api/graphql/*",
                    "src/features/auth/api/*",
                ),
                validation=(
                    "Auth and metadata integration tests pass.",
                    "Only one runtime Apollo bootstrap path remains.",
                ),
                risks=("Auth header behavior may regress during split.",),
                mitigations=("Keep one canonical auth-header utility with integration coverage.",),
            ),
            WorkItem(
                id="P5-W2",
                title="Migrate imports using temporary re-exports",
                steps=(
                    "Convert src/graphql/* and src/lib/graphql/* into forward-only re-exports.",
                    "Migrate imports in domain batches and track remaining legacy references.",
                    "Disallow new imports from legacy paths after baseline migration.",
                ),
                files=("src/graphql/*", "src/lib/graphql/*", "all legacy consumers"),
                validation=(
                    "Legacy import count decreases to zero.",
                    "Tests pass per migrated batch.",
                ),
                risks=("Re-export chains can hide circular imports.",),
                mitigations=("Forbid nested re-exports and run import graph checks.",),
            ),
            WorkItem(
                id="P5-W3",
                title="Delete duplicate legacy modules",
                steps=(
                    "Remove obsolete modules once runtime import count is zero.",
                    "Update tests/docs to point only to final API paths.",
                    "Run full regression and production build before merge.",
                ),
                files=("obsolete files in src/graphql/* and src/lib/graphql/*",),
                validation=(
                    "Production build passes with no deleted-path references.",
                    "API integration tests pass end-to-end.",
                ),
                risks=("Hidden transitive imports may break late.",),
                mitigations=("Use build-time import checks as merge gate.",),
            ),
        ),
        exit_criteria=(
            "Only one GraphQL/API model remains active.",
            "Runtime code no longer imports from legacy graphql roots.",
        ),
        rollback=(
            "Re-enable temporary re-exports for blocked modules.",
            "Restore deleted files from isolated commits if needed.",
        ),
    ),
    Phase(
        number=6,
        name="Guardrails and final hardening",
        objective="Enforce architecture rules in CI and remove remaining compatibility debt.",
        duration="1 week",
        dependencies=(
            "Phases 1-5 complete with small exception list.",
            "Target architecture accepted by maintainers.",
        ),
        deliverables=(
            "Lint/CI layer boundary enforcement.",
            "Manifest integrity checks (duplicate ids/paths, defaultRoute validity, nav-route consistency).",
            "Removal of temporary wrappers still on runtime path.",
        ),
        work_items=(
            WorkItem(
                id="P6-W1",
                title="Enforce layer import rules",
                steps=(
                    "Add no-restricted-imports rules per layer in eslint config.",
                    "Add CI script to fail forbidden cross-layer imports.",
                    "Roll out in warning mode first, then fail mode.",
                ),
                files=("eslint.config.js", "scripts/layer_boundary_check.*", "CI config"),
                validation=(
                    "Warning-mode reports match expected violations only.",
                    "Fail-mode gate blocks new violations.",
                ),
                risks=("Too-broad patterns may block valid imports.",),
                mitigations=("Use explicit allowlists for contracts and type-only imports.",),
            ),
            WorkItem(
                id="P6-W2",
                title="Add manifest quality gates",
                steps=(
                    "Add integrity checks for duplicate ids/paths and missing defaultRoute targets.",
                    "Verify every navigation path resolves to a registered route.",
                    "Run checks in CI and pre-merge.",
                ),
                files=(
                    "src/app/router/__tests__/*",
                    "scripts/manifest_integrity_check.*",
                ),
                validation=(
                    "Invalid manifests fail with actionable errors.",
                    "Navigation/route mismatch is caught before runtime.",
                ),
                risks=("Noisy checks may be ignored.",),
                mitigations=("Keep errors short and path-specific.",),
            ),
            WorkItem(
                id="P6-W3",
                title="Remove last compatibility runtime paths",
                steps=(
                    "Delete temporary adapters/wrappers in router/providers/graphql layers.",
                    "Run full regression test suite and production build.",
                    "Finalize architecture documentation and onboarding instructions.",
                ),
                files=(
                    "deprecated compatibility modules",
                    "refactor_frontend.md and/or follow-up docs",
                ),
                validation=(
                    "No runtime imports reference deprecated wrappers.",
                    "Test, lint, and build are green in CI.",
                ),
                risks=("Last-mile removals can expose hidden dependencies.",),
                mitigations=("Remove in isolated commits with quick rollback paths.",),
            ),
        ),
        exit_criteria=(
            "Architecture is enforced automatically, not by convention only.",
            "Compatibility debt is removed from runtime code paths.",
            "Project onboarding path is stable and manifest-driven.",
        ),
        rollback=(
            "Temporarily restore wrappers behind explicit TODO deprecation markers.",
            "Downgrade gates to warning mode for emergency unblock only.",
        ),
    ),
)


def as_dict(phases: tuple[Phase, ...]) -> dict:
    return {
        "guardrails": list(GUARDRAILS),
        "phases": [
            {
                "number": phase.number,
                "name": phase.name,
                "objective": phase.objective,
                "duration": phase.duration,
                "dependencies": list(phase.dependencies),
                "deliverables": list(phase.deliverables),
                "work_items": [
                    {
                        "id": item.id,
                        "title": item.title,
                        "steps": list(item.steps),
                        "files": list(item.files),
                        "validation": list(item.validation),
                        "risks": list(item.risks),
                        "mitigations": list(item.mitigations),
                    }
                    for item in phase.work_items
                ],
                "exit_criteria": list(phase.exit_criteria),
                "rollback": list(phase.rollback),
            }
            for phase in phases
        ],
    }


def _bullets(lines: list[str], values: TextList) -> None:
    for value in values:
        lines.append(f"- {value}")


def render_markdown(phases: tuple[Phase, ...]) -> str:
    lines: list[str] = [
        "# rail-react frontend refactor: implementation phases",
        "",
        "## Architecture guardrails",
        "These constraints are mandatory across all phases.",
    ]
    _bullets(lines, GUARDRAILS)
    lines.append("")
    lines.append("## Multi-phase plan")
    lines.append("")

    for phase in phases:
        lines.append(f"## Phase {phase.number}: {phase.name}")
        lines.append(f"Objective: {phase.objective}")
        lines.append(f"Duration: {phase.duration}")
        lines.append("")
        lines.append("Dependencies")
        _bullets(lines, phase.dependencies)
        lines.append("Deliverables")
        _bullets(lines, phase.deliverables)
        lines.append("")

        for item in phase.work_items:
            lines.append(f"### {item.id} - {item.title}")
            lines.append("Steps")
            _bullets(lines, item.steps)
            lines.append("Files")
            _bullets(lines, item.files)
            lines.append("Validation")
            _bullets(lines, item.validation)
            if item.risks:
                lines.append("Risks")
                _bullets(lines, item.risks)
            if item.mitigations:
                lines.append("Mitigations")
                _bullets(lines, item.mitigations)
            lines.append("")

        lines.append("Exit criteria")
        _bullets(lines, phase.exit_criteria)
        lines.append("Rollback")
        _bullets(lines, phase.rollback)
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Render refactor phases as markdown or json."
    )
    parser.add_argument(
        "--format",
        choices=("markdown", "json"),
        default="markdown",
        help="Output format.",
    )
    parser.add_argument(
        "--phase",
        nargs="*",
        type=int,
        help="Optional phase numbers to include, for example --phase 1 2.",
    )
    args = parser.parse_args()

    selected = PHASES
    if args.phase:
        wanted = set(args.phase)
        selected = tuple(phase for phase in PHASES if phase.number in wanted)
        if not selected:
            raise SystemExit("No phases found for the requested --phase values.")

    if args.format == "json":
        print(json.dumps(as_dict(selected), indent=2))
    else:
        print(render_markdown(selected))


if __name__ == "__main__":
    main()
