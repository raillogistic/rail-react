import * as React from "react";
import type { ModelFormProps } from "../types";
import { ModelFormProvider } from "../context/ModelFormContext";
import { useModelFormController } from "../hooks/useModelFormController";
import { ModelFormShell } from "./ModelFormShell";
import { ModelAccessContext, useModelAccess } from "@/lib/security/modelAccess";

export function ModelFormRoot<
  TFormValues extends Record<string, any> = Record<string, any>
>(props: ModelFormProps<TFormValues> & { children?: React.ReactNode }) {
  const { children, appName, modelName, ...rest } = props;
  const contextValue = useModelFormController({
    ...(rest as ModelFormProps<TFormValues>),
    appName,
    modelName,
  });

  const resolvedAppName = appName ?? contextValue.metadata?.app ?? "";
  const resolvedModelName = modelName ?? contextValue.metadata?.model ?? "";
  const modelAccess = useModelAccess({
    appName: resolvedAppName,
    modelName: resolvedModelName,
    formMetaOverride: contextValue.metadata,
    loadTableMetadata: false,
    loadFormMetadata: !contextValue.metadata,
  });

  return (
    <ModelAccessContext.Provider value={modelAccess}>
      <ModelFormProvider value={contextValue}>
        {children ?? <ModelFormShell />}
      </ModelFormProvider>
    </ModelAccessContext.Provider>
  );
}
