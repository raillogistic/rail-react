import application from '@rail/application';
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { gql, useQuery } from "@apollo/client";
import { ROUTES } from "@/shared/routing/routes";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/kit/tabs";
import { User, Settings, Shield, Smartphone, Lock, Sparkles } from "lucide-react";

/**
 * Interface pour les propriétés du composant SettingsLayout.
 */
interface SettingsLayoutProps {
  /** Les éléments enfants à afficher à l'intérieur du layout des paramètres. */
  children: React.ReactNode;
}

/**
 * Requête GraphQL permettant de récupérer les permissions de l'utilisateur connecté
 * afin de conditionner l'affichage de l'onglet d'administration UI.
 */
const GET_USER_PERMISSIONS = gql`
  query GetUserPermissionsForLayout {
    me {
      id
      isSuperuser
      modelPermissions {
        modelName
        verboseName
        canUpdate
        canCreate
        canDelete
      }
    }
  }
`;

/**
 * @file SettingsLayout.tsx
 * @description Layout commun pour la page des paramètres qui encapsule les enfants dans une interface à onglets.
 * JSDoc: Ce composant synchronise les onglets avec le chemin de l'URL courante et restreint l'accès à l'onglet admin.
 * Tous les intitulés sont en français conformément aux directives de style du projet.
 *
 * @param props - Les propriétés du composant.
 * @returns Le composant de mise en page avec la barre d'onglets et le contenu enfant.
 */
export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const { data: userData } = useQuery(GET_USER_PERMISSIONS, {
    skip: !user,
    fetchPolicy: "network-only",
  });

  const remoteUser = userData?.me;
  const permissions = remoteUser?.modelPermissions || [];
  const hasUIPermission = permissions.some(
    (p: any) =>
      (p.modelName.toLowerCase() === "core.uicomponentconfig" ||
        p.modelName === "UIComponentConfig") &&
      (p.canUpdate || p.canCreate),
  );
  const canManageUI = remoteUser?.isSuperuser || hasUIPermission;
  const isAdmin = Boolean(
    remoteUser?.isSuperuser || user?.is_superuser || hasRole?.("admin_system")
  );

  const currentTab = location.pathname;

  /**
   * Redirige l'utilisateur vers la route correspondant à l'onglet sélectionné.
   * @param value - La route cible de l'onglet.
   */
  const handleTabChange = (value: string) => {
    navigate(value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Paramètres</h1>
        <p className="text-muted-foreground text-sm">
          Gérez vos informations de compte, préférences d'affichage et sécurité.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <TabsList className="flex flex-wrap w-full md:w-auto h-auto p-1 bg-muted/60 dark:bg-zinc-800/40 rounded-lg">
          <TabsTrigger value={ROUTES.SETTINGS_ACCOUNT} className="flex-1 md:flex-initial py-2 px-4 gap-2 text-xs md:text-sm font-medium">
            <User className="h-4 w-4" />
            Compte
          </TabsTrigger>
          <TabsTrigger value={ROUTES.SETTINGS_APPEARANCE} className="flex-1 md:flex-initial py-2 px-4 gap-2 text-xs md:text-sm font-medium">
            <Settings className="h-4 w-4" />
            Apparence
          </TabsTrigger>
          {canManageUI && (
            <TabsTrigger value={ROUTES.SETTINGS_ADMIN} className="flex-1 md:flex-initial py-2 px-4 gap-2 text-xs md:text-sm font-medium">
              <Shield className="h-4 w-4" />
              Administration UI
            </TabsTrigger>
          )}
          {isAdmin && application.slots?.AiSettings && (
            <TabsTrigger value={ROUTES.SETTINGS_AI} className="flex-1 md:flex-initial py-2 px-4 gap-2 text-xs md:text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              Intelligence Artificielle
            </TabsTrigger>
          )}
          <TabsTrigger value={ROUTES.SETTINGS_SESSIONS} className="flex-1 md:flex-initial py-2 px-4 gap-2 text-xs md:text-sm font-medium">
            <Smartphone className="h-4 w-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value={ROUTES.SETTINGS_MFA} className="flex-1 md:flex-initial py-2 px-4 gap-2 text-xs md:text-sm font-medium">
            <Lock className="h-4 w-4" />
            Sécurité (MFA)
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {children}
        </div>
      </Tabs>
    </div>
  );
}