import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { SessionManager, Session } from '@/features/auth/components/SessionManager';
import { GET_ACTIVE_SESSIONS } from '@/shared/api/graphql/legacy/queries';
import { REVOKE_SESSION_MUTATION, REVOKE_ALL_SESSIONS_MUTATION } from '@/shared/api/graphql/legacy/mutations';
import { useAuth } from '@/features/auth/hooks/useAuth';

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
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Gestion des Sessions</h1>
      <p className="text-muted-foreground mb-8">
        Gérez vos sessions actives sur les différents appareils et navigateurs.
        Revoking a session will sign you out from that device.
      </p>

      <SessionManager
        sessions={sessions}
        isLoading={loading}
        onRevoke={handleRevokeSession}
        onRevokeAll={handleRevokeAllSessions}
      />
    </div>
  );
}
