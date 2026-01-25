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
import { AlertTriangle, Wifi, WifiOff, X } from 'lucide-react';

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
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <WifiOff className="h-5 w-5 text-yellow-600" />
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Connection Issue
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              {message}
            </p>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1"></div>
                    Retrying...
                  </>
                ) : (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Retry
                  </>
                )}
              </button>
              
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="bg-yellow-50 rounded-md inline-flex text-yellow-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for managing offline state and alerts
 */
export const useOfflineAlert = () => {
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
};