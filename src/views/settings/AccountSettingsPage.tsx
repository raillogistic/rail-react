import { useAuth } from "@/auth/hooks/useAuth";
import { gql, useQuery } from "@apollo/client";
import { SettingsLayout } from "./SettingsLayout";
import { GET_MFA_STATUS } from "@/graphql/queries";
import { Badge } from "@/lib/components/ui/badge";
import { Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/links";

export const GET_USER_DATA = gql`
  query GetUserData {
    me {
      id
      username
      first_name: firstName
      last_name: lastName
      email
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

export function AccountSettingsPage() {
  const { user } = useAuth();
  const { data: userData, loading: userLoading } = useQuery(GET_USER_DATA, {
    skip: !user,
    fetchPolicy: "network-only",
  });

  const { data: mfaData, loading: mfaLoading } = useQuery(GET_MFA_STATUS, {
    skip: !user,
  });

  const navigate = useNavigate();
  const remoteUser = userData?.me;
  const mfaEnabled = mfaData?.me?.mfa_enabled;
  const loading = userLoading || mfaLoading;

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
                <dt className="text-muted-foreground">Prénom</dt>
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

          {/* NEW: Security Section */}
          <section className="rounded-lg border bg-background p-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </h2>
            <div className="mt-4 space-y-4">
              {/* MFA Status */}
              <div
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(ROUTES.SETTINGS_MFA)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      Authentification à deux facteurs
                    </p>
                    <Badge variant={mfaEnabled ? "default" : "destructive"}>
                      {mfaEnabled ? "Activé" : "Désactivé"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mfaEnabled
                      ? "Votre compte est protégé par 2FA"
                      : "Ajoutez une couche de sécurité supplémentaire"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-background p-4">
            <h2 className="text-base font-semibold">Mot de passe</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Le formulaire de changement de mot de passe est fourni par
              l'application hôte.
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
