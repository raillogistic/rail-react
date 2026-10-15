import type { ComponentType } from "react";
import type { NavigationSection } from "@/shared/routing/navigation";
import type { NavigationPattern, SidebarMode } from "@/shared/ui/theme";
import { get_best_matching_path } from "@/widgets/navigation/nav-main";

/**
 * Option de configuration du modèle de sous-navigation.
 */
export type NavigationPatternOption = {
  value: NavigationPattern;
  label: string;
  description: string;
};

/**
 * Option de configuration de la disposition de la barre latérale.
 */
export type SidebarModeOption = {
  value: SidebarMode;
  label: string;
  description: string;
};

/**
 * Options disponibles pour la disposition de la barre latérale.
 */
export const SIDEBAR_MODE_OPTIONS: SidebarModeOption[] = [
  {
    value: "icons",
    label: "Menu avec icônes",
    description:
      "Barre d'icônes compacte. L'affichage des sous-menus est défini par le type de navigation.",
  },
  {
    value: "complete",
    label: "Barre latérale complète",
    description:
      "Barre latérale complète affichant directement le menu et les sous-menus.",
  },
];

export type ProjectNavigationEntry = {
  id: string;
  title: string;
  path: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  sectionLabel: string;
};

export type ProjectNavigationGroup = {
  label: string;
  entries: ProjectNavigationEntry[];
};

export const NAVIGATION_PATTERN_OPTIONS: NavigationPatternOption[] = [
  {
    value: "secondary-sidebar",
    label: "Sous-navigation latérale",
    description: "Affiche le menu contextuel dans la deuxième barre latérale.",
  },
  {
    value: "contextual-tabs",
    label: "Onglets contextuels",
    description:
      "Affiche les pages du module sous forme d'onglets en haut du contenu.",
  },
  {
    value: "header-dropdown",
    label: "Menu dans l'en-tête",
    description:
      "Affiche la navigation du module dans un menu déroulant compact.",
  },
  {
    value: "rail-flyout",
    label: "Flyout depuis la barre",
    description:
      "Ouvre le sous-menu depuis l'icône active de la barre d'applications.",
  },
];

export const getProjectNavigationEntries = (
  navigationLinks: NavigationSection[],
  filterPath?: (path: string) => boolean,
): ProjectNavigationEntry[] =>
  navigationLinks.flatMap((section) =>
    section.items.flatMap((item) => {
      if (item.hidden) {
        return [];
      }

      const visibleChildren =
        item.children?.filter((child) => {
          if (child.hidden) {
            return false;
          }

          return filterPath ? filterPath(child.path) : true;
        }) ?? [];

      if (visibleChildren.length > 0) {
        return visibleChildren.map((child) => ({
          id: `${item.id}:${child.path}`,
          title: child.title,
          path: child.path,
          description: child.description,
          icon: child.icon ?? item.icon,
          sectionLabel: section.label,
        }));
      }

      if (filterPath && !filterPath(item.path)) {
        return [];
      }

      return [
        {
          id: item.id,
          title: item.title,
          path: item.path,
          description: item.description,
          icon: item.icon,
          sectionLabel: section.label,
        },
      ];
    }),
  );

export const groupProjectNavigationEntries = (
  entries: ProjectNavigationEntry[],
): ProjectNavigationGroup[] => {
  const grouped = new Map<string, ProjectNavigationEntry[]>();

  entries.forEach((entry) => {
    const bucket = grouped.get(entry.sectionLabel) ?? [];
    bucket.push(entry);
    grouped.set(entry.sectionLabel, bucket);
  });

  return Array.from(grouped.entries()).map(([label, sectionEntries]) => ({
    label,
    entries: sectionEntries,
  }));
};

export const getActiveProjectNavigationPath = (
  pathname: string,
  entries: ProjectNavigationEntry[],
): string | null =>
  get_best_matching_path(
    pathname,
    entries.map((entry) => entry.path),
  );

export const splitProjectNavigationEntries = (
  entries: ProjectNavigationEntry[],
  primaryLimit = 5,
) => ({
  primaryEntries: entries.slice(0, primaryLimit),
  overflowEntries: entries.slice(primaryLimit),
});
