import { Button } from "@/shared/ui/kit/button";
import { localizeTableErrorMessage } from "../DynamicModelTable.shared";

export function ModelTableLoadingSkeleton() {
  return (
    <div
      className="flex h-105 w-full flex-col gap-5 p-4"
      role="status"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-muted/40" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 bg-muted/30" />
            <div className="h-6 w-48 bg-muted/40" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted/30" />
          <div className="h-9 w-20 bg-muted/30" />
        </div>
      </div>
      <div className="h-12 w-full border border-border/20 bg-muted/20" />
      <div className="flex-1 overflow-hidden border border-border/20 bg-card/30 backdrop-blur-sm">
        <div className="h-10 w-full bg-muted/30" />
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border/10 px-4 py-3"
          >
            <div className="size-4 bg-muted/30" />
            <div className="h-3.5 flex-2 bg-muted/25" />
            <div className="h-3.5 flex-1 bg-muted/20" />
            <div className="h-3.5 w-20 bg-muted/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ModelTableMetadataErrorState({ error }: { error: Error }) {
  return (
    <div className="flex h-100 items-center justify-center p-8">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-border/50 bg-background/50 p-8 flex flex-col items-center text-center gap-4">
        <div className="flex size-12 rounded-full items-center justify-center bg-rose-500/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-6 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">
            Erreur de métadonnées
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {localizeTableErrorMessage(error)}
          </p>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </div>
    </div>
  );
}

export function ModelTableDataErrorDisplay({ error }: { error: Error }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-md px-4 py-3 bg-red-500/10 text-xs font-medium text-red-600 border border-red-500/20">
      <div className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-red-500/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-3.5 text-rose-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <span>Erreur de donnees : {localizeTableErrorMessage(error)}</span>
    </div>
  );
}
