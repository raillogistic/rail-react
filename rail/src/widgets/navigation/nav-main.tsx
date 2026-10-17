import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import type { NavigationSection } from "@/shared/routing/navigation";
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
  /** Fonction optionnelle pour filtrer l'accès aux chemins */
  filterPath?: (path: string) => boolean;
};

/**
 * Normalise un chemin en supprimant les espaces, en convertissant en minuscules,
 * et en enlevant le slash de fin s'il y en a un.
 * @param path Le chemin à normaliser.
 * @returns Le chemin normalisé.
 */
export const normalizePath = (path: string): string => {
  if (!path) return "";
  let normalized = path.trim().toLowerCase();
  if (normalized.endsWith("/") && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

/**
 * Convertit un chemin avec paramètres (ex: :id) en une expression régulière.
 * @param path Le chemin cible à convertir.
 * @returns Une RegExp correspondant au chemin et à ses sous-chemins potentiels.
 */
export const path_to_regex = (path: string): RegExp => {
  const normalized = normalizePath(path);
  const escaped = normalized.replace(/[.+*?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/:[a-zA-Z0-9_]+/g, "[^/]+");
  return new RegExp(`^${pattern}(?:/|$)`);
};

/**
 * Vérifie si le chemin d'URL actuel correspond au motif du chemin cible.
 * @param target_path Le chemin cible à comparer.
 * @param current_pathname Le chemin d'URL actuel.
 * @returns Vrai si le chemin correspond, sinon faux.
 */
export const matches_pathname = (target_path: string, current_pathname: string): boolean => {
  if (!target_path) return false;
  return path_to_regex(target_path).test(normalizePath(current_pathname));
};

/**
 * Détermine le meilleur chemin correspondant (le plus spécifique ou exact) pour l'URL actuelle.
 * @param current_pathname Le chemin d'URL actuel.
 * @param paths La liste des chemins disponibles dans la navigation.
 * @returns Le chemin correspondant le plus spécifique, ou null.
 */
export const get_best_matching_path = (current_pathname: string, paths: string[]): string | null => {
  const normalized_current = normalizePath(current_pathname);

  // Recherche d'abord une correspondance exacte
  for (const path of paths) {
    if (path && normalizePath(path) === normalized_current) {
      return path;
    }
  }

  // Recherche de la correspondance regex/préfixe la plus longue
  let best_match: string | null = null;
  let max_len = -1;

  for (const path of paths) {
    if (path && matches_pathname(path, current_pathname)) {
      if (path.length > max_len) {
        max_len = path.length;
        best_match = path;
      }
    }
  }

  return best_match;
};

/**
 * @file nav-main.tsx
 * @description Composant affichant l'arbre de navigation principal dans la barre latérale.
 * Gère le déploiement automatique des sous-menus contenant l'élément actif,
 * et applique une esthétique épurée (sans ombres, indicateur à gauche, animations fines).
 */
export function NavMain({ navigationLinks, filterPath }: NavMainProps) {
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const is_collapsed = state === "collapsed";

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const [expanded_items, set_expanded_items] = useState<
    Record<string, boolean>
  >({});

  // Collecte tous les chemins de la navigation pour déterminer le meilleur match
  const all_paths = navigationLinks.flatMap((section) =>
    section.items.flatMap((item) => [
      item.path,
      ...(item.children?.map((child) => child.path) || []),
    ]),
  );

  const best_match = get_best_matching_path(location.pathname, all_paths);

  /**
   * Vérifie si le chemin cible est le meilleur match pour l'URL actuelle.
   * @param target_path Chemin à comparer.
   * @returns Vrai si le chemin correspond exactement au meilleur match.
   */
  const matches_path = (target_path: string): boolean => {
    return target_path === best_match;
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
            child.path === best_match,
          );
          const is_item_active = item.path === best_match;

          if ((has_active_child || is_item_active) && !prev[item.id]) {
            next = { ...next, [item.id]: true };
          }
        }
      }

      return next;
    });
  }, [best_match, navigationLinks]);

  // Keep the sidebar navigable across projects even when the current route
  // belongs to a different default module such as core settings.
  const visible_sections = navigationLinks.filter((section) => {
    // Vérifier si la section a au moins un item accessible
    return section.items.some((item) => {
      if (item.hidden) return false;
      return filterPath ? filterPath(item.path) : true;
    });
  });

  /**
   * Vérifie si le badge contient un contenu significatif à afficher.
   * @param badge Contenu du badge.
   * @returns Vrai si le badge est présent.
   */
  const has_badge_content = (badge?: React.ReactNode): boolean => {
    return badge !== undefined && badge !== null && badge !== false && badge !== "";
  };

  /**
   * Affiche le badge en mode déplié avec le style capsule approprié.
   * @param badge Contenu du badge.
   * @param is_active Indique si l'élément parent est actif.
   * @returns Élément React ou null.
   */
  const render_badge = (badge: React.ReactNode, is_active: boolean) => {
    if (!has_badge_content(badge)) return null;
    if (typeof badge === "string" || typeof badge === "number") {
      return (
        <span
          className={cn(
            "ml-auto text-xs font-medium px-2 py-0.5 rounded-full tabular-nums transition-colors group-data-[collapsible=icon]:hidden",
            is_active
              ? "bg-white text-foreground shadow-xs dark:bg-card"
              : "bg-muted text-muted-foreground"
          )}
        >
          {badge}
        </span>
      );
    }
    return <div className="ml-auto group-data-[collapsible=icon]:hidden">{badge}</div>;
  };

  return (
    <SidebarGroup className="py-0 px-1">
      <SidebarGroupContent className="flex flex-col gap-4">
        {visible_sections.map((section) => (
          <div key={section.id} className="space-y-1">
            {!is_collapsed && (
              <SidebarGroupLabel className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarMenu className="gap-1">
              {section.items
                .filter((item) => {
                  if (item.hidden) return false;
                  return filterPath ? filterPath(item.path) : true;
                })
                .map((item) => {
                  const visible_children = item.children?.filter(
                    (child) => {
                      if (child.hidden) return false;
                      return filterPath ? filterPath(child.path) : true;
                    }
                  );
                  const has_children = Boolean(visible_children?.length);
                  const is_item_active =
                    matches_path(item.path) ||
                    item.children?.some((child) => matches_path(child.path));
                  const is_open =
                    has_children && Boolean(expanded_items[item.id]);
                  const has_badge = has_badge_content(item.badge);

                  if (!has_children) {
                    return (
                      <SidebarMenuItem key={item.id} className="relative">
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={is_item_active}
                        >
                          <Link to={item.path} onClick={handleLinkClick}>
                            {item.icon && <item.icon />}
                            <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                            {!is_collapsed && render_badge(item.badge, is_item_active)}
                            {has_badge && (
                              <span
                                aria-hidden="true"
                                className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-card pointer-events-none hidden group-data-[collapsible=icon]:block"
                              />
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
                      <SidebarMenuItem key={item.id} className="relative">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={is_item_active && !is_open}
                          >
                            {item.icon && <item.icon />}
                            <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                            {!is_collapsed && render_badge(item.badge, is_item_active)}
                            {has_badge && (
                              <span
                                aria-hidden="true"
                                className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-card pointer-events-none hidden group-data-[collapsible=icon]:block"
                              />
                            )}
                            <ChevronRight
                              className={cn(
                                "ml-auto size-4 transition-transform duration-200 text-muted-foreground/60 group-data-[collapsible=icon]:hidden",
                                has_badge && "ml-1.5",
                                is_open && "rotate-90"
                              )}
                            />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="overflow-hidden transition-all duration-300">
                          <SidebarMenuSub className="my-1 border-l border-border/50 pl-3">
                            {visible_children?.map((child) => {
                              const is_child_active = matches_path(child.path);
                              return (
                                <SidebarMenuSubItem key={child.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={is_child_active}
                                    className="h-8 rounded-lg px-2 text-xs font-medium"
                                  >
                                    <Link to={child.path} onClick={handleLinkClick}>
                                      <span className="truncate">{child.title}</span>
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
