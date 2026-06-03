// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: scripts/getModels.mjs
// Command: npm run getModels
// Generated at: 2026-06-03T22:36:03.918Z

export interface AssignmentsAssetAssignment {
  /** Bien */
  asset: PatrimoineAsset;
  /** Employé bénéficiaire */
  assignedToEmployee?: ReferentialsEmployee | null;
  /** Service bénéficiaire */
  assignedToService?: ReferentialsService | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Description personnalisée */
  descriptionCustom?: string | null;
  /** Description standard */
  descriptionTemplate?: string | null;
  /** documents */
  documents?: DocumentsDocument | null;
  /** Date de fin */
  endDate?: string | null;
  /** Ancien employé */
  fromEmployee?: ReferentialsEmployee | null;
  /** Ancienne localisation */
  fromLocation?: LocationsLocation | null;
  /** Ancien service */
  fromService?: ReferentialsService | null;
  /** ID */
  id?: number | null;
  /** État physique */
  physicalCondition?: string | null;
  /** Motif */
  reason?: string | null;
  /** Date de début */
  startDate: string;
  /** Statut */
  status: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface AssignmentsRestitution {
  /** Statut administratif après retour */
  administrativeStatus: string;
  /** Bien */
  asset: PatrimoineAsset;
  /** Commentaire */
  comment?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Localisation de stockage après retour */
  location: LocationsLocation;
  /** Effectué par */
  performedBy?: UsersUser | null;
  /** État physique au retour */
  physicalCondition: string;
  /** Date de restitution */
  restitutionDate: string;
  /** Statut */
  status: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface DocumentsDocument {
  /** asset */
  asset?: PatrimoineAsset[] | null;
  /** assetdisposal */
  assetDisposal?: PatrimoineAssetDisposal[] | null;
  /** assignment */
  assignment?: AssignmentsAssetAssignment[] | null;
  /** Type de contenu */
  contentType: Record<string, unknown>;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Type de document */
  documentType: ReferentialsDocumentType;
  /** Fichier */
  file: string;
  /** Nom original */
  fileName: string;
  /** Taille (octets) */
  fileSize: number;
  /** Généré par template */
  generatedFromTemplate: boolean;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Type MIME */
  mimeType: string;
  /** ID de l'objet */
  objectId: number;
  /** Titre */
  title: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Version */
  version: number;
}
export interface DocumentsDocumentTemplate {
  /** Contenu HTML/CSS */
  content: string;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Nom */
  name: string;
  /** Type de template */
  templateType: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface InventoryInventoryCampaign {
  /** Code de campagne */
  campaignCode?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de fin */
  endDate?: string | null;
  /** ID */
  id?: number | null;
  /** Lignes d'inventaire */
  lines?: InventoryInventoryLine[] | null;
  /** Nom */
  name: string;
  /** ID de référence du périmètre */
  scopeReferenceId?: number | null;
  /** Type de périmètre */
  scopeType: string;
  /** Date de début */
  startDate: string;
  /** Statut */
  status: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface InventoryInventoryLine {
  /** Bien */
  asset: PatrimoineAsset;
  /** Campagne */
  campaign: InventoryInventoryCampaign;
  /** Contrôlé le */
  checkedAt?: string | null;
  /** Contrôlé par */
  checkedBy?: UsersUser | null;
  /** Commentaire sur l'état */
  conditionComment?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Localisation attendue */
  expectedLocation?: LocationsLocation | null;
  /** ID */
  id?: number | null;
  /** Localisation constatée */
  observedLocation?: LocationsLocation | null;
  /** Résultat */
  result?: string | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface InventoryInventorySequence {
  /** ID */
  id?: number | null;
  /** Dernière valeur */
  lastValue: number;
  /** Année */
  year: number;
}
export interface LocationsAssetMassMovement {
  /** Biens concernés */
  assets: PatrimoineAsset[];
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date */
  date: string;
  /** ID */
  id?: number | null;
  /** Notes */
  notes?: string | null;
  /** Nouvel état physique (Global) */
  physicalCondition?: string | null;
  /** Motif */
  reason: string;
  /** Référence */
  reference?: string | null;
  /** Statut */
  status: string;
  /** Nouvelle localisation */
  toLocation: LocationsLocation;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface LocationsAssetMovement {
  /** Bien */
  asset: PatrimoineAsset;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Ancien employé */
  fromEmployee?: ReferentialsEmployee | null;
  /** Ancienne localisation */
  fromLocation?: LocationsLocation | null;
  /** Ancien service */
  fromService?: ReferentialsService | null;
  /** ID */
  id?: number | null;
  /** Date du mouvement */
  movementDate?: string | null;
  /** Effectué par */
  performedBy?: UsersUser | null;
  /** État physique */
  physicalCondition?: string | null;
  /** Motif */
  reason?: string | null;
  /** Référence */
  reference?: string | null;
  /** Statut */
  status: string;
  /** Nouvelle localisation */
  toLocation: LocationsLocation;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface LocationsLocation {
  /** Adresse */
  address?: string | null;
  /** Mouvements de masse */
  assetmassmovement?: LocationsAssetMassMovement[] | null;
  /** Biens */
  assets?: PatrimoineAsset[] | null;
  /** Affectations */
  assignmentsFrom?: AssignmentsAssetAssignment[] | null;
  /** Localisations */
  children?: LocationsLocation[] | null;
  /** Code */
  code?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Lignes d'inventaire */
  inventoryLinesExpected?: InventoryInventoryLine[] | null;
  /** Lignes d'inventaire */
  inventoryLinesObserved?: InventoryInventoryLine[] | null;
  /** Actif */
  isActive: boolean;
  /** Niveau */
  level: string;
  /** Mouvements */
  movementsFrom?: LocationsAssetMovement[] | null;
  /** Mouvements */
  movementsTo?: LocationsAssetMovement[] | null;
  /** Nom */
  name: string;
  /** Localisation parent */
  parent?: LocationsLocation | null;
  /** Restitutions */
  restitution?: AssignmentsRestitution[] | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Utilisateurs */
  users?: UsersUser[] | null;
}
export interface LocationsLocationSequence {
  /** ID */
  id?: number | null;
  /** Dernière valeur */
  lastValue: number;
}
export interface LocationsMovementSequence {
  /** ID */
  id?: number | null;
  /** Dernière valeur */
  lastValue: number;
  /** Année */
  year: number;
}
export interface PatrimoineAsset {
  /** Date d'acquisition */
  acquisitionDate: string;
  /** Méthode d'acquisition */
  acquisitionMethod: string;
  /** Valeur d'acquisition */
  acquisitionValue?: number | null;
  /** Nom du propriétaire réel */
  actualOwnerName?: string | null;
  /** Fournisseur propriétaire */
  actualOwnerSupplier?: ReferentialsSupplier | null;
  /** Type de propriétaire réel */
  actualOwnerType: string;
  /** Statut administratif */
  administrativeStatus?: string | null;
  /** Date d'archivage */
  archivedAt?: string | null;
  /** Type de bien */
  assetType: string;
  /** Affectations */
  assignments?: AssignmentsAssetAssignment[] | null;
  /** Marque */
  brand?: string | null;
  /** Catégorie */
  category: ReferentialsAssetCategory;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Description */
  description?: string | null;
  /** Sorties de patrimoine */
  disposals?: PatrimoineAssetDisposal[] | null;
  /** documents */
  documents?: DocumentsDocument | null;
  /** Date de sortie */
  exitDate?: string | null;
  /** Sortie via */
  exitDisposal?: PatrimoineAssetDisposal | null;
  /** Méthode de sortie */
  exitMethod?: string | null;
  /** Famille */
  family?: ReferentialsAssetFamily | null;
  /** Profil financier */
  financialProfile?: PatrimoineAssetFinancialProfile[] | null;
  /** ID */
  id?: number | null;
  /** Code inventaire */
  inventoryCode?: string | null;
  /** Lignes d'inventaire */
  inventoryLines?: InventoryInventoryLine[] | null;
  /** Est actif */
  isActive: boolean;
  /** Ancien code */
  legacyCode?: string | null;
  /** Localisation */
  location?: LocationsLocation | null;
  /** Mouvements de masse */
  massMovements?: LocationsAssetMassMovement[] | null;
  /** Métadonnées */
  metadata?: Record<string, unknown> | null;
  /** Modèle */
  modelName?: string | null;
  /** Mouvements */
  movements?: LocationsAssetMovement[] | null;
  /** Désignation */
  name: string;
  /** net book value */
  netBookValue?: string | null;
  /** Statut de propriété */
  ownershipStatus: string;
  /** État physique */
  physicalCondition: string;
  /** Valeur QR Code */
  qrCodeValue?: string | null;
  /** Employé responsable */
  responsibleEmployee?: ReferentialsEmployee | null;
  /** Service responsable */
  responsibleService?: ReferentialsService | null;
  /** Restitutions */
  restitutions?: AssignmentsRestitution[] | null;
  /** Numéro de série */
  serialNumber?: string | null;
  /** Suivis d'état des biens */
  stateTracks?: PatrimoineAssetStateTracker[] | null;
  /** Fournisseur */
  supplier?: ReferentialsSupplier | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface PatrimoineAssetDisposal {
  /** Biens concernés */
  assets: PatrimoineAsset[];
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date */
  date: string;
  /** documents */
  documents?: DocumentsDocument | null;
  /** Biens */
  exitedAssets?: PatrimoineAsset[] | null;
  /** Type de sortie */
  exitMethod: string;
  /** ID */
  id?: number | null;
  /** Notes */
  notes?: string | null;
  /** Motif */
  reason: string;
  /** Référence */
  reference?: string | null;
  /** Statut */
  status: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface PatrimoineAssetFinancialProfile {
  /** Bien */
  asset: PatrimoineAsset;
  /** Valeur nette comptable (calculée) */
  cachedNetBookValue?: number | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Base amortissable */
  depreciableBaseValue?: number | null;
  /** Durée d'amortissement (mois) */
  depreciationDurationMonths?: number | null;
  /** Méthode d'amortissement */
  depreciationMethod?: string | null;
  /** Début d'amortissement */
  depreciationStartDate?: string | null;
  /** Valeur de sortie */
  exitValue?: number | null;
  /** ID */
  id?: number | null;
  /** Dernière date de calcul d'amortissement */
  lastDepreciationDate?: string | null;
  /** net book value */
  netBookValue?: string | null;
  /** Valeur résiduelle */
  residualValue: number;
  /** resolved depreciation duration */
  resolvedDepreciationDuration?: string | null;
  /** resolved depreciation method */
  resolvedDepreciationMethod?: string | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface PatrimoineAssetStateTracker {
  /** Description d'action */
  actionDesignation: string;
  /** Bien */
  asset: PatrimoineAsset;
  /** Date et heure */
  datetime: string;
  /** ID */
  id?: number | null;
  /** Motif */
  motif?: string | null;
  /** Nouveau statut administratif */
  newAdministrativeStatus?: string | null;
  /** Nouvelle localisation */
  newLocation?: LocationsLocation | null;
  /** Nouvel état physique */
  newPhysicalCondition?: string | null;
  /** Statut administratif précédent */
  previousAdministrativeStatus?: string | null;
  /** Localisation précédente */
  previousLocation?: LocationsLocation | null;
  /** État physique précédent */
  previousPhysicalCondition?: string | null;
  /** Référence */
  reference?: string | null;
  /** Utilisateur */
  user?: UsersUser | null;
}
export interface PatrimoineExitSequence {
  /** ID */
  id?: number | null;
  /** Dernière valeur */
  lastValue: number;
  /** Année */
  year: number;
}
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
  /** Utilisateur */
  user: UsersUser;
  /** User agent */
  userAgent: string;
}
export interface ReferentialsAssetCategory {
  /** Biens */
  assets?: PatrimoineAsset[] | null;
  /** Code */
  code?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Durée d'amortissement (mois) */
  depreciationDurationMonths?: number | null;
  /** Méthode d'amortissement */
  depreciationMethod?: string | null;
  /** Familles de biens */
  families?: ReferentialsAssetFamily[] | null;
  /** Icône */
  icon?: string | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Système */
  isSystem: boolean;
  /** Définitions de métadonnées */
  metadataDefinitions?: ReferentialsAssetMetadataDefinition[] | null;
  /** Nom */
  name: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface ReferentialsAssetFamily {
  /** Biens */
  assets?: PatrimoineAsset[] | null;
  /** Catégorie */
  category: ReferentialsAssetCategory;
  /** Code */
  code?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Durée d'amortissement (mois) */
  depreciationDurationMonths?: number | null;
  /** Méthode d'amortissement */
  depreciationMethod?: string | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Définitions de métadonnées */
  metadataDefinitions?: ReferentialsAssetMetadataDefinition[] | null;
  /** Nom */
  name: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface ReferentialsAssetMetadataDefinition {
  /** Catégorie */
  category?: ReferentialsAssetCategory | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Ordre d'affichage */
  displayOrder: number;
  /** Famille */
  family?: ReferentialsAssetFamily | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Champs de métadonnées */
  items?: ReferentialsAssetMetadataDefinitionItem[] | null;
  /** Nom de la section */
  name: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface ReferentialsAssetMetadataDefinitionItem {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Définition */
  definition: ReferentialsAssetMetadataDefinition;
  /** Ordre d'affichage */
  displayOrder: number;
  /** Clé du champ */
  fieldName: string;
  /** Type de champ */
  fieldType: string;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Obligatoire */
  isRequired: boolean;
  /** Libellé */
  label: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface ReferentialsAssetSequence {
  /** Code catégorie */
  categoryCode: string;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Dernière valeur */
  lastValue: number;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Année */
  year: number;
}
export interface ReferentialsDocumentType {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Documents */
  documents?: DocumentsDocument[] | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Nom */
  name: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface ReferentialsEmployee {
  /** Affectations */
  assignments?: AssignmentsAssetAssignment[] | null;
  /** Affectations */
  assignmentsFrom?: AssignmentsAssetAssignment[] | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** E-mail */
  email?: string | null;
  /** Matricule */
  employeeCode?: string | null;
  /** Prénom */
  firstName: string;
  /** Nom complet */
  fullName?: string | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Intitulé du poste */
  jobTitle?: string | null;
  /** Nom */
  lastName: string;
  /** Mouvements */
  movementsFromEmployee?: LocationsAssetMovement[] | null;
  /** Téléphone */
  phone?: string | null;
  /** Biens */
  responsibleAssets?: PatrimoineAsset[] | null;
  /** Service */
  service: ReferentialsService;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface ReferentialsService {
  /** Adresse */
  address?: string | null;
  /** Affectations */
  assignments?: AssignmentsAssetAssignment[] | null;
  /** Affectations */
  assignmentsFrom?: AssignmentsAssetAssignment[] | null;
  /** Services */
  children?: ReferentialsService[] | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** E-mail */
  email?: string | null;
  /** Employés */
  employees?: ReferentialsEmployee[] | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Mouvements */
  movementsFromService?: LocationsAssetMovement[] | null;
  /** Nom */
  name: string;
  /** Service parent */
  parent?: ReferentialsService | null;
  /** Téléphone */
  phone?: string | null;
  /** Biens */
  responsibleAssets?: PatrimoineAsset[] | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Utilisateurs */
  users?: UsersUser[] | null;
}
export interface ReferentialsSupplier {
  /** Adresse */
  address?: string | null;
  /** Biens */
  assets?: PatrimoineAsset[] | null;
  /** E-mail */
  contactEmail?: string | null;
  /** Téléphone */
  contactPhone?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Actif */
  isActive: boolean;
  /** Nom */
  name: string;
  /** Biens */
  ownedAssets?: PatrimoineAsset[] | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface UsersPasswordResetOTP {
  /** Code OTP */
  code: string;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date d'expiration */
  expiresAt: string;
  /** ID */
  id?: number | null;
  /** Utilisé */
  isUsed: boolean;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Utilisateur */
  user: UsersUser;
}
export interface UsersUser {
  /** Affectations */
  assetassignmentCreated?: AssignmentsAssetAssignment[] | null;
  /** Affectations */
  assetassignmentUpdated?: AssignmentsAssetAssignment[] | null;
  /** Catégories de biens */
  assetcategoryCreated?: ReferentialsAssetCategory[] | null;
  /** Catégories de biens */
  assetcategoryUpdated?: ReferentialsAssetCategory[] | null;
  /** Biens */
  assetCreated?: PatrimoineAsset[] | null;
  /** Sorties de patrimoine */
  assetdisposalCreated?: PatrimoineAssetDisposal[] | null;
  /** Sorties de patrimoine */
  assetdisposalUpdated?: PatrimoineAssetDisposal[] | null;
  /** Familles de biens */
  assetfamilyCreated?: ReferentialsAssetFamily[] | null;
  /** Familles de biens */
  assetfamilyUpdated?: ReferentialsAssetFamily[] | null;
  /** Profils financiers */
  assetfinancialprofileCreated?: PatrimoineAssetFinancialProfile[] | null;
  /** Profils financiers */
  assetfinancialprofileUpdated?: PatrimoineAssetFinancialProfile[] | null;
  /** Mouvements de masse */
  assetmassmovementCreated?: LocationsAssetMassMovement[] | null;
  /** Mouvements de masse */
  assetmassmovementUpdated?: LocationsAssetMassMovement[] | null;
  /** Définitions de métadonnées */
  assetmetadatadefinitionCreated?: ReferentialsAssetMetadataDefinition[] | null;
  /** Champs de métadonnées */
  assetmetadatadefinitionitemCreated?: ReferentialsAssetMetadataDefinitionItem[] | null;
  /** Champs de métadonnées */
  assetmetadatadefinitionitemUpdated?: ReferentialsAssetMetadataDefinitionItem[] | null;
  /** Définitions de métadonnées */
  assetmetadatadefinitionUpdated?: ReferentialsAssetMetadataDefinition[] | null;
  /** Mouvements */
  assetmovementCreated?: LocationsAssetMovement[] | null;
  /** Mouvements */
  assetmovementUpdated?: LocationsAssetMovement[] | null;
  /** Séquences d'inventaire */
  assetsequenceCreated?: ReferentialsAssetSequence[] | null;
  /** Séquences d'inventaire */
  assetsequenceUpdated?: ReferentialsAssetSequence[] | null;
  /** Suivis d'état des biens */
  assetstatetracker?: PatrimoineAssetStateTracker[] | null;
  /** Biens */
  assetUpdated?: PatrimoineAsset[] | null;
  /** date joined */
  dateJoined: string;
  /** desc */
  desc?: string | null;
  /** Documents */
  documentCreated?: DocumentsDocument[] | null;
  /** Templates de documents */
  documenttemplateCreated?: DocumentsDocumentTemplate[] | null;
  /** Templates de documents */
  documenttemplateUpdated?: DocumentsDocumentTemplate[] | null;
  /** Types de documents */
  documenttypeCreated?: ReferentialsDocumentType[] | null;
  /** Types de documents */
  documenttypeUpdated?: ReferentialsDocumentType[] | null;
  /** Documents */
  documentUpdated?: DocumentsDocument[] | null;
  /** email address */
  email?: string | null;
  /** Employés */
  employeeCreated?: ReferentialsEmployee[] | null;
  /** Employés */
  employeeUpdated?: ReferentialsEmployee[] | null;
  /** first name */
  firstName?: string | null;
  /** groups */
  groups: Record<string, unknown>[];
  /** ID */
  id?: number | null;
  /** Campagnes d'inventaire */
  inventorycampaignCreated?: InventoryInventoryCampaign[] | null;
  /** Campagnes d'inventaire */
  inventorycampaignUpdated?: InventoryInventoryCampaign[] | null;
  /** Lignes d'inventaire */
  inventoryline?: InventoryInventoryLine[] | null;
  /** Lignes d'inventaire */
  inventorylineCreated?: InventoryInventoryLine[] | null;
  /** Lignes d'inventaire */
  inventorylineUpdated?: InventoryInventoryLine[] | null;
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
  /** Localisations */
  locationCreated?: LocationsLocation[] | null;
  /** Localisations */
  locationUpdated?: LocationsLocation[] | null;
  /** log entries */
  logentry?: Record<string, unknown>[] | null;
  /** Appareils MFA */
  mfaDevices?: RailDjangoMFADevice[] | null;
  /** password */
  password: string;
  /** Codes de réinitialisation */
  passwordresetotpCreated?: UsersPasswordResetOTP[] | null;
  /** Codes de réinitialisation */
  passwordresetotpUpdated?: UsersPasswordResetOTP[] | null;
  /** Mouvements */
  performedMovements?: LocationsAssetMovement[] | null;
  /** Profil utilisateur */
  profile?: UsersUserProfile[] | null;
  /** media export jobs */
  railMediaExportJobs?: RailDjangoMediaExportJob[] | null;
  /** Codes de réinitialisation */
  resetCodes?: UsersPasswordResetOTP[] | null;
  /** Restitutions */
  restitution?: AssignmentsRestitution[] | null;
  /** Restitutions */
  restitutionCreated?: AssignmentsRestitution[] | null;
  /** Restitutions */
  restitutionUpdated?: AssignmentsRestitution[] | null;
  /** Rôle principal */
  roleLabel?: string | null;
  /** saved filters */
  savedFilters?: RailDjangoSavedFilter[] | null;
  /** Service */
  service?: ReferentialsService | null;
  /** Services */
  serviceCreated?: ReferentialsService[] | null;
  /** Services */
  serviceUpdated?: ReferentialsService[] | null;
  /** Paramètres utilisateur */
  settings?: UsersUserSettings[] | null;
  /** Site */
  site?: LocationsLocation | null;
  /** Fournisseurs */
  supplierCreated?: ReferentialsSupplier[] | null;
  /** Fournisseurs */
  supplierUpdated?: ReferentialsSupplier[] | null;
  /** Appareils de confiance */
  trustedDevices?: RailDjangoTrustedDevice[] | null;
  /** username */
  username: string;
  /** user permissions */
  userPermissions: Record<string, unknown>[];
  /** Profils utilisateurs */
  userprofileCreated?: UsersUserProfile[] | null;
  /** Profils utilisateurs */
  userprofileUpdated?: UsersUserProfile[] | null;
  /** Paramètres utilisateurs */
  usersettingsCreated?: UsersUserSettings[] | null;
  /** Paramètres utilisateurs */
  usersettingsUpdated?: UsersUserSettings[] | null;
}
export interface UsersUserProfile {
  /** Biographie */
  bio?: string | null;
  /** Date de naissance */
  birthDate?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Téléphone */
  phoneNumber?: string | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Utilisateur */
  user: UsersUser;
}
export interface UsersUserSettings {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Police */
  fontFamily: string;
  /** Taille de police */
  fontSize: string;
  /** ID */
  id?: number | null;
  /** Disposition */
  layout: string;
  /** Mode */
  mode: string;
  /** Mode barre latérale */
  sidebarCollapseMode: string;
  /** Configurations des tableaux */
  tableConfigs?: Record<string, unknown> | null;
  /** Thème */
  theme: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Utilisateur */
  user: UsersUser;
}

export type DjangoModelMap = {
  "assignments.AssetAssignment": AssignmentsAssetAssignment;
  "assignments.Restitution": AssignmentsRestitution;
  "documents.Document": DocumentsDocument;
  "documents.DocumentTemplate": DocumentsDocumentTemplate;
  "inventory.InventoryCampaign": InventoryInventoryCampaign;
  "inventory.InventoryLine": InventoryInventoryLine;
  "inventory.InventorySequence": InventoryInventorySequence;
  "locations.AssetMassMovement": LocationsAssetMassMovement;
  "locations.AssetMovement": LocationsAssetMovement;
  "locations.Location": LocationsLocation;
  "locations.LocationSequence": LocationsLocationSequence;
  "locations.MovementSequence": LocationsMovementSequence;
  "patrimoine.Asset": PatrimoineAsset;
  "patrimoine.AssetDisposal": PatrimoineAssetDisposal;
  "patrimoine.AssetFinancialProfile": PatrimoineAssetFinancialProfile;
  "patrimoine.AssetStateTracker": PatrimoineAssetStateTracker;
  "patrimoine.ExitSequence": PatrimoineExitSequence;
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
  "referentials.AssetCategory": ReferentialsAssetCategory;
  "referentials.AssetFamily": ReferentialsAssetFamily;
  "referentials.AssetMetadataDefinition": ReferentialsAssetMetadataDefinition;
  "referentials.AssetMetadataDefinitionItem": ReferentialsAssetMetadataDefinitionItem;
  "referentials.AssetSequence": ReferentialsAssetSequence;
  "referentials.DocumentType": ReferentialsDocumentType;
  "referentials.Employee": ReferentialsEmployee;
  "referentials.Service": ReferentialsService;
  "referentials.Supplier": ReferentialsSupplier;
  "users.PasswordResetOTP": UsersPasswordResetOTP;
  "users.User": UsersUser;
  "users.UserProfile": UsersUserProfile;
  "users.UserSettings": UsersUserSettings;
};

export type DjangoModelName = keyof DjangoModelMap;
