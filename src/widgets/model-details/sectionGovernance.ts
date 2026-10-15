export const SECTION_EXTENSIBILITY_GUIDE = [
  "Add new section kinds as additive union members and keep old kinds stable.",
  "Extend SectionDefinition by adding optional fields only.",
  "Keep loader inputs stable; add optional properties to SectionLoadCtx when needed.",
  "Keep SectionState status values stable to avoid runtime regressions.",
  "Prefer composing with createCustomSection for one-off rendering logic.",
  "Use section cache keys for stable mounted-session caching across rerenders.",
  "Route all new empty/error/loading views through standard state components.",
] as const;

export const SECTION_NON_BREAKING_RULES = [
  "Do not rename or remove existing SectionKind values.",
  "Do not remove existing SectionDefinition, TabDefinition, or DetailsPageSchema properties.",
  "Only add optional fields to section and tab contracts.",
  "Do not change action callback signatures; add optional context only.",
  "Do not expose raw backend errors in section error UI.",
  "Do not change default lazy/eager behavior without feature flags.",
] as const;

export const SECTION_ACCEPTANCE_CHECKLIST = [
  "Schema validation passes and duplicate ids are rejected.",
  "Permissions and visibleIf gate section/tab visibility correctly.",
  "Header/entity data loads eagerly and non-critical sections load lazily.",
  "Section loading supports AbortController cancellation.",
  "Loaded sections are cached while host is mounted.",
  "Retry path re-executes failed section loads.",
  "Loading/empty/error/no-access states are consistent across all built-in sections.",
  "Tabs are keyboard accessible and action buttons have aria labels.",
] as const;
