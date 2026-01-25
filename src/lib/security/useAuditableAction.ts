import * as React from "react";
import { useAuditLogger } from "./auditLogger";

export interface AuditableActionOptions {
  appName: string;
  modelName: string;
  component: string;
  logEvent?: (name: string, attributes?: Record<string, unknown>) => void;
}

export interface AuditableActionMetadata {
  severity?: "low" | "medium" | "high" | "critical";
  success?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

export function useAuditableAction(options: AuditableActionOptions) {
  const { appName, modelName, component, logEvent } = options;
  const auditLogger = useAuditLogger(appName, modelName);

  return React.useCallback(
    (operation: string, details?: AuditableActionMetadata) => {
      auditLogger({
        operation,
        component,
        severity: details?.severity,
        success: details?.success,
        description: details?.description,
        metadata: details?.metadata,
      }).catch(() => {
        // Silent failure by design to avoid blocking UI interactions
      });
      if (logEvent) {
        logEvent(operation, details?.metadata);
      }
    },
    [auditLogger, component, logEvent]
  );
}

export const buildAuditAttributes = (
  appName: string,
  modelName: string,
  operation: string,
  component: string
) => ({
  "data-rail-app": appName,
  "data-rail-model": modelName,
  "data-rail-operation": operation,
  "data-rail-component": component,
});
