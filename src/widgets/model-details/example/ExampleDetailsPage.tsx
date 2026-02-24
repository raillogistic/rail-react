import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import DynamicDetail from "../DynamicDetail";
import type { DetailsPageSchema } from "../sectionTypes";
import {
  createAttachmentsSection,
  createCustomSection,
  createGeneralSection,
  createHeaderSection,
  createListSection,
  createMetricsSection,
  createModelSection,
  createSettingsSection,
  createTableSection,
  createTimelineSection,
} from "../builtInSections";
import type { UnitFieldInput } from "../units/unitFieldTypes";

type ExampleEntity = {
  id: string;
  name: string;
  status: "active" | "inactive";
  owner: string;
  createdAt: string;
  mrr: number;
  growth: number;
};

type RelatedRow = {
  id: string;
  desc: string;
  quantity: number;
};

const relatedColumns: ColumnDef<RelatedRow>[] = [
  { id: "desc", header: "Description" },
  { id: "quantity", header: "Quantity" },
];

const fakeEntity: ExampleEntity = {
  id: "10",
  name: "Enterprise Workspace",
  status: "active",
  owner: "Ada Lovelace",
  createdAt: "2026-01-15T14:10:00Z",
  mrr: 28500,
  growth: 0.16,
};

const fakeRelatedRows: RelatedRow[] = [
  { id: "r1", desc: "Primary contract", quantity: 3 },
  { id: "r2", desc: "Support plan", quantity: 1 },
];

const fakeTimeline = [
  {
    id: "e1",
    actor: "Alice",
    type: "Update",
    timestamp: "2026-02-15T10:20:00Z",
    title: "Pricing updated",
  },
  {
    id: "e2",
    actor: "Bob",
    type: "Create",
    timestamp: "2026-02-14T08:10:00Z",
    title: "Document uploaded",
  },
];

const fakeFiles = [
  {
    id: "f1",
    name: "msa.pdf",
    sizeBytes: 129300,
    contentType: "application/pdf",
    href: "#",
  },
  {
    id: "f2",
    name: "pricing.xlsx",
    sizeBytes: 25300,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    href: "#",
  },
];

const generalFields = (entity: ExampleEntity): UnitFieldInput[] => [
  {
    id: "name",
    label: "Name",
    kind: "text",
    value: entity.name,
  },
  {
    id: "status",
    label: "Status",
    kind: "status",
    value: entity.status,
  },
  {
    id: "owner",
    label: "Owner",
    kind: "text",
    value: entity.owner,
  },
  {
    id: "created",
    label: "Created",
    kind: "datetime",
    value: entity.createdAt,
  },
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildExampleSchema(): DetailsPageSchema {
  return {
    header: [
      // createHeaderSection({
      //   id: "header-main",
      //   title: "Overview",
      //   select: (ctx) => {
      //     const entity = ctx.entity as ExampleEntity | undefined;
      //     if (!entity) return undefined;
      //     return {
      //       title: entity.name,
      //       subtitle: `Owner: ${entity.owner}`,
      //       badges: [{ id: "status", label: entity.status.toUpperCase() }],
      //     };
      //   },
      // }),
    ],
    body: [
      createModelSection({
        id: "order-model",
        appLabel: "billing",
        title: "Invoice",
        objectId: "1",
        modelName: "Invoice",
        manifest: {
          sections: [
            {
              fields: ["createdAt"],
              columns: 2,
            },
          ],
          // includeUnassignedFields: true,
        },
      }),
      //   createGeneralSection({
      //     id: "general-main",
      //     title: "General",
      //     columns: 2,
      //     select: (ctx) => {
      //       const entity = ctx.entity as ExampleEntity | undefined;
      //       return entity ? generalFields(entity) : [];
      //     },
      //     actions: (ctx) => [
      //       {
      //         id: "refresh",
      //         label: "Refresh",
      //         onClick: async ({ reload }) => {
      //           await reload();
      //         },
      //       },
      //     ],
      //   }),
      //   createMetricsSection({
      //     id: "metrics-main",
      //     title: "Metrics",

      //     select: (ctx) => {
      //       const entity = ctx.entity as ExampleEntity | undefined;
      //       if (!entity) return [];
      //       return [
      //         {
      //           id: "mrr",
      //           label: "MRR",
      //           value: entity.mrr,
      //           kind: "currency",
      //         },
      //         {
      //           id: "growth",
      //           label: "Growth",
      //           value: entity.growth,
      //           kind: "percent",
      //           trend: entity.growth >= 0 ? "up" : "down",
      //         },
      //       ];
      //     },
      //   }),
      //   createCustomSection({
      //     id: "custom-note",
      //     title: "Customx",
      //     loadingStrategy: "lazy",
      //     select: () => ({
      //       note: "Custom section forx product-specific content.",
      //       dd: "dmlsqkdmsqlk",
      //     }),
      //     actions: (ctx) => [
      //       {
      //         id: "refresh",
      //         label: "Refresh",
      //         onClick: async ({ reload }) => {
      //           await reload();
      //         },
      //       },
      //     ],
      //     render: ({ data }) => (
      //       <div className="text-sm text-muted-foreground">
      //         {(data as { note?: string } | undefined)?.note}
      //       </div>
      //     ),
      //   }),
      // ],
      // tabs: [
      //   {
      //     id: "related",
      //     title: "Related",
      //     loadingStrategy: "lazy",
      //     sections: [
      //       createTableSection<RelatedRow>({
      //         id: "related-table",
      //         title: "Related records",
      //         columns: relatedColumns,
      //         load: async ({ abortSignal }) => {
      //           await wait(250);
      //           if (abortSignal.aborted)
      //             throw new DOMException("Aborted", "AbortError");
      //           return fakeRelatedRows;
      //         },
      //       }),
      //       createListSection({
      //         id: "related-list",
      //         title: "Quick list",
      //         select: () =>
      //           fakeRelatedRows.map((row) => ({
      //             id: row.id,
      //             title: row.desc,
      //             subtitle: `Quantity: ${row.quantity}`,
      //           })),
      //       }),
      //     ],
      //   },
      //   {
      //     id: "activity",
      //     title: "Activity",
      //     sections: [
      //       createTimelineSection({
      //         id: "activity-feed",
      //         title: "Timeline",
      //         load: async ({ abortSignal }) => {
      //           await wait(150);
      //           if (abortSignal.aborted)
      //             throw new DOMException("Aborted", "AbortError");
      //           return fakeTimeline;
      //         },
      //       }),
      //     ],
      //   },
      //   {
      //     id: "documents",
      //     title: "Documents",
      //     sections: [
      //       createAttachmentsSection({
      //         id: "docs-files",
      //         title: "Attachments",
      //         load: async ({ abortSignal }) => {
      //           await wait(180);
      //           if (abortSignal.aborted)
      //             throw new DOMException("Aborted", "AbortError");
      //           return fakeFiles;
      //         },
      //       }),
      //     ],
      //   },
      //   {
      //     id: "settings",
      //     title: "Settings",
      //     sections: [
      //       createSettingsSection({
      //         id: "advanced-settings",
      //         title: "Advanced settings",
      //         select: (ctx) => {
      //           const entity = ctx.entity as ExampleEntity | undefined;
      //           if (!entity) return [];
      //           return [
      //             {
      //               id: "group-general",
      //               title: "General controls",
      //               fields: [
      //                 {
      //                   id: "settings-status",
      //                   label: "Status",
      //                   kind: "status",
      //                   value: entity.status,
      //                 },
      //                 {
      //                   id: "settings-owner",
      //                   label: "Owner",
      //                   kind: "text",
      //                   value: entity.owner,
      //                 },
      //               ],
      //             },
      //           ];
      //         },
      //       }),
      //     ],
      //   },
    ],
  };
}

export default function ExampleDetailsPage() {
  const schema = React.useMemo(() => buildExampleSchema(), []);

  return (
    <DynamicDetail
      schema={schema}
      runtime={
        {
          // entityId: fakeEntity.id,
          // entity: fakeEntity,
          // permissions: ["billing.view_invoice"],
        }
      }
      className="space-y-4"
    />
  );
}

