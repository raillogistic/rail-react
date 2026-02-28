/**
 * Offline detection utility for handling network connectivity
 * 
 * Purpose: Provides utilities to detect when the server is offline and handle connectivity issues
 * Args: Various network detection functions
 * Returns: Network status and connectivity information
 * Raises: None (handles errors internally)
 * Example: const isOffline = await isServerOffline()
 */
import { getRuntimeBackendConfig } from "@/shared/config/backend-endpoint";

/**
 * Check if an error indicates the server is offline
 */
export const isServerOfflineError = (error: any): boolean => {
  if (!error) return false;

  // Check for network errors
  if (error.networkError) {
    const networkError = error.networkError;
    
    // Connection refused, server unreachable
    if (networkError.code === 'ECONNREFUSED' || 
        networkError.message?.includes('ECONNREFUSED') ||
        networkError.message?.includes('fetch')) {
      return true;
    }
    
    // No status code usually means connection failed
    if (!('statusCode' in networkError)) {
      return true;
    }
    
    // Server errors (5xx) might indicate server is down
    if (networkError.statusCode >= 500) {
      return true;
    }
  }
  
  // Check for fetch errors
  if (error.message?.includes('fetch') || 
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('NetworkError')) {
    return true;
  }
  
  // Check for Apollo Client network errors
  if ( error.networkError) {
    return isServerOfflineError({ networkError: error.networkError });
  }
  
  return false;
};

/**
 * Check if the browser is online
 */
export const isBrowserOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Test server connectivity by making a simple request
 */
const getDefaultServerUrl = (): string => {
  return getRuntimeBackendConfig().backendUrl;
};

export const testServerConnectivity = async (serverUrl?: string): Promise<boolean> => {
  const baseUrl = serverUrl ?? getDefaultServerUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Server connectivity test failed:', error);
    return false;
  }
};

/**
 * Get a user-friendly offline message
 */
export const getOfflineMessage = (context: 'login' | 'general' | 'protected' = 'general'): string => {
  switch (context) {
    case 'login':
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    case 'protected':
      return 'Connection to server lost. Some features may not be available until connection is restored.';
    default:
      return 'Server is currently unreachable. Please check your connection.';
  }
};

/**
 * Create a custom event for offline status changes
 */
export const dispatchOfflineEvent = (isOffline: boolean, context?: string) => {
  const event = new CustomEvent('server-connectivity-change', {
    detail: { isOffline, context, timestamp: Date.now() }
  });
  window.dispatchEvent(event);
};

/**
 * Hook-like function to listen for offline events
 */
export const onOfflineStatusChange = (callback: (isOffline: boolean, context?: string) => void) => {
  const handler = (event: CustomEvent) => {
    callback(event.detail.isOffline, event.detail.context);
  };
  
  window.addEventListener('server-connectivity-change', handler as EventListener);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('server-connectivity-change', handler as EventListener);
  };
};

/**
 * Enhanced error message for offline scenarios
 */
export const getEnhancedErrorMessage = (error: any, context: string = 'general'): string => {
  if (isServerOfflineError(error)) {
    return getOfflineMessage(context as 'login' | 'general' | 'protected');
  }
  
  // Return original error message if not offline-related
  return error.message || 'An unexpected error occurred';
};
