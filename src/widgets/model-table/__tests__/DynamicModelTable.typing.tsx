import type { LocationsAssetMovement } from "@/models";
import {
  DynamicModelTable,
  type DynamicModelTableHandle,
} from "@/widgets/model-table";

const validHandle: DynamicModelTableHandle<LocationsAssetMovement> | null = null;
void validHandle?.data[0]?.reason;
void validHandle?.selectedRows[0]?.asset?.name;

const validDechargeTable = (
  <DynamicModelTable<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    baseTable={{
      fields: {
        include: [
          "reference",
          "reason",
          "asset",
          "asset.name",
          "fromEmployee",
        ],
        exclude: ["id"],
        add: [
          {
            accessor: "asset.brand",
            title: "Brand",
            order: { after: "asset.name" },
          },
        ],
        render: {
          reason: (_value, row) => row.reason ?? "-",
          "asset.name": (_value, row) => row.asset.name,
        },
      },
      columnOrdering: {
        mode: "config",
        order: ["reference", "asset.name", "reason", "fromEmployee"],
        locked: ["reference"],
      },
      quickFilters: ["reason", "asset.name"],
      relations: {
        toLocation: {
          display: "name",
          fields: ["code", "address"],
        },
      },
      columnActions: (context) => [
        {
          label: context.row.reason ?? "Action",
          onClick: ({ row }) => {
            void row.asset.name;
          },
        },
      ],
    }}
    create={{
      resolveFormProps: ({ selectedRows }) => ({
        state: {
          defaultValues: {
            reason: selectedRows[0]?.reason ?? "",
          },
        },
      }),
    }}
    update={{
      resolveObjectId: ({ row }) => row.id,
      resolveFormProps: ({ row }) => ({
        onlyFields: ["reason", "status"],
        title: row.reason ?? "Modifier",
      }),
    }}
    ref={null}
  />
);

void validDechargeTable;

const invalidAccessor = (
  <DynamicModelTable<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    baseTable={{
      fields: {
        // @ts-expect-error accessor must exist on LocationsAssetMovement or derived relation paths
        include: ["missingField"],
      },
    }}
  />
);

void invalidAccessor;

const invalidDottedAccessor = (
  <DynamicModelTable<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    baseTable={{
      columnOrdering: {
        // @ts-expect-error dotted accessor must resolve from the related interface
        order: ["asset.unknownField"],
      },
    }}
  />
);

void invalidDottedAccessor;

const invalidRelationKey = (
  <DynamicModelTable<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    baseTable={{
      relations: {
        // @ts-expect-error relation key must exist on LocationsAssetMovement
        unknownRelation: {
          display: "name",
        },
      },
    }}
  />
);

void invalidRelationKey;

const invalidCreateFormOverrideField = (
  <DynamicModelTable<LocationsAssetMovement>
    app="locations"
    model="AssetMovement"
    create={{
      resolveFormProps: () => ({
        fieldOverrides: {
          status: { colSpan: 2 },
        },
      }),
    }}
  />
);

void invalidCreateFormOverrideField;
