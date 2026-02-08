import { Link } from "react-router-dom";
import {
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
import { Button } from "@/lib/components/ui/button";

export function UserNav() {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userAvatar} alt={user?.username} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{primaryIdentity}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {secondaryIdentity}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IconUserCircle className="mr-2 h-4 w-4" />
            <Link to="/settings/account" className="w-full cursor-pointer">
              <span>Compte</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings/appearance" className="w-full cursor-pointer">
              <IconSettings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()}>
          <IconLogout className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
