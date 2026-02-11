import React from "react";
import { Link, useLocation } from "react-router-dom";
import { IconInnerShadowTop, IconMenu2 } from "@tabler/icons-react";
import { NAVIGATION_LINKS, type NavigationSection } from "@/routes/links";
import { UserNav } from "@/lib/components/user-nav";
import Logo from "@/assets/logos/logo.png";
import { useTheme } from "@/lib/theme";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/lib/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/lib/components/ui/sheet";
import { cn } from "@/lib/utils";
import { CommandMenu } from "@/lib/components/command-menu";

// Custom Link wrapper to handle react-router-dom navigation with Radix components
const RouterLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof NavigationMenuLink> & { to: string }
>(({ className, children, to, ...props }, forwardedRef) => {
  return (
    <NavigationMenuLink
      asChild
      className={className}
      {...props}
      ref={forwardedRef}
    >
      <Link to={to}>{children}</Link>
    </NavigationMenuLink>
  );
});
RouterLink.displayName = "RouterLink";

type NavigationMenuEntry = {
  title: string;
  path: string;
  description?: string;
};

const getSectionEntries = (section: NavigationSection): NavigationMenuEntry[] =>
  section.items.flatMap((item): NavigationMenuEntry[] => {
    const visibleChildren =
      item.children?.filter((child) => !child.hidden) ?? [];
    if (visibleChildren.length > 0) {
      return visibleChildren.map((child) => ({
        title: child.title,
        path: child.path,
        description: child.description,
      }));
    }

    if (item.hidden) {
      return [];
    }

    return [
      {
        title: item.title,
        path: item.path,
        description: item.description,
      },
    ];
  });

const AppNavMenu = ({
  layout,
  location,
  className,
}: {
  layout: string;
  location: any;
  className?: string;
}) => (
  <NavigationMenu viewport={false} className={className}>
    <NavigationMenuList>
      {NAVIGATION_LINKS.map((section) => {
        const sectionEntries = getSectionEntries(section);

        // Check if any item in this section is active
        const isActive = section.items.some(
          (item) =>
            location.pathname.startsWith(item.path) ||
            item.children?.some((child) =>
              location.pathname.startsWith(child.path),
            ),
        );

        // Mixed mode: Render sections as simple links (no dropdowns)
        if (layout === "mixed") {
          // Navigate to the first available item's path
          const firstPath = sectionEntries[0]?.path || "#";
          return (
            <NavigationMenuItem key={section.id}>
              <RouterLink
                to={firstPath}
                className={cn(
                  navigationMenuTriggerStyle(),
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                {section.label}
              </RouterLink>
            </NavigationMenuItem>
          );
        }

        // Standard Horizontal mode: Render dropdowns for sections
        return (
          <NavigationMenuItem key={section.id}>
            {sectionEntries.length === 1 ? (
              <RouterLink
                to={sectionEntries[0].path}
                className={navigationMenuTriggerStyle()}
              >
                {sectionEntries[0].title}
              </RouterLink>
            ) : (
              <>
                <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    {sectionEntries.map((item) => (
                      <ListItem
                        key={item.path}
                        title={item.title}
                        to={item.path}
                        active={location.pathname === item.path}
                      >
                        {item.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </>
            )}
          </NavigationMenuItem>
        );
      })}
    </NavigationMenuList>
  </NavigationMenu>
);

// ... (rest of AppNavbar remains the same)

export function AppNavbar() {
  const location = useLocation();
  const { layout } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center max-w-screen px-2 gap-2">
        {/* Left Section: Logo */}
        {layout !== "mixed" && (
          <div className="mr-4 hidden lg:flex items-center flex-none">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="">
                {/* <IconInnerShadowTop className="size-4" /> */}
                <img src={Logo} alt="Logo" height={48} width={48} />
              </span>
              <span className="hidden font-bold sm:inline-block ">
                RAIL LOGISTIC
              </span>
            </Link>
          </div>
        )}

        {/* Nav Section (Horizontal mode) */}
        {layout !== "mixed" && (
          <div className="hidden lg:flex items-center flex-1">
            <AppNavMenu
              layout={layout}
              location={location}
              className="justify-start"
            />
          </div>
        )}

        {/* Center Section: Nav (Mixed mode only) */}
        {layout === "mixed" && (
          <div className="flex-1 hidden lg:flex justify-center">
            <AppNavMenu
              layout={layout}
              location={location}
              className="justify-start"
            />
          </div>
        )}

        {/* Right Section: UserNav */}
        <div
          className={cn(
            "flex items-center justify-between space-x-2",
            layout !== "mixed" ? "flex-none ml-auto" : "ml-auto",
          )}
        >
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <MobileNav />
          </div>
          <UserNav />
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof RouterLink> & {
    title: string;
    active?: boolean;
    children?: React.ReactNode;
  }
>(({ className, title, children, active, to, ...props }, ref) => {
  return (
    <li>
      <RouterLink
        ref={ref}
        to={to}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          active && "bg-accent text-accent-foreground",
          className,
        )}
        {...props}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {children}
        </p>
      </RouterLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

function MobileNav() {
  const location = useLocation();

  return (
    <Sheet>
      <SheetTrigger
        aria-label="Ouvrir la navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-sm lg:hidden"
      >
        <IconMenu2 className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b px-4 py-3 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconInnerShadowTop className="size-4" />
            </span>
            RAIL LOGISTIC
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 py-4">
          {NAVIGATION_LINKS.map((section) => {
            const sectionEntries = getSectionEntries(section);

            return (
              <div key={section.id} className="space-y-1">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {section.label}
                </p>
                <div className="flex flex-col">
                  {sectionEntries.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                        location.pathname === item.path &&
                          "bg-accent text-accent-foreground",
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
