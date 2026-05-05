import type { FC } from "react";

export const PatrimoineOverviewPage: FC = () => {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Patrimoine Overview</h1>
        <p className="text-sm text-muted-foreground">
          This page is scaffolded for the "patrimoine" project.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Build your patrimoine feature modules here.
      </div>
    </section>
  );
};

export default PatrimoineOverviewPage;
