import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, gql } from "@apollo/client";
import { UIConfigEditor } from "./UIConfigEditor";
import { Button } from "@/lib/components/ui/button";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { Label } from "@/lib/components/ui/label";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/lib/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/lib/components/ui/popover";
import { Badge } from "@/lib/components/ui/badge";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const USERS_AND_GROUPS_QUERY = gql`
  query UsersAndGroups {
    users {
      id
      username
    }
    groups {
      id
      name
    }
  }
`;

const CREATE_CONFIG_MUTATION = gql`
  mutation CreateUIComponentConfig($input: CreateUIComponentConfigInput!) {
    createUiComponentConfig: createUiComponentConfig(input: $input) {
      object {
        id
        component_id: componentId
        target_model: targetModel
        component_type: componentType
        configuration
        is_global: isGlobal
        users {
          id
          username
        }
        groups {
          id
          name
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

const UPDATE_CONFIG_MUTATION = gql`
  mutation UpdateUIComponentConfig(
    $id: ID!
    $input: UpdateUIComponentConfigInput!
  ) {
    updateUiComponentConfig: updateUiComponentConfig(id: $id, input: $input) {
      object {
        id
        component_id: componentId
        target_model: targetModel
        component_type: componentType
        configuration
        is_global: isGlobal
        users {
          id
          username
        }
        groups {
          id
          name
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

// Helper component for MultiSelect
function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  label,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
          >
            <div className="flex flex-wrap gap-1">
              {selected.length > 0 ? (
                selected.map((val) => (
                  <Badge key={val} variant="secondary" className="mr-1">
                    {options.find((opt) => opt.value === val)?.label || val}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(val);
                      }}
                    />
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput
              placeholder={`Rechercher ${label.toLowerCase()}...`}
            />
            <CommandList>
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label} // Use label for search
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface UIConfigFormProps {
  initialData?: any;
  onSuccess?: () => void;
  mode?: "create" | "update";
}

export function UIConfigForm({
  initialData,
  onSuccess,
  mode = "create",
}: UIConfigFormProps) {
  const { data: usersGroupsData } = useQuery(USERS_AND_GROUPS_QUERY);
  const [createConfig, { loading: creating }] = useMutation(
    CREATE_CONFIG_MUTATION
  );
  const [updateConfig, { loading: updating }] = useMutation(
    UPDATE_CONFIG_MUTATION
  );

  const usersOptions =
    usersGroupsData?.users?.map((u: any) => ({
      value: u.id,
      label: u.username,
    })) || [];

  const groupsOptions =
    usersGroupsData?.groups?.map((g: any) => ({
      value: g.id,
      label: g.name,
    })) || [];

  const form = useForm({
    defaultValues: {
      component_id: initialData?.component_id || "",
      target_model: initialData?.target_model || "",
      component_type: initialData?.component_type || "TABLE",
      configuration: initialData?.configuration || {},
      is_global: initialData?.is_global || false,
      users: initialData?.users?.map((u: any) => u.id) || [],
      groups: initialData?.groups?.map((g: any) => g.id) || [],
    },
    onSubmit: async ({ value }) => {
      try {
        const input = {
          componentId: value.component_id,
          targetModel: value.target_model,
          componentType: value.component_type,
          configuration: value.configuration,
          isGlobal: value.is_global,
          users: value.users,
          groups: value.groups,
        };

        if (mode === "create") {
          const { data } = await createConfig({ variables: { input } });
          if (data?.createUiComponentConfig?.errors?.length > 0) {
            console.error(data.createUiComponentConfig.errors);
            toast.error("Erreur lors de la création de la configuration");
            return;
          }
          toast.success("Configuration créée avec succès");
        } else {
          const { data } = await updateConfig({
            variables: { id: initialData.id, input },
          });
          if (data?.updateUiComponentConfig?.errors?.length > 0) {
            console.error(data.updateUiComponentConfig.errors);
            toast.error("Erreur lors de la mise à jour de la configuration");
            return;
          }
          toast.success("Configuration mise à jour avec succès");
        }

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error("Une erreur est survenue");
      }
    },
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="configuration"
          children={(field) => (
            <UIConfigEditor
              field={field}
              form={form}
              availableModels={[]} // Fetched internally by UIConfigEditor
              config={{
                name: "configuration",
                type: "custom",
                render: () => null,
              }}
            />
          )}
        />

        <div className="grid gap-6 md:grid-cols-2 pt-4">
          <form.Field
            name="users"
            children={(field) => (
              <MultiSelect
                label="Utilisateurs"
                placeholder="Sélectionner des utilisateurs..."
                options={usersOptions}
                selected={field.state.value}
                onChange={(val) => field.handleChange(val)}
              />
            )}
          />

          <form.Field
            name="groups"
            children={(field) => (
              <MultiSelect
                label="Groupes"
                placeholder="Sélectionner des groupes..."
                options={groupsOptions}
                selected={field.state.value}
                onChange={(val) => field.handleChange(val)}
              />
            )}
          />
        </div>

        <form.Field
          name="is_global"
          children={(field) => (
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="is_global"
                checked={field.state.value}
                onCheckedChange={(checked) =>
                  field.handleChange(checked as boolean)
                }
              />
              <Label htmlFor="is_global">
                Définir comme configuration globale (défaut pour tous les
                utilisateurs)
              </Label>
            </div>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={creating || updating}>
            {mode === "create" ? "Créer" : "Mettre à jour"}
          </Button>
        </div>
      </form>
    </div>
  );
}
