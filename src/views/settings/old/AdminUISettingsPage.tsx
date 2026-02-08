import { useAuth } from "@/auth/hooks/useAuth";
import { gql, useQuery } from "@apollo/client";
import { AdminUISettings } from "./AdminUISettings";
import { SettingsLayout } from "./SettingsLayout";

const GET_USER_PERMISSIONS = gql`
  query GetUserPermissions {
    me {
      id
      is_superuser: isSuperuser
      model_permissions: modelPermissions {
        model_name: modelName
        verbose_name: verboseName
        can_update: canUpdate
        can_create: canCreate
        can_delete: canDelete
      }
    }
  }
`;

interface ModelPermission {
  model_name: string;
  verbose_name: string;
  can_update: boolean;
  can_create: boolean;
  can_delete: boolean;
}

export function AdminUISettingsPage() {
  const { user } = useAuth();
  const { data: userData } = useQuery(GET_USER_PERMISSIONS, {
    skip: !user,
    fetchPolicy: "network-only",
  });

  const remoteUser = userData?.me;
  const permissions: ModelPermission[] = remoteUser?.model_permissions || [];

  const hasUIPermission = permissions.some(
    (p) =>
      (p.model_name.toLowerCase() === "core.uicomponentconfig" ||
        p.model_name === "UIComponentConfig") &&
      (p.can_update || p.can_create)
  );

  const canManageUI =
    user?.is_superuser || remoteUser?.is_superuser || hasUIPermission;

  if (!canManageUI) {
    return (
      <SettingsLayout>
        <div className="p-4 text-muted-foreground">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <AdminUISettings />
    </SettingsLayout>
  );
}
