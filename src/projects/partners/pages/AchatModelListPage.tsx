/** Reusable Partners implementation using the host Rail runtime. */
import {
  DynamicModelTable,
  type DynamicModelTableProps,
} from "@/widgets/model-table";
import type { AchatCrudViewConfig } from "../config/viewHelpers";

type AchatModelListPageProps = {
  app: string;
  model: string;
  title: string;
  description?: string;
  createPath?: string;
  editPath?: string;
  detailPath?: string;
  fields: AchatCrudViewConfig["tableFields"];
  navFilters?: DynamicModelTableProps["navFilters"];
  readOnly?: boolean;
};

export function AchatModelListPage({
  app,
  model,
  title,
  description,
  createPath,
  editPath,
  detailPath,
  fields,
  navFilters,
  readOnly,
}: AchatModelListPageProps) {
  return (
    <section className="space-y-4">
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      <DynamicModelTable
        app={app}
        model={model}
        create={
          createPath && !readOnly
            ? {
                type: "link",
                hrefTemplate: createPath,
              }
            : undefined
        }
        update={
          editPath && !readOnly
            ? {
                type: "link",
                hrefTemplate: editPath,
              }
            : undefined
        }
        detail={detailPath ? {
          type: "link",
          hrefTemplate: detailPath,
        } : undefined}
        navFilters={navFilters}
        baseTable={{
          fields,
          tableConfig: {
            title,
          },
        }}
      />
    </section>
  );
}

export default AchatModelListPage;
