import { Link } from "react-router-dom";
import {
  IconBell,
  IconChevronRight,
  IconHelpCircle,
  IconLogout,
  IconSettings,
  IconShieldLock,
  IconUserCircle,
} from "@tabler/icons-react";
import { ROUTES } from "@/shared/routing/routes";
import { getUserIdentity, type UserLike } from "@/shared/auth/userIdentity";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/kit/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/shared/ui/kit/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/kit/sidebar";
import { cn } from "@/shared/utils";
import { Badge } from "@/shared/ui/kit/badge";

/**
 * Sidebar footer block that exposes the account avatar and actions.
 * Anchors account navigation for the authenticated shell.
 */
export type NavUserProps = {
  user?: UserLike | null;
  onLogout?: () => void | Promise<void>;
};

export function NavUser({ user, onLogout }: NavUserProps = {}) {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { userAvatar, primaryIdentity, secondaryIdentity, avatarFallback } =
    getUserIdentity(user);

  const handleLogout = () => {
    if (!onLogout) {
      return;
    }
    void onLogout();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "h-14 w-full group",
                "data-[state=open]:bg-sidebar-accent/80 data-[state=open]:text-sidebar-accent-foreground",
                "hover:bg-sidebar-accent/50",
                isCollapsed ? "justify-center p-0" : "px-3",
              )}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <Avatar
                  className={cn(
                    "border-2 border-sidebar-border/30 group-hover:border-primary/30 group-hover:shadow-md",
                    isCollapsed ? "h-9 w-9" : "h-10 w-10",
                  )}
                >
                  <AvatarImage
                    src={userAvatar}
                    alt={user?.username ?? undefined}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 border-2 border-sidebar bg-emerald-500 shadow-sm ring-1 ring-emerald-500/20" />
              </div>

              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-3">
                    <span className="truncate font-bold text-foreground/90 tracking-tight">
                      {primaryIdentity}
                    </span>
                    <span className="text-muted-foreground/60 truncate text-[11px] font-medium tracking-wide">
                      {secondaryIdentity}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center">
                    <IconChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground" />
                  </div>
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 border-sidebar-border/40 bg-sidebar/95 p-2.5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={15}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-4 px-3.5 py-4 text-left bg-primary/5 mb-2">
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                    <AvatarImage
                      src={userAvatar}
                      alt={user?.username ?? undefined}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-2 border-white bg-emerald-500 shadow-sm" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-extrabold text-foreground text-base tracking-tight">
                    {primaryIdentity}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[9px] h-4 px-1 py-0 font-bold uppercase tracking-tighter bg-primary/10 text-primary border-none"
                    >
                      Pro Plan
                    </Badge>
                    <span className="text-muted-foreground/50 truncate text-[10px] font-medium">
                      {user?.username || "active"}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup className="space-y-1 py-1 px-1">
              <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">
                Navigation
              </div>
              <DropdownMenuItem className="px-3 py-2.5 focus:bg-primary focus:text-primary-foreground group cursor-pointer">
                <IconUserCircle className="size-5 mr-3 opacity-60 group-focus:opacity-100" />
                <Link
                  to={ROUTES.SETTINGS_ACCOUNT}
                  className="flex-1 font-semibold tracking-tight"
                >
                  Mon Profil
                </Link>
                <DropdownMenuShortcut className="group-focus:text-primary-foreground opacity-50">
                  Shift+Cmd+P
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="px-3 py-2.5 focus:bg-primary focus:text-primary-foreground group cursor-pointer"
              >
                <Link
                  to={ROUTES.SETTINGS_APPEARANCE}
                  className="w-full flex items-center"
                >
                  <IconSettings className="size-5 mr-3 opacity-60 group-focus:opacity-100" />
                  <span className="flex-1 font-semibold tracking-tight">
                    Preferences
                  </span>
                  <DropdownMenuShortcut className="group-focus:text-primary-foreground opacity-50">
                    Cmd+S
                  </DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2.5 focus:bg-primary focus:text-primary-foreground group cursor-pointer">
                <IconShieldLock className="size-5 mr-3 opacity-60 group-focus:opacity-100" />
                <span className="flex-1 font-semibold tracking-tight">
                  Securite
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-sidebar-border/30 my-2 mx-1" />

            <DropdownMenuGroup className="space-y-1 py-1 px-1">
              <DropdownMenuItem className="px-3 py-2.5 focus:bg-accent group cursor-pointer">
                <IconBell className="size-5 mr-3 opacity-60 group-hover:text-primary" />
                <span className="flex-1 font-medium text-sm">
                  Notifications
                </span>
                <Badge className="ml-auto h-5 px-1.5 min-w-5 justify-center bg-primary text-primary-foreground text-[10px] font-bold">
                  12
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2.5 focus:bg-accent group cursor-pointer">
                <IconHelpCircle className="size-5 mr-3 opacity-60" />
                <span className="flex-1 font-medium text-sm">
                  Centre d'aide
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-sidebar-border/30 my-2 mx-1" />

            <div className="px-1">
              <DropdownMenuItem
                onClick={handleLogout}
                className="px-3 py-3 focus:bg-destructive focus:text-destructive-foreground text-destructive font-bold cursor-pointer shadow-sm hover:shadow-md"
              >
                <IconLogout className="size-5 mr-3" />
                <span className="flex-1">Se deconnecter</span>
                <DropdownMenuShortcut className="opacity-70 group-focus:text-destructive-foreground">
                  Option+Cmd+Q
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
