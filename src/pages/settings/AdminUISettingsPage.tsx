import { useAuth } from "@/auth/hooks/useAuth";
import { gql, useQuery } from "@apollo/client";
import { AdminUISettings } from "./AdminUISettings";
import { SettingsLayout } from "./SettingsLayout";

const GET_USER_PERMISSIONS = gql`
  query GetUserPermissions {
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

interface ModelPermission {
  modelName: string;
  verboseName: string;
  canUpdate: boolean;
  canCreate: boolean;
  canDelete: boolean;
}

export function AdminUISettingsPage() {
  const { user } = useAuth();
  const { data: userData } = useQuery(GET_USER_PERMISSIONS, {
    skip: !user,
    fetchPolicy: "network-only",
  });

  const remoteUser = userData?.me;
  const permissions: ModelPermission[] = remoteUser?.modelPermissions || [];

  const hasUIPermission = permissions.some(
    (p) =>
      (p.modelName.toLowerCase() === "core.uicomponentconfig" ||
        p.modelName === "UIComponentConfig") &&
      (p.canUpdate || p.canCreate),
  );

  const canManageUI = remoteUser?.isSuperuser || hasUIPermission;

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
