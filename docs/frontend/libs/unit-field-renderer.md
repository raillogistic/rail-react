# Unit field renderer

`UnitFieldRenderer` is the frontend primitive for rendering one atomic value on
detail pages and overview grids. You use it when you need consistent,
accessible, and resilient value display without introducing section, table, or
page layout concerns.

## When to use it

Use this renderer when a view needs one field value with shared formatting and
interaction behavior across models. The component only renders a single field
unit, so you keep composition and layout in your parent components.

Use `UnitFieldRenderer` for these kind groups:

- Text and document: `text`, `multiline`, `richText`, `code`, `json`.
- Numeric: `number`, `integer`, `currency`, `percent`, `ratio`,
  `scientific`, `delta`.
- Progress and rating: `progress`, `rating`.
- Boolean and state: `boolean`, `status`, `health`.
- Categorical: `enum`, `multiEnum`, `tags`.
- Time: `date`, `datetime`, `time`, `duration`, `relativeTime`, `timezone`.
- Units and measurement: `bytes`, `fileSize`, `distance`, `weight`,
  `temperature`, `speed`.
- Identity and references: `id`, `uuid`, `entityRef`, `user`.
- Links and contact: `url`, `email`, `phone`.
- Media: `image`, `avatar`.
- Geo and locale: `country`, `language`, `location`.
- Secure display: `masked`, `tokenPreview`.

## Import and render a field

Import from the details entrypoint and pass one `UnitFieldInput`. The renderer
normalizes defaults internally, including `emptyText`, tone, size, align, and
copy behavior.

```tsx
import { UnitFieldRenderer, type UnitFieldInput } from "@/lib/details";

const field: UnitFieldInput = {
  id: "mrr",
  label: "Monthly revenue",
  kind: "currency",
  value: 1250000.25,
  copyable: true,
  format: {
    currency: { currencyCode: "USD", decimals: 2 },
  },
};

export function RevenueUnit() {
  return (
    <UnitFieldRenderer
      field={field}
      mode="labelValue"
      density="normal"
      defaultLocale="en-US"
      defaultTimezone="America/New_York"
    />
  );
}
```

## Component API

`UnitFieldRenderer` accepts runtime options that apply to one field instance.
Use these options to control display mode, locale behavior, and interactions.

- `field: UnitFieldInput`: The field definition and value.
- `mode?: "labelValue" | "valueOnly"`: Default is `"labelValue"`.
- `density?: "compact" | "normal"`: Default is `"normal"`.
- `defaultLocale?: string`: Used when `field.format.locale` is unset.
- `defaultTimezone?: string`: Used when `field.format.dateTime.timezone` is
  unset.
- `onCopy?: (field, copiedText) => void`: Fired after a successful copy.
- `onClickValue?: (field) => void`: Fired when value interaction is clicked.

`UnitFieldInput` supports `render(ctx)` as an escape hatch. Keep this override
for exceptional cases so shared behavior remains consistent.

## Formatting and empty-state behavior

Use `formatFieldValue(field, options)` when you need testable, pure formatting
outside React rendering. It returns `{ text, normalized, isEmpty }`.

The formatter layer guarantees these behaviors:

- Treats `null`, `undefined`, empty string, and `NaN` as empty.
- Returns empty for invalid date and invalid timezone input.
- Resolves enum labels with fallback to `unknownLabel` or raw string.
- Supports progress input as `0..1`, `0..100`, or `{ current, total }`.
- Applies clamp only when `format.percent.clamp` or `format.progress.clamp` is
  enabled.
- Uses `Intl` formatters with memoized caches for low-overhead formatting.

## Accessibility and security guarantees

This renderer includes baseline a11y and secure display behavior. Keep these
rules when you extend renderer logic.

- Label/value mode uses semantic `<dl>`, `<dt>`, and `<dd>`.
- Copy controls include an aria-label with the field label.
- Link-like values always render discernible text.
- Status and health include textual badges, not color-only signals.
- `richText` is rendered as plain text (no `dangerouslySetInnerHTML`).
- `tokenPreview` never reveals the full token unless you pass
  `format.token.displayValue`.

## Extending without breaking callers

You can extend the primitive through typed additions and registry registration.
Keep additions additive to preserve compatibility across consumers.

1. Add new optional format options under `UnitFieldFormat`.
2. Add pure formatting logic in `unitFieldFormatters.ts`.
3. Register a renderer in `unitFieldRendererRegistry`.
4. Keep `formatFieldValue` return shape stable.
5. Avoid renaming or removing existing `UnitFieldKind` values.

You can also import governance constants from `@/lib/details`:

- `UNIT_FIELD_EXTENSIBILITY_GUIDE`
- `UNIT_FIELD_NON_BREAKING_RULES`
- `UNIT_FIELD_ACCEPTANCE_CHECKLIST`

## Example field set

Use the provided example data and component to validate behavior quickly during
feature work.

```tsx
import { UnitFieldExamples, unitFieldExamples } from "@/lib/details";
```

`unitFieldExamples` includes datetime with timezone, relative time, duration,
currency, percent, two progress shapes, enum mapping, tags, bytes, masked
values, token preview, entity reference links, and contact field kinds.

## Testing

Run unit formatter tests from `rail-react`:

```bash
npx vitest run src/lib/details/units/unitFieldFormatters.test.ts
```

## Next steps

If you are migrating existing detail views, replace ad-hoc atomic field
formatting with `UnitFieldRenderer`, then move page-level composition to
`SectionHost`.

For section-level architecture and schema patterns, read the
[section system guide](section-system.md).
