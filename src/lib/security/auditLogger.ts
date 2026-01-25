import * as React from "react";
import { gql, useMutation } from "@apollo/client";
import { useAuthContext } from "@/views/providers/AuthProvider";

const LOG_FRONTEND_AUDIT_MUTATION = gql`
  mutation LogFrontendAudit($input: FrontendAuditEventInput!) {
    response: log_frontend_audit(input: $input) {
      ok
      error
    }
  }
`;

export interface AuditLoggerPayload {
  operation: string;
  component: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  metadata?: Record<string, unknown>;
  success?: boolean;
}

export function useAuditLogger(appName: string, modelName: string) {
  const { user } = useAuthContext();
  const [mutate] = useMutation(LOG_FRONTEND_AUDIT_MUTATION);
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  return React.useCallback(
    (payload: AuditLoggerPayload) => {
      return mutate({
        variables: {
          input: {
            app_name: appName,
            model_name: modelName,
            component: payload.component,
            operation: payload.operation,
            description: payload.description,
            severity: payload.severity ?? "low",
            metadata: JSON.stringify(payload.metadata ?? {}),
            success: payload.success ?? true,
            source_route: pathname,
          },
        },
        context: {
          fetchOptions: {
            method: "POST",
          },
        },
      });
    },
    [appName, modelName, mutate, pathname, user?.permissions]
  );
}
