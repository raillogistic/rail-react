import type { ReactNode } from "react";

interface SettingsLayoutProps {
  children: ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto py-10 space-y-8">
      {children}
    </div>
  );
}
