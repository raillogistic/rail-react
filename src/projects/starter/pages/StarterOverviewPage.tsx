import type { FC } from "react";

export const StarterOverviewPage: FC = () => {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Starter Overview</h1>
        <p className="text-sm text-muted-foreground">
          Example project page reusing the shared shell, authentication, and UI
          system.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Add project-specific widgets here without changing core auth or routing.
      </div>
    </section>
  );
};

export default StarterOverviewPage;
