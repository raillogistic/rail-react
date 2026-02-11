# DynamicForm

## Overview
DynamicForm is a schema-driven form engine built on [TanStack React Form](https://tanstack.com/form). It renders complex, multi-section forms from a declarative `FormSchema` and supports conditional visibility, computed fields, field dependencies, multiple layout modes, autosave, and cross-field validation.

## Quick Start

```tsx
import DynamicForm from "@/lib/form/inputs/form";
import type { FormSchema } from "@/lib/form";

const schema: FormSchema = {
  fields: [
    { name: "firstName", type: "text", label: "First Name", required: true },
    { name: "lastName", type: "text", label: "Last Name" },
    { name: "email", type: "email", label: "Email" },
  ],
};

<DynamicForm
  schema={schema}
  behavior={{ onSubmit: (values) => console.log(values) }}
/>
```

## Props

All configuration is organized into five semantic groups:

| Prop | Type | Description |
|------|------|-------------|
| `schema` | `FormSchema` | Declarative schema (sections, fields, initial values, validators) |
| `state` | `FormStateConfig` | External form instance, defaults, loading, read-only |
| `behavior` | `FormBehaviorConfig` | Submit, change, validation, conditions, computed, dependencies |
| `layout` | `FormLayoutConfig` | Columns, variant, CSS, rendering mode |
| `actions` | `FormActionsConfig` | Submit/reset labels, position, extra slots, confirmation |
| `devtools` | `FormDevtoolsConfig` | Debug panel, diagnostics, change logging |

---

## Schema

### Flat fields
```tsx
const schema: FormSchema = {
  fields: [
    { name: "title", type: "text", label: "Title" },
    { name: "count", type: "number", label: "Count", min: 0, max: 100 },
  ],
};
```

### Sections
```tsx
const schema: FormSchema = {
  sections: [
    {
      id: "basic",
      title: "Basic Info",
      description: "Enter the basics.",
      fields: [
        { name: "name", type: "text", label: "Name" },
        { name: "email", type: "email", label: "Email" },
      ],
    },
    {
      id: "settings",
      title: "Settings",
      columns: 1,
      collapsible: true,
      fields: [
        { name: "notify", type: "switch", label: "Notifications" },
      ],
    },
  ],
};
```

### Field types

| Type | Config | Default value |
|------|--------|--------------|
| `text`, `email`, `password`, `textarea`, `color`, `json` | `TextFieldConfig` | `""` |
| `number`, `decimal`, `slider`, `range` | `NumberFieldConfig` | `0` |
| `select`, `radio` | `ChoiceFieldConfig` | `""` |
| `select-query` | `QueryChoiceFieldConfig` | `[]` |
| `checkbox`, `switch` | `BooleanFieldConfig` | `false` |
| `date`, `datetime-local`, `time` | `DateFieldConfig` | `""` |
| `file` | `FileFieldConfig` | `null` |
| `custom` | `CustomFieldConfig` | `""` |
| `object` | `ObjectFieldConfig` | nested defaults |
| `list` | `ListFieldConfig` | `[]` |

### Nested objects
```tsx
{
  name: "address",
  type: "object",
  label: "Address",
  columns: 2,
  fields: [
    { name: "street", type: "text", label: "Street" },
    { name: "city", type: "text", label: "City" },
    { name: "zip", type: "text", label: "ZIP" },
  ],
}
```

### List fields
```tsx
{
  name: "contacts",
  type: "list",
  label: "Contacts",
  addLabel: "Add Contact",
  minItems: 1,
  maxItems: 5,
  fields: [
    { name: "name", type: "text", label: "Name" },
    { name: "phone", type: "text", label: "Phone" },
  ],
}
```

### Custom fields
```tsx
{
  name: "avatar",
  type: "custom",
  label: "Avatar",
  render: ({ field, form }) => (
    <AvatarPicker value={field.state.value} onChange={field.handleChange} />
  ),
}
```

### Query-backed select (GraphQL)
```tsx
{
  name: "customer",
  type: "select-query",
  label: "Customer",
  relatedModel: "Customer",
  graphql: {
    relatedModel: "Customer",
    labelField: "name",
    valueField: "id",
    limit: 20,
  },
}
```

---

## State

```tsx
<DynamicForm
  schema={schema}
  state={{
    defaultValues: { status: "active" },
    readOnly: isArchived,
    disabled: isSaving,
    isLoading: isDataLoading,
    onReady: (form) => formRef.current = form,
  }}
/>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `form` | `UseFormReturn` | — | External TanStack form instance |
| `defaultValues` | `Partial<TValues>` | — | Runtime defaults merged over schema defaults |
| `disableAutoReset` | `boolean` | `false` | Skip auto-reset when defaults change |
| `readOnly` | `boolean` | `false` | All fields become non-editable |
| `disabled` | `boolean` | `false` | All fields become disabled |
| `isLoading` | `boolean` | `false` | Disables interactions |
| `onReady` | `(form) => void` | — | Fires once on form initialization |

---

## Behavior

### Submit and change
```tsx
<DynamicForm
  schema={schema}
  behavior={{
    onSubmit: async (values, { form }) => {
      await saveRecord(values);
    },
    onChange: (values, changes, form) => {
      console.log("Changed:", changes.map(c => c.name));
    },
  }}
/>
```

### Conditional visibility
```tsx
<DynamicForm
  schema={schema}
  behavior={{
    conditions: {
      shippingAddress: (values) => values.requiresShipping === true,
      "billing.*": (values) => values.paymentMethod !== "free",
    },
  }}
/>
```

Conditions can use glob patterns (`"address.*"`) to match multiple fields at once.

### Computed fields
```tsx
<DynamicForm
  schema={schema}
  behavior={{
    computed: {
      fullName: (values) => `${values.firstName} ${values.lastName}`,
      total: (values) => values.quantity * values.unitPrice,
    },
  }}
/>
```

### Field dependencies
```tsx
<DynamicForm
  schema={schema}
  behavior={{
    dependencies: {
      city: { watch: ["country"], effect: "clear" },
      district: { watch: ["city"], effect: "reload" },
    },
  }}
/>
```

| Effect | Description |
|--------|-------------|
| `clear` | Resets the field to its default value |
| `reload` | Triggers re-evaluation (useful with `select-query`) |
| `reset` | Resets the field to its default value |

### Cross-field validation
```tsx
<DynamicForm
  schema={schema}
  behavior={{
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (values.endDate < values.startDate) {
        errors.endDate = "End date must be after start date";
      }
      return Object.keys(errors).length ? errors : undefined;
    },
  }}
/>
```

### Autosave
```tsx
<DynamicForm
  schema={schema}
  behavior={{
    autosave: {
      enabled: true,
      debounceMs: 1000,
      onSave: async (values, changes) => {
        await saveDraft(values);
      },
    },
  }}
/>
```

---

## Layout

### Columns and variant
```tsx
<DynamicForm
  schema={schema}
  layout={{
    columns: 3,
    variant: "compact",
    className: "max-w-2xl",
    showSectionHeaders: true,
  }}
/>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `columns` | `number` | `2` | Default column count (1–6) |
| `variant` | `"default" \| "compact" \| "popup"` | `"default"` | Spacing preset |
| `showSectionHeaders` | `boolean` | `true` | Show section title/description |
| `className` | `string` | — | CSS class for the `<form>` element |
| `bodyClassName` | `string` | — | CSS class for the scrollable body |
| `mode` | `FormLayoutMode` | `{ type: "standard" }` | Rendering mode |

### Wizard mode
```tsx
<DynamicForm
  schema={{
    sections: [
      {
        id: "step1",
        title: "Personal Info",
        step: { canAdvance: (values) => !!values.name },
        fields: [{ name: "name", type: "text", label: "Name" }],
      },
      {
        id: "step2",
        title: "Preferences",
        fields: [{ name: "theme", type: "select", label: "Theme", options: [...] }],
      },
    ],
  }}
  layout={{
    mode: {
      type: "wizard",
      showProgress: true,
      allowSkip: false,
    },
  }}
/>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showProgress` | `boolean` | `true` | Show step progress indicators |
| `allowSkip` | `boolean` | `false` | Allow jumping to future steps |
| `resolveSteps` | `(values) => number[]` | — | Dynamic step ordering |

### Accordion mode
```tsx
<DynamicForm
  schema={schema}
  layout={{
    mode: {
      type: "accordion",
      defaultExpanded: "first",
      allowMultiple: true,
    },
  }}
/>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultExpanded` | `string[] \| "all" \| "first"` | `"first"` | Initially expanded sections |
| `allowMultiple` | `boolean` | `true` | Allow multiple sections open |

### Master-detail mode
```tsx
<DynamicForm
  schema={schema}
  layout={{
    mode: {
      type: "master-detail",
      splitRatio: [60, 40],
      renderPreview: (values) => <InvoicePreview data={values} />,
      renderToolbar: ({ form }) => <ToolbarButtons form={form} />,
    },
  }}
/>
```

### Review mode
```tsx
<DynamicForm
  schema={schema}
  layout={{
    mode: {
      type: "review",
      renderSummary: (values) => <RecordSummary data={values} />,
    },
  }}
/>
```

Renders a lock/unlock toggle. When locked, the form enters read-only mode and optionally displays a summary view.

---

## Actions

```tsx
<DynamicForm
  schema={schema}
  actions={{
    submitLabel: "Create Invoice",
    resetLabel: "Clear",
    showDirtyIndicator: true,
    confirmSubmit: {
      enabled: true,
      title: "Confirm Creation",
      message: "Are you sure you want to create this invoice?",
    },
    extra: ({ isSubmitting }) => (
      <Button variant="outline" disabled={isSubmitting}>
        Save Draft
      </Button>
    ),
  }}
/>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `submitLabel` | `string` | `"Save"` | Submit button text |
| `resetLabel` | `string` | `"Reset"` | Reset button text |
| `hidden` | `boolean` | `false` | Hide the entire actions bar |
| `position` | `"bottom" \| "top" \| "both" \| "sticky-bottom"` | `"bottom"` | Position of the actions bar |
| `extra` | `ReactNode \| (ctx) => ReactNode` | — | Additional action buttons |
| `confirmSubmit` | `{ enabled, title?, message? }` | — | Confirmation dialog before submit |
| `showDirtyIndicator` | `boolean` | `false` | Show "Unsaved changes" badge |

---

## Devtools

```tsx
<DynamicForm
  schema={schema}
  devtools={{
    enabled: process.env.NODE_ENV === "development",
    showDiagnostics: true,
    logChanges: true,
  }}
/>
```

Renders a collapsible debug panel showing current form values, change log, and submit diagnostics.

---

## Per-field features

### Reactive visibility
```tsx
{ name: "notes", type: "textarea", label: "Notes", visible: (v) => v.showNotes }
```

### Reactive disabled
```tsx
{ name: "email", type: "email", label: "Email", disabledWhen: (v) => v.usePhone }
```

### Computed value
```tsx
{ name: "total", type: "number", label: "Total", compute: (v) => v.qty * v.price }
```

### Field ordering
```tsx
{ name: "b", type: "text", label: "B", order: 2 },
{ name: "a", type: "text", label: "A", order: 1 },
// Renders: A, B
```

### Column span
```tsx
{ name: "bio", type: "textarea", label: "Bio", colSpan: 2 }
```

---

## Architecture

```
src/lib/form/
  types/              # All type definitions
    schema.ts         # Field configs, sections, schema
    behavior.ts       # Conditions, computed, dependencies
    layout.ts         # Layout modes (wizard, accordion, etc.)
    actions.ts        # Actions bar config
    props.ts          # DynamicFormProps, state, devtools
    index.ts          # Re-exports
  hooks/              # Extracted logic hooks
    useFormDefaults   # Default value computation
    useFormAutoReset  # Auto-reset on defaults change
    useFormChangeTracking  # Diff-based change tracking
    useFormConditions # Conditional field/section visibility
    useFormComputed   # Computed/derived fields
    useFormDependencies    # Field dependency effects
    useFormValidation # Form-level cross-field validation
  renderers/          # UI components
    SectionRenderer   # Section rendering with grid layout
    FieldRenderer     # Field type dispatch
    ListFieldRenderer # List field with add/remove/reorder
    ActionsBar        # Submit/reset buttons
    DebugPanel        # Developer tools panel
    modes/            # Layout mode components
      StandardMode    # Default sequential sections
      WizardMode      # Step-by-step with navigation
      AccordionMode   # Collapsible sections
      MasterDetailMode # Split form + preview
      ReviewMode      # Lock/unlock with summary
  inputs/             # Input components by type
    form.tsx          # DynamicForm (thin orchestrator)
    text.tsx, numbers.tsx, choices.tsx, boolean.tsx,
    date.tsx, time.tsx, datetime.tsx, query.tsx,
    common.tsx, factory.tsx, fieldOrder.ts
  index.tsx           # Public exports
```

## Testing

Run the form test suite:
```bash
npx vitest run src/lib/form
```

Test files:
- `__tests__/defaults.test.ts` — default value computation, deep merge, deep equal
- `__tests__/changeTracking.test.ts` — diff-based change detection
- `__tests__/fieldOrder.test.ts` — field ordering and sorting
- `__tests__/DynamicForm.test.tsx` — integration tests for rendering, conditions, and modes
- `__tests__/mutations.naming.test.ts` — mutation naming conventions
- `inputs/__tests__/query.naming.test.ts` — query field naming
