import { useAuth } from "@/auth/hooks/useAuth";
import { Button } from "@/lib/components/ui/button";
import { Separator } from "@/lib/components/ui/separator";
import { SidebarTrigger } from "@/lib/components/ui/sidebar";
import { ModeToggle } from "./ui/themeToggle";
import { LogOut } from "lucide-react";

/**
 * Props for the SiteHeader component.
 *
 * @property title - Current page title displayed prominently.
 * @property description - Optional subtext describing the active view.
 * @property sectionLabel - Optional badge showing the parent navigation section.
 */
export interface SiteHeaderProps {
  title: string;
  description?: string;
  sectionLabel?: string;
}

/**
 * Top bar that anchors navigation controls and contextual page metadata.
 */
export function SiteHeader({
  title,
  description,
  sectionLabel,
}: SiteHeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="flex h-(--header-height) min-h-16 shrink-0 items-center border-b border-border bg-background/90 text-foreground backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 px-4 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 h-6 data-[orientation=vertical]:h-6"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {sectionLabel && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
                {sectionLabel}
              </span>
            )}
            <h1 className="text-lg font-semibold leading-tight text-foreground">
              {title}
            </h1>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={() => logout()}
            className="gap-2 rounded-full border-border text-foreground"
          >
            <LogOut className="size-4" />
            {/* Déconnexion */}
          </Button>
        </div>
      </div>
    </header>
  );
}
