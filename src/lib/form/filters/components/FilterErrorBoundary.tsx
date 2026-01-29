/**
 * Dynamic Filters - Error Boundary
 * 
 * Catches and handles errors in the filter UI.
 */

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import { Button } from "@/lib/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface FilterErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface FilterErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  fallback?: React.ReactNode;
}

export class FilterErrorBoundary extends React.Component<
  FilterErrorBoundaryProps,
  FilterErrorBoundaryState
> {
  state: FilterErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): FilterErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Filter error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur de filtre</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Une erreur est survenue lors de l'affichage des filtres.</p>
            {this.state.error && (
              <p className="text-xs font-mono">{this.state.error.message}</p>
            )}
            <Button variant="outline" size="sm" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réinitialiser les filtres
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
