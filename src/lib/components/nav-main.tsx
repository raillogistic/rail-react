import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { NAVIGATION_LINKS } from "@/routes/links";
import { useTheme } from "@/lib/theme";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
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
} from "@/lib/components/ui/sidebar";

/**
 * Navigation tree used inside the sidebar.
 *
 * The component renders sections with collapsible items and highlights the
 * active branch based on the current pathname.
 */
export function NavMain() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    () => {
      const initial: Record<string, boolean> = {};
      for (const section of NAVIGATION_LINKS) {
        if (section.id === "referentials") {
          for (const item of section.items) {
            if (item.children?.length) {
              initial[item.id] = true;
            }
          }
        }
      }
      return initial;
    }
  );

  const isExactPath = (targetPath: string): boolean =>
    location.pathname === targetPath;
  const hasPathPrefix = (targetPath: string): boolean =>
    location.pathname === targetPath ||
    location.pathname.startsWith(`${targetPath}/`);

  useEffect(() => {
    setExpandedItems((prev) => {
      let next = prev;

      for (const section of NAVIGATION_LINKS) {
        for (const item of section.items) {
          if (!item.children?.length) {
            continue;
          }

          const hasActiveChild = item.children.some((child) =>
            isExactPath(child.path)
          );
          const isItemActive = isExactPath(item.path);

          if ((hasActiveChild || isItemActive) && !prev[item.id]) {
            next = { ...next, [item.id]: true };
          }
        }
      }

      return next;
    });
  }, [location.pathname]);

  const { layout } = useTheme();

  const visibleSections =
    layout === "mixed"
      ? NAVIGATION_LINKS.filter((section) =>
          section.items.some(
            (item) =>
              location.pathname.startsWith(item.path) ||
              item.children?.some((child) =>
                location.pathname.startsWith(child.path)
              )
          )
        )
      : NAVIGATION_LINKS;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-3">
        {visibleSections.map((section) => (
          <div key={section.id} className="space-y-1">
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items
                .filter((item) => !item.hidden)
                .map((item) => {
                  const visibleChildren = item.children?.filter(
                    (child) => !child.hidden
                  );
                  const hasChildren = Boolean(visibleChildren?.length);
                  const isItemActive = isExactPath(item.path);
                  const isOpen = hasChildren && Boolean(expandedItems[item.id]);

                  if (!hasChildren) {
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          className={
                            isItemActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:text-primary"
                          }
                        >
                          <Link
                            to={item.path}
                            className="flex items-center gap-2"
                          >
                            {/* {item.icon && <item.icon className="size-4" />} */}
                            <span className="truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible
                      key={item.id}
                      asChild
                      open={isOpen}
                      onOpenChange={(open) =>
                        setExpandedItems((prev) => ({
                          ...prev,
                          [item.id]: open,
                        }))
                      }
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={
                              isItemActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:text-primary"
                            }
                          >
                            {item.icon && <item.icon className="size-4" />}
                            <div className="flex flex-col items-start">
                              <span className="truncate">{item.title}</span>
                              {!visibleChildren?.length && item.description && (
                                <span className="text-xs text-muted-foreground">
                                  {item.description}
                                </span>
                              )}
                            </div>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {visibleChildren?.map((child) => {
                              const isChildActive = isExactPath(child.path);
                              return (
                                <SidebarMenuSubItem
                                  key={child.path}
                                  className="rounded-md"
                                >
                                  <SidebarMenuSubButton
                                    asChild
                                    className={
                                      isChildActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:text-primary"
                                    }
                                  >
                                    <Link
                                      to={child.path}
                                      className="flex w-full items-center gap-2 px-3 py-2"
                                    >
                                      <span>{child.title}</span>
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
