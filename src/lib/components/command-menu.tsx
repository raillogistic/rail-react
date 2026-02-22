import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  FileText,
  HelpCircle,
  History,
  Mail,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { ROUTES } from "@/shared/routing/paths";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/lib/components/ui/command";
import { Button } from "@/lib/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/lib/components/ui/badge";
import type { NavigationSection } from "@/shared/routing/navigation";

type IconComponent = React.ComponentType<{ className?: string }>;

type CommandLink = {
  title: string;
  path: string;
  description?: string;
  section: string;
  icon?: IconComponent;
};

export type CommandMenuProps = {
  navigationLinks?: NavigationSection[];
  defaultPath?: string;
};

/**
 * Global command palette.
 * Integrates with navigation manifests to keep searchable links in sync.
 */
export function CommandMenu({
  navigationLinks = [],
  defaultPath = ROUTES.DASHBOARD,
}: CommandMenuProps = {}) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((isOpen) => !isOpen);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const links = React.useMemo<CommandLink[]>(() => {
    const output: CommandLink[] = [];

    navigationLinks.forEach((section) => {
      section.items.forEach((item) => {
        if (item.component) {
          output.push({
            title: item.title,
            path: item.path,
            description: item.description,
            section: section.label,
            icon: item.icon,
          });
        }

        (item.children ?? []).forEach((child) => {
          output.push({
            title: child.title,
            path: child.path,
            description: child.description,
            section: item.title,
            icon: child.icon || item.icon,
          });
        });
      });
    });

    return output;
  }, [navigationLinks]);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start rounded-full bg-muted/30 border-muted-foreground/20 text-sm font-normal text-muted-foreground shadow-none transition-all hover:bg-muted/50 hover:border-muted-foreground/40 sm:pr-12 max-w-sm md:w-64",
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4 opacity-70" />
        <span className="hidden sm:inline-flex">Search anything...</span>
        <span className="inline-flex sm:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="bg-accent/30 px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3 text-primary animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Command Palette
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] py-0 px-1.5 h-4 font-mono bg-background/50 border-muted-foreground/20"
          >
            ESC to close
          </Badge>
        </div>

        <CommandInput
          placeholder="Type a command or search for anything..."
          className="border-none focus:ring-0 text-base py-6"
        />

        <CommandList className="max-h-[450px]">
          <CommandEmpty className="py-12 flex flex-col items-center gap-3">
            <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Search className="size-6 text-muted-foreground/30" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">No matches found</p>
              <p className="text-sm text-muted-foreground">
                Try searching for something else or browse categories.
              </p>
            </div>
          </CommandEmpty>

          <CommandGroup heading="Recent Actions" className="p-2">
            <CommandItem
              onSelect={() => runCommand(() => navigate(defaultPath))}
              className="rounded-xl px-3 py-3 cursor-pointer group"
            >
              <History className="mr-3 h-4 w-4 text-muted-foreground group-aria-selected:text-primary transition-colors" />
              <div className="flex flex-col">
                <span className="font-semibold text-sm group-aria-selected:text-primary transition-colors">
                  Return to Dashboard
                </span>
                <span className="text-[11px] text-muted-foreground opacity-70">
                  Recently viewed
                </span>
              </div>
              <ArrowUpRight className="ml-auto size-3 opacity-0 group-aria-selected:opacity-40 transition-opacity" />
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-muted/50 mx-2" />

          <CommandGroup heading="Navigation & Records" className="p-2">
            {links.map((link) => {
              const Icon = link.icon || FileText;
              return (
                <CommandItem
                  key={link.path}
                  value={`${link.title} ${link.description || ""} ${link.section}`}
                  onSelect={() => {
                    runCommand(() => navigate(link.path));
                  }}
                  className="rounded-xl px-3 py-3 cursor-pointer group"
                >
                  <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 group-aria-selected:bg-primary/10 transition-colors">
                    <Icon className="h-4.5 w-4.5 text-muted-foreground group-aria-selected:text-primary transition-colors" />
                  </div>
                  <div className="flex flex-col flex-1 truncate">
                    <span className="font-semibold text-sm group-aria-selected:text-primary transition-colors truncate">
                      {link.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                        {link.section}
                      </span>
                      {link.description && (
                        <>
                          <span className="size-1 rounded-full bg-muted-foreground/30" />
                          <span className="text-[11px] text-muted-foreground opacity-70 truncate">
                            {link.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ArrowUpRight className="ml-auto size-3 opacity-0 group-aria-selected:opacity-40 transition-opacity" />
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator className="bg-muted/50 mx-2" />

          <CommandGroup heading="Quick Settings" className="p-2">
            <CommandItem
              onSelect={() =>
                runCommand(() => navigate(ROUTES.SETTINGS_ACCOUNT))
              }
              className="rounded-xl px-3 py-2 cursor-pointer group"
            >
              <User className="mr-3 h-4 w-4 text-muted-foreground group-aria-selected:text-primary transition-colors" />
              <span className="font-medium">Account Settings</span>
              <CommandShortcut className="group-aria-selected:text-primary-foreground">
                Cmd+P
              </CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => navigate(ROUTES.SETTINGS_APPEARANCE))
              }
              className="rounded-xl px-3 py-2 cursor-pointer group"
            >
              <Settings className="mr-3 h-4 w-4 text-muted-foreground group-aria-selected:text-primary transition-colors" />
              <span className="font-medium">Theme & Appearance</span>
              <CommandShortcut className="group-aria-selected:text-primary-foreground">
                Cmd+S
              </CommandShortcut>
            </CommandItem>
            <CommandItem className="rounded-xl px-3 py-2 cursor-pointer group">
              <ShieldCheck className="mr-3 h-4 w-4 text-muted-foreground group-aria-selected:text-primary transition-colors" />
              <span className="font-medium">Security & Privacy</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-muted/50 mx-2" />

          <CommandGroup heading="Support" className="p-2">
            <CommandItem className="rounded-xl px-3 py-2 cursor-pointer group">
              <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground group-aria-selected:text-primary transition-colors" />
              <span className="font-medium">Documentation</span>
            </CommandItem>
            <CommandItem className="rounded-xl px-3 py-2 cursor-pointer group">
              <Mail className="mr-3 h-4 w-4 text-muted-foreground group-aria-selected:text-primary transition-colors" />
              <span className="font-medium">Contact Support</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>

        <div className="bg-muted/30 p-3 border-t flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <kbd className="rounded border bg-background px-1.5 py-0.5 shadow-sm">
              Up/Down
            </kbd>
            navigate
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <kbd className="rounded border bg-background px-1.5 py-0.5 shadow-sm">
              Enter
            </kbd>
            select
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <kbd className="rounded border bg-background px-1.5 py-0.5 shadow-sm">
              Esc
            </kbd>
            close
          </div>
        </div>
      </CommandDialog>
    </>
  );
}
