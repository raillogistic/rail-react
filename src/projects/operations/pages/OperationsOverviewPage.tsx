import type { FC } from "react";

export const OperationsOverviewPage: FC = () => {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Operations Overview</h1>
        <p className="text-sm text-muted-foreground">
          This page is scaffolded for the "operations" project.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Build your operations feature modules here.
      </div>
    </section>
  );
};

export default OperationsOverviewPage;
