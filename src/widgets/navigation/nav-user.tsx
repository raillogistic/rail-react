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
 * Propriétés du composant NavUser.
 */
export type NavUserProps = {
  /** Informations de l'utilisateur connecté. */
  user?: UserLike | null;
  /** Callback déclenché pour se déconnecter de la session. */
  onLogout?: () => void | Promise<void>;
};

/**
 * @file nav-user.tsx
 * @description Bloc de bas de barre latérale contenant l'avatar de l'utilisateur
 * et ouvrant un menu déroulant premium avec ses préférences, profil, et déconnexion.
 * Tous les libellés sont entièrement traduits en français et conformes à l'esthétique Localira.
 */
export function NavUser({ user, onLogout }: NavUserProps = {}) {
  const { isMobile, state } = useSidebar();
  const is_collapsed = state === "collapsed";
  const is_mobile = isMobile;
  const {
    userAvatar: user_avatar,
    primaryIdentity: primary_identity,
    secondaryIdentity: secondary_identity,
    avatarFallback: avatar_fallback,
  } = getUserIdentity(user);

  /**
   * Déclenche la déconnexion de l'utilisateur.
   */
  const handle_logout = () => {
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
                "h-12 w-full group rounded-lg transition-all duration-200",
                "data-[state=open]:bg-neutral-100/80 dark:data-[state=open]:bg-zinc-800/80 data-[state=open]:text-foreground",
                "hover:bg-neutral-100/60 dark:hover:bg-zinc-800/60",
                is_collapsed ? "justify-center p-0" : "px-2",
              )}
            >
              {/* Conteneur d'avatar avec témoin de présence en ligne vert */}
              <div className="relative shrink-0 flex items-center justify-center">
                <Avatar
                  className={cn(
                    "border border-neutral-200/30 group-hover:border-primary/45 transition-colors duration-200",
                    is_collapsed ? "h-8 w-8" : "h-9 w-9",
                  )}
                >
                  <AvatarImage
                    src={user_avatar}
                    alt={user?.username ?? undefined}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {avatar_fallback}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 border-2 border-sidebar bg-emerald-500 rounded-full" />
              </div>

              {!is_collapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-2.5">
                    <span className="truncate font-semibold text-foreground/90 tracking-tight text-[13px]">
                      {primary_identity}
                    </span>
                    <span className="text-muted-foreground/60 truncate text-[10px] font-medium tracking-wide">
                      {secondary_identity}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center shrink-0">
                    <IconChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors duration-200" />
                  </div>
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-72 border border-neutral-200/30 dark:border-zinc-800/65 bg-sidebar/90 p-2.5 backdrop-blur-2xl shadow-none rounded-xl"
            side={is_mobile ? "bottom" : "right"}
            align="end"
            sideOffset={12}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              {/* En-tête du menu utilisateur avec badge premium en français */}
              <div className="flex items-center gap-3 px-3 py-3 text-left bg-neutral-100/50 dark:bg-zinc-800/50 border border-neutral-200/20 dark:border-zinc-800/40 rounded-lg mb-2">
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11 border border-neutral-200/30">
                    <AvatarImage
                      src={user_avatar}
                      alt={user?.username ?? undefined}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {avatar_fallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 border-2 border-sidebar bg-emerald-500 rounded-full" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-foreground text-sm tracking-tight">
                    {primary_identity}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                      variant="secondary"
                      className="text-[9px] h-4.5 px-1.5 py-0 font-bold uppercase tracking-wider bg-primary/10 text-primary border-none shadow-none"
                    >
                      Compte Interne
                    </Badge>
                    <span className="text-muted-foreground/50 truncate text-[10px] font-medium">
                      {user?.username || "actif"}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>

            {/* Groupe Navigation */}
            <DropdownMenuGroup className="space-y-0.5 py-1 px-1">
              <div className="px-3 py-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-1">
                Navigation
              </div>
              <DropdownMenuItem
                asChild
                className="px-3 py-2 rounded-lg focus:bg-primary/8 focus:text-primary group cursor-pointer transition-colors duration-150"
              >
                <Link to={ROUTES.SETTINGS_ACCOUNT} className="w-full flex items-center">
                  <IconUserCircle className="size-4.5 mr-3 opacity-60 group-focus:text-primary" />
                  <span className="flex-1 font-medium text-[13px] tracking-tight">
                    Mon Profil
                  </span>
                  <DropdownMenuShortcut className="group-focus:text-primary opacity-50 text-[10px]">
                    Shift+Cmd+P
                  </DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="px-3 py-2 rounded-lg focus:bg-primary/8 focus:text-primary group cursor-pointer transition-colors duration-150"
              >
                <Link
                  to={ROUTES.SETTINGS_APPEARANCE}
                  className="w-full flex items-center"
                >
                  <IconSettings className="size-4.5 mr-3 opacity-60 group-focus:text-primary" />
                  <span className="flex-1 font-medium text-[13px] tracking-tight">
                    Préférences
                  </span>
                  <DropdownMenuShortcut className="group-focus:text-primary opacity-50 text-[10px]">
                    Cmd+S
                  </DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2 rounded-lg focus:bg-primary/8 focus:text-primary group cursor-pointer transition-colors duration-150">
                <IconShieldLock className="size-4.5 mr-3 opacity-60 group-focus:text-primary" />
                <span className="flex-1 font-medium text-[13px] tracking-tight">
                  Sécurité
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-neutral-200/20 dark:bg-zinc-800/40 my-1.5 mx-1" />

            {/* Groupe Support & Notifications */}
            <DropdownMenuGroup className="space-y-0.5 py-1 px-1">
              <DropdownMenuItem className="px-3 py-2 rounded-lg focus:bg-primary/8 focus:text-primary group cursor-pointer transition-colors duration-150">
                <IconBell className="size-4.5 mr-3 opacity-60 group-focus:text-primary" />
                <span className="flex-1 font-medium text-[13px] tracking-tight">
                  Notifications
                </span>
                <Badge className="ml-auto h-4 px-1.5 min-w-4 justify-center bg-primary text-primary-foreground text-[9px] font-bold border-none shadow-none rounded-full">
                  12
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem className="px-3 py-2 rounded-lg focus:bg-primary/8 focus:text-primary group cursor-pointer transition-colors duration-150">
                <IconHelpCircle className="size-4.5 mr-3 opacity-60 group-focus:text-primary" />
                <span className="flex-1 font-medium text-[13px] tracking-tight">
                  Centre d'aide
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-neutral-200/20 dark:bg-zinc-800/40 my-1.5 mx-1" />

            {/* Déconnexion */}
            <div className="px-1 py-0.5">
              <DropdownMenuItem
                onClick={handle_logout}
                className="px-3 py-2 rounded-lg focus:bg-destructive/10 focus:text-destructive text-destructive font-semibold cursor-pointer transition-colors duration-150"
              >
                <IconLogout className="size-4.5 mr-3" />
                <span className="flex-1 text-[13px] tracking-tight">Se déconnecter</span>
                <DropdownMenuShortcut className="opacity-70 text-[10px]">
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
