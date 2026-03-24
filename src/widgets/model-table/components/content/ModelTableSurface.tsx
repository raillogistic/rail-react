import type React from "react";
import { TooltipProvider } from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";

type ModelTableSurfaceProps = {
  persistenceKey: string;
  devtools?: React.ReactNode;
  topContent?: React.ReactNode;
  hideTableOnMobile?: boolean;
  mobileContent?: React.ReactNode;
  desktopContent: React.ReactNode;
  paginationContent?: React.ReactNode;
  dataErrorContent?: React.ReactNode;
  pdfPreviewDialog?: React.ReactNode;
  dialogsContent?: React.ReactNode;
};

export function ModelTableSurface({
  persistenceKey,
  devtools,
  topContent,
  hideTableOnMobile,
  mobileContent,
  desktopContent,
  paginationContent,
  dataErrorContent,
  pdfPreviewDialog,
  dialogsContent,
}: ModelTableSurfaceProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="relative flex h-full w-full max-w-full min-w-0 flex-col overflow-hidden border border-border/50 bg-card shadow-md shadow-black/5 sm:rounded-xl"
        data-model-table-persistence-key={persistenceKey}
      >
        {devtools}
        {topContent ? (
          <div className="z-20 flex-none shrink-0 border-b border-border/40 bg-card/90 backdrop-blur-md">
            {topContent}
          </div>
        ) : null}

        {hideTableOnMobile && mobileContent ? (
          <div className="flex-1 min-h-0 min-w-0 bg-background md:hidden">
            {mobileContent}
          </div>
        ) : null}

        <div
          className={cn(
            "flex-1 min-h-0 min-w-0 bg-background/50",
            hideTableOnMobile ? "hidden md:block" : "block",
          )}
        >
          {desktopContent}
        </div>

        {paginationContent ? (
          <div className="z-10 flex-none shrink-0 border-t border-border/40 bg-card backdrop-blur-md">
            {paginationContent}
          </div>
        ) : null}

        {dataErrorContent}
        {pdfPreviewDialog}
        {dialogsContent}
      </div>
    </TooltipProvider>
  );
}
