import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { NavigationSection } from "@/shared/routing/navigation";
import { useTheme } from "@/shared/ui/theme";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/shared/ui/kit/sidebar";
import { cn } from "@/shared/utils";

/**
 * Propriétés du composant NavMain.
 */
export type NavMainProps = {
  /** Liste des sections de navigation configurées dans l'application. */
  navigationLinks: NavigationSection[];
};

/**
 * @file nav-main.tsx
 * @description Composant affichant l'arbre de navigation principal dans la barre latérale.
 * Gère le déploiement automatique des sous-menus contenant l'élément actif,
 * et applique une esthétique épurée (sans ombres, indicateur à gauche, animations fines).
 */
export function NavMain({ navigationLinks }: NavMainProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const is_collapsed = state === "collapsed";

  const [expanded_items, set_expanded_items] = useState<Record<string, boolean>>(
    {},
  );

  /**
   * Vérifie si le chemin d'URL actuel correspond ou commence par le chemin cible.
   * @param target_path Chemin à comparer.
   * @returns Vrai si le chemin correspond, sinon faux.
   */
  const matches_path = (target_path: string): boolean => {
    if (location.pathname === target_path) {
      return true;
    }
    return location.pathname.startsWith(`${target_path}/`);
  };

  // Déplier automatiquement les sections parentes si un sous-élément est actif
  useEffect(() => {
    set_expanded_items((prev) => {
      let next = prev;

      for (const section of navigationLinks) {
        for (const item of section.items) {
          if (!item.children?.length) {
            continue;
          }

          const has_active_child = item.children.some((child) =>
            matches_path(child.path),
          );
          const is_item_active = matches_path(item.path);

          if ((has_active_child || is_item_active) && !prev[item.id]) {
            next = { ...next, [item.id]: true };
          }
        }
      }

      return next;
    });
  }, [location.pathname, navigationLinks]);

  const { layout } = useTheme();

  const visible_sections =
    layout === "mixed"
      ? navigationLinks.filter((section) =>
          section.items.some(
            (item) =>
              location.pathname.startsWith(item.path) ||
              item.children?.some((child) =>
                location.pathname.startsWith(child.path),
              ),
          ),
        )
      : navigationLinks;

  return (
    <SidebarGroup className="py-0 px-1">
      <SidebarGroupContent className="flex flex-col gap-4">
        {visible_sections.map((section) => (
          <div key={section.id} className="space-y-1.5">
            {!is_collapsed && (
              <SidebarGroupLabel className="px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/45">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-1">
              {section.items
                .filter((item) => !item.hidden)
                .map((item) => {
                  const visible_children = item.children?.filter(
                    (child) => !child.hidden,
                  );
                  const has_children = Boolean(visible_children?.length);
                  const is_item_active =
                    matches_path(item.path) ||
                    visible_children?.some((child) => matches_path(child.path));
                  const is_open = has_children && Boolean(expanded_items[item.id]);

                  if (!has_children) {
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          className={cn(
                            "relative h-9 w-full group/btn overflow-hidden rounded-lg transition-all duration-200",
                            is_item_active
                              ? "bg-primary/8 dark:bg-primary/12 text-primary font-semibold border-none"
                              : "text-muted-foreground/80 hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40 hover:text-foreground hover:translate-x-0.5",
                          )}
                        >
                          <Link
                            to={item.path}
                            className="relative flex items-center gap-3 px-3 z-10 w-full h-full"
                          >
                            {item.icon && (
                              <div className="relative flex items-center justify-center shrink-0">
                                <item.icon
                                  className={cn(
                                    "size-4 shrink-0 relative z-10 transition-colors duration-200",
                                    is_item_active
                                      ? "text-primary"
                                      : "text-muted-foreground/60 group-hover/btn:text-foreground",
                                  )}
                                />
                              </div>
                            )}
                            <span className="truncate text-[13px]">{item.title}</span>
                            {is_item_active && !is_collapsed && (
                              <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-primary transition-all duration-300" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible
                      key={item.id}
                      asChild
                      open={is_open}
                      onOpenChange={(open) =>
                        set_expanded_items((prev) => ({
                          ...prev,
                          [item.id]: open,
                        }))
                      }
                      className="group/collapsible"
                    >
                      <SidebarMenuItem key={item.id}>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={cn(
                              "h-9 w-full group/btn relative overflow-hidden rounded-lg transition-all duration-200",
                              is_item_active && !is_open
                                ? "bg-primary/8 dark:bg-primary/12 text-primary font-semibold border-none"
                                : "text-muted-foreground/80 hover:bg-neutral-100/50 dark:hover:bg-zinc-800/40 hover:text-foreground hover:translate-x-0.5",
                            )}
                          >
                            <div className="flex w-full items-center gap-3 px-1 z-10">
                              {item.icon && (
                                <div className="relative flex items-center justify-center shrink-0">
                                  <item.icon
                                    className={cn(
                                      "size-4 shrink-0 relative z-10 transition-colors duration-200",
                                      is_item_active
                                        ? "text-primary"
                                        : "text-muted-foreground/60 group-hover/btn:text-foreground",
                                    )}
                                  />
                                </div>
                              )}
                              <span className="truncate text-[13px] text-left flex-1">{item.title}</span>
                              <ChevronRight
                                className={cn(
                                  "ml-auto size-3.5 transition-transform duration-200 shrink-0",
                                  is_open && "rotate-90",
                                  is_item_active
                                    ? "text-primary"
                                    : "text-muted-foreground/40 group-hover/btn:text-foreground",
                                )}
                              />
                            </div>
                            {is_item_active && !is_open && !is_collapsed && (
                              <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-primary transition-all duration-300" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden transition-all duration-300">
                          <SidebarMenuSub className="mt-1 ml-4.5 gap-1.5 border-l border-neutral-200/10 dark:border-zinc-800/60 pl-2.5">
                            {visible_children?.map((child) => {
                              const is_child_active = matches_path(child.path);
                              return (
                                <SidebarMenuSubItem key={child.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    className={cn(
                                      "h-8 rounded-md transition-all duration-200 hover:translate-x-0.5 group/sub",
                                      is_child_active
                                        ? "bg-primary/5 text-primary font-semibold border-none"
                                        : "text-muted-foreground/70 hover:bg-neutral-100/30 dark:hover:bg-zinc-800/20 hover:text-foreground",
                                    )}
                                  >
                                    <Link
                                      to={child.path}
                                      className="flex w-full items-center gap-2.5 px-2.5"
                                    >
                                      <div
                                        className={cn(
                                          "rounded-full transition-all duration-300 shrink-0",
                                          is_child_active
                                            ? "size-1.5 bg-primary"
                                            : "size-1 bg-muted-foreground/30 group-hover/sub:bg-muted-foreground/50",
                                        )}
                                      />
                                      <span className="truncate text-[12.5px]">
                                        {child.title}
                                      </span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
            </SidebarMenu>
          </div>
        ))}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
