import { Link } from "react-router-dom";
import {
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
  IconSettings,
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

/**
 * Sidebar footer block that exposes the account avatar and actions.
 */
export function NavUser() {
  const { isMobile } = useSidebar();
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
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={userAvatar} alt={user?.username} />
                <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{primaryIdentity}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {secondaryIdentity}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userAvatar} alt={user?.username} />
                  <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{primaryIdentity}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {secondaryIdentity}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                <Link to="/settings/account" className="w-full cursor-pointer">
                  Compte
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  to="/settings/appearance"
                  className="w-full cursor-pointer"
                >
                  <IconSettings />
                  Paramètres
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <IconLogout />
              Déconnextion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
