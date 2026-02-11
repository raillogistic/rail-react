# Complex Forms (DynamicForm-only)

These components are **spec-driven wrappers** around `src/lib/form/inputs/form.tsx` (`DynamicForm`). They do not rely on shared field definitions: you pass your own `FormSchema` / `FormSectionConfig` (e.g., for a WorkOrder) and the component manages a local TanStack form instance for you.

## Component props (all generics default to `Record<string, any>`)
- `MultiStepWizardForm`: `{ sections, defaultValues?, onSubmit?, title?, finalSubmitLabel?, resetLabel? }` — slices your provided sections one per step.
- `BranchingWizardForm`: `{ resolveSections(values) => sections, defaultValues?, onSubmit?, title?, finalSubmitLabel? }` — recomputes the path from current values.
- `AccordionSectionsForm`: `{ sections, defaultValues?, onSubmit?, title? }` — renders sections inside collapsibles.
- `ReviewLockForm`: `{ schema? | sections?, defaultValues?, onSubmit?, title? }` — toggles read-only/disabled state over your schema.
- `MasterDetailPreviewForm`: `{ schema? | sections?, defaultValues?, onSubmit?, renderPreview, title? }` — split layout; preview is caller-provided.
- `ModalSubformForm`: `{ schema? | sections?, modalSchema, defaultValues?, onSubmit?, onModalSubmit?, triggerLabel?, title?, modalTitle?, modalDescription? }` — opens a Dialog with another `DynamicForm` bound to the same store.
- `DrawerSubformForm`: `{ schema? | sections?, drawerSchema, defaultValues?, onSubmit?, onDrawerSubmit?, triggerLabel?, title?, drawerTitle?, drawerDescription? }` — same idea, using a Vaul drawer.
- `DynamicSectionsForm`: `{ baseSchema? | baseSections?, loadExtraSections, defaultValues?, onSubmit?, title? }` — merges async sections (permissions/feature flags).
- `CrossSectionValidationForm`: `{ schema, defaultValues?, onSubmit?, title?, debug? }` — plain render with your validators.
- `AutosaveDraftForm`: `{ schema, defaultValues?, onSubmit?, onDraftSave, title? }` — debounced `onChange` callback for drafts.

All components are re-exported by `complex/shapes.tsx`.

## Example (WorkOrder)
See the examples alongside `src/lib/form/complex/shapes.tsx` for usage patterns. Each component receives WorkOrder sections/schemas via props (no shared defaults).

```tsx
import {
  MultiStepWizardForm,
  BranchingWizardForm,
  MasterDetailPreviewForm,
} from "@/lib/form/complex/shapes";
import type { FormSectionConfig } from "@/lib/form/inputs/types";

type WorkOrder = { title: string; status: string; parts: { name: string }[] };

const sections: FormSectionConfig<WorkOrder>[] = [
  { id: "details", fields: [{ name: "title", type: "text", label: "Titre" }] },
  { id: "status", fields: [{ name: "status", type: "select", label: "Statut", options: [...] }] },
];

<MultiStepWizardForm sections={sections} defaultValues={{ status: "draft" }} />;
<BranchingWizardForm resolveSections={(values) => (values.status === "done" ? sections.slice(0, 1) : sections)} />;
```

## Authoring guidance
1. Build your `FormSchema` or `FormSectionConfig[]` next to the domain view (e.g., WorkOrder page).
2. Pick the shape component, pass your schema via props, and (optionally) provide callbacks (`onSubmit`, `onDraftSave`, `renderPreview`, `resolveSections`).
3. Use `disableAutoReset` (already enabled in components) whenever schema fragments change dynamically.

## Performance tips
- `DynamicForm` skips diffing when `onChange` is undefined and debug is off—only attach `onChange` when needed.
- Memoize schemas and derived section lists to avoid rerenders while typing.
- Keep heavy preview/render logic out of `renderPreview` (memoize if it depends on large collections).
