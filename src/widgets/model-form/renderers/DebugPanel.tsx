/**
 * Debug panel for DynamicForm developer tools.
 *
 * Displays current form values, change log, and submit diagnostics.
 */
import React from "react";
import type { UseFormReturn } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { Card } from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/kit/tabs";
import type { ChangeRecord } from "../types/schema";
import type { FormDevtoolsConfig } from "../types/props";

export type DebugPanelProps<TValues> = {
  form: UseFormReturn<TValues>;
  formValues: TValues;
  changeLog: ChangeRecord[];
  config?: FormDevtoolsConfig<TValues>;
  isLoading?: boolean;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

type MutationRequestHints = {
  jsonFieldPaths?: string[];
};

function cloneRecord(value: Record<string, unknown>) {
  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return { ...value };
  }
}

function getValueAtPath(source: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".").filter(Boolean);
  let current: unknown = source;
  for (const segment of segments) {
    if (!isPlainRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function setValueAtPath(
  source: Record<string, unknown>,
  path: string,
  value: unknown,
) {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) {
    return source;
  }

  const next = cloneRecord(source);
  let cursor: Record<string, unknown> = next;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const nested = cursor[segment];
    if (!isPlainRecord(nested)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }

  cursor[segments[segments.length - 1]] = value;
  return next;
}

function stringifyJsonValuesForGraphiql(
  variables: Record<string, unknown>,
  hints?: MutationRequestHints | null,
) {
  const jsonFieldPaths = hints?.jsonFieldPaths ?? [];
  if (jsonFieldPaths.length === 0) {
    return variables;
  }

  let nextVariables = cloneRecord(variables);

  jsonFieldPaths.forEach((path) => {
    const normalized = String(path ?? "").trim();
    if (!normalized) return;

    const inputPath = normalized.startsWith("input.")
      ? normalized
      : `input.${normalized}`;
    const currentValue = getValueAtPath(nextVariables, inputPath);
    if (currentValue === undefined || typeof currentValue === "string") {
      return;
    }

    nextVariables = setValueAtPath(
      nextVariables,
      inputPath,
      JSON.stringify(currentValue),
    );
  });

  return nextVariables;
}

function toGraphQLLiteral(value: unknown, indentLevel = 0): string {
  const indent = "  ".repeat(indentLevel);

  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const lines = value.map((item) =>
      `${"  ".repeat(indentLevel + 1)}${toGraphQLLiteral(item, indentLevel + 1)}`,
    );
    return `[\n${lines.join("\n")}\n${indent}]`;
  }

  if (!isPlainRecord(value)) {
    return JSON.stringify(value);
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";

  const lines = entries.map(
    ([key, nested]) =>
      `${"  ".repeat(indentLevel + 1)}${key}: ${toGraphQLLiteral(
        nested,
        indentLevel + 1,
      )}`,
  );

  return `{\n${lines.join("\n")}\n${indent}}`;
}

function buildMutationRequestGraphiqlText(
  mutationRequest: unknown,
  hints?: MutationRequestHints | null,
): string {
  if (!isPlainRecord(mutationRequest)) {
    return JSON.stringify(mutationRequest, null, 2);
  }

  const operationName = String(mutationRequest.operationName ?? "").trim();
  const variables = isPlainRecord(mutationRequest.variables)
    ? mutationRequest.variables
    : null;

  if (!operationName || !variables) {
    return JSON.stringify(mutationRequest, null, 2);
  }

  const graphiqlVariables = stringifyJsonValuesForGraphiql(variables, hints);
  const entries = Object.entries(graphiqlVariables);
  const callHeader =
    entries.length === 0
      ? `  ${operationName} {`
      : `  ${operationName}(\n${entries
          .map(
            ([key, value]) =>
              `    ${key}: ${toGraphQLLiteral(value, 2)}`,
          )
          .join("\n")}\n  ) {`;

  return [
    "mutation {",
    callHeader,
    "    ok",
    "    object { id }",
    "    errors { field message code severity details }",
    "  }",
    "}",
  ].join("\n");
}

export const DebugPanel = <TValues extends Record<string, any>>({
  form,
  formValues,
  changeLog,
  config,
  isLoading,
}: DebugPanelProps<TValues>) => {
  if (!config?.enabled) return null;

  const isSubmitting = useStore(form.store, (state: any) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state: any) => state.canSubmit);
  const fieldMeta = useStore(
    form.store,
    (state) => (state as any).fieldMeta ?? {},
  );

  const displayValues = config.transformValues
    ? config.transformValues(formValues)
    : formValues;

  const modelFormDebugPayload = React.useMemo(() => {
    if (!displayValues || typeof displayValues !== "object" || Array.isArray(displayValues)) {
      return null;
    }

    const payload = displayValues as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(payload, "formValues")) {
      return null;
    }
    if (
      !Object.prototype.hasOwnProperty.call(payload, "mutationRequest") &&
      !Object.prototype.hasOwnProperty.call(payload, "mutationRequestError")
    ) {
      return null;
    }

    return {
      formValues: payload.formValues,
      mutationRequest:
        payload.mutationRequest ?? {
          error: payload.mutationRequestError ?? "Unavailable",
        },
      mutationRequestHints: isPlainRecord(payload.mutationRequestHints)
        ? (payload.mutationRequestHints as MutationRequestHints)
        : null,
    };
  }, [displayValues]);

  const [debugTab, setDebugTab] = React.useState<"formValues" | "mutationRequest">(
    "formValues",
  );
  const mutationRequestGraphiqlText = React.useMemo(
    () =>
      modelFormDebugPayload
        ? buildMutationRequestGraphiqlText(
            modelFormDebugPayload.mutationRequest,
            modelFormDebugPayload.mutationRequestHints,
          )
        : null,
    [modelFormDebugPayload],
  );
  const [copiedMutationRequest, setCopiedMutationRequest] = React.useState(false);

  React.useEffect(() => {
    if (!copiedMutationRequest) return;
    const timer = window.setTimeout(() => {
      setCopiedMutationRequest(false);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [copiedMutationRequest]);

  const handleCopyMutationRequest = React.useCallback(async () => {
    if (!mutationRequestGraphiqlText) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(mutationRequestGraphiqlText);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = mutationRequestGraphiqlText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedMutationRequest(true);
    } catch {
      setCopiedMutationRequest(false);
    }
  }, [mutationRequestGraphiqlText]);

  const diagnostics = React.useMemo(() => {
    if (!config.showDiagnostics) return null;
    const entries = Object.entries(fieldMeta as Record<string, any>);
    const hasServerErrors = entries.some(([, meta]) =>
      Boolean((meta as any)?.errorMap?.onSubmit),
    );
    const hasUserInteraction = entries.some(([, meta]) =>
      Boolean(meta?.isBlurred || meta?.isDirty),
    );
    const shouldSurface = hasServerErrors || hasUserInteraction;
    if (!shouldSurface) return null;

    const invalid = entries
      .filter(
        ([, meta]) =>
          meta &&
          meta.isValid === false &&
          (meta.isBlurred ||
            meta.isDirty ||
            (meta as any)?.errorMap?.onSubmit),
      )
      .map(([name, meta]) => ({
        name,
        errors: (meta as any)?.errors ?? [],
      }));

    const reasons: string[] = [];
    if (shouldSurface && !canSubmit) reasons.push("formulaire invalide ou non modifié");
    if (isSubmitting) reasons.push("formulaire en cours de soumission");
    if (isLoading) reasons.push("indicateur de chargement externe");

    return { reasons, invalid };
  }, [fieldMeta, canSubmit, isSubmitting, isLoading, config.showDiagnostics]);

  return (
    <Card className="p-4 space-y-2">
      {modelFormDebugPayload ? (
        <Tabs
          value={debugTab}
          onValueChange={(value) =>
            setDebugTab(value === "mutationRequest" ? "mutationRequest" : "formValues")
          }
          className="space-y-2"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formValues">formValues</TabsTrigger>
            <TabsTrigger value="mutationRequest">mutationRequest</TabsTrigger>
          </TabsList>
          <TabsContent value="formValues">
            {debugTab === "formValues" ? (
              <pre className="text-xs">
                {JSON.stringify(modelFormDebugPayload.formValues, null, 2)}
              </pre>
            ) : null}
          </TabsContent>
          <TabsContent value="mutationRequest" forceMount>
            {debugTab === "mutationRequest" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid="debug-copy-mutation-request"
                    onClick={handleCopyMutationRequest}
                  >
                    {copiedMutationRequest ? "Copié" : "Copier"}
                  </Button>
                </div>
                <pre
                  data-testid="debug-mutation-request-graphiql"
                  className="text-xs"
                >
                  {mutationRequestGraphiqlText}
                </pre>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      ) : (
        <pre className="text-xs">
          {JSON.stringify(displayValues, null, 2)}
        </pre>
      )}
      {config.showFieldMeta ? (
        <pre className="text-[11px] text-muted-foreground">
          {JSON.stringify(fieldMeta, null, 2)}
        </pre>
      ) : null}
      <pre className="text-[11px] text-muted-foreground">
        {JSON.stringify(changeLog.slice(-5), null, 2)}
      </pre>
      {diagnostics && diagnostics.reasons.length ? (
        <div className="text-xs text-destructive space-y-1">
          <p>Soumission bloquée : {diagnostics.reasons.join(", ")}</p>
          {diagnostics.invalid.length ? (
            <div>
              <p>Champs invalides :</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {diagnostics.invalid.map(({ name, errors }) => (
                  <li key={name}>
                    {name}
                    {errors?.length ? ` (${errors.join(", ")})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
};
