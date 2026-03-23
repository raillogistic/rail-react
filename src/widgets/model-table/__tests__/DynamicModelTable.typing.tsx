import type { OperationsDecharge } from "@/models";
import {
  DynamicModelTable,
  type DynamicModelTableHandle,
} from "@/widgets/model-table";

const validHandle: DynamicModelTableHandle<OperationsDecharge> | null = null;
void validHandle?.data[0]?.site;
void validHandle?.selectedRows[0]?.beneficiaire?.nom;

const validDechargeTable = (
  <DynamicModelTable<OperationsDecharge>
    app="operations"
    model="Decharge"
    baseTable={{
      fields: {
        include: [
          "numero",
          "site",
          "beneficiaire",
          "beneficiaire.nom",
          "restitutionRelationCount",
        ],
        exclude: ["numeroAnnee"],
        add: [
          {
            accessor: "beneficiaire.prenom",
            title: "Prenom",
            order: { after: "beneficiaire.nom" },
          },
        ],
        render: {
          site: (_value, row) => row.site ?? "-",
          "beneficiaire.nom": (_value, row) => row.beneficiaire.nom,
        },
      },
      columnOrdering: {
        mode: "config",
        order: ["numero", "beneficiaire.nom", "site", "restitutionRelationCount"],
        locked: ["numero"],
      },
      quickFilters: ["site", "beneficiaire.nom"],
      relations: {
        restitutionRelation: {
          display: "nom",
          fields: ["numero", "commentaire"],
        },
      },
      columnActions: (context) => [
        {
          label: context.row.site ?? "Action",
          onClick: ({ row }) => {
            void row.beneficiaire.nom;
          },
        },
      ],
    }}
    create={{
      resolveFormProps: ({ selectedRows }) => ({
        state: {
          defaultValues: {
            site: selectedRows[0]?.site ?? "",
          },
        },
      }),
    }}
    update={{
      resolveObjectId: ({ row }) => row.id,
      resolveFormProps: ({ row }) => ({
        onlyFields: ["site", "commentaire"],
        title: row.site ?? "Modifier",
      }),
    }}
    ref={null}
  />
);

void validDechargeTable;

const invalidAccessor = (
  <DynamicModelTable<OperationsDecharge>
    app="operations"
    model="Decharge"
    baseTable={{
      fields: {
        // @ts-expect-error accessor must exist on OperationsDecharge or derived relation paths
        include: ["missingField"],
      },
    }}
  />
);

void invalidAccessor;

const invalidDottedAccessor = (
  <DynamicModelTable<OperationsDecharge>
    app="operations"
    model="Decharge"
    baseTable={{
      columnOrdering: {
        // @ts-expect-error dotted accessor must resolve from the related interface
        order: ["beneficiaire.unknownField"],
      },
    }}
  />
);

void invalidDottedAccessor;

const invalidRelationKey = (
  <DynamicModelTable<OperationsDecharge>
    app="operations"
    model="Decharge"
    baseTable={{
      relations: {
        // @ts-expect-error relation key must exist on OperationsDecharge
        unknownRelation: {
          display: "nom",
        },
      },
    }}
  />
);

void invalidRelationKey;

const invalidCreateFormOverrideField = (
  <DynamicModelTable<OperationsDecharge>
    app="operations"
    model="Decharge"
    create={{
      resolveFormProps: () => ({
        fieldOverrides: {
          etat: { colSpan: 2 },
        },
      }),
    }}
  />
);

void invalidCreateFormOverrideField;
