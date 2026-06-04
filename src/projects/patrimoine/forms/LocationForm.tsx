import type { LocationsLocation } from "@/models";
import { ModelForm } from "@/widgets/model-form";
import { activeOnlyWhere } from "@/shared/utils/modelFormFilters";

const ALLOWED_PARENT_LEVELS: Record<string, string[]> = {
  site: [],
  building: ["site"],
  floor: ["building"],
  office: ["floor"],
  room: ["floor"],
  zone: ["office", "room"],
};

export interface LocationFormProps {
  mode?: "CREATE" | "UPDATE" | "VIEW";
  objectId?: string | number | null;
  onSuccess?: (data: any) => void;
}

export function LocationForm({
  mode = "CREATE",
  objectId,
  onSuccess,
}: LocationFormProps) {
  const isUpdate = mode === "UPDATE";

  return (
    <ModelForm<LocationsLocation>
      title={
        isUpdate
          ? "Modifier la Localisation"
          : "Créer une nouvelle Localisation"
      }
      description="Définissez les sites, bâtiments et locaux de l'organisation."
      app="locations"
      model="Location"
      mode={mode}
      objectId={objectId}
      onSubmitResult={(result) => {
        if (result.ok) onSuccess?.(result.object);
      }}
      generatedSections={[
        {
          id: "general",
          title: "Informations Générales",
          columns: 2,
          fields: ["name", "level"],
        },
        {
          id: "hierarchy",
          title: "Hiérarchie & Emplacement",
          columns: 1,
          fields: ["parent", "address"],
        },
      ]}
      fieldOverrides={{
        code: { hidden: true },
        parent: (field: any) => ({
          ...field,
          type: "select-query",
          dependsOn: ["level"],
          visible: (values) => values.level !== "site",
          graphql: {
            ...(field.graphql ?? {}),
            where: (ctx: any) => {
              const allowedLevels =
                ALLOWED_PARENT_LEVELS[String(ctx.values.level ?? "")] ?? [];

              return activeOnlyWhere(
                allowedLevels.length > 0
                  ? {
                      level: { in: allowedLevels },
                    }
                  : undefined,
              );
            },
          },
        }),
        address: {
          type: "textarea",
        },
      }}
    />
  );
}
