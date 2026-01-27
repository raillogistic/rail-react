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
  
  // Destructure config to ensure stable dependencies for primitives
  const { 
    idleTimeoutMs, 
    warningThresholdMs, 
    throttleMs = 1000,
    events = DEFAULT_EVENTS 
  } = config;

  const [state, setState] = useState<ActivityMonitorState>({
    isIdle: false,
    isWarning: false,
    lastActivity: new Date(),
    timeUntilTimeout: null,
  });

  // Use refs to track state for interval/timeouts without triggering effect re-runs
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

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

    // Only update state if needed to avoid unnecessary renders
    setState(prev => {
        if (!prev.isIdle && !prev.isWarning && prev.timeUntilTimeout === idleTimeoutMs) {
            return prev;
        }
        return {
            ...prev,
            isIdle: false,
            isWarning: false,
            lastActivity: new Date(now),
            timeUntilTimeout: idleTimeoutMs,
        };
    });

    // Set warning timer
    const warningDelay = idleTimeoutMs - warningThresholdMs;
    warningTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isWarning: true }));
    }, warningDelay);

    // Set idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isIdle: true }));
      logout({ reason: 'idle_timeout' });
    }, idleTimeoutMs);
  }, [isAuthenticated, idleTimeoutMs, warningThresholdMs, logout]);

  const handleActivity = useCallback(() => {
    // Throttle activity updates
    if (throttleRef.current) return;

    throttleRef.current = setTimeout(() => {
      throttleRef.current = null;
    }, throttleMs);

    resetTimers();
  }, [resetTimers, throttleMs]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  // Setup event listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Use a stable reference for events if possible, or accept re-run on array change
    // For now assuming events doesn't change often or is stable default
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timers
    resetTimers();

    // Update countdown every second when warning
    const countdownInterval = setInterval(() => {
      // Access current state via ref to avoid adding state to dependencies
      if (stateRef.current.isWarning) {
        const remaining = idleTimeoutMs - (Date.now() - lastActivityRef.current);
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
  }, [isAuthenticated, idleTimeoutMs, warningThresholdMs, throttleMs, handleActivity, resetTimers]); 
  // removed 'config' and 'state.isWarning' from deps

  return {
    ...state,
    extendSession,
    resetActivity: resetTimers,
  };
}
