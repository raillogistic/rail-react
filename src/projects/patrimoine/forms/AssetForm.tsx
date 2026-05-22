import type { PatrimoineAsset } from "@/models";
import { ModelForm, type ModelFormProps } from "@/widgets/model-form";
import { useStore } from "@tanstack/react-form";
import { useAssetMetadataDefinitions } from "../hooks/useAssetMetadata";
import type { JsonNestedValidationHandle } from "@/widgets/model-form/types";
import JsonNestedInput from "@/widgets/model-form/inputs/json-nested";

/**
 * Props du formulaire Asset, étendant les props ModelForm.
 */
export interface AssetFormProps extends Partial<
  ModelFormProps<PatrimoineAsset>
> {
  /**
   * Callback pour exposer l'instance TanStack Form au parent.
   * Permet au parent de surveiller les valeurs du formulaire
   * (category, family) pour le rendu dynamique des métadonnées.
   */
  onFormReady?: (form: any) => void;
  /**
   * Reférence à la section des métadonnées pour gérer la validation.
   */
  metadataRef?: React.RefObject<JsonNestedValidationHandle | null>;
}

/**
 * Extrait un ID scalaire d'une valeur de formulaire qui peut être
 * un ID direct, un tableau, ou un objet avec une propriété `id`.
 */
function extractScalarId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value || null;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const first = value[0];
    if (typeof first === "string") return first || null;
    if (typeof first === "number") return String(first);
    if (first && typeof first === "object" && "id" in first) {
      return String((first as any).id);
    }
    return null;
  }
  if (typeof value === "object" && "id" in (value as object)) {
    return String((value as { id: unknown }).id);
  }
  return null;
}

/**
 * Wrapper component to safely use hooks inside the custom field renderer.
 */
function AssetMetadataCustomFieldWrapper({
  ctx,
  metadataRef,
}: {
  ctx: any;
  metadataRef: React.RefObject<JsonNestedValidationHandle | null> | undefined;
}) {
  const { form, field, config } = ctx;

  const categoryId = extractScalarId(
    useStore(form.store, (state: any) => state.values?.category),
  );
  const familyId = extractScalarId(
    useStore(form.store, (state: any) => state.values?.family),
  );

  const {
    sections,
    loading,
    hasDefinitions,
  } = useAssetMetadataDefinitions({ categoryId, familyId });

  const mappedSections = sections.map((section) => ({
    id: section.definitionId,
    name: section.name,
    fields: section.fields as any,
  }));

  const jsonConfig = {
    ...config,
    type: "json-nested",
    sections: mappedSections,
    loading,
    emptyMessage: categoryId
      ? "Aucune métadonnée définie pour cette catégorie."
      : "Veuillez sélectionner une catégorie pour voir les informations complémentaires.",
    validationRef: metadataRef,
    title: "Informations Complémentaires",
    subtitle: "Attributs spécifiques à la catégorie et famille du bien.",
  };

  return <JsonNestedInput config={jsonConfig} field={field} form={form} />;
}

/**
 * Composant de formulaire pour le modèle Asset (Bien).
 *
 * Centralise les règles métier et la structure du formulaire.
 */
export function AssetForm({
  mode = "CREATE",
  objectId,
  onSuccess,
  onFormReady,
  metadataRef,
  ...props
}: AssetFormProps) {
  const isUpdate = mode === "UPDATE";

  return (
    <ModelForm<PatrimoineAsset>
      devtools={{ enabled: true }}
      title={isUpdate ? "Modifier le Bien" : "Créer un nouveau Bien"}
      description="Gérez les informations d'identification, de localisation et de propriété du bien patrimonial."
      app="patrimoine"
      model="Asset"
      mode={mode}
      objectId={objectId}
      onSuccess={onSuccess}
      // Exposer l'instance du formulaire au parent
      state={{
        onReady: onFormReady,
      }}
      behavior={{
        validate: () => {
          if (metadataRef?.current) {
            const errors = metadataRef.current.validate();
            if (errors.length > 0) {
              return {
                metadata:
                  "Veuillez remplir les champs obligatoires des informations complémentaires.",
              };
            }
          }
          return undefined;
        },
      }}
      // Organisation en sections pour une meilleure lisibilité
      generatedSections={[
        {
          id: "identification",
          title: "Identification",
          columns: 2,
          fields: ["legacyCode", "name", "description"],
        },
        {
          id: "classification",
          title: "Classification",
          columns: 2,
          fields: ["category", "family"],
        },
        {
          id: "location_responsibility",
          title: "Localisation & Responsabilité",
          columns: 2,
          fields: ["location", "responsibleEmployee", "responsibleService"],
        },
        {
          id: "acquisition_ownership",
          title: "Acquisition & Propriété",
          columns: 2,
          fields: [
            "assetType",
            "acquisitionMethod",
            "acquisitionDate",
            "acquisitionValue",
            "ownershipStatus",
            "actualOwnerType",
            "actualOwnerName",
            "actualOwnerSupplier",
            "supplier",
          ],
        },
        {
          id: "technical",
          title: "Caractéristiques Techniques",
          columns: 3,
          fields: ["brand", "modelName", "serialNumber"],
        },
        {
          id: "metadata_section",
          title: "", // Titre géré par AssetMetadataSection
          columns: 1,
          fields: [
            {
              name: "metadata",
              type: "custom",
              render: (ctx) => {
                return (
                  <AssetMetadataCustomFieldWrapper
                    ctx={ctx}
                    metadataRef={metadataRef}
                  />
                );
              },
            },
          ],
        },
        {
          id: "status_condition",
          title: "Statut & État",
          columns: 2,
          fields: ["administrativeStatus", "physicalCondition"],
        },
        {
          id: "exit",
          title: "Sortie du Patrimoine",
          columns: 2,
          fields: ["exitMethod", "exitDate"],
        },
      ]}
      fieldOverrides={{
        // RG-BIEN-01: inventoryCode auto-généré, non saisissable, visible en lecture seule après création
        inventoryCode: {
          readOnly: true,
          hidden: !isUpdate,
        },
        description: {
          type: "textarea",
          colSpan: 2,
        },

        // RG-BIEN-07: Filtrage des familles par catégorie
        family: (field) => ({
          ...field,
          type: "select-query",
          dependsOn: ["category"],
          visible: (values) => Boolean(values.category),
          graphql: {
            // @ts-ignore
            ...(field.graphql ?? {}),
            where: (ctx: any) => {
              // Ensure we extract a valid single scalar ID or undefined
              const categoryId = Array.isArray(ctx.values.category)
                ? ctx.values.category[0]
                : ctx.values.category;

              if (!categoryId) return {};

              return {
                category: { eq: categoryId },
              };
            },
          },
        }),

        // RG-AFF-05: Responsabilité exclusive Employé vs Service
        responsibleEmployee: {
          dependsOn: ["responsibleService"],
          disabledWhen: (values) => Boolean(values.responsibleService),
        },
        responsibleService: {
          dependsOn: ["responsibleEmployee"],
          disabledWhen: (values) => Boolean(values.responsibleEmployee),
        },

        // RG-FIN-01: Type du bien immuable après création
        assetType: {
          readOnly: isUpdate,
        },

        // Visibilité conditionnelle des propriétaires externes
        actualOwnerName: {
          dependsOn: ["actualOwnerType"],
          visible: (values) =>
            values.actualOwnerType === "other" ||
            values.actualOwnerType === "partner",
        },
        actualOwnerSupplier: {
          dependsOn: ["actualOwnerType"],
          visible: (values) => values.actualOwnerType === "supplier",
        },

        // RG-FIN-03: Sortie du patrimoine visible uniquement si statut approprié
        exitMethod: {
          dependsOn: ["administrativeStatus"],
          visible: (values) =>
            ["reformed", "lost", "disposed"].includes(
              values.administrativeStatus,
            ),
        },
        exitDate: {
          dependsOn: ["administrativeStatus"],
          visible: (values) =>
            ["reformed", "lost", "disposed"].includes(
              values.administrativeStatus,
            ),
        },

        // Champs techniques masqués
        qrCodeValue: { hidden: true },
        archivedAt: { hidden: true },
        isActive: { hidden: true },
        
        metadata: {
          hidden: false,
          type: "custom",
        }
      }}
      // Gestion des relations imbriquées (Documents uniquement)
      nested={{
        documents: {
          title: "Documents & Pièces Jointes",
          itemLabel: "Document",
          columns: 1,
          addButton: { label: "Ajouter un document" },
        },
      }}
      {...props}
    />
  );
}
