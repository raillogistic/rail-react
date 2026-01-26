import React, { useEffect, useState } from 'react';
import { Button } from '@/lib/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Laptop, Smartphone, Globe, Monitor } from 'lucide-react';

export interface Session {
  id: string;
  deviceName: string;
  browser: string;
  location?: string;
  lastActive: Date;
  current: boolean;
  ipAddress?: string;
  os?: string;
  deviceType?: string;
}

interface SessionManagerProps {
  sessions: Session[];
  isLoading: boolean;
  onRevoke: (sessionId: string) => Promise<void>;
  onRevokeAll: () => Promise<void>;
}

export function SessionManager({
  sessions,
  isLoading,
  onRevoke,
  onRevokeAll
}: SessionManagerProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await onRevoke(sessionId);
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAll = async () => {
    setIsRevokingAll(true);
    try {
      await onRevokeAll();
    } finally {
      setIsRevokingAll(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      .format(-Math.round((Date.now() - date.getTime()) / 60000), 'minute');
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Smartphone className="h-5 w-5" />;
      case 'desktop':
      case 'laptop':
        return <Laptop className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Active Sessions</h2>
        {sessions.length > 1 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRevokeAll}
            disabled={isRevokingAll}
          >
            {isRevokingAll ? 'Signing out...' : 'Sign out all other devices'}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map(session => (
          <Card key={session.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-muted rounded-full text-muted-foreground mt-1">
                  {getDeviceIcon(session.deviceType)}
                </div>
                <div>
                  <p className="font-medium flex items-center">
                    {session.deviceName || 'Unknown Device'}
                    {session.current && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {session.browser} {session.os ? `on ${session.os}` : ''} • {session.location || session.ipAddress || 'Unknown location'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last active {formatDate(session.lastActive)}
                  </p>
                </div>
              </div>
              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revokingId === session.id}
                >
                  {revokingId === session.id ? 'Signing out...' : 'Sign out'}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No active sessions found.
          </div>
        )}
      </div>
    </div>
  );
}
