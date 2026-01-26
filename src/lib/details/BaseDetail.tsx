import * as React from "react";
import { Card } from "@/lib/components/ui/card";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  BaseDetailProps,
  DetailTabSectionList,
  DetailTabSectionTable,
  DetailPanelConfig,
} from "./types";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/lib/components/ui/tabs";
import TableDetail from "./components/TableDetail";
import ListDetail from "./components/ListDetail";

export default function BaseDetail<TData = Record<string, unknown>>({
  data,
  tabs,
  className,
  initialTab,
}: BaseDetailProps<TData>) {
  const [active, setActive] = React.useState<string>(
    initialTab ?? tabs?.[0]?.key ?? "tab-0"
  );
  const renderSimpleTable = (section: DetailTabSectionTable) => {
    const sourceRows: unknown[] = Array.isArray(section.rows)
      ? section.rows!
      : (section.dataPath
          ? ((data as Record<string, unknown>)?.[section.dataPath] as unknown[])
          : []) || [];

    return (
      <Card className="p-3 space-y-3">
        {(section.title || section.actions?.length) && (
          <div className="flex items-center justify-between gap-3">
            <div>
              {section.title ? (
                <h4 className="text-sm font-semibold">{section.title}</h4>
              ) : null}
              {section.description ? (
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
            </div>
            {section.actions && section.actions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {section.actions.map((action) => (
                  <Button
                    key={action.key}
                    size={action.size ?? "sm"}
                    variant={action.variant ?? "outline"}
                    onClick={() =>
                      action.on_click?.({
                        data: data as Record<string, unknown>,
                        rows: sourceRows,
                      })
                    }
                  >
                    {action.icon}
                    {action.size === "icon" ? null : (
                      <span className={action.icon ? "ml-1" : ""}>
                        {action.label}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            ) : null}
          </div>
        )}
        <TableDetail columns={section.columns} rows={sourceRows} />
      </Card>
    );
  };

  const renderListSections = (ps: DetailPanelConfig[]) => (
    <ListDetail
      data={data as Record<string, unknown>}
      panels={ps}
      className={className}
    />
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="mb-2">
          {tabs.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <div className="flex flex-col gap-4">
              {t.sections.map((s, idx) => {
                const isList = (s as DetailTabSectionList).type === "list";
                if (isList) {
                  const list = s as DetailTabSectionList;
                  return (
                    <div key={`${t.key}-list-${idx}`}>
                      {renderListSections(list.panels)}
                    </div>
                  );
                }
                const tbl = s as DetailTabSectionTable;
                return (
                  <div key={`${t.key}-table-${idx}`}>
                    {renderSimpleTable(tbl)}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
