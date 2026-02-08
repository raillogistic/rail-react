import React from "react";
import { useAuth } from "@/auth/hooks/useAuth";
import { gql, useQuery } from "@apollo/client";
import { SettingsLayout } from "./SettingsLayout";
import { AccountSettingsForm } from "./users/AccountSettingsForm";
import { ChangePasswordForm } from "./users/ChangePasswordForm";

export const GET_USER_DATA = gql`
  query GetUserData {
    me {
      id
      username
      first_name
      last_name
      email
      is_superuser: isSuperuser
      model_permissions: modelPermissions {
        model_name
        verbose_name
        can_update
        can_create
        can_delete
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

  const content = () => {
    if (loading)
      return <div className="p-4 text-muted-foreground">Chargement...</div>;
    if (!remoteUser)
      return (
        <div className="p-4 text-muted-foreground">Utilisateur non trouvé.</div>
      );
    return (
      <div className="space-y-6">
        <AccountSettingsForm user={remoteUser} />
        <ChangePasswordForm />
      </div>
    );
  };

  return <SettingsLayout>{content()}</SettingsLayout>;
}
