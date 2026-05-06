import { useParams } from "react-router-dom";
import type { PatrimoineAsset } from "@/models";
import { ModelForm } from "@/widgets/model-form";

/**
 * Page de formulaire pour le modèle Asset (Bien).
 * Implémente les règles métier complexes (RG-BIEN-*) et une organisation par sections.
 */
export function AssetFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);

  return (
    <section className="space-y-4">
      <ModelForm<PatrimoineAsset>
        title={isUpdate ? "Modifier le Bien" : "Créer un nouveau Bien"}
        description="Gérez les informations d'identification, de localisation et de propriété du bien patrimonial."
        app="patrimoine"
        model="Asset"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
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
          // RG-BIEN-01: inventoryCode auto-généré, non saisissable
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
            // On injecte le filtre dans la requête GraphQL de l'input
            inputProps: {
              where: (values: any) => ({
                category: { id: { eq: values.category } },
              }),
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
        }}
        // Gestion des relations imbriquées (Documents et Métadonnées)
        nested={{
          documents: {
            title: "Documents & Pièces Jointes",
            itemLabel: "Document",
            columns: 1,
            addButton: { label: "Ajouter un document" },
          },
          metadata: {
            title: "Informations Complémentaires",
            description: "Attributs spécifiques à la catégorie du bien.",
            columns: 2,
          },
        }}
      />
    </section>
  );
}

export default AssetFormPage;
