import * as React from "react";
import { Button } from "@/lib/components/ui/button";
import { Card } from "@/lib/components/ui/card";
import { Skeleton } from "@/lib/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useModelFormContext } from "../context/ModelFormContext";
import type { ModelFormLayoutVariant } from "../types";
import DynamicForm from "../../form/inputs/form";
import AccordionSectionsForm from "../../form/complex/components/AccordionSectionsForm";
import MasterDetailPreviewForm from "../../form/complex/components/MasterDetailPreviewForm";

const DEFAULT_LOADING = (
  <Card className="space-y-3 p-4">
    <Skeleton className="h-5 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-32 w-full" />
  </Card>
);

const DEFAULT_ERROR_MESSAGE = "Unable to load the form.";

export function ModelFormLoading() {
  const { loadingMessage, containerClassName } = useModelFormContext();
  return (
    <div className={cn("space-y-4", containerClassName)}>
      {loadingMessage ?? DEFAULT_LOADING}
    </div>
  );
}

export function ModelFormErrorState() {
  const { error, errorMessage, containerClassName, refetchMetadata } =
    useModelFormContext();
  return (
    <div className={cn("space-y-4", containerClassName)}>
      <Card className="space-y-3 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        <p>{errorMessage ?? DEFAULT_ERROR_MESSAGE}</p>
        {error?.message ? (
          <p className="text-xs text-destructive/80">{error.message}</p>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void refetchMetadata();
          }}
        >
          Retry
        </Button>
      </Card>
    </div>
  );
}

export function ModelFormHeader() {
  const { headingTitle, description, showHeading } = useModelFormContext();
  if (!showHeading || (!headingTitle && !description)) {
    return null;
  }
  return (
    <div className="space-y-1">
      {headingTitle ? (
        <h2 className="text-lg font-semibold">{headingTitle}</h2>
      ) : null}
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function ModelFormErrors() {
  const { globalMutationErrors, resolveFieldLabel } = useModelFormContext();
  if (!globalMutationErrors.length) return null;
  return (
    <Card className="space-y-2 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      <p className="font-semibold">Server returned errors:</p>
      <ul className="list-disc space-y-1 pl-5">
        {globalMutationErrors.map((error, index) => (
          <li key={`${error.field ?? "form"}-${index}`}>
            {error.field ? (
              <span className="font-medium">
                {resolveFieldLabel?.(error.field) ?? error.field}: {" "}
              </span>
            ) : null}
            {error.message}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ModelFormBody() {
  const {
    schema,
    form,
    layoutVariant,
    formProps,
    headingTitle,
    metadata,
  } = useModelFormContext();

  if (!schema) return null;

  const variant = layoutVariant?.variant ?? "default";
  const formPropsForVariant =
    layoutVariant && "formProps" in layoutVariant
      ? { ...formProps, ...(layoutVariant.formProps ?? {}) }
      : formProps;
  const accordionFormProps =
    variant === "accordion"
      ? (() => {
          const { showSectionHeaders: _omit, ...rest } = formPropsForVariant;
          return { ...rest, showSectionHeaders: false };
        })()
      : formPropsForVariant;

  if (variant === "accordion" && schema.sections?.length) {
    const accordion = layoutVariant as Extract<
      ModelFormLayoutVariant<any>,
      { variant: "accordion" }
    >;
    return (
      <AccordionSectionsForm
        sections={schema.sections}
        form={form}
        title={accordion?.title ?? headingTitle ?? metadata?.verboseName}
        formProps={accordionFormProps}
      />
    );
  }

  if (
    variant === "master-detail" &&
    schema.sections?.length &&
    layoutVariant &&
    "renderPreview" in layoutVariant
  ) {
    const masterDetail = layoutVariant as Extract<
      ModelFormLayoutVariant<any>,
      { variant: "master-detail" }
    >;
    return (
      <MasterDetailPreviewForm
        schema={schema}
        form={form}
        title={masterDetail.title ?? headingTitle ?? metadata?.verboseName}
        className={masterDetail.className}
        detailsCardClassName={masterDetail.detailsCardClassName}
        previewCardClassName={masterDetail.previewCardClassName}
        renderToolbar={masterDetail.renderToolbar}
        renderPreview={masterDetail.renderPreview}
        formProps={formPropsForVariant}
      />
    );
  }

  return (
    <DynamicForm
      schema={schema}
      form={form}
      {...formPropsForVariant}
    />
  );
}

export function ModelFormShell() {
  const { loading, error, schema, containerClassName } = useModelFormContext();
  if (loading) {
    return <ModelFormLoading />;
  }
  if (error) {
    return <ModelFormErrorState />;
  }
  if (!schema) {
    return null;
  }
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 border border-border/60 p-4 py-8 shadow-sm",
        containerClassName
      )}
    >
      <ModelFormHeader />
      <ModelFormErrors />
      <div className="flex flex-1 overflow-hidden">
        <ModelFormBody />
      </div>
    </div>
  );
}
