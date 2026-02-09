import { Link } from "react-router-dom";
import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
  IconSettings,
  IconChevronRight,
} from "@tabler/icons-react";
import { useAuthContext } from "@/auth/context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/lib/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Sidebar footer block that exposes the account avatar and actions.
 */
export function NavUser() {
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user, logout } = useAuthContext();
  
  const userAvatar = user?.avatar || user?.avatarUrl;
  const displayName =
    user?.first_name ||
    user?.last_name ||
    user?.firstName ||
    user?.lastName
      ? `${user?.first_name || user?.firstName || ""} ${user?.last_name || user?.lastName || ""}`.trim()
      : user?.displayName || user?.username || "Utilisateur";
  
  const primaryIdentity = displayName || user?.username || user?.email || "Utilisateur";
  const secondaryIdentity = user?.email || user?.username || "Compte";
  
  const avatarFallback = primaryIdentity
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "h-12 w-full transition-all duration-300 rounded-xl",
                "data-[state=open]:bg-sidebar-accent/50 data-[state=open]:text-sidebar-accent-foreground",
                isCollapsed ? "justify-center p-0" : "px-2"
              )}
            >
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9 border-2 border-sidebar-border/50 transition-transform duration-300 group-hover:scale-105">
                  <AvatarImage src={userAvatar} alt={user?.username} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-emerald-500 shadow-sm" />
              </div>
              
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                    <span className="truncate font-bold text-foreground/90">{primaryIdentity}</span>
                    <span className="text-muted-foreground/70 truncate text-[11px] font-medium">
                      {secondaryIdentity}
                    </span>
                  </div>
                  <IconChevronRight className="ml-auto size-4 text-muted-foreground/40 transition-transform duration-300 group-data-[state=open]:rotate-90" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-2xl border-sidebar-border/40 bg-sidebar/95 p-2 backdrop-blur-xl shadow-2xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={12}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-primary/10">
                    <AvatarImage src={userAvatar} alt={user?.username} />
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-emerald-500" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-foreground">{primaryIdentity}</span>
                  <span className="text-muted-foreground/60 truncate text-xs">
                    {secondaryIdentity}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-sidebar-border/40" />
            <DropdownMenuGroup className="space-y-1 py-1">
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                <IconUserCircle className="size-4.5 mr-2 opacity-70" />
                <Link to="/settings/account" className="flex-1 font-medium">
                  Mon Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 focus:bg-primary/5 focus:text-primary transition-colors cursor-pointer">
                <Link
                  to="/settings/appearance"
                  className="w-full"
                >
                  <IconSettings className="size-4.5 mr-2 opacity-70" />
                  <span className="font-medium">Préférences</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-sidebar-border/40" />
            <DropdownMenuItem 
              onClick={() => logout()}
              className="rounded-xl px-3 py-2.5 mt-1 focus:bg-destructive/10 focus:text-destructive text-muted-foreground transition-colors cursor-pointer"
            >
              <IconLogout className="size-4.5 mr-2 opacity-70" />
              <span className="font-semibold">Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
