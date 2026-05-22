/**
 * Hook pour gérer les métadonnées dynamiques d'un bien.
 *
 * Charge les définitions de métadonnées (sections + champs) en fonction
 * de la catégorie et/ou famille sélectionnée dans le formulaire de bien.
 * Les valeurs sont stockées dans le JSONField `metadata` de l'Asset.
 *
 * @module patrimoine/hooks/useAssetMetadata
 */
import { useMemo } from "react";
import { gql, useQuery } from "@apollo/client";
import type { ReferentialsAssetMetadataDefinition } from "@/models";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Définition d'un champ de métadonnée individuel, aplati pour le rendu. */
export interface MetadataFieldDefinition {
  /** ID de l'item de définition */
  definitionItemId: string;
  /** Nom de la section parente */
  sectionName: string;
  /** Ordre d'affichage de la section */
  sectionOrder: number;
  /** Clé technique du champ */
  fieldKey: string;
  /** Libellé affiché */
  label: string;
  /** Type de champ (text, number, date, boolean, select, multiselect) */
  fieldType: string;
  /** Champ obligatoire */
  isRequired: boolean;
  /** Ordre d'affichage du champ */
  displayOrder: number;
}

/** Section regroupant des champs de métadonnées */
export interface MetadataSection {
  /** ID de la définition parente */
  definitionId: string;
  /** Nom de la section */
  name: string;
  /** Ordre d'affichage */
  order: number;
  /** Champs de la section */
  fields: MetadataFieldDefinition[];
}

// ─── GraphQL Documents ──────────────────────────────────────────────────────

/**
 * Query GraphQL pour charger les définitions de métadonnées (sections + champs).
 * Les items inactifs sont filtrés côté client pour garder la query simple.
 */
const METADATA_DEFINITIONS_QUERY = gql`
  query AssetMetadataDefinitions($where: AssetMetadataDefinitionWhereInput) {
    assetMetadataDefinitionList(where: $where) {
      id
      name
      displayOrder
      category {
        id
      }
      family {
        id
      }
      items {
        id
        fieldKey
        label
        fieldType
        isRequired
        displayOrder
        isActive
      }
    }
  }
`;

// ─── Hook : Définitions ─────────────────────────────────────────────────────

/**
 * Options pour le hook useAssetMetadataDefinitions.
 */
interface UseAssetMetadataDefinitionsOptions {
  /** ID de la catégorie sélectionnée (null si aucune) */
  categoryId: string | null;
  /** ID de la famille sélectionnée (null si aucune) */
  familyId: string | null;
}

/**
 * Charge les définitions de métadonnées applicables à une combinaison catégorie/famille.
 *
 * Logique de résolution des filtres :
 * - Si catégorie seule : définitions attachées à la catégorie SANS famille spécifique
 * - Si catégorie + famille : définitions catégorie-only (family IS NULL) + définitions famille
 * - Si famille seule : définitions attachées à la famille
 *
 * @param options - categoryId et familyId issus du formulaire
 * @returns Sections avec leurs champs, indicateurs de chargement
 */
export function useAssetMetadataDefinitions({
  categoryId,
  familyId,
}: UseAssetMetadataDefinitionsOptions) {
  const whereFilter = useMemo(() => {
    if (!categoryId && !familyId) return null;

    // Cas : catégorie sans famille → définitions de catégorie sans famille spécifique
    if (categoryId && !familyId) {
      return {
        category: { eq: categoryId },
        family: { isNull: true },
        isActive: { eq: true },
      };
    }

    // Cas : catégorie + famille → définitions catégorie-only + définitions famille
    if (categoryId && familyId) {
      return {
        OR: [
          { category: { eq: categoryId }, family: { isNull: true } },
          { family: { eq: familyId } },
        ],
        isActive: { eq: true },
      };
    }

    // Cas : famille seule (peu probable mais sûr)
    if (familyId) {
      return {
        family: { eq: familyId },
        isActive: { eq: true },
      };
    }

    return null;
  }, [categoryId, familyId]);

  const { data, loading, error, refetch } = useQuery(
    METADATA_DEFINITIONS_QUERY,
    {
      variables: { where: whereFilter },
      skip: !whereFilter,
      fetchPolicy: "cache-and-network",
    },
  );

  /** Sections aplaties avec leurs champs */
  const sections = useMemo<MetadataSection[]>(() => {
    const rawDefinitions = (data?.assetMetadataDefinitionList ?? []) as Array<
      ReferentialsAssetMetadataDefinition & { items?: any[] }
    >;

    return rawDefinitions
      .filter((def) => def.items && def.items.length > 0)
      .map((def) => ({
        definitionId: String(def.id),
        name: def.name,
        order: def.displayOrder,
        fields: (def.items ?? [])
          .filter((item: any) => item.isActive)
          .sort(
            (a: any, b: any) =>
              (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
          )
          .map(
            (item: any): MetadataFieldDefinition => ({
              definitionItemId: String(item.id),
              sectionName: def.name,
              sectionOrder: def.displayOrder,
              fieldKey: item.fieldKey,
              label: item.label,
              fieldType: item.fieldType,
              isRequired: item.isRequired,
              displayOrder: item.displayOrder ?? 0,
            }),
          ),
      }))
      .sort((a, b) => a.order - b.order);
  }, [data]);

  /** Liste plate de tous les champs de métadonnées */
  const allFields = useMemo<MetadataFieldDefinition[]>(
    () => sections.flatMap((s) => s.fields),
    [sections],
  );

  return {
    sections,
    allFields,
    loading,
    error,
    refetch,
    hasDefinitions: sections.length > 0,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extrait la valeur brute d'un champ de métadonnée depuis le JSONField metadata.
 *
 * Utile pour convertir une valeur stockée en JSON vers le format attendu
 * par le champ de formulaire correspondant.
 *
 * @param fieldType - Type du champ (text, number, date, boolean, select, multiselect)
 * @param value - Valeur brute du JSONField
 * @returns La valeur formatée pour le champ de formulaire
 */
export function extractMetadataValue(
  fieldType: string,
  value: unknown,
): unknown {
  if (value === undefined || value === null) return undefined;

  switch (fieldType) {
    case "text":
      return String(value);
    case "number":
      return typeof value === "number" ? value : undefined;
    case "date":
      return typeof value === "string" ? value : undefined;
    case "boolean":
      return Boolean(value);
    case "select":
    case "multiselect":
      return value;
    default:
      return value;
  }
}
