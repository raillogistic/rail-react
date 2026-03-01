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
  type ModelDynamicDetailFieldConfig,
  type ModelDynamicDetailNestedConfig,
  type ModelDynamicDetailRowConfig,
  type ModelDynamicDetailSectionConfig,
} from "@/widgets/model-details";
import SectionErrorState from "@/widgets/model-details/states/SectionErrorState";
import SectionSkeleton from "@/widgets/model-details/states/SectionSkeleton";
import { GitBranch, LayoutGrid, Wrench } from "lucide-react";

const PRODUCT_ID = "9";

/**
 * Resolves the normalized GraphQL relation path.
 */
function relationPath(relation: RelationshipMetadata): string {
  return toGraphqlFieldName(relation.name || relation.fieldName || "");
}

/**
 * Builds a prioritized list of overview fields from metadata.
 */
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
    "is_active",
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

/**
 * Splits fields into row configs using a fixed column count.
 */
function rowsFromFields(
  fields: string[],
  sectionId: string,
  columns: number,
): ModelDynamicDetailRowConfig[] {
  const rows: ModelDynamicDetailRowConfig[] = [];
  for (let index = 0; index < fields.length; index += columns) {
    const chunk = fields.slice(index, index + columns);
    if (chunk.length === 0) continue;
    rows.push({
      id: `${sectionId}:row:${index}`,
      columns,
      fields: chunk,
    });
  }
  return rows;
}

/**
 * Builds tab-targeted layout sections for a complex detail dashboard.
 */
function buildTabbedSections(
  overviewFields: string[],
): ModelDynamicDetailSectionConfig[] {
  const mainFields =
    overviewFields.length > 0
      ? overviewFields.slice(0, Math.min(6, overviewFields.length))
      : ["id"];
  const auditCandidates = ["id", "createdAt", "updatedAt"];
  const auditFields = auditCandidates.filter((field) =>
    overviewFields.includes(field),
  );
  const fallbackField = overviewFields[0] ?? "id";

  const contextualField: ModelDynamicDetailFieldConfig = {
    path: fallbackField,
    colSpan: 2,
    description: "Example contextual renderer using section host id.",
    render: (ctx) => (
      <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-sm">
        <div className="font-medium text-foreground/90">
          {String(ctx.value ?? "-")}
        </div>
        <div className="text-xs text-muted-foreground">
          Section host: {ctx.sectionId}
        </div>
      </div>
    ),
  };

  return [
    {
      id: "general-summary",
      tabId: "general",
      title: "Summary",
      description: "Primary model fields grouped as a dense grid.",
      order: 10,
      containerSpan: {
        base: 1,
        xxl: 4,
      },
      columns: 3,
      rows: rowsFromFields(mainFields, "general-summary", 3),
    },
    {
      id: "general-audit",
      tabId: "general",
      title: "Audit",
      description: "Record lineage and synchronization metadata.",
      order: 20,
      containerSpan: {
        base: 1,
        xxl: 2,
      },
      columns: 3,
      rows:
        auditFields.length > 0
          ? rowsFromFields(auditFields, "general-audit", 3)
          : rowsFromFields([fallbackField], "general-audit", 3),
    },
    {
      id: "operations-context",
      tabId: "operations",
      title: "Operations Context",
      description: "Field-level renderer demonstrates section host context.",
      order: 10,
      containerSpan: {
        base: 1,
        xxl: 6,
      },
      columns: 3,
      rows: [
        {
          id: "operations-context:row:0",
          columns: 3,
          fields: [
            contextualField,
            ...(mainFields[1] ? [mainFields[1]] : []),
            ...(mainFields[2] ? [mainFields[2]] : []),
          ],
        },
      ],
    },
  ];
}

/**
 * Builds nested relation config and routes nested sections to the relations tab.
 */
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
        tabId: "relations",
        sectionId: `relations:${path}`,
        title: `${firstToOne.verboseName} (Object)`,
        description: "Nested object relation rendered with contextual fields.",
        mode: "object",
        columns: 2,
        fields: ["desc", { path: "id", order: 1 }],
      };
    }
  }

  if (firstToMany) {
    const path = relationPath(firstToMany);
    if (path) {
      nested[path] = {
        tabId: "relations",
        sectionId: `relations:${path}`,
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

/**
 * Renders a model detail dashboard configured with complex tabs and sections.
 */
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
      view: {
        initialTabId: "general",
        sectionColumns: 6,
        resolveSectionContainer: () => ({
          className: "col-span-1 2xl:col-span-6",
        }),
      },
      layout: {
        tabs: [
          {
            id: "general",
            title: "General",
            icon: <LayoutGrid className="size-4" />,
            order: 0,
          },
          {
            id: "relations",
            title: "Relations",
            icon: <GitBranch className="size-4" />,
            order: 1,
          },
          {
            id: "operations",
            title: "Operations",
            icon: <Wrench className="size-4" />,
            order: 2,
          },
        ],
        // includeFields: overviewFields,
        sections: buildTabbedSections(overviewFields),
        customSections: [
          {
            id: "relations-note",
            tabId: "relations",
            title: "Relation Rendering Strategy",
            description: "Nested sections use explicit tab routing.",
            render: ({ metadata }) => (
              <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-sm">
                <div className="font-medium text-foreground/90">
                  {metadata?.verboseName ?? "Model"} relations
                </div>
                <div className="text-xs text-muted-foreground">
                  Detected relationships: {metadata?.relationships?.length ?? 0}
                </div>
              </div>
            ),
          },
          {
            id: "operations-note",
            tabId: "operations",
            title: "Execution Notes",
            description: "Operational guidance for actions and mutations.",
            render: ({ id }) => (
              <div className="rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-sm">
                <div className="font-medium text-foreground/90">
                  Active record id: {id}
                </div>
                <div className="text-xs text-muted-foreground">
                  Use update, delete, and custom actions from the header
                  toolbar.
                </div>
              </div>
            ),
          },
          {
            id: "body-fallback",
            title: "Body Fallback Section",
            description: "No tabId provided, so this remains in body scope.",
            order: 900,
            render: () => (
              <div className="rounded-md border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground">
                This custom section is intentionally rendered outside tabs.
              </div>
            ),
          },
        ],
        includeUnassignedFields: true,
        defaultColumns: 3,
      },
      nestedFields,
      actions: {
        updateForm: {
          modelFormProps: {
            // onlyRequired: true,
            // onlyFields: ["name", "description"],

            layout: {
              columns: 3,
            },
          },
        },
      },
      queryOptions: {
        fetchPolicy: "cache-and-network",
      },
    }),
    [nestedFields, overviewFields],
  );

  // if (metadataState.loading && !metadataState.metadata) {
  //   return (
  //     <div className="flex h-full w-full min-h-0 flex-col gap-4 p-4">
  //       <SectionSkeleton lines={7} />
  //     </div>
  //   );
  // }

  // if (metadataState.error && !metadataState.metadata) {
  //   return (
  //     <div className="flex h-full w-full min-h-0 flex-col gap-4 p-4">
  //       <SectionErrorState
  //         title="store.Product metadata unavailable"
  //         description={metadataState.error.message}
  //         onRetry={() => metadataState.refetch().then(() => undefined)}
  //       />
  //     </div>
  //   );
  // }

  return (
    <div className="container mx-auto flex h-full w-full min-h-0 flex-col gap-4 p-16">
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
