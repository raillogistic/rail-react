import React, { Component, ReactNode } from 'react';
import { AuthError, AuthErrorType, getErrorMessage } from '@/shared/api/auth/error-handler';

interface Props {
  children: ReactNode;
  onError?: (error: AuthError) => void;
  onRetry?: () => void;
  onLogout?: () => void;
  fallback?: (error: AuthError, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: AuthError | null;
  retryCount: number;
}

/**
 * Error boundary specifically for authentication errors
 * Provides user-friendly error messages and recovery options
 */
export class AuthErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's an AuthError
    if (error instanceof AuthError) {
      return {
        hasError: true,
        error
      };
    }

    // Convert generic errors to AuthError
    const authError = new AuthError(
      AuthErrorType.UNKNOWN_ERROR,
      error.message,
      'An unexpected error occurred. Please try again.',
      { cause: error }
    );

    return {
      hasError: true,
      error: authError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);


    if (this.state.error) {
      this.props.onError?.(this.state.error);
    }
  }

  handleRetry = () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));

    this.props.onRetry?.();
  };

  handleLogout = () => {
    this.props.onLogout?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return (
        <DefaultAuthErrorUI
          error={this.state.error}
          onRetry={this.handleRetry}
          onLogout={this.handleLogout}
          canRetry={this.state.retryCount < this.maxRetries}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultAuthErrorUIProps {
  error: AuthError;
  onRetry: () => void;
  onLogout: () => void;
  canRetry: boolean;
}

/**
 * Default error UI component for authentication errors
 */
function DefaultAuthErrorUI({ error, onRetry, onLogout, canRetry }: DefaultAuthErrorUIProps) {
  const errorMessage = getErrorMessage(error);

  const getErrorIcon = () => {
    switch (error.type) {
      case AuthErrorType.NETWORK_ERROR:
        return 'ðŸŒ';
      case AuthErrorType.TOKEN_EXPIRED:
      case AuthErrorType.SESSION_EXPIRED:
        return 'â°';
      case AuthErrorType.UNAUTHORIZED:
      case AuthErrorType.TOKEN_INVALID:
        return 'ðŸ”’';
      case AuthErrorType.FORBIDDEN:
        return 'ðŸš«';
      default:
        return 'âš ï¸';
    }
  };

  const shouldShowRetry = error.shouldRetry && canRetry;
  const shouldShowLogout = error.shouldLogout;

  return (
    <div className="auth-error-boundary">
      <div className="auth-error-container">
        <div className="auth-error-icon">
          {getErrorIcon()}
        </div>

        <h2 className="auth-error-title">
          {error.type === AuthErrorType.NETWORK_ERROR ? 'Connection Problem' :
            error.type === AuthErrorType.TOKEN_EXPIRED ? 'Session Expired' :
              error.type === AuthErrorType.UNAUTHORIZED ? 'Authentication Required' :
                error.type === AuthErrorType.FORBIDDEN ? 'Access Denied' :
                  'Something Went Wrong'}
        </h2>

        <p className="auth-error-message">
          {errorMessage}
        </p>

        {error.code && (
          <p className="auth-error-code">
            Error Code: {error.code}
          </p>
        )}

        <div className="auth-error-actions">
          {shouldShowRetry && (
            <button
              onClick={onRetry}
              className="auth-error-button auth-error-button--primary"
            >
              Try Again
            </button>
          )}

          {shouldShowLogout && (
            <button
              onClick={onLogout}
              className="auth-error-button auth-error-button--secondary"
            >
              Log In Again
            </button>
          )}

          {!shouldShowRetry && !shouldShowLogout && (
            <button
              onClick={() => window.location.reload()}
              className="auth-error-button auth-error-button--primary"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
      {/* @ts-ignore */}
      <style jsx>{`
        .auth-error-boundary {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
          background-color: #f8f9fa;
        }
        
        .auth-error-container {
          text-align: center;
          max-width: 500px;
          padding: 2rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .auth-error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .auth-error-title {
          color: #dc3545;
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .auth-error-message {
          color: #6c757d;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        
        .auth-error-code {
          color: #868e96;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
          font-family: monospace;
        }
        
        .auth-error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .auth-error-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .auth-error-button--primary {
          background-color: #007bff;
          color: white;
        }
        
        .auth-error-button--primary:hover {
          background-color: #0056b3;
        }
        
        .auth-error-button--secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .auth-error-button--secondary:hover {
          background-color: #545b62;
        }
      `}</style>
    </div>
  );
}

/**
 * Hook for handling authentication errors in components
 */
export function useAuthErrorHandler() {
  const [error, setError] = React.useState<AuthError | null>(null);

  const handleError = React.useCallback((error: AuthError) => {
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    hasError: !!error
  };
}