# Section system

The section system gives you a strict, schema-driven way to build detail pages
in `rail-react`. You define sections and tabs with TypeScript contracts, then
`SectionHost` handles visibility, loading, retries, and rendering states.

Use this guide when you build or migrate details pages to the new section
runtime.

## What the system includes

The section runtime ships as composable primitives and helpers in
`@/lib/details`.

- `SectionHost` as the runtime orchestrator.
- `TabHost` as the tab layer with lazy activation tracking.
- `SectionFrame` as shared section chrome.
- Standard states:
  - `SectionSkeleton`
  - `SectionEmptyState`
  - `SectionErrorState`
  - `SectionNoAccessState`
- Built-in section factories:
  - `createHeaderSection`
  - `createGeneralSection`
  - `createMetricsSection`
  - `createTableSection`
  - `createListSection`
  - `createTimelineSection`
  - `createAttachmentsSection`
  - `createSettingsSection`
  - `createCustomSection`

## Core contracts

The system is defined by strict types in
`src/lib/details/sectionTypes.ts`.

```ts
type SectionKind =
  | "header"
  | "general"
  | "metrics"
  | "table"
  | "list"
  | "timeline"
  | "attachments"
  | "settings"
  | "custom";

type DetailsPageSchema = {
  header: SectionDefinition[];
  tabs?: TabDefinition[];
  body?: SectionDefinition[];
};
```

Each `SectionDefinition<TData>` supports:

- visibility and access:
  - `permissions`
  - `visibleIf(ctx)`
  - `disabledIf(ctx)`
- data:
  - `dataSource`
  - `loadingStrategy` (`eager` or `lazy`)
  - `load(ctx)` with `AbortSignal`
  - `select(ctx)` for entity or computed data
- rendering:
  - `render(args)`
  - optional `empty(args)`, `error(args)`, `skeleton()`
- actions:
  - `actions(ctx)` returning `SectionAction[]`

`SectionRuntimeCtx` includes `entityId`, optional `entity`, `locale`,
`timezone`, `user`, `permissions`, navigation references, and optional `api`
references.

## Loading and caching behavior

The section loader runtime is implemented in
`src/lib/details/sectionState.ts` and `src/lib/details/SectionHost.tsx`.

The runtime guarantees:

- **Entity-first load**:
  - `entityLoader` runs eagerly when provided.
- **Section-level load**:
  - each section uses `load(ctx)` with cancel support.
- **Mounted-session cache**:
  - each section instance caches by entity, tab scope, and `cacheKey`.
- **Retry support**:
  - `retryOptions` supports retries and optional backoff.
- **No refetch loops**:
  - loaded tab sections stay cached while the host is mounted.
- **Safe errors**:
  - user-facing error states do not expose backend internals.

## Permissions and visibility

The runtime resolves visibility and access at both tab and section levels.

- Tabs can define `permissions` and `visibleIf`.
- Sections can define `permissions`, `visibleIf`, and `disabledIf`.
- If a user lacks access, sections either hide or render no-access state,
  based on `noAccessBehavior`.
- Actions also support permission gates and disabled logic.

Use `can(permissionKey, ctx)` and `hasRequiredPermissions(...)` to evaluate
permissions consistently in custom logic.

## Build a page schema

Define header, body, and tab sections with built-in factories.

```tsx
import SectionHost, {
  createAttachmentsSection,
  createCustomSection,
  createGeneralSection,
  createHeaderSection,
  createListSection,
  createMetricsSection,
  createSettingsSection,
  createTableSection,
  createTimelineSection,
  type DetailsPageSchema,
} from "@/lib/details";

const schema: DetailsPageSchema = {
  header: [
    createHeaderSection({
      id: "header-main",
      select: () => ({ title: "Account" }),
    }),
  ],
  body: [
    createGeneralSection({ id: "general", select: () => ({ fields: [] }) }),
    createMetricsSection({ id: "metrics", select: () => ({ metrics: [] }) }),
    createCustomSection({ id: "custom", render: () => <div>Custom</div> }),
  ],
  tabs: [
    {
      id: "related",
      title: "Related",
      sections: [createTableSection({ id: "related-table", columns: [] })],
    },
    {
      id: "activity",
      title: "Activity",
      sections: [createTimelineSection({ id: "timeline" })],
    },
    {
      id: "documents",
      title: "Documents",
      sections: [createAttachmentsSection({ id: "attachments" })],
    },
    {
      id: "settings",
      title: "Settings",
      sections: [
        createSettingsSection({ id: "settings-advanced" }),
        createListSection({
          id: "settings-list",
          select: () => ({ items: [] }),
        }),
      ],
    },
  ],
};
```

Then render:

```tsx
<SectionHost
  schema={schema}
  runtime={{
    entityId: recordId,
    locale: "en-US",
    timezone: "America/New_York",
    permissions: userPermissions,
  }}
  entityLoader={async ({ abortSignal }) => {
    const response = await fetchEntity(recordId, abortSignal);
    return response;
  }}
/>
```

For a complete runnable example, see
`src/lib/details/example/ExampleDetailsPage.tsx`.

## BaseDetail compatibility

`BaseDetail` now runs through `SectionHost` internally while preserving the
existing `BaseDetailProps` API.

This compatibility layer keeps:

- controlled and uncontrolled tab state behavior.
- `renderTabList`, `renderSection`, and `sectionRenderers`.
- legacy section layout options (`span`, `order`, and section classes).
- list, table, and unit section rendering behavior.

Use `BaseDetail` when you need compatibility with existing tab and section
configs. Use `SectionHost` directly for new enterprise detail pages.

## Testing the section system

Run the focused section-system test suite from `rail-react`:

```bash
npm run test -- src/lib/details/tests --run
```

The current tests cover:

- schema validation
- visibility and permission gates
- lazy tab load and cache behavior
- retry path behavior
- in-flight abort behavior on unmount

## Extensibility and non-breaking rules

Use the governance exports from `@/lib/details` to keep changes additive:

- `SECTION_EXTENSIBILITY_GUIDE`
- `SECTION_NON_BREAKING_RULES`
- `SECTION_ACCEPTANCE_CHECKLIST`

These constants are defined in
`src/lib/details/sectionGovernance.ts`.

## Next steps

Use the section system for new detail pages, and migrate older views in phases:

1. Move field-level formatting to `UnitFieldRenderer`.
2. Move page orchestration to `SectionHost`.
3. Keep legacy consumers on `BaseDetail` until each page can adopt schema-first
   sections.
