export const UNIT_FIELD_EXTENSIBILITY_GUIDE: string[] = [
  "Add a new kind to UnitFieldKind and keep it atomic (single-value only).",
  "Add formatter behavior in unitFieldFormatters.ts first; keep it pure and deterministic.",
  "Register rendering in unitFieldRendererRegistry without replacing existing kind behavior.",
  "Prefer new optional format sub-objects instead of changing existing option semantics.",
  "Treat null/undefined/empty/invalid values as empty state through formatFieldValue.",
  "Ensure accessible text equivalents for badges, icons, and color-based signals.",
  "For secure values, default to least disclosure and require explicit display override.",
];

export const UNIT_FIELD_NON_BREAKING_RULES: string[] = [
  "Never remove a UnitFieldKind; deprecate and alias if needed.",
  "Never rename existing UnitField properties.",
  "Only add optional properties to UnitField, UnitFieldFormat, UnitFieldLink, and UnitFieldBadge.",
  "Keep formatFieldValue return shape stable: { text, normalized, isEmpty }.",
  "Keep renderer registry keyed by kind and preserve existing keys.",
  "If behavior changes are required, gate them behind new opt-in format flags.",
];

export const UNIT_FIELD_ACCEPTANCE_CHECKLIST: string[] = [
  "All supported kinds render without runtime errors.",
  "Invalid values produce empty state text, not crashes.",
  "Copy action has an aria-label with field label text.",
  "Links have discernible text and safe external rel values.",
  "Rich text is rendered safely as text, without dangerous HTML injection.",
  "Token previews never reveal full token unless displayValue override is passed.",
  "Formatter utilities are covered by unit tests for core numeric/time/mask/progress flows.",
];
