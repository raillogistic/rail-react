# Model detail migration guide

This guide explains how to migrate detail pages to the section runtime in
`rail-react`. It covers schema design, runtime wiring, and verification for
the current `SectionHost` architecture.

## Migration overview

Use the section runtime for all detail pages. Build a page from
`DetailsPageSchema`, render it with `SectionHost`, and use built-in section
factories for standard layouts.

Use this migration checklist:

1. Define a `DetailsPageSchema` for your page.
2. Add `header`, `body`, and optional `tabs` sections.
3. Move field rendering to `UnitFieldRenderer` where needed.
4. Add section-level `permissions`, `visibleIf`, and `disabledIf`.
5. Verify behavior with focused details tests and TypeScript checks.

## Section-first usage

Render detail pages with `SectionHost` and a schema object.

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

export function ProductDetailPage({ id }: { id: string }) {
  return (
    <SectionHost
      schema={schema}
      runtime={{ entityId: id, permissions: ["detail.read"] }}
      entityLoader={async ({ abortSignal }) => loadEntity(id, abortSignal)}
    />
  );
}
```

For full schema and built-in section coverage, read the
[section system guide](frontend/libs/section-system.md).

## Atomic field rendering

Use `UnitFieldRenderer` for strict single-value rendering in section content.

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

For complete field-kind and format details, read the
[unit field renderer guide](frontend/libs/unit-field-renderer.md).

## Verification

Run these commands from `rail-react`:

```bash
npm run test -- src/lib/details/tests --run
npx tsc -p tsconfig.app.json --noEmit
```

## Next steps

After migration, standardize schemas across your models so detail pages share
the same loading, permission, and state behavior.
