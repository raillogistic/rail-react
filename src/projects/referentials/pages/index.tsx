/**
 * Pages génériques CRUD pour les référentiels.
 * Utilise DynamicModelTable, ModelForm et ModelDynamicDetail de rail-react.
 */
import { useParams } from "react-router-dom";
import type {
  ReferentialsService,
  ReferentialsEmployee,
  ReferentialsAssetCategory,
  ReferentialsAssetFamily,
  ReferentialsSupplier,
  ReferentialsDocumentType,
  ReferentialsPhysicalCondition,
  ReferentialsAssetMetadataDefinition,
} from "@/models";
import { DynamicModelTable } from "@/widgets/model-table";
import { ModelForm } from "@/widgets/model-form";
import { ModelDynamicDetail } from "@/widgets/model-details";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { HierarchyOrganigram } from "@/widgets/hierarchy-organigram";
import { ROUTES } from "@/projects/referentials/config/routes";

// ──────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────

/** Liste des services avec vue tableau et organigramme. */
export function ServiceListPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="list">Vue Liste</TabsTrigger>
            <TabsTrigger value="organigram">Organigramme</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-0 border-none p-0 outline-none">
          <DynamicModelTable<ReferentialsService>
            app="referentials"
            model="Service"
            create={{ type: "link", hrefTemplate: ROUTES.SERVICE_CREATE }}
            update={{ type: "link", hrefTemplate: ROUTES.SERVICE_EDIT }}
            detail={{ type: "link", hrefTemplate: ROUTES.SERVICE_DETAIL }}
            baseTable={{ tableConfig: { title: "Services" } }}
          />
        </TabsContent>

        <TabsContent
          value="organigram"
          className="mt-0 border-none p-0 outline-none"
        >
          <HierarchyOrganigram
            app="referentials"
            model="Service"
            rootAddLabel="Nouveau service"
            childAddLabel="Ajouter un sous-service"
            emptyMessage="Aucun service à afficher. Commencez par en créer un."
            formConfig={{
              parentFieldName: "parent",
              generatedSections: [
                {
                  id: "general",
                  title: "Informations",
                  columns: 2,
                  fields: ["name", "code", "parent", "isActive"],
                },
              ],
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Formulaire création/édition de service. */
export function ServiceFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsService>
        title={isUpdate ? "Modifier le Service" : "Créer un Service"}
        description="Gérez les services de l'organisation."
        app="referentials"
        model="Service"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "general",
            title: "Informations",
            columns: 2,
            fields: ["name", "code", "parent", "isActive"],
          },
        ]}
      />
    </section>
  );
}

/** Détail d'un service. */
export function ServiceDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsService>
      app="referentials"
      model="Service"
      id={id}
      baseDetail={{
        nestedFields: {
          employees: { title: "Employés rattachés", mode: "table" },
          children: { title: "Sous-services", mode: "table" },
        },
      }}
    />
  );
}

// ──────────────────────────────────────────────
// Employee
// ──────────────────────────────────────────────

/** Liste des employés. */
export function EmployeeListPage() {
  return (
    <DynamicModelTable<ReferentialsEmployee>
      app="referentials"
      model="Employee"
      create={{ type: "link", hrefTemplate: ROUTES.EMPLOYEE_CREATE }}
      update={{ type: "link", hrefTemplate: ROUTES.EMPLOYEE_EDIT }}
      detail={{ type: "link", hrefTemplate: ROUTES.EMPLOYEE_DETAIL }}
      baseTable={{ tableConfig: { title: "Employés" } }}
    />
  );
}

/** Formulaire création/édition d'employé. */
export function EmployeeFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsEmployee>
        title={isUpdate ? "Modifier l'Employé" : "Créer un Employé"}
        description="Gérez les employés et leur rattachement au service."
        app="referentials"
        model="Employee"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "identity",
            title: "Identité",
            columns: 2,
            fields: ["firstName", "lastName", "employeeCode"],
          },
          {
            id: "affectation",
            title: "Rattachement",
            columns: 2,
            fields: ["service", "jobTitle"],
          },
          {
            id: "contact",
            title: "Contact",
            columns: 2,
            fields: ["email", "phone"],
          },
          { id: "status", title: "Statut", columns: 1, fields: ["isActive"] },
        ]}
        fieldOverrides={{
          fullName: { hidden: true },
        }}
      />
    </section>
  );
}

/** Détail d'un employé. */
export function EmployeeDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsEmployee>
      app="referentials"
      model="Employee"
      id={id}
    />
  );
}

// ──────────────────────────────────────────────
// AssetCategory
// ──────────────────────────────────────────────

/** Liste des catégories de biens. */
export function AssetCategoryListPage() {
  return (
    <DynamicModelTable<ReferentialsAssetCategory>
      app="referentials"
      model="AssetCategory"
      create={{ type: "link", hrefTemplate: ROUTES.ASSET_CATEGORY_CREATE }}
      update={{ type: "link", hrefTemplate: ROUTES.ASSET_CATEGORY_EDIT }}
      detail={{ type: "link", hrefTemplate: ROUTES.ASSET_CATEGORY_DETAIL }}
      baseTable={{ tableConfig: { title: "Catégories de biens" } }}
    />
  );
}

/** Formulaire création/édition de catégorie. */
export function AssetCategoryFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsAssetCategory>
        title={isUpdate ? "Modifier la Catégorie" : "Créer une Catégorie"}
        description="Gérez les catégories de biens du patrimoine."
        app="referentials"
        model="AssetCategory"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "general",
            title: "Informations",
            columns: 2,
            fields: ["name", "code", "icon", "isSystem", "isActive"],
          },
          {
            id: "finance",
            title: "Amortissement par défaut",
            columns: 2,
            fields: ["depreciationMethod", "depreciationDurationMonths"],
          },
        ]}
      />
    </section>
  );
}

/** Détail d'une catégorie. */
export function AssetCategoryDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsAssetCategory>
      app="referentials"
      model="AssetCategory"
      id={id}
      baseDetail={{
        nestedFields: {
          families: { title: "Familles", mode: "table" },
        },
      }}
    />
  );
}

// ──────────────────────────────────────────────
// AssetFamily
// ──────────────────────────────────────────────

/** Liste des familles de biens. */
export function AssetFamilyListPage() {
  return (
    <DynamicModelTable<ReferentialsAssetFamily>
      app="referentials"
      model="AssetFamily"
      create={{ type: "link", hrefTemplate: ROUTES.ASSET_FAMILY_CREATE }}
      update={{ type: "link", hrefTemplate: ROUTES.ASSET_FAMILY_EDIT }}
      detail={{ type: "link", hrefTemplate: ROUTES.ASSET_FAMILY_DETAIL }}
      baseTable={{ tableConfig: { title: "Familles de biens" } }}
    />
  );
}

/** Formulaire création/édition de famille. */
export function AssetFamilyFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsAssetFamily>
        title={isUpdate ? "Modifier la Famille" : "Créer une Famille"}
        description="Gérez les familles de biens, sous-classification des catégories."
        app="referentials"
        model="AssetFamily"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "general",
            title: "Informations",
            columns: 2,
            fields: ["category", "name", "code", "isActive"],
          },
          {
            id: "finance",
            title: "Amortissement par défaut",
            columns: 2,
            fields: ["depreciationMethod", "depreciationDurationMonths"],
          },
        ]}
      />
    </section>
  );
}

/** Détail d'une famille. */
export function AssetFamilyDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsAssetFamily>
      app="referentials"
      model="AssetFamily"
      id={id}
    />
  );
}

// ──────────────────────────────────────────────
// Supplier
// ──────────────────────────────────────────────

/** Liste des fournisseurs. */
export function SupplierListPage() {
  return (
    <DynamicModelTable<ReferentialsSupplier>
      app="referentials"
      model="Supplier"
      create={{ type: "link", hrefTemplate: ROUTES.SUPPLIER_CREATE }}
      update={{ type: "link", hrefTemplate: ROUTES.SUPPLIER_EDIT }}
      detail={{ type: "link", hrefTemplate: ROUTES.SUPPLIER_DETAIL }}
      baseTable={{ tableConfig: { title: "Fournisseurs" } }}
    />
  );
}

/** Formulaire création/édition de fournisseur. */
export function SupplierFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsSupplier>
        title={isUpdate ? "Modifier le Fournisseur" : "Créer un Fournisseur"}
        description="Gérez les fournisseurs d'origine des biens."
        app="referentials"
        model="Supplier"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "general",
            title: "Informations",
            columns: 2,
            fields: ["name", "code"],
          },
          {
            id: "contact",
            title: "Contact",
            columns: 2,
            fields: ["contactEmail", "contactPhone"],
          },
          { id: "address", title: "Adresse", columns: 1, fields: ["address"] },
          { id: "status", title: "Statut", columns: 1, fields: ["isActive"] },
        ]}
        fieldOverrides={{ address: { type: "textarea" } }}
      />
    </section>
  );
}

/** Détail d'un fournisseur. */
export function SupplierDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsSupplier>
      app="referentials"
      model="Supplier"
      id={id}
    />
  );
}

// ──────────────────────────────────────────────
// DocumentType
// ──────────────────────────────────────────────

/** Liste des types de documents. */
export function DocumentTypeListPage() {
  return (
    <DynamicModelTable<ReferentialsDocumentType>
      app="referentials"
      model="DocumentType"
      create={{ type: "link", hrefTemplate: ROUTES.DOCUMENT_TYPE_CREATE }}
      update={{ type: "link", hrefTemplate: ROUTES.DOCUMENT_TYPE_EDIT }}
      detail={{ type: "link", hrefTemplate: ROUTES.DOCUMENT_TYPE_DETAIL }}
      baseTable={{ tableConfig: { title: "Types de documents" } }}
    />
  );
}

/** Formulaire création/édition de type de document. */
export function DocumentTypeFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsDocumentType>
        title={isUpdate ? "Modifier le Type" : "Créer un Type de document"}
        description="Gérez les types de documents utilisés dans le système."
        app="referentials"
        model="DocumentType"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "general",
            title: "Informations",
            columns: 2,
            fields: ["name", "code", "isActive"],
          },
        ]}
      />
    </section>
  );
}

/** Détail d'un type de document. */
export function DocumentTypeDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsDocumentType>
      app="referentials"
      model="DocumentType"
      id={id}
    />
  );
}

// ──────────────────────────────────────────────
// PhysicalCondition
// ──────────────────────────────────────────────

/** Liste des états physiques. */
export function PhysicalConditionListPage() {
  return (
    <DynamicModelTable<ReferentialsPhysicalCondition>
      app="referentials"
      model="PhysicalCondition"
      create={{ type: "link", hrefTemplate: ROUTES.PHYSICAL_CONDITION_CREATE }}
      update={{ type: "link", hrefTemplate: ROUTES.PHYSICAL_CONDITION_EDIT }}
      detail={{ type: "link", hrefTemplate: ROUTES.PHYSICAL_CONDITION_DETAIL }}
      baseTable={{ tableConfig: { title: "États physiques" } }}
    />
  );
}

/** Formulaire création/édition d'état physique. */
export function PhysicalConditionFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsPhysicalCondition>
        title={isUpdate ? "Modifier l'État physique" : "Créer un État physique"}
        description="Gérez les états physiques des biens du patrimoine."
        app="referentials"
        model="PhysicalCondition"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "general",
            title: "Informations",
            columns: 2,
            fields: ["name", "code", "isActive"],
          },
        ]}
      />
    </section>
  );
}

/** Détail d'un état physique. */
export function PhysicalConditionDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsPhysicalCondition>
      app="referentials"
      model="PhysicalCondition"
      id={id}
    />
  );
}

// ──────────────────────────────────────────────
// AssetMetadataDefinition
// ──────────────────────────────────────────────

/** Liste des définitions de métadonnées. */
export function MetadataDefinitionListPage() {
  return (
    <DynamicModelTable<ReferentialsAssetMetadataDefinition>
      app="referentials"
      model="AssetMetadataDefinition"
      create={{ type: "link", hrefTemplate: ROUTES.METADATA_DEFINITION_CREATE }}
      update={{ type: "link", hrefTemplate: ROUTES.METADATA_DEFINITION_EDIT }}
      detail={{ type: "link", hrefTemplate: ROUTES.METADATA_DEFINITION_DETAIL }}
      baseTable={{ tableConfig: { title: "Définitions de métadonnées" } }}
    />
  );
}

/** Formulaire création/édition de métadonnée. */
export function MetadataDefinitionFormPage() {
  const { id = "" } = useParams();
  const isUpdate = Boolean(id);
  return (
    <section className="space-y-4">
      <ModelForm<ReferentialsAssetMetadataDefinition>
        title={
          isUpdate
            ? "Modifier la Définition"
            : "Créer une Définition de métadonnée"
        }
        description="Configurez les champs dynamiques associés aux catégories ou familles de biens."
        app="referentials"
        model="AssetMetadataDefinition"
        mode={isUpdate ? "UPDATE" : "CREATE"}
        objectId={isUpdate ? id : undefined}
        generatedSections={[
          {
            id: "scope",
            title: "Périmètre",
            columns: 2,
            fields: ["category", "family"],
          },
          {
            id: "definition",
            title: "Définition du champ",
            columns: 2,
            fields: ["fieldKey", "label", "fieldType", "isRequired"],
          },
          {
            id: "display",
            title: "Affichage",
            columns: 2,
            fields: ["displayOrder", "isActive"],
          },
        ]}
      />
    </section>
  );
}

/** Détail d'une définition de métadonnée. */
export function MetadataDefinitionDetailPage() {
  const { id = "" } = useParams();
  return (
    <ModelDynamicDetail<ReferentialsAssetMetadataDefinition>
      app="referentials"
      model="AssetMetadataDefinition"
      id={id}
    />
  );
}
