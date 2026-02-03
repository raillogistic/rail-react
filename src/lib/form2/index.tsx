import { ModelFormRoot } from "./components/ModelFormRoot";
import {
  ModelFormShell,
  ModelFormHeader,
  ModelFormErrors,
  ModelFormBody,
  ModelFormLoading,
  ModelFormErrorState,
} from "./components/ModelFormShell";

export const ModelForm = Object.assign(ModelFormRoot, {
  Root: ModelFormRoot,
  Shell: ModelFormShell,
  Header: ModelFormHeader,
  Errors: ModelFormErrors,
  Body: ModelFormBody,
  Loading: ModelFormLoading,
  ErrorState: ModelFormErrorState,
});

export default ModelForm;

export * from "./types";
export * from "./hooks/useModelForm";
export * from "./hooks/useFormMetadata";
export * from "./context/ModelFormContext";
export * from "./components/ModelFormShell";
