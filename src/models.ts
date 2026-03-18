// AUTO-GENERATED FILE. DO NOT EDIT.
// Source: scripts/getModels.mjs
// Command: npm run getModels
// Generated at: 2026-03-18T17:24:23.194Z

export interface CatalogBenificiaire {
  /** Historiques d'affectation */
  affectationHistoriques?: OperationsAffectationHistorique[] | null;
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
}
export interface CatalogCategorieArticle {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
}
export interface CatalogVehicule {
  /** Actif */
  actif: boolean;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
}
export interface MissionBaremePrimeMission {
  /** Actif */
  actif: boolean;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
}
export interface MissionBaremePrimeMissionLigne {
  /** Bareme */
  bareme: MissionBaremePrimeMission;
  /** Categorie socio-professionnelle */
  categorieSocioProfessionnelle: string;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
  /** ID */
  id?: number | null;
  /** Montant journalier hebergement */
  montantHebergement: number;
  /** Montant journalier repas */
  montantRepas: number;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: Record<string, unknown> | null;
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
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
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
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
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
  createdBy?: Record<string, unknown> | null;
  /** Introduction personnalisée */
  customIntro?: string | null;
  /** Date de decharge */
  dateDecharge: string;
  /** desc */
  desc?: string | null;
  /** Etat de sortie */
  etatSortie: OperationsEtat;
  /** garde msg */
  gardeMsg?: string | null;
  /** Garder le produit dans l'enceinte de l'entreprise */
  garder?: boolean | null;
  /** Historiques d'affectation */
  historiqueEvenements?: OperationsAffectationHistorique[] | null;
  /** ID */
  id?: number | null;
  /** Libelle de l'article */
  libelle: string;
  /** Numero */
  numero?: string | null;
  /** Annee du numero */
  numeroAnnee?: number | null;
  /** Sequence du numero */
  numeroSequence?: number | null;
  /** Piece jointe */
  pieceJointeUrl?: string | null;
  /** restitution */
  restitution?: string | null;
  /** restitution commentaire */
  restitutionCommentaire?: string | null;
  /** restitution date restitution */
  restitutionDateRestitution?: string | null;
  /** restitution etat retour id */
  restitutionEtatRetourId?: string | null;
  /** restitution etat retour libelle */
  restitutionEtatRetourLibelle?: string | null;
  /** restitution id */
  restitutionId?: string | null;
  /** restitution numero */
  restitutionNumero?: string | null;
  /** restitution observation */
  restitutionObservation?: string | null;
  /** restitution piece jointe url */
  restitutionPieceJointeUrl?: string | null;
  /** restitution recu par */
  restitutionRecuPar?: string | null;
  /** Restitution */
  restitutionRelation?: OperationsRestitution[] | null;
  /** restitution serial retour */
  restitutionSerialRetour?: string | null;
  /** restitution statut */
  restitutionStatut?: string | null;
  /** Numero de serie */
  serial?: string | null;
  /** Site */
  site?: string | null;
  /** Statut */
  statut: string;
  /** Date de modification */
  updatedAt?: string | null;
  /** Modifié par */
  updatedBy?: Record<string, unknown> | null;
}
export interface OperationsEtat {
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
}
export interface OperationsLegacyAffectationSource {
  /** Beneficiaire */
  beneficiaire: CatalogBenificiaire;
  /** Categorie */
  categorie?: CatalogCategorieArticle | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
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
  updatedBy?: Record<string, unknown> | null;
}
export interface OperationsRestitution {
  /** Commentaire */
  commentaire?: string | null;
  /** Date de création */
  createdAt?: string | null;
  /** Créé par */
  createdBy?: Record<string, unknown> | null;
  /** Introduction personnalisée */
  customIntro?: string | null;
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
  updatedBy?: Record<string, unknown> | null;
}
export interface RailDjangoSavedFilter {
  /** created at */
  createdAt?: string | null;
  /** created by */
  createdBy: Record<string, unknown>;
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

export type DjangoModelMap = {
  "catalog.Benificiaire": CatalogBenificiaire;
  "catalog.CategorieArticle": CatalogCategorieArticle;
  "catalog.Vehicule": CatalogVehicule;
  "mission.BaremePrimeMission": MissionBaremePrimeMission;
  "mission.BaremePrimeMissionLigne": MissionBaremePrimeMissionLigne;
  "mission.OrdreMission": MissionOrdreMission;
  "operations.AffectationHistorique": OperationsAffectationHistorique;
  "operations.Decharge": OperationsDecharge;
  "operations.Etat": OperationsEtat;
  "operations.LegacyAffectationSource": OperationsLegacyAffectationSource;
  "operations.Restitution": OperationsRestitution;
  "rail_django.SavedFilter": RailDjangoSavedFilter;
};

export type DjangoModelName = keyof DjangoModelMap;
