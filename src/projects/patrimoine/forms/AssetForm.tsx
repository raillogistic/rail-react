import type { PatrimoineAsset } from "@/models";
import { ModelForm } from "@/widgets/model-form";
import { useStore } from "@tanstack/react-form";
import { useAssetMetadataDefinitions } from "../hooks/useAssetMetadata";
import type { JsonNestedValidationHandle } from "@/widgets/model-form/types";
import JsonNestedInput from "@/widgets/model-form/inputs/json-nested";
import {
  activeOnlyWhere,
  extractScalarId,
} from "@/shared/utils/modelFormFilters";

export interface AssetFormProps {
  mode?: "CREATE" | "UPDATE" | "VIEW";
  objectId?: string | number | null;
  onSuccess?: (data: any) => void;
  onFormReady?: (form: any) => void;
  metadataRef?: React.RefObject<JsonNestedValidationHandle | null>;
}

function AssetMetadataCustomFieldWrapper({
  ctx,
  metadataRef,
}: {
  ctx: any;
  metadataRef: React.RefObject<JsonNestedValidationHandle | null> | undefined;
}) {
  const { form, field, config } = ctx;

  const categoryValue = extractScalarId(
    useStore(form.store, (state: any) => state.values?.category),
  );
  const familyValue = extractScalarId(
    useStore(form.store, (state: any) => state.values?.family),
  );

  const categoryId =
    categoryValue === undefined ? null : String(categoryValue);
  const familyId = familyValue === undefined ? null : String(familyValue);

  const { sections, loading } = useAssetMetadataDefinitions({
    categoryId,
    familyId,
  });

  const mappedSections = sections.map((section) => ({
    id: section.definitionId,
    name: section.name,
    fields: section.fields as any,
  }));

  return (
    <JsonNestedInput
      config={{
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
      }}
      field={field}
      form={form}
    />
  );
}

export function AssetForm({
  mode = "CREATE",
  objectId,
  onSuccess,
  onFormReady,
  metadataRef,
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
      onSubmitResult={(result) => {
        if (result.ok) onSuccess?.(result.object);
      }}
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
          id: "status_condition",
          title: "Statut & État",
          columns: 2,
          fields: ["physicalCondition"],
        },
        {
          id: "metadata_section",
          title: "",
          columns: 1,
          fields: [
            {
              name: "metadata",
              type: "custom",
              render: (ctx) => (
                <AssetMetadataCustomFieldWrapper
                  ctx={ctx}
                  metadataRef={metadataRef}
                />
              ),
            },
          ],
        },
      ]}
      fieldOverrides={{
        inventoryCode: {
          readOnly: true,
          hidden: !isUpdate,
        },
        description: {
          type: "textarea",
          colSpan: 2,
        },
        category: {
          readOnly: isUpdate,
          graphql: {
            where: activeOnlyWhere(),
          },
        },
        family: (field: any) => ({
          ...field,
          type: "select-query",
          dependsOn: ["category"],
          visible: (values) => Boolean(values.category),
          readOnly: isUpdate,
          graphql: {
            ...(field.graphql ?? {}),
            where: (ctx: any) => {
              const categoryId = extractScalarId(ctx.values.category);
              return activeOnlyWhere(
                categoryId
                  ? {
                      category: { eq: categoryId },
                    }
                  : undefined,
              );
            },
          },
        }),
        location: {
          readOnly: isUpdate,
          graphql: {
            where: activeOnlyWhere(),
          },
        },
        responsibleEmployee: (field: any) => ({
          ...field,
          type: "select-query",
          dependsOn: ["responsibleService"],
          disabledWhen: (values) => Boolean(values.responsibleService),
          readOnly: isUpdate,
          graphql: {
            ...(field.graphql ?? {}),
            where: (ctx: any) => {
              const serviceId = extractScalarId(ctx.values.responsibleService);
              return activeOnlyWhere(
                serviceId
                  ? {
                      service: { eq: serviceId },
                    }
                  : undefined,
              );
            },
          },
        }),
        responsibleService: {
          dependsOn: ["responsibleEmployee"],
          disabledWhen: (values) => Boolean(values.responsibleEmployee),
          readOnly: isUpdate,
          graphql: {
            where: activeOnlyWhere(),
          },
        },
        assetType: {
          readOnly: isUpdate,
        },
        acquisitionValue: { readOnly: isUpdate },
        acquisitionDate: { readOnly: isUpdate },
        acquisitionMethod: { readOnly: isUpdate },
        brand: { readOnly: isUpdate },
        modelName: { readOnly: isUpdate },
        serialNumber: { readOnly: isUpdate },
        administrativeStatus: { readOnly: isUpdate },
        physicalCondition: { readOnly: isUpdate },
        actualOwnerName: {
          dependsOn: ["actualOwnerType"],
          visible: (values) =>
            values.actualOwnerType === "other" ||
            values.actualOwnerType === "partner",
        },
        actualOwnerSupplier: {
          dependsOn: ["actualOwnerType"],
          visible: (values) => values.actualOwnerType === "supplier",
          graphql: {
            where: activeOnlyWhere(),
          },
        },
        supplier: {
          graphql: {
            where: activeOnlyWhere(),
          },
        },
        qrCodeValue: { hidden: true },
        archivedAt: { hidden: true },
        isActive: { hidden: true },
        metadata: {
          hidden: false,
          type: "custom",
        },
      }}
      nested={{
        documents: {
          title: "Documents & Pièces Jointes",
          itemLabel: "Document",
          columns: 1,
          addButton: { label: "Ajouter un document" },
        },
      }}
    />
  );
}
