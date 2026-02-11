import React, { useMemo, useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import { useStore } from "@tanstack/react-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Label } from "@/lib/components/ui/label";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Switch } from "@/lib/components/ui/switch";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/lib/components/ui/alert";
import {
  Table,
  FileText,
  LayoutList,
  Info,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/components/ui/command";
import { Button } from "@/lib/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/lib/components/ui/select";
import { cn } from "@/lib/utils";
import { FieldRenderContext } from "@/lib/form/inputs/types";

const METADATA_QUERY = gql`
  query UIConfigMetadata($app_name: String!, $model_name: String!) {
    model_table: modelTable(appName: $app_name, modelName: $model_name) {
      verboseName
      fields {
        name
        title
        field_type: fieldType
        sortable
        filterable
      }
      filters {
        field_name: fieldName
        field_label: fieldLabel
      }
    }
  }
`;

const AVAILABLE_MODELS_QUERY = gql`
  query AvailableModels {
    available_models: availableModels {
      app_label: appLabel
      model_name: modelName
      verbose_name: verboseName
    }
  }
`;

type UIConfigState = {
  columnVisibility?: string[];
  columnOrder?: string[];
  filters?: string[];
  ordering?: string[];
  hiddenFields?: string[];
  readOnlyFields?: string[];
};

type FieldMetadata = {
  name: string;
  title: string;
  field_type: string;
  sortable: boolean;
  filterable: boolean;
};

type FilterMetadata = {
  field_name: string;
  field_label: string;
};

interface ModelPermission {
  model_name: string;
  verbose_name: string;
  can_update: boolean;
  can_create: boolean;
  can_delete: boolean;
}

interface UIConfigEditorProps extends FieldRenderContext {
  availableModels: ModelPermission[];
}

export function UIConfigEditor({
  field,
  form,
  availableModels: propAvailableModels,
}: UIConfigEditorProps) {
  const componentId = useStore(
    form.store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.values.component_id,
  );
  const targetModel = useStore(
    form.store,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state: any) => state.values.target_model,
  );
  const value = field.state.value as UIConfigState | undefined;

  const [open, setOpen] = useState(false);

  const { data: availableModelsData } = useQuery(AVAILABLE_MODELS_QUERY);
  const availableModels = useMemo(() => {
    if (propAvailableModels && propAvailableModels.length > 0) {
      return propAvailableModels;
    }
    if (availableModelsData?.available_models) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return availableModelsData.available_models.map((m: any) => ({
        model_name: `${m.app_label}.${m.model_name}`,
        verbose_name: m.verbose_name,
        can_update: true, // Default permissions if not provided
        can_create: true,
        can_delete: true,
      }));
    }
    return [];
  }, [propAvailableModels, availableModelsData]);

  const availableApps = useMemo(() => {
    const apps = new Set<string>();
    availableModels.forEach((m: ModelPermission) => {
      const [app] = m.model_name.split(".");
      if (app) apps.add(app);
    });
    return Array.from(apps).sort();
  }, [availableModels]);

  const [selectedApp, setSelectedApp] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [componentType, setComponentType] = useState<string>("TABLE");

  // Initialize state from targetModel or componentId
  useEffect(() => {
    if (targetModel) {
      const [app] = targetModel.split(".");
      setSelectedApp(app);
      setSelectedModel(targetModel);
    } else if (componentId && typeof componentId === "string") {
      const parts = componentId.split(":");
      if (parts.length === 3) {
        setComponentType(parts[0].toUpperCase());
        const app = parts[1];
        const modelKey = `${parts[1]}.${parts[2]}`;
        setSelectedApp(app);
        setSelectedModel(modelKey);
      }
    }
  }, [componentId, targetModel]);

  // Update component_id and target_model when selection changes
  useEffect(() => {
    if (selectedModel && componentType) {
      const [app, model] = selectedModel.split(".");
      if (app && model) {
        const newId = `${componentType.toLowerCase()}:${app}:${model}`;
        if (newId !== componentId) {
          form.setFieldValue("component_id", newId);
          form.setFieldValue("component_type", componentType);
          form.setFieldValue("target_model", selectedModel);
        }
      }
    }
  }, [selectedModel, componentType, form, componentId]);

  const { appName, modelName, isValid } = useMemo(() => {
    if (!selectedModel) return { appName: "", modelName: "", isValid: false };
    const parts = selectedModel.split(".");
    if (parts.length !== 2)
      return { appName: "", modelName: "", isValid: false };
    return { appName: parts[0], modelName: parts[1], isValid: true };
  }, [selectedModel]);

  const { data, loading, error } = useQuery(METADATA_QUERY, {
    variables: { app_name: appName, model_name: modelName },
    skip: !isValid,
  });

  const metadata = data?.model_table;
  const fields = (metadata?.fields || []) as FieldMetadata[];
  const filters = (metadata?.filters || []) as FilterMetadata[];

  // Initialize value if needed
  useEffect(() => {
    if (!value && isValid) {
      field.handleChange({});
    }
  }, [value, isValid, field]);

  const handleArrayToggle = (
    key: keyof UIConfigState,
    item: string,
    checked: boolean,
  ) => {
    const currentList = (value?.[key] as string[]) || [];
    let newList;
    if (checked) {
      if (!currentList.includes(item)) {
        newList = [...currentList, item];
      } else {
        newList = currentList;
      }
    } else {
      newList = currentList.filter((i) => i !== item);
    }
    field.handleChange({
      ...value,
      [key]: newList,
    });
  };

  const toggleAll = (
    key: keyof UIConfigState,
    items: string[],
    checked: boolean,
  ) => {
    field.handleChange({
      ...value,
      [key]: checked ? items : [],
    });
  };

  const handleOrderingToggle = (fieldName: string) => {
    const currentOrdering = (value?.ordering as string[]) || [];
    const existingIndex = currentOrdering.findIndex(
      (o) => o === fieldName || o === `-${fieldName}`,
    );

    const newOrdering = [...currentOrdering];
    if (existingIndex >= 0) {
      const current = currentOrdering[existingIndex];
      if (current.startsWith("-")) {
        // Was desc, remove it
        newOrdering.splice(existingIndex, 1);
      } else {
        // Was asc, make desc
        newOrdering[existingIndex] = `-${fieldName}`;
      }
    } else {
      // Add new as asc
      newOrdering.push(fieldName);
    }
    field.handleChange({ ...value, ordering: newOrdering });
  };

  const removeOrdering = (fieldName: string) => {
    const currentOrdering = (value?.ordering as string[]) || [];
    const newOrdering = currentOrdering.filter(
      (o) => o !== fieldName && o !== `-${fieldName}`,
    );
    field.handleChange({ ...value, ordering: newOrdering });
  };

  if (!availableModels || availableModels.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Aucun modèle disponible</AlertTitle>
        <AlertDescription>
          Vous n'avez pas les permissions nécessaires pour configurer des
          modèles.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredModels = selectedApp
    ? availableModels.filter((m: ModelPermission) =>
        m.model_name.startsWith(`${selectedApp}.`),
      )
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sélection du modèle</CardTitle>
          <CardDescription>
            Choisissez l'application, le modèle et le type de composant à
            configurer.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Application</Label>
            <Select
              value={selectedApp}
              onValueChange={(val) => {
                setSelectedApp(val);
                setSelectedModel("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une application" />
              </SelectTrigger>
              <SelectContent>
                {availableApps.map((app) => (
                  <SelectItem key={app} value={app}>
                    {app}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Modèle</Label>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  disabled={!selectedApp}
                  className="w-full justify-between"
                >
                  {selectedModel
                    ? availableModels.find(
                        (model) => model.model_name === selectedModel,
                      )?.verbose_name || selectedModel
                    : "Sélectionner un modèle..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput placeholder="Rechercher un modèle..." />
                  <CommandList>
                    <CommandEmpty>Aucun modèle trouvé.</CommandEmpty>
                    <CommandGroup>
                      {filteredModels.map((model) => (
                        <CommandItem
                          key={model.model_name}
                          value={model.model_name}
                          onSelect={(currentValue) => {
                            setSelectedModel(
                              currentValue === selectedModel
                                ? ""
                                : currentValue,
                            );
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedModel === model.model_name
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {model.verbose_name} ({model.model_name.split(".")[1]}
                          )
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Type de composant</Label>
            <Select value={componentType} onValueChange={setComponentType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TABLE">
                  <div className="flex items-center">
                    <Table className="mr-2 h-4 w-4" />
                    Tableau
                  </div>
                </SelectItem>
                <SelectItem value="FORM">
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Formulaire
                  </div>
                </SelectItem>
                <SelectItem value="DETAIL">
                  <div className="flex items-center">
                    <LayoutList className="mr-2 h-4 w-4" />
                    Détail
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isValid && (
        <>
          {loading && <div>Chargement des métadonnées...</div>}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                Impossible de charger les métadonnées : {error.message}
              </AlertDescription>
            </Alert>
          )}

          {metadata && componentType === "TABLE" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Colonnes visibles</CardTitle>

                  <CardDescription>
                    Sélectionnez les colonnes à afficher dans le tableau.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center space-x-2">
                    <Checkbox
                      checked={
                        value?.columnVisibility?.length === fields.length
                      }
                      onCheckedChange={(checked) =>
                        toggleAll(
                          "columnVisibility",
                          fields.map((f) => f.name),
                          checked as boolean,
                        )
                      }
                    />
                    <Label>Tout sélectionner</Label>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {fields.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`col-${f.name}`}
                            checked={value?.columnVisibility?.includes(f.name)}
                            onCheckedChange={(checked) =>
                              handleArrayToggle(
                                "columnVisibility",
                                f.name,
                                checked as boolean,
                              )
                            }
                          />
                          <Label htmlFor={`col-${f.name}`}>
                            {f.title} ({f.name})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Filtres disponibles</CardTitle>
                  <CardDescription>
                    Sélectionnez les filtres à activer pour ce tableau.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center space-x-2">
                    <Checkbox
                      checked={value?.filters?.length === filters.length}
                      onCheckedChange={(checked) =>
                        toggleAll(
                          "filters",
                          filters.map((f) => f.field_name),
                          checked as boolean,
                        )
                      }
                    />
                    <Label>Tout sélectionner</Label>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {filters.map((f) => (
                        <div
                          key={f.field_name}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`filter-${f.field_name}`}
                            checked={value?.filters?.includes(f.field_name)}
                            onCheckedChange={(checked) =>
                              handleArrayToggle(
                                "filters",
                                f.field_name,
                                checked as boolean,
                              )
                            }
                          />
                          <Label htmlFor={`filter-${f.field_name}`}>
                            {f.field_label} ({f.field_name})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Tri par défaut</CardTitle>
                  <CardDescription>
                    Définissez l'ordre de tri par défaut. Cliquez pour changer
                    la direction.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {fields
                      .filter((f) => f.sortable)
                      .map((f) => {
                        const orderState = value?.ordering?.find(
                          (o) => o === f.name || o === `-${f.name}`,
                        );
                        const isAsc = orderState === f.name;
                        const isDesc = orderState === `-${f.name}`;

                        return (
                          <Button
                            key={f.name}
                            variant={orderState ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleOrderingToggle(f.name)}
                            className="flex items-center gap-1"
                          >
                            {f.title}
                            {isAsc && <ArrowUp className="h-3 w-3" />}
                            {isDesc && <ArrowDown className="h-3 w-3" />}
                            {orderState && (
                              <X
                                className="ml-1 h-3 w-3 hover:text-red-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeOrdering(f.name);
                                }}
                              />
                            )}
                          </Button>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {metadata && componentType === "FORM" && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Champs cachés</CardTitle>
                  <CardDescription>
                    Sélectionnez les champs à masquer dans le formulaire.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {fields.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center space-x-2"
                        >
                          <Switch
                            id={`hidden-${f.name}`}
                            checked={value?.hiddenFields?.includes(f.name)}
                            onCheckedChange={(checked) =>
                              handleArrayToggle("hiddenFields", f.name, checked)
                            }
                          />
                          <Label htmlFor={`hidden-${f.name}`}>
                            {f.title} ({f.name})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Champs en lecture seule</CardTitle>
                  <CardDescription>
                    Sélectionnez les champs non modifiables.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {fields.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center space-x-2"
                        >
                          <Switch
                            id={`readonly-${f.name}`}
                            checked={value?.readOnlyFields?.includes(f.name)}
                            onCheckedChange={(checked) =>
                              handleArrayToggle(
                                "readOnlyFields",
                                f.name,
                                checked,
                              )
                            }
                          />
                          <Label htmlFor={`readonly-${f.name}`}>
                            {f.title} ({f.name})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
