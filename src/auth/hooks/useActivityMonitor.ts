import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

interface ActivityMonitorConfig {
  idleTimeoutMs: number;
  warningThresholdMs: number;
  events?: string[];
  throttleMs?: number;
}

interface ActivityMonitorState {
  isIdle: boolean;
  isWarning: boolean;
  lastActivity: Date;
  timeUntilTimeout: number | null;
}

const DEFAULT_EVENTS = [
  'mousemove', 'mousedown', 'keydown',
  'touchstart', 'scroll', 'click'
];

export function useActivityMonitor(config: ActivityMonitorConfig) {
  const { isAuthenticated, logout } = useAuth();
  const [state, setState] = useState<ActivityMonitorState>({
    isIdle: false,
    isWarning: false,
    lastActivity: new Date(),
    timeUntilTimeout: null,
  });

  const lastActivityRef = useRef(Date.now());
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    if (!isAuthenticated) return;

    const now = Date.now();
    lastActivityRef.current = now;

    setState(prev => ({
      ...prev,
      isIdle: false,
      isWarning: false,
      lastActivity: new Date(now),
      timeUntilTimeout: config.idleTimeoutMs,
    }));

    // Set warning timer
    const warningDelay = config.idleTimeoutMs - config.warningThresholdMs;
    warningTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isWarning: true }));
    }, warningDelay);

    // Set idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isIdle: true }));
      logout({ reason: 'idle_timeout' });
    }, config.idleTimeoutMs);
  }, [isAuthenticated, config.idleTimeoutMs, config.warningThresholdMs, logout]);

  const handleActivity = useCallback(() => {
    // Throttle activity updates
    if (throttleRef.current) return;

    throttleRef.current = setTimeout(() => {
      throttleRef.current = null;
    }, config.throttleMs || 1000);

    resetTimers();
  }, [resetTimers, config.throttleMs]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Setup event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = config.events || DEFAULT_EVENTS;
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timers
    resetTimers();

    // Update countdown every second when warning
    const countdownInterval = setInterval(() => {
      if (state.isWarning) {
        const remaining = config.idleTimeoutMs - (Date.now() - lastActivityRef.current);
        setState(prev => ({
          ...prev,
          timeUntilTimeout: Math.max(0, remaining),
        }));
      }
    }, 1000);

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (throttleRef.current) clearTimeout(throttleRef.current);
      clearInterval(countdownInterval);
    };
  }, [isAuthenticated, config, handleActivity, resetTimers, state.isWarning]);

  return {
    ...state,
    extendSession,
    resetActivity: resetTimers,
  };
}
