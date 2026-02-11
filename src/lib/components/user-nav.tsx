import { Link } from "react-router-dom";
import {
  IconLogout,
  IconUserCircle,
  IconSettings,
  IconShieldLock,
  IconCreditCard,
  IconLifebuoy
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
  DropdownMenuShortcut
} from "@/lib/components/ui/dropdown-menu";
import { Button } from "@/lib/components/ui/button";

/**
 * Enhanced User Navigation dropdown menu.
 * Used primarily in headers or standalone navigation bars.
 */
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
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-transparent hover:border-border transition-all ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden">
          <Avatar className="h-full w-full">
            <AvatarImage src={userAvatar} alt={user?.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-0">
          <div className="flex items-center gap-3 p-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border border-primary/10">
                <AvatarImage src={userAvatar} alt={user?.username} />
                <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
            </div>
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-semibold leading-none truncate max-w-[160px]">
                {primaryIdentity}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate max-w-[160px]">
                {secondaryIdentity}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-1">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to="/settings/account" className="flex items-center cursor-pointer w-full">
                <IconUserCircle className="mr-2 h-4 w-4 opacity-70" />
                <span className="flex-1">Mon Profil</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/appearance" className="flex items-center cursor-pointer w-full">
                <IconSettings className="mr-2 h-4 w-4 opacity-70" />
                <span className="flex-1">Paramètres</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/security" className="flex items-center cursor-pointer w-full">
                <IconShieldLock className="mr-2 h-4 w-4 opacity-70" />
                <span className="flex-1">Sécurité</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer">
              <IconCreditCard className="mr-2 h-4 w-4 opacity-70" />
              <span>Facturation</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <IconLifebuoy className="mr-2 h-4 w-4 opacity-70" />
              <span>Support</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => logout()}
          className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer m-1 rounded-md"
        >
          <IconLogout className="mr-2 h-4 w-4" />
          <span className="font-semibold">Se déconnecter</span>
          <DropdownMenuShortcut className="text-destructive-foreground opacity-70">⌥⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}