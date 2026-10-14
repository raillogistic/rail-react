/**
 * @file SessionsPage.tsx
 * @description Page de gestion des sessions actives de l'utilisateur.
 * JSDoc: Ce composant permet d'afficher la liste des appareils et navigateurs connectés
 * à la session de l'utilisateur et offre des actions de révocation unitaire ou globale.
 * Intégré au layout à onglets de configuration 'SettingsLayout'.
 */

import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { SessionManager, Session } from '@/features/auth/components/SessionManager';
import { GET_ACTIVE_SESSIONS } from '@/shared/api/graphql/legacy/queries';
import { REVOKE_SESSION_MUTATION, REVOKE_ALL_SESSIONS_MUTATION } from '@/shared/api/graphql/legacy/mutations';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { SettingsLayout } from "../settings/SettingsLayout";

export function SessionsPage() {
  const { user } = useAuth();

  const { data, loading, refetch } = useQuery(GET_ACTIVE_SESSIONS, {
    fetchPolicy: 'network-only',
    skip: !user,
  });

  const [revokeSession] = useMutation(REVOKE_SESSION_MUTATION);
  const [revokeAllSessions] = useMutation(REVOKE_ALL_SESSIONS_MUTATION);

  const [sessions, setSessions] = React.useState<Session[]>([]);

  React.useEffect(() => {
    if (data?.my_sessions) {
      setSessions(data.my_sessions.map((s: any) => ({
        id: s.id,
        deviceName: s.device_type || 'Unknown Device',
        browser: s.browser,
        location: s.location,
        lastActive: new Date(s.last_activity),
        current: s.is_current,
        ipAddress: s.ip_address,
        os: s.os,
        deviceType: s.device_type,
      })));
    }
  }, [data]);

  const handleRevokeSession = async (sessionId: string) => {
    await revokeSession({ variables: { session_id: sessionId } });
    await refetch();
  };

  const handleRevokeAllSessions = async () => {
    await revokeAllSessions();
    await refetch();
  };

  if (!user) {
    return <div>Please log in to manage sessions.</div>;
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Gestion des Sessions</h2>
          <p className="text-muted-foreground text-sm">
            Gérez vos sessions actives sur les différents appareils et navigateurs.
            La révocation d'une session vous déconnectera de cet appareil.
          </p>
        </div>

        <SessionManager
          sessions={sessions}
          isLoading={loading}
          onRevoke={handleRevokeSession}
          onRevokeAll={handleRevokeAllSessions}
        />
      </div>
    </SettingsLayout>
  );
}
