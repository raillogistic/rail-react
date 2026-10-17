/** Explicit fields, forms and detail layouts owned by Partners. */
import React from "react";
import { UnitFieldRenderer, type ModelDynamicDetailFieldRenderContext } from "@/widgets/model-details";
import { Badge } from "@/shared/ui/kit/badge";
import { SupplierAttachmentListSection } from "../components/SupplierAttachmentListSection";
import { defineCrudViewConfig } from "./viewHelpers";
/** Show explicit relation descriptions with their French label and empty state. */
function renderProcurementMappings({value, path, field}: ModelDynamicDetailFieldRenderContext) {
  return <UnitFieldRenderer field={{id: path, label: field.label, kind: "tags",
    value: Array.isArray(value) ? value.map((item: {desc:string}) => item.desc) : [],
    emptyText: "Aucun mapping configuré"}} />;
}

function SupplierTypeBadge({ value }: { value: unknown }) {
  const isSupplier = Boolean(value);
  return (
    <Badge variant={isSupplier ? "secondary" : "outline"}>
      {isSupplier ? "Fournisseur" : "Non fournisseur"}
    </Badge>
  );
}

// Removed global SupplierProgressCell since tracking is now per-category

export const PARTNERS_MASTER_DATA_VIEWS = {
"procurement-lots": defineCrudViewConfig({
    detailFieldOverrides: {
      categories: {label: "Catégories associées", emptyText: "Aucun mapping configuré", render: renderProcurementMappings},
      technicalDepartments: {label: "Structures d'appui technique", emptyText: "Aucun mapping configuré", render: renderProcurementMappings},
    },
    tableFields: ["code", "name", "defaultPortfolio", "isActive"],
    formSections: [{ id: "lot", title: "Lot d'activité", columns: 2,
      fields: ["code", "name", "description", "defaultPortfolio", "categories", "technicalDepartments", "technicalSupport", "isActive"] }],
    detailSections: [{ id: "lot", title: "Périmètre et appuis techniques", columns: 2,
      fields: ["code", "name", "description", "defaultPortfolio", "categories", "technicalDepartments", "technicalSupport", "isActive"] }],
  }),
suppliers: defineCrudViewConfig({
    tableFields: [
      "name",
      "lots",
      {
        accessor: "isSupplier",
        title: "Type",
        render: (value) => <SupplierTypeBadge value={value} />,
      },

      "approvedFromBatch.name",
      "isActive",
    ],
    formSections: [
      {
        id: "supplier-general",
        title: "Informations",
        columns: 2,
        fields: ["name", "isSupplier", "isActive"],
      },
      {
        id: "supplier-lots",
        title: "Lots d'activité",
        columns: 1,
        fields: ["lots"],
      },
      {
        id: "supplier-contact",
        title: "Coordonnees",
        columns: 2,
        fields: ["email", "phone", "website", "address"],
      },
      {
        id: "supplier-legal",
        title: "References legales",
        columns: 2,
        fields: ["nif", "art", "nis", "rc"],
      },
      {
        id: "supplier-notes",
        title: "Notes",
        columns: 1,
        fields: ["notes"],
      },
      {
        id: "supplier-contacts",
        title: "Contacts",
        columns: 1,
        fields: ["contacts"],
      },
    ],
    formNested: {
      contacts: {
        title: "Contacts",
        description:
          "Ajoutez les interlocuteurs principaux et administratifs du fournisseur directement dans ce formulaire.",
        onlyFields: [
          "name",
          "position",
          "phone",
          "email",
          "isPrimary",
          "notes",
        ],
        fieldsOrder: "custom",
        customOrder: [
          "name",
          "position",
          "phone",
          "email",
          "isPrimary",
          "notes",
        ],
        columns: 2,
        itemLabel: "contact",
        addButton: { label: "Ajouter un contact" },
        removeOperation: "delete",
        deleteMutation: { enabled: true },
        fieldOverrides: {
          name: {
            label: "Nom",
            placeholder: "Nom du contact",
          },
          position: {
            label: "Poste",
            placeholder: "Ex. Responsable achats",
          },
          phone: {
            label: "Telephone",
          },
          email: {
            label: "E-mail",
          },
          isPrimary: {
            label: "Contact principal",
          },
          notes: {
            label: "Notes",
          },
        },
      },
    },
    detailSections: [
      {
        id: "supplier-summary",
        title: "Fournisseur",
        columns: 2,
        fields: [
          "name",
          "isSupplier",
          "isActive",
          "approvedFromBatch.name",
          "lots",
          "notes",
        ],
      },
      {
        id: "supplier-contact",
        title: "Coordonnees",
        columns: 2,
        fields: ["email", "phone", "website", "address"],
      },
      {
        id: "supplier-legal",
        title: "References legales",
        columns: 2,
        fields: ["nif", "art", "nis", "rc"],
      },
      {
        id: "supplier-audit",
        title: "Suivi",
        columns: 2,
        fields: ["createdAt", "updatedAt"],
      },
    ],
    detailCustomSections: [
      {
        id: "supplier-attachments",
        title: "Pieces jointes",
        render: ({ id }) =>
          React.createElement(SupplierAttachmentListSection, {
            supplierId: id,
          }),
      },
    ],
  }),
"supplier-contacts": defineCrudViewConfig({
    tableFields: [
      "name",
      "supplier.name",
      "position",
      "phone",
      "email",
      "isPrimary",
    ],
    formSections: [
      {
        id: "supplier-contact-general",
        title: "Informations",
        columns: 2,
        fields: ["supplier", "name", "position", "isPrimary"],
      },
      {
        id: "supplier-contact-coordinates",
        title: "Coordonnees",
        columns: 2,
        fields: ["phone", "email"],
      },
      {
        id: "supplier-contact-notes",
        title: "Notes",
        columns: 1,
        fields: ["notes"],
      },
    ],
    detailSections: [
      {
        id: "supplier-contact-summary",
        title: "Contact",
        columns: 2,
        fields: ["supplier.name", "name", "position", "isPrimary"],
      },
      {
        id: "supplier-contact-coordinates",
        title: "Coordonnees",
        columns: 2,
        fields: ["phone", "email", "notes"],
      },
      {
        id: "supplier-contact-audit",
        title: "Suivi",
        columns: 2,
        fields: ["createdAt", "updatedAt"],
      },
    ],
  }),
"supplier-intake-batches": defineCrudViewConfig({
    tableFields: ["name", "status", "createdAt", "submittedAt"],
    formSections: [
      {
        id: "intake-batch-general",
        title: "Informations",
        columns: 1,
        fields: ["name", "notes"],
      },
      {
        id: "intake-batch-entries",
        title: "Fournisseurs proposes",
        columns: 1,
        fields: ["entries"],
      },
    ],
    formNested: {
      entries: {
        title: "Fournisseurs proposes",
        description: "Ajoutez les fournisseurs a inserer dans cette liste.",
        onlyFields: [
          "sortOrder",
          "name",
          "email",
          "phone",
          "address",
          "nif",
          "art",
          "nis",
          "rc",
          "website",
          "notes",
        ],
        fieldsOrder: "custom",
        customOrder: [
          "sortOrder",
          "name",
          "email",
          "phone",
          "address",
          "nif",
          "art",
          "nis",
          "rc",
          "website",
          "notes",
        ],
        columns: 2,
        itemLabel: "fournisseur propose",
        addButton: { label: "Ajouter un fournisseur" },
        removeOperation: "delete",
        fieldOverrides: {
          sortOrder: { label: "Ordre" },
          name: { label: "Nom", placeholder: "Raison sociale" },
          email: { label: "E-mail" },
          phone: { label: "Telephone" },
          address: { label: "Adresse" },
          nif: { label: "NIF" },
          art: { label: "ART" },
          nis: { label: "NIS" },
          rc: { label: "RC" },
          website: { label: "Site web" },
          notes: { label: "Notes" },
        },
      },
    },
    detailSections: [
      {
        id: "intake-batch-summary",
        title: "Liste d'insertion",
        columns: 2,
        fields: ["name", "status", "notes"],
      },
      {
        id: "intake-batch-dates",
        title: "Dates",
        columns: 2,
        fields: [
          "submittedAt",
          "approvedAt",
          "rejectedAt",
          "createdAt",
          "updatedAt",
        ],
      },
    ],
    detailNestedFields: {
      entries: {
        title: "Fournisseurs proposes",
        mode: "table",
        fields: [
          "sortOrder",
          "name",
          "email",
          "phone",
          "nif",
          "rc",
          "supplier.name",
        ],
        table: {
          initialPageSize: 10,
          enableQuickSearch: false,
        },
      },
    },
  }),
"supplier-intake-entries": defineCrudViewConfig({
    tableFields: [
      "batch.name",
      "sortOrder",
      "name",
      "email",
      "phone",
      "nif",
      "rc",
      "supplier.name",
    ],
    formSections: [
      {
        id: "intake-entry-general",
        title: "Entree",
        columns: 2,
        fields: ["batch", "sortOrder", "name"],
      },
      {
        id: "intake-entry-coordinates",
        title: "Coordonnees",
        columns: 2,
        fields: ["email", "phone", "website", "address"],
      },
      {
        id: "intake-entry-legal",
        title: "References legales",
        columns: 2,
        fields: ["nif", "art", "nis", "rc"],
      },
      {
        id: "intake-entry-notes",
        title: "Notes",
        columns: 1,
        fields: ["notes"],
      },
    ],
    detailSections: [
      {
        id: "intake-entry-summary",
        title: "Entree",
        columns: 2,
        fields: ["batch.name", "sortOrder", "name", "supplier.name", "notes"],
      },
      {
        id: "intake-entry-coordinates",
        title: "Coordonnees",
        columns: 2,
        fields: ["email", "phone", "website", "address"],
      },
      {
        id: "intake-entry-legal",
        title: "References legales",
        columns: 2,
        fields: ["nif", "art", "nis", "rc"],
      },
    ],
  })
} as const;
