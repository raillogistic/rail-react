import React from "react";


export interface DynamicTableTopShellProps<TSource extends object> {
  sectionVisibility: {
    header: boolean;
    topActions: boolean;
    toolbar: boolean;
    bulkActionsBar: boolean;
  };
  sectionController: any;
  selectedRows: any[];
  HeaderSlot: React.ComponentType<any>;
  TopActionsSlot: React.ComponentType<any>;
  ToolbarSlot: React.ComponentType<any>;
  BulkActionsBarSlot: React.ComponentType<any>;
  headerTopActionsSlot: React.ComponentType<any>;
}

export function DynamicTableTopShell<TSource extends object>({
  sectionVisibility,
  sectionController,
  selectedRows,
  HeaderSlot,
  TopActionsSlot,
  ToolbarSlot,
  BulkActionsBarSlot,
  headerTopActionsSlot,
}: DynamicTableTopShellProps<TSource>) {
  if (!sectionController.metadata) return null;

  return (
    <div className="flex w-full flex-col bg-background relative z-10 transition-colors">
      {(sectionVisibility.header || sectionVisibility.topActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 py-4 gap-4">
          {sectionVisibility.header ? (
            <div className="flex-1 min-w-0">
              <HeaderSlot
                controller={sectionController}
                TopActionsComponent={headerTopActionsSlot}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {!sectionVisibility.header && sectionVisibility.topActions && (
            <div className="flex items-center gap-2">
              <TopActionsSlot controller={sectionController} />
            </div>
          )}
        </div>
      )}

      {sectionVisibility.toolbar && (
        <div className="px-2 pb-3">
          <ToolbarSlot controller={sectionController} />
        </div>
      )}

      {sectionVisibility.bulkActionsBar && selectedRows.length > 0 && (
        <BulkActionsBarSlot controller={sectionController} />
      )}
    </div>
  );
}
