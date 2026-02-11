/**
 * Offline Alert Component
 * 
 * Purpose: Shows a user-friendly alert when backend is offline or unreachable
 * Args: None (uses global offline state)
 * Returns: Alert component JSX or null
 * Raises: None (handles errors internally)
 * Example: <OfflineAlert /> (used in main app layout)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, X, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/lib/components/ui/alert';
import { Button } from '@/lib/components/ui/button';

interface OfflineAlertProps {
  isVisible: boolean;
  onRetry: () => void;
  onDismiss: () => void;
  message?: string;
}

export const OfflineAlert: React.FC<OfflineAlertProps> = ({
  isVisible,
  onRetry,
  onDismiss,
  message = "Unable to connect to the server. Please check your connection and try again."
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)] mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
      <Alert className="border-orange-200 bg-orange-50/90 backdrop-blur-md shadow-lg border-2">
        <WifiOff className="h-5 w-5 text-orange-600" />
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between w-full">
            <div>
              <AlertTitle className="text-orange-800 font-bold flex items-center gap-2">
                Connection Issue
              </AlertTitle>
              <AlertDescription className="text-orange-700/80 mt-1 font-medium leading-relaxed">
                {message}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-100 -mr-2 -mt-1 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="default"
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white border-none shadow-md h-8 px-4 rounded-full font-semibold"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Attempting...
                </>
              ) : (
                <>
                  <Wifi className="h-3.5 w-3.5 mr-2" />
                  Retry Connection
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="border-orange-200 text-orange-700 hover:bg-orange-100 h-8 px-4 rounded-full font-medium"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

/**
 * Hook for managing offline state and alerts
 */
export function useOfflineAlert() {
  const [isOffline, setIsOffline] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Detect network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (showAlert) {
        setShowAlert(false);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowAlert(true);
      setLastError("You appear to be offline. Please check your internet connection.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showAlert]);

  const showOfflineAlert = useCallback((message?: string) => {
    setLastError(message || "Unable to connect to the server. Please check your connection and try again.");
    setShowAlert(true);
  }, []);

  const hideOfflineAlert = useCallback(() => {
    setShowAlert(false);
    setLastError(null);
  }, []);

  const retryConnection = useCallback(async () => {
    // Simple connectivity test
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        hideOfflineAlert();
        return true;
      } else {
        throw new Error('Server not responding');
      }
    } catch (error) {
      console.error('Retry connection failed:', error);
      return false;
    }
  }, [hideOfflineAlert]);

  return {
    isOffline,
    showAlert,
    lastError,
    showOfflineAlert,
    hideOfflineAlert,
    retryConnection,
  };
}