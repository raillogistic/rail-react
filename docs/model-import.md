# Model Import Flow

## Entry Point

Model import is launched from `ModelTableV2` top actions:

- Route: `/model-import?app=<app>&model=<model>`
- Page component: `src/features/model-import/pages/ModelImportPage.tsx`

## UI Modules

- `TemplateDownloadCard`: template metadata and download.
- `ImportUploadPanel`: file upload with format/version feedback.
- `ImportReviewGrid`: editable rows with save-and-revalidate.
- `ImportIssuesPanel`: issue filtering and report download.
- `ImportSimulationPanel`: validate and simulate actions.
- `ImportCommitPanel`: commit/delete controls and summaries.

## Hooks

- `useModelImportTemplate`: template metadata query.
- `useModelImportReview`: upload, row patching, batch refresh.
- `useModelImportExecution`: validate/simulate/commit/delete/report actions.

## GraphQL Operations

Defined in `src/shared/api/graphql/legacy/importing.ts`:

- `modelImportTemplate`
- `createModelImportBatch`
- `modelImportBatch`
- `modelImportBatchPages`
- `updateModelImportBatch`
- `deleteModelImportBatch`
- `modelImportErrorReport`

## Verification

```bash
cd rail-react
npx vitest run src/features/model-import --passWithNoTests
```
