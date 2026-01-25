import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  FileText,
  LayoutDashboard,
} from "lucide-react";

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
import { NAVIGATION_LINKS } from "@/routes/links";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  // Helper to flatten items for search
  const getAllLinks = () => {
    const links: {
      title: string;
      path: string;
      description?: string;
      section: string;
    }[] = [];

    NAVIGATION_LINKS.forEach((section) => {
      section.items.forEach((item) => {
        // Add parent item if it has a component (is a page)
        if (item.component) {
          links.push({
            title: item.title,
            path: item.path,
            description: item.description,
            section: section.label,
          });
        }

        // Add children
        if (item.children) {
          item.children.forEach((child) => {
            links.push({
              title: child.title,
              path: child.path,
              description: child.description,
              section: item.title,
            });
          });
        }
      });
    });
    return links;
  };

  const links = getAllLinks();

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center rounded-full bg-background text-sm font-normal text-muted-foreground shadow-none"
        )}
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
      >
        {/* <Search className="h-4 w-4" /> */}
        <kbd className="">
          <Search />
          {/* <span className="text-xs">⌘</span>K */}
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Tapez une commande ou recherchez..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

          {/* We can group by section if we want, or just show all */}
          <CommandGroup heading="Liens">
            {links.map((link) => (
              <CommandItem
                key={link.path}
                value={`${link.title} ${link.description || ""} ${
                  link.section
                }`}
                onSelect={() => {
                  runCommand(() => navigate(link.path));
                }}
              >
                <div className="mr-2 flex h-4 w-4 items-center justify-center">
                  <FileText className="h-3 w-3" />
                </div>
                <div className="flex flex-col">
                  <span>{link.title}</span>
                  {link.description && (
                    <span className="text-xs text-muted-foreground">
                      {link.description}
                    </span>
                  )}
                </div>
                {/* <CommandShortcut>⌘P</CommandShortcut> */}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Paramètres">
            <CommandItem
              onSelect={() => runCommand(() => navigate("/settings/account"))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => navigate("/settings/appearance"))
              }
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Apparence</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
