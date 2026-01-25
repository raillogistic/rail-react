/**
 * Offline Notification Component
 *
 * Purpose: Displays a notification when the server is offline on protected routes
 * Args: onRetry callback for retry functionality, className for custom styling
 * Returns: JSX notification element
 * Raises: None (handles errors internally)
 * Example: <OfflineNotification onRetry={handleRetry} />
 */

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, X } from "lucide-react";
import {
  onOfflineStatusChange,
  testServerConnectivity,
} from "@/utils/offline-detector";

interface OfflineNotificationProps {
  onRetry?: () => void;
  className?: string;
  showRetryButton?: boolean;
  autoHide?: boolean;
  position?: "top" | "bottom";
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({
  onRetry,
  className = "",
  showRetryButton = true,
  autoHide = false,
  position = "top",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Initial connectivity check
    const checkInitialConnectivity = async () => {
      const isOnline = await testServerConnectivity();
      if (!isOnline && !isDismissed) {
        setIsVisible(true);
      }
    };

    checkInitialConnectivity();

    // Listen for offline status changes
    const cleanup = onOfflineStatusChange((isOffline) => {
      if (isOffline && !isDismissed) {
        setIsVisible(true);
      } else if (!isOffline) {
        setIsVisible(false);
        setIsDismissed(false); // Reset dismissal when back online
      }
    });

    return cleanup;
  }, [isDismissed]);

  const handleRetry = async () => {
    setIsRetrying(true);

    try {
      const isOnline = await testServerConnectivity();
      if (isOnline) {
        setIsVisible(false);
        setIsDismissed(false);
        onRetry?.();
      }
    } catch (error) {
      console.warn("Retry connectivity check failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!isVisible) {
    return null;
  }

  const positionClasses =
    position === "top" ? "top-4 left-4 right-4" : "bottom-4 left-4 right-4";

  return (
    <div className={`fixed ${positionClasses} z-50 ${className}`}>
      <div className="bg-orange-50 border border-orange-200 rounded-lg shadow-lg p-4 mx-auto max-w-md">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <WifiOff className="h-6 w-6 text-orange-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-orange-800">
              Server Connection Lost
            </h3>
            <p className="text-sm text-orange-700 mt-1">
              Unable to connect to localhost:8000/graphql. Some features may not
              be available.
            </p>

            {showRetryButton && (
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="animate-spin h-3 w-3 mr-1" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry Connection
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="bg-orange-50 rounded-md inline-flex text-orange-400 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
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

export default OfflineNotification;
