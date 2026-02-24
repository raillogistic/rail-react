import * as React from "react";
import { toGraphqlFieldName } from "@/shared/api/graphql/graphql/naming";
import { useMetadata } from "@/shared/api/graphql/graphql/metadata/gateway";
import type {
  ModelMetadata,
  RelationshipMetadata,
} from "@/shared/api/graphql/graphql/metadata/types";
import {
  ModelDynamicDetail,
  type ModelDynamicDetailConfig,
  type ModelDynamicDetailNestedConfig,
} from "@/widgets/model-details";
import SectionErrorState from "@/widgets/model-details/states/SectionErrorState";
import SectionSkeleton from "@/widgets/model-details/states/SectionSkeleton";

const PRODUCT_ID = "9";

function relationPath(relation: RelationshipMetadata): string {
  return toGraphqlFieldName(relation.name || relation.fieldName || "");
}

function buildOverviewFields(metadata: ModelMetadata | null): string[] {
  const readableFields = (metadata?.fields ?? [])
    .filter(
      (field) => field.readable !== false && field.visibility !== "hidden",
    )
    .map((field) => toGraphqlFieldName(field.name || field.fieldName || ""))
    .filter(Boolean);

  const preferred = [
    "name",
    "sku",
    "status",
    "price",
    "stock",
    "createdAt",
    "updatedAt",
  ];
  const available = new Set(readableFields);
  const selectedPreferred = preferred.filter((field) => available.has(field));
  if (selectedPreferred.length > 0) {
    return selectedPreferred;
  }

  if (readableFields.length > 0) {
    return readableFields.slice(0, 8);
  }

  return ["id"];
}

function buildNestedFields(
  metadata: ModelMetadata | null,
): Record<string, ModelDynamicDetailNestedConfig> {
  const relationships = metadata?.relationships ?? [];
  const firstToOne = relationships.find((relation) => relation.isToOne);
  const firstToMany = relationships.find((relation) => relation.isToMany);

  const nested: Record<string, ModelDynamicDetailNestedConfig> = {};

  if (firstToOne) {
    const path = relationPath(firstToOne);
    if (path) {
      nested[path] = {
        title: `${firstToOne.verboseName} (Object)`,
        description: "Nested object rendered in object mode.",
        mode: "object",
        fields: ["id", "desc"],
      };
    }
  }

  if (firstToMany) {
    const path = relationPath(firstToMany);
    if (path) {
      nested[path] = {
        title: `${firstToMany.verboseName} (Table)`,
        description: "Nested collection rendered in table mode.",
        mode: "table",
        fields: ["id", "desc"],
        table: {
          initialPageSize: 5,
          enableQuickSearch: true,
          enableSorting: true,
        },
      };
    }
  }

  return nested;
}

export default function DashboardPage() {
  const metadataState = useMetadata({
    app: "store",
    model: "Product",
    profile: "table",
    objectId: PRODUCT_ID,
  });

  const overviewFields = React.useMemo(
    () => buildOverviewFields(metadataState.metadata),
    [metadataState.metadata],
  );

  const nestedFields = React.useMemo(
    () => buildNestedFields(metadataState.metadata),
    [metadataState.metadata],
  );

  const baseDetail = React.useMemo<ModelDynamicDetailConfig>(
    () => ({
      runtime: {},
      layout: {
        includeFields: overviewFields,
        sections: [
          {
            id: "overview",
            title: "Overview",
            description: "Core Product fields from store.Product metadata.",
            columns: 3,
            // fields: overviewFields,
          },
        ],
        includeUnassignedFields: true,
        defaultColumns: 4,
      },
      nestedFields,
      actions: {
        updateForm: {
          modelFormProps: {
            onlyRequired: true,
            excludeFields: ["price"],
            layout: {
              columns: 3,
            },
          },
        },
      },
      // actions: {
      //   showUpdate: true,
      //   showDelete: true,
      //   showTemplates: true,
      //   showCustomMutations: true,
      // },
      queryOptions: {
        fetchPolicy: "cache-and-network",
      },
    }),
    [nestedFields, overviewFields],
  );

  if (metadataState.loading && !metadataState.metadata) {
    return (
      <div className="flex h-full w-full min-h-0 flex-col gap-4 p-4">
        <SectionSkeleton lines={7} />
      </div>
    );
  }

  if (metadataState.error && !metadataState.metadata) {
    return (
      <div className="flex h-full w-full min-h-0 flex-col gap-4 p-4">
        <SectionErrorState
          title="store.Product metadata unavailable"
          description={metadataState.error.message}
          onRetry={() => metadataState.refetch().then(() => undefined)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-4 p-4">
      <div className="min-h-0 flex-1 overflow-auto">
        <ModelDynamicDetail
          app="store"
          model="Product"
          id={PRODUCT_ID}
          baseDetail={baseDetail}
        />
      </div>
    </div>
  );
}
