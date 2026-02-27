import React from "react";
import { Link, useLocation, type Location } from "react-router-dom";
import {
  IconArrowRight,
  IconChevronRight,
  IconMenu2,
  IconSparkles,
} from "@tabler/icons-react";
import {
  DEFAULT_APP_ROUTE,
  NAVIGATION_LINKS,
  type NavigationSection,
} from "@/app/router/navigation";
import { BRANDING } from "@/projects/branding";
import { UserNav } from "@/widgets/navigation/nav-user-menu";
import Logo from "@/shared/assets/legacy-assets/logos/logo.png";
import { useTheme } from "@/shared/ui/theme";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/shared/ui/kit/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/kit/sheet";
import { cn } from "@/shared/utils";
import { CommandMenu } from "@/widgets/navigation/command-menu";
import { Badge } from "@/shared/ui/kit/badge";
import { Separator } from "@/shared/ui/kit/separator";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";
import { useAuthContext } from "@/features/auth/context";

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
  icon?: React.ComponentType<{ className?: string }>;
  section?: string;
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
        icon: (child.icon || item.icon) as React.ComponentType<{
          className?: string;
        }>,
        section: item.title,
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
        icon: item.icon as React.ComponentType<{ className?: string }>,
        section: section.label,
      },
    ];
  });

const AppNavMenu = ({
  layout,
  location,
  className,
}: {
  layout: string;
  location: Location;
  className?: string;
}) => (
  <NavigationMenu viewport={false} className={cn("max-w-full", className)}>
    <NavigationMenuList className="gap-1">
      {NAVIGATION_LINKS.map((section) => {
        const sectionEntries = getSectionEntries(section);
        const isActive = section.items.some(
          (item) =>
            location.pathname.startsWith(item.path) ||
            item.children?.some((child) =>
              location.pathname.startsWith(child.path),
            ),
        );

        if (layout === "mixed") {
          const firstPath = sectionEntries[0]?.path || "#";
          return (
            <NavigationMenuItem key={section.id}>
              <RouterLink
                to={firstPath}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "relative h-9 px-4 text-sm font-semibold transition-all duration-300 rounded-full",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {section.label}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-in zoom-in duration-300" />
                )}
              </RouterLink>
            </NavigationMenuItem>
          );
        }

        return (
          <NavigationMenuItem key={section.id}>
            {sectionEntries.length === 1 ? (
              <RouterLink
                to={sectionEntries[0].path}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "h-9 px-4 font-semibold rounded-full transition-all duration-300",
                  isActive && "bg-primary/10 text-primary",
                )}
              >
                {sectionEntries[0].title}
              </RouterLink>
            ) : (
              <>
                <NavigationMenuTrigger
                  className={cn(
                    "h-9 px-4 font-semibold rounded-full bg-transparent hover:bg-muted transition-all duration-300",
                    isActive &&
                      "bg-primary/10 text-primary hover:bg-primary/15",
                  )}
                >
                  {section.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="p-0 border-none bg-transparent">
                  <div className="w-[500px] lg:w-[600px] rounded-[1.5rem] border border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-300">
                    <div className="grid grid-cols-[1fr_1.5fr] gap-4">
                      <div className="rounded-2xl bg-primary/5 p-4 flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
                          <IconSparkles className="size-24" />
                        </div>
                        <div>
                          <Badge
                            variant="outline"
                            className="bg-background/50 backdrop-blur-sm border-primary/20 text-primary font-bold mb-3"
                          >
                            {section.label}
                          </Badge>
                          <h3 className="text-xl font-extrabold tracking-tight mb-2">
                            Gestion et pilotage
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Accedez aux modules de configuration, au suivi des
                            operations et aux tableaux de bord.
                          </p>
                        </div>
                        <div className="mt-6">
                          <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                            Module actif <IconArrowRight className="size-3" />
                          </div>
                        </div>
                      </div>
                      <ul className="grid grid-cols-1 gap-1">
                        {sectionEntries.map((item) => (
                          <ListItem
                            key={item.path}
                            title={item.title}
                            to={item.path}
                            icon={item.icon}
                            active={location.pathname === item.path}
                          >
                            {item.description || "Module de gestion dedie"}
                          </ListItem>
                        ))}
                      </ul>
                    </div>
                  </div>
                </NavigationMenuContent>
              </>
            )}
          </NavigationMenuItem>
        );
      })}
    </NavigationMenuList>
  </NavigationMenu>
);

export function AppNavbar() {
  const location = useLocation();
  const { layout } = useTheme();
  const { user, logout } = useAuthContext();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 ease-in-out",
        scrolled
          ? "border-b bg-background/80 backdrop-blur-xl shadow-sm h-14"
          : "border-b bg-background h-16",
      )}
    >
      <div className="container flex h-full items-center max-w-screen px-4 gap-4">
        {layout !== "mixed" && (
          <div className="flex items-center flex-none">
            <Link
              to="/"
              className="flex items-center gap-3 group transition-all active:scale-95"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={Logo}
                  alt={BRANDING.logoAlt}
                  className="h-9 w-9 object-contain relative z-10"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-black tracking-tighter text-sm leading-none flex items-center gap-1">
                  {BRANDING.productName}
                  <Badge
                    variant="secondary"
                    className="text-[8px] h-3 px-1 py-0 bg-primary/10 text-primary border-none"
                  >
                    {BRANDING.editionLabel}
                  </Badge>
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                  {BRANDING.platformLabel}
                </span>
              </div>
            </Link>
          </div>
        )}

        {layout !== "mixed" && (
          <div className="hidden lg:flex items-center flex-1 ml-4">
            <AppNavMenu
              layout={layout}
              location={location}
              className="justify-start"
            />
          </div>
        )}

        {layout === "mixed" && (
          <>
            <div className="flex-none lg:flex hidden items-center">
              <img src={Logo} alt={BRANDING.logoAlt} className="h-8 w-8" />
            </div>
            <div className="flex-1 hidden lg:flex justify-center">
              <AppNavMenu
                layout={layout}
                location={location}
                className="justify-center"
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden md:flex">
            <CommandMenu
              navigationLinks={NAVIGATION_LINKS}
              defaultPath={DEFAULT_APP_ROUTE}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <MobileNav />
            </div>
            <Separator
              orientation="vertical"
              className="h-4 hidden lg:block opacity-30"
            />
            <UserNav user={user} onLogout={logout} />
          </div>
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
    icon?: React.ComponentType<{ className?: string }>;
    children?: React.ReactNode;
  }
>(({ className, title, children, active, to, icon: Icon, ...props }, ref) => {
  return (
    <li>
      <RouterLink
        ref={ref}
        to={to}
        className={cn(
          "flex items-center gap-3 select-none rounded-xl p-3 leading-none no-underline outline-none transition-all duration-300 group/item",
          "hover:bg-primary/5 hover:text-primary",
          active ? "bg-primary/5 text-primary" : "text-foreground/70",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center transition-all duration-300",
            active
              ? "bg-primary/10 text-primary shadow-sm"
              : "bg-muted/50 text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary",
          )}
        >
          {Icon ? (
            <Icon className="size-5" />
          ) : (
            <IconChevronRight className="size-4" />
          )}
        </div>
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="text-sm font-bold leading-none tracking-tight">
            {title}
          </div>
          <p className="line-clamp-1 text-xs leading-snug text-muted-foreground opacity-70 group-hover/item:text-primary/70 transition-colors">
            {children}
          </p>
        </div>
        <IconArrowRight className="size-3.5 opacity-0 group-hover/item:opacity-40 transition-opacity -translate-x-2 group-hover/item:translate-x-0 duration-300" />
      </RouterLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

function MobileNav() {
  const location = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Open navigation"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-background hover:bg-muted text-muted-foreground shadow-sm transition-all active:scale-90"
        >
          <IconMenu2 className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] p-0 border-r-border/40 bg-background/95 backdrop-blur-2xl"
      >
        <ScrollArea className="h-full">
          <SheetHeader className="px-6 py-6 text-left bg-primary/5 mb-2">
            <SheetTitle className="flex items-center gap-3 text-xl font-black tracking-tighter">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <img
                  src={Logo}
                  alt={BRANDING.logoAlt}
                  className="h-7 w-7 brightness-0 invert"
                />
              </div>
              {BRANDING.productName}
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col px-4 pb-10">
            {NAVIGATION_LINKS.map((section) => {
              const sectionEntries = getSectionEntries(section);

              return (
                <div key={section.id} className="mt-6 first:mt-2">
                  <div className="px-4 py-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em] opacity-50">
                      {section.label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {sectionEntries.map((item) => {
                      const Icon = item.icon as React.ComponentType<{
                        className?: string;
                      }>;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 group",
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground/50 group-hover:bg-background",
                            )}
                          >
                            {Icon ? (
                              <Icon className="size-4.5" />
                            ) : (
                              <IconChevronRight className="size-4" />
                            )}
                          </div>
                          <span className="flex-1 truncate">{item.title}</span>
                          {isActive && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)] animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
