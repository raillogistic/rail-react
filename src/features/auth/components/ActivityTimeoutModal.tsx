import { useActivityMonitor } from '../hooks/useActivityMonitor';
import { useAuth } from '../hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/shared/ui/kit/dialog';
import { Button } from '@/shared/ui/kit/button';

interface ActivityTimeoutModalProps {
  idleTimeoutMs?: number;
  warningThresholdMs?: number;
}

const isAutoLogoutEnabled = (): boolean => {
  const value = import.meta.env.VITE_AUTO_LOGOUT_ENABLED;
  return value !== "false" && value !== "0";
};

const readEnvMinutes = (key: string, fallbackMinutes: number): number => {
  const raw = import.meta.env[key];
  if (raw == null || raw === "") return fallbackMinutes * 60_000;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 60_000 : fallbackMinutes * 60_000;
};

export function ActivityTimeoutModal({
  idleTimeoutMs = readEnvMinutes("VITE_IDLE_TIMEOUT_MIN", 15),
  warningThresholdMs = readEnvMinutes("VITE_IDLE_WARNING_MIN", 2),
}: ActivityTimeoutModalProps) {
  const { isWarning, timeUntilTimeout, extendSession } = useActivityMonitor({
    idleTimeoutMs,
    warningThresholdMs,
    autoLogout: isAutoLogoutEnabled(),
  });
  const { logout } = useAuth();

  const formatTime = (ms: number | null) => {
    if (ms === null) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isWarning}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Timeout Warning</DialogTitle>
          <DialogDescription>
            Your session is about to expire due to inactivity.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center text-lg">
            Your session will expire in{' '}
            <span className="font-bold text-destructive">
              {formatTime(timeUntilTimeout)}
            </span>
          </p>
          <p className="text-center text-muted-foreground mt-2">
            Click "Stay Logged In" to continue your session.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              void logout({ reason: 'idle_timeout' });
            }}
          >
            Log Out Now
          </Button>
          <Button onClick={extendSession}>
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
