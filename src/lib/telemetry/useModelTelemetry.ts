import * as React from "react";
import { SpanStatusCode, trace, context as otelContext } from "@opentelemetry/api";
import { stableSerialize } from "@/lib/graphql/metadata/cache";

export interface UseModelTelemetryOptions {
  component: string;
  appName: string;
  modelName: string;
  attributes?: Record<string, string | number | boolean | null | undefined>;
}

export interface ModelTelemetryHandle {
  logEvent: (name: string, attributes?: Record<string, unknown>) => void;
  recordError: (error: unknown) => void;
}

const tracer = trace.getTracer("rail-logistic-frontend");

export function useModelTelemetry(options: UseModelTelemetryOptions): ModelTelemetryHandle {
  const { component, appName, modelName, attributes } = options;
  const attrSignature = React.useMemo(
    () => stableSerialize(attributes ?? {}),
    [attributes]
  );
  const spanRef = React.useRef<ReturnType<typeof tracer.startSpan> | null>(null);

  React.useEffect(() => {
    const baseAttributes = {
      "rail.component": component,
      "rail.model.app": appName,
      "rail.model.name": modelName,
    };
    const spanAttributes = attributes
      ? {
          ...baseAttributes,
          ...attributes,
        }
      : baseAttributes;
    const span = tracer.startSpan(
      `${component}.mount`,
      { attributes: spanAttributes },
      otelContext.active()
    );
    spanRef.current = span;
    return () => {
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      spanRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component, appName, modelName, attrSignature]);

  const logEvent = React.useCallback((name: string, eventAttributes?: Record<string, unknown>) => {
    if (!spanRef.current) return;
    spanRef.current.addEvent(name, eventAttributes);
  }, []);

  const recordError = React.useCallback((error: unknown) => {
    if (!spanRef.current) return;
    if (error instanceof Error) {
      spanRef.current.recordException(error);
      spanRef.current.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    } else {
      spanRef.current.addEvent("error", { detail: String(error) });
      spanRef.current.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
    }
  }, []);

  return { logEvent, recordError };
}

