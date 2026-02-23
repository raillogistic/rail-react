import { useAuth } from "@/features/auth/hooks/useAuth";
import { gql, useQuery } from "@apollo/client";
import { SettingsLayout } from "./SettingsLayout";
import { AccountSettingsForm } from "./users/AccountSettingsForm";
import { ChangePasswordForm } from "./users/ChangePasswordForm";

export const GET_USER_DATA = gql`
  query GetUserData {
    me {
      id
      username
      firstName
      lastName
      first_name: firstName
      last_name: lastName
      email
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

export function AccountSettingsPage() {
  const { user } = useAuth();
  const { data: userData, loading } = useQuery(GET_USER_DATA, {
    skip: !user,
    fetchPolicy: "network-only",
  });

  const remoteUser = userData?.me;
  const authUser = user as Record<string, any> | null;
  const fallbackUser = {
    id:
      authUser?.id || authUser?.user_id || authUser?.userId || authUser?.sub || "",
    firstName:
      authUser?.firstName ||
      authUser?.first_name ||
      authUser?.metadata?.first_name ||
      "",
    lastName:
      authUser?.lastName ||
      authUser?.last_name ||
      authUser?.metadata?.last_name ||
      "",
    email: authUser?.email || "",
  };
  const formUser = {
    id: String(remoteUser?.id ?? ""),
    firstName:
      remoteUser?.firstName ?? remoteUser?.first_name ?? fallbackUser.firstName,
    lastName:
      remoteUser?.lastName ?? remoteUser?.last_name ?? fallbackUser.lastName,
    first_name:
      remoteUser?.first_name ?? remoteUser?.firstName ?? fallbackUser.firstName,
    last_name:
      remoteUser?.last_name ?? remoteUser?.lastName ?? fallbackUser.lastName,
    email: remoteUser?.email ?? fallbackUser.email,
  };

  const content = () => {
    if (loading) {
      return <div className="p-4 text-muted-foreground">Chargement...</div>;
    }
    if (!formUser?.id) {
      return (
        <div className="p-4 text-muted-foreground">Utilisateur non trouve.</div>
      );
    }
    return (
      <div className="space-y-6">
        <AccountSettingsForm user={formUser} />
        <ChangePasswordForm />
      </div>
    );
  };

  return <SettingsLayout>{content()}</SettingsLayout>;
}
