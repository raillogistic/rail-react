import { useContext } from "react";
import { Link } from "react-router-dom";
import {
 IconLogout,
 IconSettings,
 IconShieldLock,
 IconUserCircle,
} from "@tabler/icons-react";
import { ROUTES } from "@/shared/routing/routes";
import { AuthContext } from "@/features/auth/context";
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
import { Button } from "@/shared/ui/kit/button";

/**
 * Enhanced user navigation dropdown menu.
 * Used primarily in headers or standalone navigation bars.
 */
export type UserNavProps = {
 user?: UserLike | null;
 onLogout?: () => void | Promise<void>;
};

export function UserNav({ user, onLogout }: UserNavProps = {}) {
 const authContext = useContext(AuthContext);
 const resolvedUser = user ?? authContext?.user ?? null;
 const { userAvatar, primaryIdentity, secondaryIdentity, avatarFallback } =
 getUserIdentity(resolvedUser);

 const handleLogout = () => {
 const logoutAction = onLogout ?? authContext?.logout;
 if (!logoutAction) {
 return;
 }
 void logoutAction();
 };

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 className="relative h-9 w-9 p-0 border border-transparent hover:border-border ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden"
 >
 <Avatar className="h-full w-full">
 <AvatarImage
 src={userAvatar}
 alt={resolvedUser?.username ?? undefined}
 />
 <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
 {avatarFallback}
 </AvatarFallback>
 </Avatar>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent className="w-64" align="end" forceMount>
 <DropdownMenuLabel className="font-normal p-0">
 <div className="flex items-center gap-3 p-3">
 <div className="relative">
 <Avatar className="h-10 w-10 border border-primary/10">
 <AvatarImage
 src={userAvatar}
 alt={resolvedUser?.username ?? undefined}
 />
 <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
 {avatarFallback}
 </AvatarFallback>
 </Avatar>
 <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-background bg-emerald-500" />
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
 <Link
 to={ROUTES.SETTINGS_ACCOUNT}
 className="flex items-center cursor-pointer w-full"
 >
 <IconUserCircle className="mr-2 h-4 w-4 opacity-70" />
 <span className="flex-1">Mon Profil</span>
 <DropdownMenuShortcut>Shift+Cmd+P</DropdownMenuShortcut>
 </Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <Link
 to={ROUTES.SETTINGS_APPEARANCE}
 className="flex items-center cursor-pointer w-full"
 >
 <IconSettings className="mr-2 h-4 w-4 opacity-70" />
 <span className="flex-1">Parametres</span>
 <DropdownMenuShortcut>Cmd+S</DropdownMenuShortcut>
 </Link>
 </DropdownMenuItem>
 <DropdownMenuItem asChild>
 <Link
 to={ROUTES.SETTINGS_MFA}
 className="flex items-center cursor-pointer w-full"
 >
 <IconShieldLock className="mr-2 h-4 w-4 opacity-70" />
 <span className="flex-1">Securite</span>
 </Link>
 </DropdownMenuItem>
 </DropdownMenuGroup>
 <DropdownMenuSeparator className="my-1" />
 </div>
 <DropdownMenuItem
 onSelect={handleLogout}
 className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer m-1 "
 >
 <IconLogout className="mr-2 h-4 w-4" />
 <span className="font-semibold">Se deconnecter</span>
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 );
}
