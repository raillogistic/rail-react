import type { FC } from "react";

export const StarterReportsPage: FC = () => {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Starter Reports</h1>
        <p className="text-sm text-muted-foreground">
          Secondary page to demonstrate multi-page project navigation.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Connect this view to feature-specific data loaders and components.
      </div>
    </section>
  );
};

export default StarterReportsPage;
