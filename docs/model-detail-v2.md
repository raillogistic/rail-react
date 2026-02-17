# Model detail migration guide

This guide explains how to migrate detail pages to the new section-based
runtime in `rail-react`. You can keep existing `ModelDetail` and `BaseDetail`
usage while adopting the section system in phases.

## Migration overview

The section system is now the recommended detail-page architecture. It gives
you strict schema contracts, permission-aware rendering, lazy data loading, and
consistent loading and error states.

Use this migration checklist:

1. Keep existing `ModelDetail` usage working as-is.
2. Move page-level composition to `SectionHost` for new pages.
3. Keep legacy pages on `BaseDetail` until migration is complete.
4. Move atomic value formatting to `UnitFieldRenderer`.
5. Run the section and detail test matrix after each migration step.

## Current detail APIs

Use these exports from `@/lib/details`:

- `ModelDetail` for existing metadata-driven detail flows.
- `BaseDetail` for legacy tab and section config compatibility.
- `SectionHost` for the new strict section runtime.

For new work, prefer `SectionHost` and built-in section factories.

## BaseDetail compatibility

`BaseDetail` now runs through `SectionHost` internally. It preserves legacy
public props and extension hooks:

- controlled and uncontrolled tab selection
- `renderTabList`
- `renderSection`
- `sectionRenderers`
- section layout options like `span` and `order`

Use `BaseDetail` when you need a low-risk migration path without changing
existing callers.

## Section-first usage

When you build a new details page, define a `DetailsPageSchema` and render it
with `SectionHost`.

```tsx
import SectionHost, {
  createGeneralSection,
  createHeaderSection,
  type DetailsPageSchema,
} from "@/lib/details";

const schema: DetailsPageSchema = {
  header: [createHeaderSection({ id: "header-main" })],
  body: [createGeneralSection({ id: "general-main" })],
};

<SectionHost
  schema={schema}
  runtime={{ entityId: id, permissions: userPermissions }}
  entityLoader={async ({ abortSignal }) => loadEntity(id, abortSignal)}
/>;
```

For full schema and built-in section coverage, read the
[section system guide](frontend/libs/section-system.md).

## Atomic field rendering

Use `UnitFieldRenderer` for single-field formatting in custom sections and
custom render callbacks.

```tsx
import { UnitFieldRenderer } from "@/lib/details";

<UnitFieldRenderer
  mode="valueOnly"
  field={{
    id: "status",
    label: "Status",
    kind: "status",
    value: statusValue,
  }}
/>;
```

For full field-kind and formatting details, read the
[unit field renderer guide](frontend/libs/unit-field-renderer.md).

## Verification

Run these commands from `rail-react`:

```bash
npm run test -- src/lib/details/tests --run
npx tsc -p tsconfig.app.json --noEmit
```

## Next steps

After migration, standardize section schemas across your app models so page
structure, state handling, and permissions stay consistent.
