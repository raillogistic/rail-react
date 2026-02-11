import React from "react";
import { useApolloClient } from "@apollo/client";
import { useStore } from "@tanstack/react-form";
import type { UseFormReturn } from "@tanstack/react-form";
import { parse, type DocumentNode } from "graphql";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import {
  FieldWrapper,
  resolveFieldErrors,
  resolveRequiredError,
} from "./common";
import { cn } from "@/lib/utils";
import { useModelPermissions } from "@/lib/auth/hooks/useModelPermissions";
import type {
  FieldComponentProps,
  QueryChoiceFieldConfig,
  ChoiceOption,
  QueryChoiceGraphQLConfig,
  QueryChoiceVariableBuilderContext,
  QueryChoiceRecordContext,
  QueryChoiceInlineCreateConfig,
} from "./types";

type Props = FieldComponentProps<QueryChoiceFieldConfig>;

const LazyModelForm: React.FC<Record<string, any>> = () => null;

const QueryChoiceInput: React.FC<Props> = ({ config, field, form }) => {
  const meta = field.state.meta;
  const dirty = meta.isDirty;
  const submitCount = useStore(
    form.store,
    (state) =>
      (state as any).submissionAttempts ?? (state as any).submitCount ?? 0,
  );
  const isSubmitted = submitCount > 0;
  const showError =
    dirty || meta.isBlurred || isSubmitted || Boolean(meta.errorMap?.onSubmit);
  const fieldErrors = resolveFieldErrors(meta, showError);
  const error =
    fieldErrors ?? resolveRequiredError(config, field.state.value, showError);
  const graphqlConfig = React.useMemo<
    QueryChoiceGraphQLConfig | undefined
  >(() => {
    if (config.graphql) {
      return {
        relatedModel: config.graphql.relatedModel ?? config.relatedModel,
        ...config.graphql,
      };
    }
    if (config.relatedModel) {
      return { relatedModel: config.relatedModel };
    }
    return undefined;
  }, [config.graphql, config.relatedModel]);

  const recipe = React.useMemo(
    () => buildGraphQLRecipe(graphqlConfig),
    [graphqlConfig],
  );

  const inlineCreateConfig = React.useMemo(
    () => config.inlineCreate ?? null,
    [config.inlineCreate],
  );

  const relatedModelForInline =
    graphqlConfig?.relatedModel ?? config.relatedModel ?? null;

  const inlineModelInfo = React.useMemo(
    () =>
      resolveInlineModelInfo({
        rawRelatedModel: relatedModelForInline,
        overrideApp: inlineCreateConfig?.appName,
        overrideModel: inlineCreateConfig?.modelName,
        overridePermissionModel: inlineCreateConfig?.permissionModelName,
      }),
    [
      inlineCreateConfig?.appName,
      inlineCreateConfig?.modelName,
      inlineCreateConfig?.permissionModelName,
      relatedModelForInline,
    ],
  );

  const inlineCreationEnabled = inlineCreateConfig?.enabled ?? true;
  const formMeta = (form?.options as any)?.meta as
    | { appName?: string; modelName?: string }
    | undefined;
  const inlineAppName = inlineModelInfo.appName ?? formMeta?.appName ?? null;
  const inlineModelNameRaw = inlineModelInfo.modelName ?? null;
  const inlineModelName = normalizeInlineModelName(inlineModelNameRaw);
  const permissionTarget =
    inlineCreateConfig?.permissionModelName ??
    (inlineAppName && inlineModelName
      ? `${inlineAppName}.${inlineModelName}`
      : (inlineModelInfo.permissionModelName ?? inlineModelName));
  const inlinePermissions = useModelPermissions(permissionTarget ?? "", {
    skip: !inlineCreationEnabled || !permissionTarget,
  });

  const prefilledOptions = React.useMemo<ChoiceOption[]>(() => {
    const raw = field.state.value;
    if (Array.isArray(raw)) {
      return raw
        .map((entry) => extractPrefilledOption(entry))
        .filter((option): option is ChoiceOption => Boolean(option));
    }
    const single = extractPrefilledOption(raw);
    return single ? [single] : [];
  }, [field.state.value]);

  const selectedValues = React.useMemo<Array<string | number>>(() => {
    if (Array.isArray(field.state.value)) {
      return field.state.value
        .map((entry) => coerceValue(entry))
        .filter(
          (entry): entry is string | number =>
            entry !== null && entry !== undefined,
        );
    }
    const single = coerceValue(field.state.value);
    return single === null || single === undefined ? [] : [single];
  }, [field.state.value]);

  const client = useApolloClient();
  const [options, setOptions] =
    React.useState<ChoiceOption[]>(prefilledOptions);
  const [loading, setLoading] = React.useState(false);
  const [inlineFormOpen, setInlineFormOpen] = React.useState(false);
  const inlineFormRef = React.useRef<UseFormReturn<Record<string, any>> | null>(
    null,
  );
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState<number>(-1);
  const formValuesRef = React.useRef(form.state.values);
  const requestRef = React.useRef(0);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const optionsListRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    formValuesRef.current = form.state.values;
  }, [form.state.values]);

  React.useEffect(() => {
    if (!prefilledOptions.length) return;
    setOptions((prev) => mergeChoiceOptions(prefilledOptions, prev));
  }, [prefilledOptions]);

  const fieldRef = React.useRef(field);
  const formRef = React.useRef(form);

  React.useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  const searchVariableName =
    graphqlConfig?.searchVariableName ?? recipe.searchVariableName;
  const limitVariableName =
    graphqlConfig?.limitVariableName ?? recipe.limitVariableName;
  const limitDefault = graphqlConfig?.limit ?? recipe.limitDefault ?? 100;
  const includeVariableName =
    graphqlConfig?.includeVariableName ?? recipe.includeVariableName;

  const resultPath = graphqlConfig?.resultPath ?? recipe.resultPath;
  const valueKey = graphqlConfig?.valueKey ?? recipe.valueKey;
  const labelKey = graphqlConfig?.labelKey ?? recipe.labelKey;
  const descriptionKey = graphqlConfig?.descriptionKey ?? recipe.descriptionKey;

  const buildVariables = React.useCallback(
    (term: string) => {
      const ctx: QueryChoiceVariableBuilderContext = {
        search: term,
        values: formValuesRef.current,
        form: formRef.current,
        field: fieldRef.current,
      };
      const dynamicVariables =
        typeof graphqlConfig?.variables === "function"
          ? graphqlConfig.variables(ctx)
          : (graphqlConfig?.variables ?? {});
      const variables = {
        ...(graphqlConfig?.initialVariables ?? {}),
        ...dynamicVariables,
      };
      if (searchVariableName) {
        variables[searchVariableName] = term;
      }
      if (
        limitVariableName &&
        variables[limitVariableName] === undefined &&
        typeof limitDefault !== "undefined"
      ) {
        variables[limitVariableName] = limitDefault;
      }
      if (includeVariableName && variables[includeVariableName] === undefined) {
        const includeValues = selectedValues.filter(
          (value) => value !== undefined && value !== null,
        );
        if (includeValues.length > 0) {
          variables[includeVariableName] = includeValues;
        }
      }
      return variables;
    },
    [
      graphqlConfig,
      includeVariableName,
      limitDefault,
      limitVariableName,
      searchVariableName,
      selectedValues,
    ],
  );

  const mapRecordsToOptions = React.useCallback(
    (
      records: Record<string, any>[],
      data: Record<string, any>,
      term: string,
    ) => {
      const ctx: QueryChoiceRecordContext = {
        field: fieldRef.current,
        form: formRef.current,
        search: term,
      };
      if (graphqlConfig?.mapResult) {
        return graphqlConfig.mapResult(records, data, ctx);
      }
      const mapped = records
        .map((record) => {
          if (graphqlConfig?.mapRecord) {
            return graphqlConfig.mapRecord(record, ctx);
          }
          return defaultMapRecord(record, valueKey, labelKey, descriptionKey);
        })
        .filter((option): option is ChoiceOption => Boolean(option));
      return mapped;
    },
    [descriptionKey, graphqlConfig, labelKey, valueKey],
  );

  const load = React.useCallback(
    async (term: string) => {
      setLoading(true);
      const requestId = ++requestRef.current;
      try {
        let next: ChoiceOption[] = [];
        if (config.loadOptions) {
          next = await config.loadOptions(term, {
            values: formValuesRef.current,
          });
        } else if (client && recipe.document) {
          const response = await client.query({
            query: recipe.document,
            variables: buildVariables(term),
            fetchPolicy: graphqlConfig?.fetchPolicy ?? "network-only",
          });
          const records = resolveRecords(response.data, resultPath);
          next = mapRecordsToOptions(records, response.data, term);
          graphqlConfig?.onQueryResult?.(
            { data: response.data, records, options: next },
            { field: fieldRef.current, form: formRef.current, search: term },
          );
        } else {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.warn(
              "[QueryChoiceInput] No loadOptions or GraphQL configuration provided.",
            );
          }
        }
        if (requestRef.current === requestId) {
          setOptions((prev) => mergeChoiceOptions(prev, next));
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("[QueryChoiceInput] Failed to fetch options", err);
        }
        if (requestRef.current === requestId) {
          setOptions(prefilledOptions);
        }
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [
      buildVariables,
      client,
      config,
      graphqlConfig,
      mapRecordsToOptions,
      prefilledOptions,
      recipe.document,
      resultPath,
    ],
  );

  const debounceMs =
    config.debounceMs ??
    graphqlConfig?.debounceMs ??
    (graphqlConfig ? 250 : undefined);

  const scheduleLoad = React.useCallback(
    (term: string) => {
      if (!debounceMs) {
        void load(term);
        return;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void load(term);
      }, debounceMs);
    },
    [debounceMs, load],
  );

  React.useEffect(() => {
    scheduleLoad("");
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [scheduleLoad]);

  const handleInlineCreated = React.useCallback(
    (payload: any) => {
      const { option, value } = resolveCreatedOption(
        payload,
        inlineCreateConfig?.mapCreatedOption,
        { valueKey, labelKey, descriptionKey },
      );
      if (value === null || value === undefined) {
        return;
      }
      const normalizedOption = option ?? {
        value,
        label: option?.label ?? String(value),
      };
      if (normalizedOption) {
        setOptions((prev) => mergeChoiceOptions(prev, [normalizedOption]));
      }
      const nextValue = config.multiple
        ? Array.from(new Set([...selectedValues, value]))
        : value;
      field.handleChange(nextValue as any);
      void load("");
    },
    [
      config.multiple,
      descriptionKey,
      field,
      inlineCreateConfig?.mapCreatedOption,
      labelKey,
      load,
      selectedValues,
      valueKey,
    ],
  );

  const toggle = (value: ChoiceOption["value"]) => {
    if (config.multiple) {
      const exists = selectedValues.includes(value);
      const next = exists
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      field.handleChange(next);
      return;
    }
    field.handleChange(value);
  };

  React.useEffect(() => {
    setHighlightedIndex((current) => {
      if (!options.length) {
        return -1;
      }
      if (
        current >= 0 &&
        current < options.length &&
        !options[current]?.disabled
      ) {
        return current;
      }
      return findNextEnabledIndex(options, -1, 1);
    });
  }, [options]);

  React.useEffect(() => {
    if (highlightedIndex < 0) return;
    const container = optionsListRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-option-index="${highlightedIndex}"]`,
    );
    target?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setHighlightedIndex((current) =>
        findNextEnabledIndex(options, current, direction),
      );
      return;
    }
    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option && !option.disabled) {
        toggle(option.value);
      }
    }
  };

  const inlineFormProps = React.useMemo(() => {
    const rawOverrides = (inlineCreateConfig?.formProps ?? {}) as Record<
      string,
      any
    >;
    const {
      appName: _appName,
      modelName: _modelName,
      onCompleted: userOnCompleted,
      showSectionHeaders,
      ...restOverrides
    } = rawOverrides;
    return {
      ...restOverrides,
      appName: inlineAppName ?? undefined,
      modelName: inlineModelName ?? undefined,
      mutationMode: "create",
      showSectionHeaders: showSectionHeaders ?? false,
      layout: {
        ...(restOverrides.layout ?? {}),
        card: false,
      },
      inPopup: true,
      onFormReady: (readyForm: UseFormReturn<Record<string, any>>) => {
        inlineFormRef.current = readyForm;
        if (typeof rawOverrides.onFormReady === "function") {
          rawOverrides.onFormReady(readyForm);
        }
      },
      onCompleted: (payload: any) => {
        if (payload?.ok === false) {
          const errors = payload?.errors ?? [];
          if (Array.isArray(errors) && inlineFormRef.current) {
            errors.forEach((error: any) => {
              if (!error?.field) return;
              inlineFormRef.current?.setFieldMeta(error.field, (prev) => ({
                ...prev,
                isTouched: true,
                isValid: false,
                errors: [error.message].filter(Boolean),
                errorMap: {
                  ...(prev?.errorMap ?? {}),
                  onSubmit: error.message,
                },
              }));
            });
          }
          setInlineFormOpen(true);
          return;
        }
        if (typeof userOnCompleted === "function") {
          userOnCompleted(payload);
        }
        handleInlineCreated(payload);
        setInlineFormOpen(false);
      },
    };
  }, [
    handleInlineCreated,
    inlineAppName,
    inlineModelName,
    inlineCreateConfig?.formProps,
  ]);

  const inlineDialogTitle =
    inlineCreateConfig?.title ??
    inlineModelName ??
    config.label ??
    "Create record";

  const inlineButtonVisible = false;
  const canOpenInlineForm = false;
  const inlineButtonDisabled = true;

  React.useEffect(() => {
    if (inlineFormOpen && !canOpenInlineForm) {
      setInlineFormOpen(false);
    }
  }, [canOpenInlineForm, inlineFormOpen]);

  const selectedLabel = React.useMemo(() => {
    if (!config.multiple && selectedValues.length === 1) {
      const choice = options.find((opt) => opt.value === selectedValues[0]);
      if (choice) {
        if (choice.description) {
          return `${choice.label} — ${choice.description}`;
        }
        return choice.label;
      }
      return config.placeholder ?? "Sélectionner";
    }
    if (selectedValues.length > 0) {
      const resolved = options.filter((opt) =>
        selectedValues.includes(opt.value),
      );
      if (resolved.length > 0) {
        return resolved
          .map((opt) =>
            opt.description ? `${opt.label} — ${opt.description}` : opt.label,
          )
          .join(", ");
      }
      return `${selectedValues.length} sélectionné${
        selectedValues.length > 1 ? "s" : ""
      }`;
    }
    return config.placeholder ?? "Sélectionner";
  }, [config.multiple, config.placeholder, options, selectedValues]);

  const tooltipLabel = selectedValues.length > 0 ? selectedLabel : undefined;
  const inlineTriggerLabel = inlineCreateConfig?.title ?? "Add";

  return (
    <FieldWrapper config={config} error={error} dirty={dirty}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                data-slot="button"
              >
                <span className="truncate" title={tooltipLabel}>
                  {selectedLabel}
                </span>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 space-y-2 p-2">
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(event) => {
                  const term = event.target.value;
                  setSearch(term);
                  scheduleLoad(term);
                }}
                autoFocus
                onKeyDown={handleKeyDown}
              />
              <div
                className="max-h-60 overflow-y-auto space-y-1"
                ref={optionsListRef}
              >
                {options.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-3">
                    Aucun résultat
                  </p>
                ) : (
                  options.map((option, index) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      className={cn(
                        "items-start rounded-md py-2 pl-8 pr-2 text-left",
                        option.description ? "gap-1" : null,
                        index === highlightedIndex ? "bg-muted" : null,
                      )}
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={() => toggle(option.value)}
                      disabled={option.disabled}
                      title={String(option.value)}
                      data-option-index={index}
                      aria-selected={index === highlightedIndex}
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-medium">
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        ) : null}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {inlineButtonVisible ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-1 h-10 w-10"
            aria-label={inlineTriggerLabel}
            onClick={() => setInlineFormOpen(true)}
            data-slot="button"
            disabled={inlineButtonDisabled}
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <Dialog open={inlineFormOpen} onOpenChange={setInlineFormOpen}>
        <DialogContent className="max-w-3xl">
          <div className="max-h-[70vh] overflow-y-auto">
            <React.Suspense
              fallback={
                <p className="text-sm text-muted-foreground">Loading form...</p>
              }
            >
              {inlineFormOpen && canOpenInlineForm ? (
                <LazyModelForm
                  {...inlineFormProps}
                  onError={() => setInlineFormOpen(true)}
                />
              ) : null}
            </React.Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </FieldWrapper>
  );
};

export default QueryChoiceInput;
export { buildGraphQLRecipe, resolveRecords, defaultMapRecord };

type InlineModelInfo = {
  appName: string | null;
  modelName: string | null;
  permissionModelName: string | null;
  fullName: string | null;
};

function resolveInlineModelInfo(options: {
  rawRelatedModel?: string | null;
  overrideApp?: string | null;
  overrideModel?: string | null;
  overridePermissionModel?: string | null;
}): InlineModelInfo {
  const {
    rawRelatedModel,
    overrideApp,
    overrideModel,
    overridePermissionModel,
  } = options;
  const cleaned = rawRelatedModel?.trim() ?? null;
  const derivedAppModel =
    cleaned && cleaned.includes(".")
      ? (() => {
          const parts = cleaned.split(".");
          const modelName = parts.pop() ?? null;
          const appName = parts.join(".") || null;
          return { appName, modelName };
        })()
      : { appName: null, modelName: cleaned };

  const appName = overrideApp ?? derivedAppModel.appName;
  const modelName = overrideModel ?? derivedAppModel.modelName;

  let permissionModelName = overridePermissionModel ?? rawRelatedModel ?? null;

  if (!appName && permissionModelName && permissionModelName.includes(".")) {
    const parts = permissionModelName.split(".");
    const last = parts.pop();
    const prefix = parts.join(".") || null;
    if (prefix) {
      permissionModelName = `${prefix}.${last ?? ""}`;
    }
  }

  const fullName =
    appName && modelName ? `${appName}.${modelName}` : (modelName ?? null);
  permissionModelName = permissionModelName ?? fullName;

  return {
    appName,
    modelName,
    permissionModelName,
    fullName,
  };
}

function resolveCreatedOption(
  payload: any,
  mapper: QueryChoiceInlineCreateConfig["mapCreatedOption"],
  keys: { valueKey?: string; labelKey?: string; descriptionKey?: string },
): { option: ChoiceOption | null; value: string | number | null } {
  const createdRecord =
    (payload?.object as Record<string, any> | undefined | null) ?? null;
  const mapped =
    (typeof mapper === "function" ? mapper(payload, keys) : null) ??
    (createdRecord
      ? defaultMapRecord(
          createdRecord,
          keys.valueKey,
          keys.labelKey,
          keys.descriptionKey,
        )
      : null);

  const value =
    mapped?.value ?? coerceValue(createdRecord) ?? coerceValue(payload);

  const option =
    mapped ??
    (value !== null && value !== undefined
      ? {
          value,
          label:
            (createdRecord?.desc as string | undefined) ??
            (createdRecord?.name as string | undefined) ??
            (createdRecord?.label as string | undefined) ??
            String(value),
          description:
            createdRecord?.description !== undefined
              ? String(createdRecord.description)
              : undefined,
        }
      : null);

  return {
    option: option ?? null,
    value: value ?? null,
  };
}

function normalizeInlineModelName(modelName: string | null): string | null {
  if (!modelName) return null;
  const hasUpper = /[A-Z]/.test(modelName);
  const hasSeparator = /[_\s-]/.test(modelName);
  if (hasUpper && !hasSeparator) {
    return modelName;
  }
  return toPascalCase(modelName);
}

function findNextEnabledIndex(
  options: ChoiceOption[],
  startIndex: number,
  direction: 1 | -1,
): number {
  if (!options.length) {
    return -1;
  }
  let index = startIndex;
  for (let iteration = 0; iteration < options.length; iteration += 1) {
    index += direction;
    if (index < 0) {
      index = options.length - 1;
    } else if (index >= options.length) {
      index = 0;
    }
    if (!options[index]?.disabled) {
      return index;
    }
  }
  return -1;
}

function coerceValue(entry: unknown): string | number | null {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === "string" || typeof entry === "number") {
    return entry;
  }
  if (typeof entry === "object") {
    const record = entry as Record<string, unknown>;
    const candidate =
      record.value ?? record.id ?? record.pk ?? record.uuid ?? null;
    if (typeof candidate === "string" || typeof candidate === "number") {
      return candidate;
    }
  }
  return null;
}

function extractPrefilledOption(entry: unknown): ChoiceOption | null {
  if (!entry || typeof entry !== "object") return null;
  const value = coerceValue(entry);
  if (value === null || value === undefined) return null;
  const record = entry as Record<string, unknown>;
  const label =
    record.label ?? record.desc ?? record.name ?? record.title ?? record.code;
  const description =
    record.description ?? record.subtitle ?? record.reference ?? null;
  const option: ChoiceOption = {
    value,
    label: label ? String(label) : String(value),
  };
  if (description) {
    option.description = String(description);
  }
  return option;
}

function mergeChoiceOptions(
  base: ChoiceOption[],
  addition: ChoiceOption[],
): ChoiceOption[] {
  if (!addition.length) return base;
  const map = new Map<ChoiceOption["value"], ChoiceOption>();
  base.forEach((option) => {
    map.set(option.value, option);
  });
  addition.forEach((option) => {
    map.set(option.value, option);
  });
  return Array.from(map.values());
}

type GraphQLRecipe = {
  document: DocumentNode | null;
  resultPath?: string;
  searchVariableName?: string | null;
  limitVariableName?: string | null;
  limitDefault?: number;
  includeVariableName?: string | null;
  valueKey?: string;
  labelKey?: string;
  descriptionKey?: string;
};

function buildGraphQLRecipe(config?: QueryChoiceGraphQLConfig): GraphQLRecipe {
  if (!config) {
    return { document: null };
  }
  if (config.queryDocument) {
    return {
      document: ensureDocumentNode(config.queryDocument),
      resultPath: config.resultPath,
      searchVariableName: config.searchVariableName ?? null,
      limitVariableName: config.limitVariableName ?? null,
      limitDefault: config.limit ?? 100,
      includeVariableName: config.includeVariableName ?? null,
      valueKey: config.valueKey,
      labelKey: config.labelKey,
      descriptionKey: config.descriptionKey,
    };
  }
  const normalizedRelatedModel = config.relatedModel
    ? toModelToken(config.relatedModel.split(".").pop() ?? "")
    : undefined;

  if (!normalizedRelatedModel) {
    return { document: null };
  }
  const listField = resolveListFieldName(
    config.listFieldName,
    normalizedRelatedModel,
  );
  const searchVariableName =
    config.searchVariableName === undefined
      ? "quick"
      : config.searchVariableName;
  const searchVariableType = config.searchVariableType ?? "String";
  const limitVariableName =
    config.limitVariableName === undefined ? "limit" : config.limitVariableName;
  const limitDefault = config.limit ?? 100;
  const includeVariableName =
    config.includeVariableName === undefined
      ? "include"
      : config.includeVariableName;
  const includeVariableType = config.includeVariableType ?? "[ID!]";

  const selections = dedupeStrings(
    [
      config.valueField ?? "id: pk",
      config.labelField ?? "desc",
      config.descriptionField,
      ...(config.extraFields ?? []),
    ].filter(Boolean) as string[],
  );
  if (selections.length === 0) {
    selections.push("id: pk");
  }

  const variableDefinitions: string[] = [];
  const fieldArguments: string[] = [];

  if (searchVariableName) {
    variableDefinitions.push(`$${searchVariableName}: ${searchVariableType}`);
    fieldArguments.push(`${searchVariableName}: $${searchVariableName}`);
  }
  if (limitVariableName) {
    variableDefinitions.push(`$${limitVariableName}: Int`);
    fieldArguments.push(`${limitVariableName}: $${limitVariableName}`);
  }
  if (includeVariableName) {
    variableDefinitions.push(`$${includeVariableName}: ${includeVariableType}`);
    fieldArguments.push(`${includeVariableName}: $${includeVariableName}`);
  }

  const staticArgsEntries = Object.entries(config.staticArgs ?? {});
  staticArgsEntries.forEach(([name, value]) => {
    fieldArguments.push(`${name}: ${formatGraphQLLiteral(value)}`);
  });

  const queryName = config.queryName ?? `${toPascalCase(listField)}QuickQuery`;

  const querySource = `
    query ${queryName}${
      variableDefinitions.length ? `(${variableDefinitions.join(", ")})` : ""
    } {
      ${listField}${
        fieldArguments.length ? `(${fieldArguments.join(", ")})` : ""
      } {
${selections.map((line) => `        ${line}`).join("\n")}
      }
    }
  `;

  return {
    document: parse(querySource),
    resultPath: config.resultPath ?? listField,
    searchVariableName,
    limitVariableName,
    limitDefault,
    includeVariableName,
    valueKey: config.valueKey ?? inferPropName(config.valueField ?? "id"),
    labelKey: config.labelKey ?? inferPropName(config.labelField ?? "desc"),
    descriptionKey:
      config.descriptionKey ?? inferPropName(config.descriptionField ?? ""),
  };
}

function ensureDocumentNode(input: DocumentNode | string): DocumentNode {
  return typeof input === "string" ? parse(input) : input;
}

function resolveRecords(
  data: Record<string, any> | undefined,
  path?: string,
): Record<string, any>[] {
  if (!data) return [];
  if (!path) {
    const first = Object.values(data)[0];
    return Array.isArray(first) ? (first as Record<string, any>[]) : [];
  }
  const value = path
    .split(".")
    .reduce<Record<string, any> | any>((acc, segment) => {
      if (acc === undefined || acc === null) return acc;
      return acc[segment];
    }, data);
  return Array.isArray(value) ? (value as Record<string, any>[]) : [];
}

function defaultMapRecord(
  record: Record<string, any>,
  valueKey?: string,
  labelKey?: string,
  descriptionKey?: string,
): ChoiceOption | null {
  const value =
    getValue(record, valueKey) ??
    getValue(record, "id") ??
    getValue(record, "pk");
  if (value === undefined || value === null) return null;
  const label =
    getValue(record, labelKey) ??
    getValue(record, "label") ??
    getValue(record, "name") ??
    getValue(record, "desc") ??
    String(value);
  const option: ChoiceOption = {
    value,
    label: String(label),
  };
  const description =
    getValue(record, descriptionKey) ?? getValue(record, "description");
  if (description !== undefined && description !== null) {
    option.description = String(description);
  }
  return option;
}

function getValue(record: Record<string, any>, key?: string) {
  if (!key) return undefined;
  return key.split(".").reduce<any>((acc, segment) => {
    if (acc === undefined || acc === null) return acc;
    return acc[segment];
  }, record);
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const canonical = value.trim();
    if (!canonical || seen.has(canonical)) return false;
    seen.add(canonical);
    return true;
  });
}

function inferPropName(selection: string): string | undefined {
  if (!selection) return undefined;
  if (selection.includes(":")) {
    return selection.split(":")[0]?.trim();
  }
  const clean = selection.trim().split(/\s|\(/)[0];
  return clean || undefined;
}

function toModelToken(value: string) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  const pascal = normalized
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join("");
  if (!pascal) return "";
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function resolveListFieldName(
  providedListFieldName: string | undefined,
  normalizedRelatedModel: string,
) {
  const defaultListField = `${normalizedRelatedModel}List`;
  if (!providedListFieldName) {
    return defaultListField;
  }

  const trimmed = providedListFieldName.trim();
  if (!trimmed) {
    return defaultListField;
  }

  // New schema convention: list root fields are "{modelName}List".
  // Keep explicit names only when they already follow that convention.
  if (trimmed.endsWith("List")) {
    return trimmed;
  }

  return defaultListField;
}

function toPascalCase(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

function formatGraphQLLiteral(value: string | number | boolean) {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return String(value);
}
