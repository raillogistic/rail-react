// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: scripts/getModels.mjs
// Command: npm run getModels
// Generated at: 2026-03-11T16:10:01.269Z

export interface CatalogBenificiaire {
  /** Historiques d'affectation */
  affectationHistoriques?: OperationsAffectationHistorique[] | null;
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Decharges */
  decharges?: OperationsDecharge[] | null;
  /** Fonction */
  fonction?: string | null;
  /** ID */
  id?: number | null;
  /** Sources d'affectation legacy */
  legacyAffectationSources?: OperationsLegacyAffectationSource[] | null;
  /** name */
  name?: string | null;
  /** Nom */
  nom: string;
  /** Ordres de mission */
  ordresMission?: MissionOrdreMission[] | null;
  /** Prénom */
  prenom: string;
  /** Sexe */
  sexe: string;
  /** Structure */
  structure?: string | null;
  /** Type de beneficiaire */
  typeBeneficiaire: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface CatalogCategorieArticle {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Sources d'affectation legacy */
  legacyAffectationSources?: OperationsLegacyAffectationSource[] | null;
  /** Nom de la catégorie */
  nom: string;
  /** Restituable */
  restituable: boolean;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface CatalogHistoricalBenificiaire {
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Fonction */
  fonction?: string | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** next record */
  nextRecord?: string | null;
  /** Nom */
  nom: string;
  /** Prénom */
  prenom: string;
  /** prev record */
  prevRecord?: string | null;
  /** Sexe */
  sexe: string;
  /** Structure */
  structure?: string | null;
  /** Type de beneficiaire */
  typeBeneficiaire: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface CatalogHistoricalCategorieArticle {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** next record */
  nextRecord?: string | null;
  /** Nom de la catégorie */
  nom: string;
  /** prev record */
  prevRecord?: string | null;
  /** Restituable */
  restituable: boolean;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface CatalogHistoricalVehicule {
  /** Actif */
  actif: boolean;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Immatriculation */
  immatriculation: string;
  /** instance */
  instance?: string | null;
  /** Libelle */
  libelle?: string | null;
  /** Marque */
  marque?: string | null;
  /** Modele */
  modele?: string | null;
  /** next record */
  nextRecord?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface CatalogVehicule {
  /** Actif */
  actif: boolean;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Immatriculation */
  immatriculation: string;
  /** Libelle */
  libelle?: string | null;
  /** Marque */
  marque?: string | null;
  /** Modele */
  modele?: string | null;
  /** Ordres de mission */
  ordresMission?: MissionOrdreMission[] | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface MissionBaremePrimeMission {
  /** Actif */
  actif: boolean;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Bareme par defaut */
  defaultBarem?: boolean | null;
  /** ID */
  id?: number | null;
  /** Libelle */
  libelle: string;
  /** Lignes de bareme de prime de mission */
  lignes?: MissionBaremePrimeMissionLigne[] | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface MissionBaremePrimeMissionLigne {
  /** Bareme */
  bareme: MissionBaremePrimeMission;
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle: string;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** Montant journalier hebergement */
  montantHebergement: number;
  /** Montant journalier repas */
  montantRepas: number;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface MissionHistoricalBaremePrimeMission {
  /** Actif */
  actif: boolean;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Bareme par defaut */
  defaultBarem?: boolean | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** Libelle */
  libelle: string;
  /** next record */
  nextRecord?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface MissionHistoricalBaremePrimeMissionLigne {
  /** Bareme */
  bareme?: MissionBaremePrimeMission | null;
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle: string;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** Montant journalier hebergement */
  montantHebergement: number;
  /** Montant journalier repas */
  montantRepas: number;
  /** next record */
  nextRecord?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface MissionHistoricalOrdreMission {
  /** Adresse administrative */
  adresseAdministrative?: string | null;
  /** Avance prime */
  avancePrime?: number | null;
  /** Concerné */
  beneficiaire?: CatalogBenificiaire | null;
  /** Fonction */
  beneficiaireFonction?: string | null;
  /** Nom */
  beneficiaireNom?: string | null;
  /** Prenom */
  beneficiairePrenom?: string | null;
  /** Sexe */
  beneficiaireSexe?: string | null;
  /** Structure */
  beneficiaireStructure?: string | null;
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle?: string | null;
  /** Commentaire */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de depart */
  dateDepart: string;
  /** Date de retour prévue */
  dateRetour: string;
  /** Date/heure Retour */
  dateTime?: string | null;
  /** Date/heure Départ  */
  departTime?: string | null;
  /** Destination */
  destination: string;
  /** Hébergement */
  hebergement?: number | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** Montant unitaire hebergement */
  montantHebergementUnitaire: number;
  /** Montant unitaire repas */
  montantRepasUnitaire: number;
  /** Moyen de transport */
  moyenTransport?: string | null;
  /** next record */
  nextRecord?: string | null;
  /** Numero */
  numero?: string | null;
  /** Annee du numero */
  numeroAnnee?: number | null;
  /** Sequence du numero */
  numeroSequence?: number | null;
  /** Objet de la mission */
  objet: string;
  /** Piece jointe */
  pieceJointeUrl?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Prime hebergement */
  primeHebergement: number;
  /** Prime repas */
  primeRepas: number;
  /** Prime totale */
  primeTotale: number;
  /** Repas */
  repas?: number | null;
  /** Statut */
  statut: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Valable à l'étranger */
  valableEtranger?: boolean | null;
  /** Vehicule */
  vehicule?: CatalogVehicule | null;
}
export interface MissionOrdreMission {
  /** Adresse administrative */
  adresseAdministrative?: string | null;
  /** Avance prime */
  avancePrime?: number | null;
  /** Concerné */
  beneficiaire: CatalogBenificiaire;
  /** Fonction */
  beneficiaireFonction?: string | null;
  /** Nom */
  beneficiaireNom?: string | null;
  /** Prenom */
  beneficiairePrenom?: string | null;
  /** Sexe */
  beneficiaireSexe?: string | null;
  /** Structure */
  beneficiaireStructure?: string | null;
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle?: string | null;
  /** Commentaire */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de depart */
  dateDepart: string;
  /** Date de retour prévue */
  dateRetour: string;
  /** Date/heure Retour */
  dateTime?: string | null;
  /** Date/heure Départ  */
  departTime?: string | null;
  /** desc */
  desc?: string | null;
  /** Destination */
  destination: string;
  /** Hébergement */
  hebergement?: number | null;
  /** ID */
  id?: number | null;
  /** Montant unitaire hebergement */
  montantHebergementUnitaire: number;
  /** Montant unitaire repas */
  montantRepasUnitaire: number;
  /** Moyen de transport */
  moyenTransport?: string | null;
  /** name */
  name?: string | null;
  /** Numero */
  numero?: string | null;
  /** Annee du numero */
  numeroAnnee?: number | null;
  /** Sequence du numero */
  numeroSequence?: number | null;
  /** Objet de la mission */
  objet: string;
  /** objet list */
  objetList?: unknown[] | null;
  /** Piece jointe */
  pieceJointeUrl?: string | null;
  /** Prime hebergement */
  primeHebergement: number;
  /** Prime repas */
  primeRepas: number;
  /** Prime totale */
  primeTotale: number;
  /** Repas */
  repas?: number | null;
  /** Statut */
  statut: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
  /** Valable à l'étranger */
  valableEtranger?: boolean | null;
  /** Vehicule */
  vehicule?: CatalogVehicule | null;
}
export interface OperationsAffectationHistorique {
  /** Beneficiaire */
  beneficiaire: CatalogBenificiaire;
  /** Commentaire d'audit */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de l'evenement */
  dateEvent: string;
  /** Decharge */
  decharge?: OperationsDecharge | null;
  /** Etat */
  etat: OperationsEtat;
  /** ID */
  id?: number | null;
  /** Source legacy */
  legacySource?: OperationsLegacyAffectationSource | null;
  /** Libelle */
  libelle?: string | null;
  /** Quantite affectee */
  qte: number;
  /** Restitution */
  restitution?: OperationsRestitution | null;
  /** Type d'evenement */
  typeEvent: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsDecharge {
  /** Beneficiaire */
  beneficiaire: CatalogBenificiaire;
  /** Code d'inventaire */
  codeInventaire?: string | null;
  /** Commentaire */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de decharge */
  dateDecharge: string;
  /** desc */
  desc?: string | null;
  /** Etat de sortie */
  etatSortie?: OperationsEtat | null;
  /** garde msg */
  gardeMsg?: string | null;
  /** Garder le produit dans l'enceinte de l'entreprise */
  garder?: boolean | null;
  /** Historiques d'affectation */
  historiqueEvenements?: OperationsAffectationHistorique[] | null;
  /** ID */
  id?: number | null;
  /** Libelle de l'article */
  libelle?: string | null;
  /** Numero */
  numero?: string | null;
  /** Annee du numero */
  numeroAnnee?: number | null;
  /** Sequence du numero */
  numeroSequence?: number | null;
  /** Piece jointe */
  pieceJointeUrl?: string | null;
  /** Restitutions */
  restitutions?: OperationsRestitution[] | null;
  /** Numero de serie */
  serial?: string | null;
  /** Site */
  site?: string | null;
  /** Statut */
  statut: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsEtat {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Decharges */
  dechargesSortie?: OperationsDecharge[] | null;
  /** ID */
  id?: number | null;
  /** Libelle */
  libelle: string;
  /** Restitutions */
  restitutionsRetour?: OperationsRestitution[] | null;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsHistoricalAffectationHistorique {
  /** Beneficiaire */
  beneficiaire?: CatalogBenificiaire | null;
  /** Commentaire d'audit */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de l'evenement */
  dateEvent: string;
  /** Decharge */
  decharge?: OperationsDecharge | null;
  /** Etat */
  etat?: OperationsEtat | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** Source legacy */
  legacySource?: OperationsLegacyAffectationSource | null;
  /** Libelle */
  libelle?: string | null;
  /** next record */
  nextRecord?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Quantite affectee */
  qte: number;
  /** Restitution */
  restitution?: OperationsRestitution | null;
  /** Type d'evenement */
  typeEvent: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsHistoricalDecharge {
  /** Beneficiaire */
  beneficiaire?: CatalogBenificiaire | null;
  /** Code d'inventaire */
  codeInventaire?: string | null;
  /** Commentaire */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de decharge */
  dateDecharge: string;
  /** Etat de sortie */
  etatSortie?: OperationsEtat | null;
  /** Garder le produit dans l'enceinte de l'entreprise */
  garder?: boolean | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** Libelle de l'article */
  libelle?: string | null;
  /** next record */
  nextRecord?: string | null;
  /** Numero */
  numero?: string | null;
  /** Annee du numero */
  numeroAnnee?: number | null;
  /** Sequence du numero */
  numeroSequence?: number | null;
  /** Piece jointe */
  pieceJointeUrl?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Numero de serie */
  serial?: string | null;
  /** Site */
  site?: string | null;
  /** Statut */
  statut: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsHistoricalLegacyAffectationSource {
  /** Beneficiaire */
  beneficiaire?: CatalogBenificiaire | null;
  /** Categorie */
  categorie?: CatalogCategorieArticle | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de sortie estimee */
  dateSortieEstimee?: string | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** Libelle */
  libelle?: string | null;
  /** next record */
  nextRecord?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Quantite de sortie (Reference) */
  qteSortieReference: number;
  /** Reference papier de decharge */
  referenceDechargeLegacy: string;
  /** Restituable */
  restituable: boolean;
  /** Serialise */
  serialise: boolean;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsHistoricalRestitution {
  /** Commentaire */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de restitution */
  dateRestitution: string;
  /** Decharge source */
  decharge?: OperationsDecharge | null;
  /** Etat de retour */
  etatRetour?: OperationsEtat | null;
  /** history change reason */
  historyChangeReason?: string | null;
  /** history date */
  historyDate: string;
  /** history id */
  historyId?: number | null;
  /** history type */
  historyType: string;
  /** history user */
  historyUser?: UsersUser | null;
  /** ID */
  id?: number | null;
  /** instance */
  instance?: string | null;
  /** Source legacy */
  legacySource?: OperationsLegacyAffectationSource | null;
  /** next record */
  nextRecord?: string | null;
  /** Numero */
  numero?: string | null;
  /** Annee du numero */
  numeroAnnee?: number | null;
  /** Sequence du numero */
  numeroSequence?: number | null;
  /** Observation */
  observation?: string | null;
  /** Origine */
  origine: string;
  /** Piece jointe */
  pieceJointeUrl?: string | null;
  /** prev record */
  prevRecord?: string | null;
  /** Recu par */
  recuPar: string;
  /** Numero de serie */
  serialRetour?: string | null;
  /** Statut */
  statut: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsLegacyAffectationSource {
  /** Beneficiaire */
  beneficiaire: CatalogBenificiaire;
  /** Categorie */
  categorie?: CatalogCategorieArticle | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de sortie estimee */
  dateSortieEstimee?: string | null;
  /** Historiques d'affectation */
  historiqueEvenements?: OperationsAffectationHistorique[] | null;
  /** ID */
  id?: number | null;
  /** Libelle */
  libelle?: string | null;
  /** Quantite de sortie (Reference) */
  qteSortieReference: number;
  /** Reference papier de decharge */
  referenceDechargeLegacy: string;
  /** Restituable */
  restituable: boolean;
  /** Restitutions */
  restitutions?: OperationsRestitution[] | null;
  /** Serialise */
  serialise: boolean;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
}
export interface OperationsNumeroSequence {
  /** Annee */
  annee: number;
  /** ID */
  id?: number | null;
  /** Prefixe */
  prefix: string;
  /** Prochain numero */
  prochain: number;
}
export interface OperationsRestitution {
  /** Commentaire */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: UsersUser | null;
  /** Date de restitution */
  dateRestitution: string;
  /** Decharge source */
  decharge?: OperationsDecharge | null;
  /** desc */
  desc?: string | null;
  /** Etat de retour */
  etatRetour?: OperationsEtat | null;
  /** Historiques d'affectation */
  historiqueEvenements?: OperationsAffectationHistorique[] | null;
  /** ID */
  id?: number | null;
  /** Source legacy */
  legacySource?: OperationsLegacyAffectationSource | null;
  /** Numero */
  numero?: string | null;
  /** Annee du numero */
  numeroAnnee?: number | null;
  /** Sequence du numero */
  numeroSequence?: number | null;
  /** Observation */
  observation?: string | null;
  /** Origine */
  origine: string;
  /** Piece jointe */
  pieceJointeUrl?: string | null;
  /** Recu par */
  recuPar: string;
  /** Numero de serie */
  serialRetour?: string | null;
  /** Statut */
  statut: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: UsersUser | null;
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
export interface UsersPasswordResetOTP {
  /** Code */
  code: string;
  /** Date de création */
  createdAt?: string | null;
  /** Date d'expiration */
  expiresAt: string;
  /** ID */
  id?: number | null;
  /** Est utilisé */
  isUsed: boolean;
  /** Utilisateur */
  user: UsersUser;
}
export interface UsersUser {
  /** Historiques d'affectation */
  affectationhistoriqueCreated?: OperationsAffectationHistorique[] | null;
  /** Historiques d'affectation */
  affectationhistoriqueUpdated?: OperationsAffectationHistorique[] | null;
  /** Baremes de prime de mission */
  baremeprimemissionCreated?: MissionBaremePrimeMission[] | null;
  /** Lignes de bareme de prime de mission */
  baremeprimemissionligneCreated?: MissionBaremePrimeMissionLigne[] | null;
  /** Lignes de bareme de prime de mission */
  baremeprimemissionligneUpdated?: MissionBaremePrimeMissionLigne[] | null;
  /** Baremes de prime de mission */
  baremeprimemissionUpdated?: MissionBaremePrimeMission[] | null;
  /** Bénéficiaires */
  benificiaireCreated?: CatalogBenificiaire[] | null;
  /** Bénéficiaires */
  benificiaireUpdated?: CatalogBenificiaire[] | null;
  /** Catégories d'articles */
  categoriearticleCreated?: CatalogCategorieArticle[] | null;
  /** Catégories d'articles */
  categoriearticleUpdated?: CatalogCategorieArticle[] | null;
  /** date joined */
  dateJoined: string;
  /** Decharges */
  dechargeCreated?: OperationsDecharge[] | null;
  /** Decharges */
  dechargeUpdated?: OperationsDecharge[] | null;
  /** desc */
  desc?: string | null;
  /** email address */
  email?: string | null;
  /** Etats */
  etatCreated?: OperationsEtat[] | null;
  /** Etats */
  etatUpdated?: OperationsEtat[] | null;
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
  /** Sources d'affectation legacy */
  legacyaffectationsourceCreated?: OperationsLegacyAffectationSource[] | null;
  /** Sources d'affectation legacy */
  legacyaffectationsourceUpdated?: OperationsLegacyAffectationSource[] | null;
  /** log entries */
  logentry?: Record<string, unknown>[] | null;
  /** Appareils MFA */
  mfaDevices?: RailDjangoMFADevice[] | null;
  /** Ordres de mission */
  ordremissionCreated?: MissionOrdreMission[] | null;
  /** Ordres de mission */
  ordremissionUpdated?: MissionOrdreMission[] | null;
  /** password */
  password: string;
  /** Profil Utilisateur */
  profile?: UsersUserProfile[] | null;
  /** media export jobs */
  railMediaExportJobs?: RailDjangoMediaExportJob[] | null;
  /** Codes de réinitialisation de mot de passe */
  resetCodes?: UsersPasswordResetOTP[] | null;
  /** Restitutions */
  restitutionCreated?: OperationsRestitution[] | null;
  /** Restitutions */
  restitutionUpdated?: OperationsRestitution[] | null;
  /** saved filters */
  savedFilters?: RailDjangoSavedFilter[] | null;
  /** Paramètres Utilisateur */
  settings?: UsersUserSettings[] | null;
  /** Appareils de confiance */
  trustedDevices?: RailDjangoTrustedDevice[] | null;
  /** username */
  username: string;
  /** user permissions */
  userPermissions: Record<string, unknown>[];
  /** Vehicules */
  vehiculeCreated?: CatalogVehicule[] | null;
  /** Vehicules */
  vehiculeUpdated?: CatalogVehicule[] | null;
}
export interface UsersUserProfile {
  /** Biographie */
  bio?: string | null;
  /** Date de naissance */
  birthDate?: string | null;
  /** ID */
  id?: number | null;
  /** Numéro de téléphone */
  phoneNumber?: string | null;
  /** Utilisateur */
  user: UsersUser;
}
export interface UsersUserSettings {
  /** Famille de police */
  fontFamily: string;
  /** Taille de police */
  fontSize: string;
  /** ID */
  id?: number | null;
  /** Disposition */
  layout: string;
  /** Mode d'affichage */
  mode: string;
  /** Mode de réduction de la barre latérale */
  sidebarCollapseMode: string;
  /** Configurations des tableaux */
  tableConfigs?: Record<string, unknown> | null;
  /** Thème */
  theme: string;
  /** Utilisateur */
  user: UsersUser;
}

export type DjangoModelMap = {
  "catalog.Benificiaire": CatalogBenificiaire;
  "catalog.CategorieArticle": CatalogCategorieArticle;
  "catalog.HistoricalBenificiaire": CatalogHistoricalBenificiaire;
  "catalog.HistoricalCategorieArticle": CatalogHistoricalCategorieArticle;
  "catalog.HistoricalVehicule": CatalogHistoricalVehicule;
  "catalog.Vehicule": CatalogVehicule;
  "mission.BaremePrimeMission": MissionBaremePrimeMission;
  "mission.BaremePrimeMissionLigne": MissionBaremePrimeMissionLigne;
  "mission.HistoricalBaremePrimeMission": MissionHistoricalBaremePrimeMission;
  "mission.HistoricalBaremePrimeMissionLigne": MissionHistoricalBaremePrimeMissionLigne;
  "mission.HistoricalOrdreMission": MissionHistoricalOrdreMission;
  "mission.OrdreMission": MissionOrdreMission;
  "operations.AffectationHistorique": OperationsAffectationHistorique;
  "operations.Decharge": OperationsDecharge;
  "operations.Etat": OperationsEtat;
  "operations.HistoricalAffectationHistorique": OperationsHistoricalAffectationHistorique;
  "operations.HistoricalDecharge": OperationsHistoricalDecharge;
  "operations.HistoricalLegacyAffectationSource": OperationsHistoricalLegacyAffectationSource;
  "operations.HistoricalRestitution": OperationsHistoricalRestitution;
  "operations.LegacyAffectationSource": OperationsLegacyAffectationSource;
  "operations.NumeroSequence": OperationsNumeroSequence;
  "operations.Restitution": OperationsRestitution;
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
