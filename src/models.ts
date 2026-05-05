// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: scripts/getModels.mjs
// Command: npm run getModels
// Generated at: 2026-05-05T15:10:25.434Z

export interface RailDjangoAuditEventModel {
  /** additional data */
  additionalData?: Record<string, unknown> | null;
  /** client ip */
  clientIp?: string | null;
  /** error message */
  errorMessage?: string | null;
  /** event type */
  eventType: string;
  /** ID */
  id?: number | null;
  /** pk */
  pk?: string | null;
  /** request method */
  requestMethod?: string | null;
  /** request path */
  requestPath?: string | null;
  /** session id */
  sessionId?: string | null;
  /** severity */
  severity: string;
  /** success */
  success: boolean;
  /** timestamp */
  timestamp: string;
  /** user agent */
  userAgent?: string | null;
  /** user id */
  userId?: number | null;
  /** username */
  username?: string | null;
}
export interface RailDjangoImportBatch {
  /** app label */
  appLabel: string;
  /** committed at */
  committedAt?: string | null;
  /** committed rows */
  committedRows: number;
  /** created at */
  createdAt?: string | null;
  /** create rows */
  createRows: number;
  /** error report path */
  errorReportPath?: string | null;
  /** file format */
  fileFormat: string;
  /** file name */
  fileName: string;
  /** id */
  id: string;
  /** invalid rows */
  invalidRows: number;
  /** import issues */
  issues?: RailDjangoImportIssue[] | null;
  /** model name */
  modelName: string;
  /** pk */
  pk?: string | null;
  /** import rows */
  rows?: RailDjangoImportRow[] | null;
  /** import simulation snapshots */
  simulationSnapshots?: RailDjangoImportSimulationSnapshot[] | null;
  /** status */
  status: string;
  /** submitted at */
  submittedAt?: string | null;
  /** template id */
  templateId: string;
  /** template version */
  templateVersion: string;
  /** total rows */
  totalRows: number;
  /** updated at */
  updatedAt?: string | null;
  /** update rows */
  updateRows: number;
  /** uploaded by user id */
  uploadedByUserId: string;
  /** valid rows */
  validRows: number;
}
export interface RailDjangoImportIssue {
  /** batch */
  batch: RailDjangoImportBatch;
  /** code */
  code: string;
  /** created at */
  createdAt?: string | null;
  /** field path */
  fieldPath?: string | null;
  /** id */
  id: string;
  /** message */
  message: string;
  /** pk */
  pk?: string | null;
  /** row */
  row?: RailDjangoImportRow | null;
  /** row number */
  rowNumber?: number | null;
  /** severity */
  severity: string;
  /** stage */
  stage: string;
  /** suggested fix */
  suggestedFix?: string | null;
}
export interface RailDjangoImportRow {
  /** action */
  action: string;
  /** batch */
  batch: RailDjangoImportBatch;
  /** edited values */
  editedValues: Record<string, unknown>;
  /** id */
  id: string;
  /** issue count */
  issueCount: number;
  /** import issues */
  issues?: RailDjangoImportIssue[] | null;
  /** matching key */
  matchingKey?: string | null;
  /** normalized values */
  normalizedValues?: Record<string, unknown> | null;
  /** pk */
  pk?: string | null;
  /** row number */
  rowNumber: number;
  /** source values */
  sourceValues: Record<string, unknown>;
  /** status */
  status: string;
  /** target record id */
  targetRecordId?: string | null;
  /** updated at */
  updatedAt?: string | null;
}
export interface RailDjangoImportSimulationSnapshot {
  /** batch */
  batch: RailDjangoImportBatch;
  /** blocking errors */
  blockingErrors: number;
  /** can commit */
  canCommit: boolean;
  /** duration ms */
  durationMs: number;
  /** executed at */
  executedAt?: string | null;
  /** id */
  id: string;
  /** pk */
  pk?: string | null;
  /** warnings */
  warnings: number;
  /** would create */
  wouldCreate: number;
  /** would update */
  wouldUpdate: number;
}
export interface RailDjangoMediaExportJob {
  /** archive name */
  archiveName?: string | null;
  /** archive path */
  archivePath?: string | null;
  /** archive size bytes */
  archiveSizeBytes: number;
  /** created at */
  createdAt?: string | null;
  /** error message */
  errorMessage?: string | null;
  /** expires at */
  expiresAt?: string | null;
  /** finished at */
  finishedAt?: string | null;
  /** id */
  id: string;
  /** message */
  message?: string | null;
  /** metadata */
  metadata?: Record<string, unknown> | null;
  /** pk */
  pk?: string | null;
  /** progress */
  progress: number;
  /** requested by */
  requestedBy?: UsersUser | null;
  /** selected paths */
  selectedPaths?: Record<string, unknown> | null;
  /** started at */
  startedAt?: string | null;
  /** status */
  status: string;
  /** uncompressed size bytes */
  uncompressedSizeBytes: number;
  /** updated at */
  updatedAt?: string | null;
}
export interface RailDjangoMetadataDeployVersionModel {
  /** created at */
  createdAt?: string | null;
  /** ID */
  id?: number | null;
  /** key */
  key: string;
  /** pk */
  pk?: string | null;
  /** updated at */
  updatedAt?: string | null;
  /** version */
  version: string;
}
export interface RailDjangoMFABackupCode {
  /** Code de récupération */
  code: string;
  /** Créé le */
  createdAt?: string | null;
  /** Appareil MFA */
  device: RailDjangoMFADevice;
  /** ID */
  id?: number | null;
  /** Est utilisé */
  isUsed: boolean;
  /** pk */
  pk?: string | null;
}
export interface RailDjangoMFADevice {
  /** Codes de récupération */
  backupCodes?: RailDjangoMFABackupCode[] | null;
  /** Créé le */
  createdAt?: string | null;
  /** Nom de l'appareil */
  deviceName: string;
  /** Type d'appareil */
  deviceType: string;
  /** ID */
  id?: number | null;
  /** Est actif */
  isActive: boolean;
  /** Appareil principal */
  isPrimary: boolean;
  /** Dernière utilisation */
  lastUsed?: string | null;
  /** Numéro de téléphone */
  phoneNumber?: string | null;
  /** pk */
  pk?: string | null;
  /** Clé secrète */
  secretKey?: string | null;
  /** Utilisateur */
  user: UsersUser;
}
export interface RailDjangoReportingDataset {
  /** Code */
  code: string;
  /** Champs calcules */
  computedFields: Record<string, unknown>;
  /** Creation */
  createdAt?: string | null;
  /** Filtres par defaut */
  defaultFilters: Record<string, unknown>;
  /** Description detaillee */
  description?: string | null;
  /** Dimensions */
  dimensions: Record<string, unknown>;
  /** Exports BI */
  exportJobs?: RailDjangoReportingExportJob[] | null;
  /** ID */
  id?: number | null;
  /** Derniere materialisation */
  lastMaterializedAt?: string | null;
  /** Metadonnees UI */
  metadata: Record<string, unknown>;
  /** Mesures */
  metrics: Record<string, unknown>;
  /** Tri par defaut */
  ordering: Record<string, unknown>;
  /** pk */
  pk?: string | null;
  /** Limite apercu */
  previewLimit: number;
  /** Application source */
  sourceAppLabel: string;
  /** Type de source */
  sourceKind: string;
  /** Modele source */
  sourceModel: string;
  /** Titre */
  title: string;
  /** Mise a jour */
  updatedAt?: string | null;
  /** Visualisations BI */
  visualizations?: RailDjangoReportingVisualization[] | null;
}
export interface RailDjangoReportingExportJob {
  /** Creation */
  createdAt?: string | null;
  /** Dataset */
  dataset?: RailDjangoReportingDataset | null;
  /** Erreur */
  errorMessage?: string | null;
  /** Filtres */
  filters: Record<string, unknown>;
  /** Fin */
  finishedAt?: string | null;
  /** Format */
  format: string;
  /** ID */
  id?: number | null;
  /** Payload */
  payload: Record<string, unknown>;
  /** pk */
  pk?: string | null;
  /** Rapport */
  report?: RailDjangoReportingReport | null;
  /** Debut */
  startedAt?: string | null;
  /** Statut */
  status: string;
  /** Titre */
  title: string;
  /** Visualisation */
  visualization?: RailDjangoReportingVisualization | null;
}
export interface RailDjangoReportingReport {
  /** Blocs de rapport */
  blocks?: RailDjangoReportingReportBlock[] | null;
  /** Code */
  code: string;
  /** Creation */
  createdAt?: string | null;
  /** Description */
  description?: string | null;
  /** Exports BI */
  exportJobs?: RailDjangoReportingExportJob[] | null;
  /** Filtres applicables */
  filters: Record<string, unknown>;
  /** ID */
  id?: number | null;
  /** Layout */
  layout: Record<string, unknown>;
  /** pk */
  pk?: string | null;
  /** Theme */
  theme?: string | null;
  /** Titre */
  title: string;
  /** Mise a jour */
  updatedAt?: string | null;
  /** Visualisations */
  visualizations: RailDjangoReportingVisualization[];
}
export interface RailDjangoReportingReportBlock {
  /** ID */
  id?: number | null;
  /** Layout */
  layout: Record<string, unknown>;
  /** pk */
  pk?: string | null;
  /** Position */
  position: number;
  /** Rapport */
  report: RailDjangoReportingReport;
  /** Titre alternatif */
  titleOverride?: string | null;
  /** Visualisation */
  visualization: RailDjangoReportingVisualization;
}
export interface RailDjangoReportingVisualization {
  /** Blocs de rapport */
  blocks?: RailDjangoReportingReportBlock[] | null;
  /** Code */
  code: string;
  /** Configuration */
  config: Record<string, unknown>;
  /** Creation */
  createdAt?: string | null;
  /** Jeu de donnees */
  dataset: RailDjangoReportingDataset;
  /** Filtres par defaut */
  defaultFilters: Record<string, unknown>;
  /** Description */
  description?: string | null;
  /** Exports BI */
  exportJobs?: RailDjangoReportingExportJob[] | null;
  /** ID */
  id?: number | null;
  /** Visualisation par defaut */
  isDefault: boolean;
  /** Type */
  kind: string;
  /** Options UI */
  options: Record<string, unknown>;
  /** pk */
  pk?: string | null;
  /** Rapports BI */
  reports?: RailDjangoReportingReport[] | null;
  /** Titre */
  title: string;
  /** Mise a jour */
  updatedAt?: string | null;
}
export interface RailDjangoSavedFilter {
  /** created at */
  createdAt?: string | null;
  /** created by */
  createdBy: UsersUser;
  /** description */
  description?: string | null;
  /** filter json */
  filterJson: Record<string, unknown>;
  /** ID */
  id?: number | null;
  /** is shared */
  isShared: boolean;
  /** last used at */
  lastUsedAt?: string | null;
  /** model name */
  modelName: string;
  /** name */
  name: string;
  /** pk */
  pk?: string | null;
  /** updated at */
  updatedAt?: string | null;
  /** use count */
  useCount: number;
}
export interface RailDjangoSchemaRegistryModel {
  /** apps */
  apps?: Record<string, unknown> | null;
  /** auto discover */
  autoDiscover: boolean;
  /** created at */
  createdAt?: string | null;
  /** custom scalars */
  customScalars: Record<string, unknown>;
  /** description */
  description?: string | null;
  /** enabled */
  enabled: boolean;
  /** error handling */
  errorHandling: Record<string, unknown>;
  /** exclude models */
  excludeModels?: Record<string, unknown> | null;
  /** ID */
  id?: number | null;
  /** middleware settings */
  middlewareSettings: Record<string, unknown>;
  /** models */
  models?: Record<string, unknown> | null;
  /** monitoring settings */
  monitoringSettings: Record<string, unknown>;
  /** mutation settings */
  mutationSettings: Record<string, unknown>;
  /** name */
  name: string;
  /** performance settings */
  performanceSettings: Record<string, unknown>;
  /** persisted query settings */
  persistedQuerySettings: Record<string, unknown>;
  /** pk */
  pk?: string | null;
  /** plugin settings */
  pluginSettings: Record<string, unknown>;
  /** query settings */
  querySettings: Record<string, unknown>;
  /** schema registry settings */
  schemaRegistrySettings: Record<string, unknown>;
  /** schema settings */
  schemaSettings: Record<string, unknown>;
  /** security settings */
  securitySettings: Record<string, unknown>;
  /** subscription settings */
  subscriptionSettings: Record<string, unknown>;
  /** type generation settings */
  typeGenerationSettings: Record<string, unknown>;
  /** updated at */
  updatedAt?: string | null;
  /** version */
  version: string;
}
export interface RailDjangoSchemaSnapshotModel {
  /** created at */
  createdAt?: string | null;
  /** ID */
  id?: number | null;
  /** pk */
  pk?: string | null;
  /** schema hash */
  schemaHash: string;
  /** schema json */
  schemaJson: Record<string, unknown>;
  /** schema name */
  schemaName: string;
  /** schema sdl */
  schemaSdl?: string | null;
  /** version */
  version: string;
}
export interface RailDjangoTaskExecution {
  /** attempts */
  attempts: number;
  /** completed at */
  completedAt?: string | null;
  /** created at */
  createdAt?: string | null;
  /** error */
  error?: string | null;
  /** expires at */
  expiresAt?: string | null;
  /** id */
  id: string;
  /** max retries */
  maxRetries: number;
  /** metadata */
  metadata?: Record<string, unknown> | null;
  /** name */
  name: string;
  /** owner id */
  ownerId?: string | null;
  /** pk */
  pk?: string | null;
  /** progress */
  progress: number;
  /** result */
  result?: Record<string, unknown> | null;
  /** result reference */
  resultReference?: string | null;
  /** started at */
  startedAt?: string | null;
  /** status */
  status: string;
  /** updated at */
  updatedAt?: string | null;
}
export interface RailDjangoTrustedDevice {
  /** Créé le */
  createdAt?: string | null;
  /** Empreinte de l'appareil */
  deviceFingerprint: string;
  /** Nom de l'appareil */
  deviceName: string;
  /** Expire le */
  expiresAt: string;
  /** ID */
  id?: number | null;
  /** Adresse IP */
  ipAddress: string;
  /** Est actif */
  isActive: boolean;
  /** pk */
  pk?: string | null;
  /** Utilisateur */
  user: UsersUser;
  /** User agent */
  userAgent: string;
}
export interface UsersPasswordResetOTP {
  /** code */
  code: string;
  /** created at */
  createdAt?: string | null;
  /** expires at */
  expiresAt: string;
  /** ID */
  id?: number | null;
  /** is used */
  isUsed: boolean;
  /** pk */
  pk?: string | null;
  /** user */
  user: UsersUser;
}
export interface UsersUser {
  /** date joined */
  dateJoined: string;
  /** desc */
  desc?: string | null;
  /** email address */
  email?: string | null;
  /** first name */
  firstName?: string | null;
  /** groups */
  groups: Record<string, unknown>[];
  /** ID */
  id?: number | null;
  /** active */
  isActive: boolean;
  /** is anonymous */
  isAnonymous?: string | null;
  /** is authenticated */
  isAuthenticated?: string | null;
  /** staff status */
  isStaff: boolean;
  /** superuser status */
  isSuperuser: boolean;
  /** last login */
  lastLogin?: string | null;
  /** last name */
  lastName?: string | null;
  /** log entries */
  logentry?: Record<string, unknown>[] | null;
  /** Appareils MFA */
  mfaDevices?: RailDjangoMFADevice[] | null;
  /** pk */
  pk?: string | null;
  /** User Profile */
  profile?: UsersUserProfile[] | null;
  /** media export jobs */
  railMediaExportJobs?: RailDjangoMediaExportJob[] | null;
  /** password reset otps */
  resetCodes?: UsersPasswordResetOTP[] | null;
  /** saved filters */
  savedFilters?: RailDjangoSavedFilter[] | null;
  /** User Settings */
  settings?: UsersUserSettings[] | null;
  /** Appareils de confiance */
  trustedDevices?: RailDjangoTrustedDevice[] | null;
  /** username */
  username: string;
  /** user permissions */
  userPermissions: Record<string, unknown>[];
}
export interface UsersUserProfile {
  /** bio */
  bio?: string | null;
  /** birth date */
  birthDate?: string | null;
  /** ID */
  id?: number | null;
  /** phone number */
  phoneNumber?: string | null;
  /** pk */
  pk?: string | null;
  /** user */
  user: UsersUser;
}
export interface UsersUserSettings {
  /** font family */
  fontFamily: string;
  /** font size */
  fontSize: string;
  /** ID */
  id?: number | null;
  /** layout */
  layout: string;
  /** mode */
  mode: string;
  /** pk */
  pk?: string | null;
  /** sidebar collapse mode */
  sidebarCollapseMode: string;
  /** table configs */
  tableConfigs?: Record<string, unknown> | null;
  /** theme */
  theme: string;
  /** user */
  user: UsersUser;
}

export type DjangoModelMap = {
  "rail_django.AuditEventModel": RailDjangoAuditEventModel;
  "rail_django.ImportBatch": RailDjangoImportBatch;
  "rail_django.ImportIssue": RailDjangoImportIssue;
  "rail_django.ImportRow": RailDjangoImportRow;
  "rail_django.ImportSimulationSnapshot": RailDjangoImportSimulationSnapshot;
  "rail_django.MediaExportJob": RailDjangoMediaExportJob;
  "rail_django.MetadataDeployVersionModel": RailDjangoMetadataDeployVersionModel;
  "rail_django.MFABackupCode": RailDjangoMFABackupCode;
  "rail_django.MFADevice": RailDjangoMFADevice;
  "rail_django.ReportingDataset": RailDjangoReportingDataset;
  "rail_django.ReportingExportJob": RailDjangoReportingExportJob;
  "rail_django.ReportingReport": RailDjangoReportingReport;
  "rail_django.ReportingReportBlock": RailDjangoReportingReportBlock;
  "rail_django.ReportingVisualization": RailDjangoReportingVisualization;
  "rail_django.SavedFilter": RailDjangoSavedFilter;
  "rail_django.SchemaRegistryModel": RailDjangoSchemaRegistryModel;
  "rail_django.SchemaSnapshotModel": RailDjangoSchemaSnapshotModel;
  "rail_django.TaskExecution": RailDjangoTaskExecution;
  "rail_django.TrustedDevice": RailDjangoTrustedDevice;
  "users.PasswordResetOTP": UsersPasswordResetOTP;
  "users.User": UsersUser;
  "users.UserProfile": UsersUserProfile;
  "users.UserSettings": UsersUserSettings;
};

export type DjangoModelName = keyof DjangoModelMap;
