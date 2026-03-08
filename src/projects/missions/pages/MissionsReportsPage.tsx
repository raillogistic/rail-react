import type { FC } from "react";

export const MissionsReportsPage: FC = () => {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Missions Reports</h1>
        <p className="text-sm text-muted-foreground">
          Secondary view scaffolded for reporting and analytics.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Add reporting widgets and data hooks for missions.
      </div>
    </section>
  );
};

export default MissionsReportsPage;
