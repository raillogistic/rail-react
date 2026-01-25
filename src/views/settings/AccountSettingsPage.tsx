import { useAuth } from "@/auth/hooks/useAuth";
import { gql, useQuery } from "@apollo/client";
import { SettingsLayout } from "./SettingsLayout";

export const GET_USER_DATA = gql`
  query GetUserData {
    me {
      id
      username
      first_name
      last_name
      email
      is_superuser
      model_permissions: model_permissions {
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
      if (loading) return <div className="p-4 text-muted-foreground">Chargement...</div>;
      if (!remoteUser) return <div className="p-4 text-muted-foreground">Utilisateur non trouvé.</div>;
      return (
        <div className="space-y-6">
          <section className="rounded-lg border bg-background p-4">
            <h2 className="text-base font-semibold">Profil</h2>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Nom d'utilisateur</dt>
                <dd className="font-medium">{remoteUser.username}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">PrÃ©nom</dt>
                <dd className="font-medium">{remoteUser.first_name ?? "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Nom</dt>
                <dd className="font-medium">{remoteUser.last_name ?? "-"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{remoteUser.email ?? "-"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border bg-background p-4">
            <h2 className="text-base font-semibold">Mot de passe</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Le formulaire de changement de mot de passe est fourni par
              l'application hÃ´te.
            </p>
          </section>
        </div>
      );
  }

  return (
    <SettingsLayout>
        {content()}
    </SettingsLayout>
  );
}
