export type ImportFileFormat = "CSV" | "XLSX";
export type ImportIssueSeverity = "ERROR" | "WARNING";
export type ImportBatchStatus =
  | "UPLOADED"
  | "PARSED"
  | "REVIEWING"
  | "VALIDATION_FAILED"
  | "VALIDATED"
  | "SIMULATION_FAILED"
  | "SIMULATED"
  | "COMMITTED"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";
export type ImportRowAction = "CREATE" | "UPDATE";
export type ImportRowStatus = "VALID" | "INVALID" | "READY" | "LOCKED" | "COMMITTED";
export type UpdateModelImportBatchAction =
  | "PATCH_ROWS"
  | "VALIDATE"
  | "SIMULATE"
  | "COMMIT";

export interface ImportColumnRule {
  name: string;
  label?: string | null;
  required: boolean;
  dataType: string;
  defaultValue?: unknown;
  formatHint?: string | null;
  allowedValues?: string[] | null;
}

export interface ModelImportTemplate {
  templateId: string;
  appLabel: string;
  modelName: string;
  version: string;
  exactVersion: string;
  matchingKeyFields: string[];
  requiredColumns: ImportColumnRule[];
  optionalColumns: ImportColumnRule[];
  acceptedFormats: ImportFileFormat[];
  maxRows: number;
  maxFileSizeBytes: number;
  downloadUrl: string;
}

export interface ImportIssue {
  id: string;
  rowNumber?: number | null;
  fieldPath?: string | null;
  code: string;
  severity: ImportIssueSeverity;
  message: string;
  suggestedFix?: string | null;
  stage?: string | null;
}

export interface ModelImportRow {
  id: string;
  rowNumber: number;
  editedValues: Record<string, unknown>;
  normalizedValues?: Record<string, unknown> | null;
  matchingKey?: string | null;
  action: ImportRowAction;
  status: ImportRowStatus;
  issueCount: number;
  updatedAt: string;
}

export interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  blockingIssues: number;
  warnings: number;
}

export interface ImportSimulationSummary {
  canCommit: boolean;
  wouldCreate: number;
  wouldUpdate: number;
  blockingIssues: number;
  warnings: number;
  durationMs: number;
}

export interface ImportCommitSummary {
  totalRows: number;
  committedRows: number;
  createRows: number;
  updateRows: number;
  skippedRows: number;
}

export interface ModelImportBatch {
  id: string;
  appLabel: string;
  modelName: string;
  templateId: string;
  templateVersion: string;
  status: ImportBatchStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  createRows: number;
  updateRows: number;
  committedRows: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  committedAt?: string | null;
  rows?: ModelImportRow[];
  issues?: ImportIssue[];
  lastValidation?: ImportValidationSummary | null;
  lastSimulation?: ImportSimulationSummary | null;
}

export interface ModelImportBatchPage {
  page: number;
  perPage: number;
  total: number;
  results: ModelImportBatch[];
}

export interface CreateModelImportBatchInput {
  appLabel: string;
  modelName: string;
  templateId: string;
  templateVersion: string;
  file: File;
  fileFormat: ImportFileFormat;
}

export interface ImportRowPatchInput {
  rowNumber: number;
  editedValues: Record<string, unknown>;
}

export interface UpdateModelImportBatchInput {
  batchId: string;
  action: UpdateModelImportBatchAction;
  patches?: ImportRowPatchInput[];
}

export interface DeleteModelImportBatchInput {
  batchId: string;
}

export interface CreateModelImportBatchPayload {
  ok: boolean;
  batch?: ModelImportBatch | null;
  issues: ImportIssue[];
}

export interface UpdateModelImportBatchPayload {
  ok: boolean;
  batch?: ModelImportBatch | null;
  rows: ModelImportRow[];
  issues: ImportIssue[];
  validationSummary?: ImportValidationSummary | null;
  simulationSummary?: ImportSimulationSummary | null;
  commitSummary?: ImportCommitSummary | null;
}

export interface DeleteModelImportBatchPayload {
  ok: boolean;
  deletedBatchId?: string | null;
}

export interface ImportFileDownload {
  fileName: string;
  contentType: string;
  downloadUrl: string;
  expiresAt?: string | null;
}
