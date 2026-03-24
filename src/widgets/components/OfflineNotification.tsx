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
} from "@/shared/utils/legacy-utils/offline-detector";
import { Alert, AlertTitle, AlertDescription } from "@/shared/ui/kit/alert";
import { Button } from "@/shared/ui/kit/button";
import { cn } from "@/shared/utils";

interface OfflineNotificationProps {
  onRetry?: () => void;
  className?: string;
  showRetryButton?: boolean;
  position?: "top" | "bottom";
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({
  onRetry,
  className = "",
  showRetryButton = true,
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
    position === "top" 
      ? "top-6 left-1/2 -translate-x-1/2" 
      : "bottom-6 left-1/2 -translate-x-1/2";

  return (
    <div className={cn(
      "fixed z-50 w-full max-w-lg px-4",
      positionClasses,
      className
    )}>
      <Alert className="border-orange-200 bg-orange-50/90 backdrop-blur-md shadow-2xl border-2 overflow-hidden ring-4 ring-orange-500/5">
        <WifiOff className="h-5 w-5 text-orange-600" />
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between w-full gap-4">
            <div>
              <AlertTitle className="text-orange-900 font-bold text-base flex items-center gap-2">
                Server Connection Lost
              </AlertTitle>
              <AlertDescription className="text-orange-800/80 mt-1 font-medium leading-relaxed">
                Unable to connect to the GraphQL API. Some features may be restricted.
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-100/50 rounded-full shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {showRetryButton && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                variant="default"
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm h-8 px-4 rounded-full font-bold"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Retry Connection
                  </>
                )}
              </Button>
              <div className="flex h-2 w-2 relative ml-1">
                <span className="absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </div>
              <span className="text-[10px] text-orange-600/70 font-bold uppercase tracking-widest">Auto-checking</span>
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
};

export default OfflineNotification;
