/**
 * FieldSelector - Nested Field Picker with Depth Navigation
 * 
 * Features:
 * - Navigate through related models up to maxDepth
 * - Breadcrumb navigation for nested paths
 * - Search/filter fields
 * - Visual distinction between scalar and relation fields
 * - Keyboard navigation support
 * - Recently used fields (optional)
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Database,
  Link2,
  Search,
  Hash,
  Calendar,
  ToggleLeft,
  Type,
  Braces,
  Clock,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Badge } from "@/lib/components/ui/badge";
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
  CommandSeparator,
} from "@/lib/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { ScrollArea } from "@/lib/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type {
  UnifiedFilterSchema,
  FilterableField,
  RelationFilter,
  NestedFilterConfig,
} from "../types";

export interface FieldSelectorProps {
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  currentPath?: string[];
  onSelect: (fieldPath: string[], fieldName: string, defaultOperator: string) => void;
  recentFields?: string[][];
  children: React.ReactNode;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  schema,
  config,
  currentPath = [],
  onSelect,
  recentFields = [],
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string[]>(currentPath);
  const [search, setSearch] = useState("");

  // Get current schema at navigation path
  const { currentSchema, breadcrumbs } = useMemo(() => {
    let current: UnifiedFilterSchema | undefined = schema;
    const crumbs: Array<{ label: string; path: string[] }> = [
      { label: schema.verboseName, path: [] },
    ];

    for (let i = 0; i < navigationPath.length; i++) {
      const segment = navigationPath[i];
      const relation = current?.relationFilters.find((r) => r.name === segment);

      if (relation?.nestedSchema) {
        current = relation.nestedSchema;
        crumbs.push({
          label: relation.fieldLabel,
          path: navigationPath.slice(0, i + 1),
        });
      } else {
        break;
      }
    }

    return { currentSchema: current, breadcrumbs: crumbs };
  }, [schema, navigationPath]);

  // Get available fields at current level
  const { scalarFields, relationFields } = useMemo(() => {
    if (!currentSchema) {
      return { scalarFields: [], relationFields: [] };
    }

    const currentDepth = navigationPath.length;
    const canGoDeeper = currentDepth < config.maxDepth;

    return {
      scalarFields: currentSchema.fields,
      relationFields: canGoDeeper ? currentSchema.relationFilters : [],
    };
  }, [currentSchema, navigationPath, config.maxDepth]);

  // Filter by search
  const filteredScalars = useMemo(() => {
    if (!search) return scalarFields;
    const lower = search.toLowerCase();
    return scalarFields.filter(
      (f) =>
        f.name.toLowerCase().includes(lower) ||
        f.fieldLabel.toLowerCase().includes(lower)
    );
  }, [scalarFields, search]);

  const filteredRelations = useMemo(() => {
    if (!search) return relationFields;
    const lower = search.toLowerCase();
    return relationFields.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.fieldLabel.toLowerCase().includes(lower)
    );
  }, [relationFields, search]);

  // Handlers
  const handleSelectScalar = useCallback(
    (field: FilterableField) => {
      const fullPath = [...navigationPath, field.name];
      onSelect(fullPath, field.name, field.defaultOperator);
      setOpen(false);
      setNavigationPath(currentPath);
      setSearch("");
    },
    [navigationPath, onSelect, currentPath]
  );

  const handleNavigateToRelation = useCallback((relation: RelationFilter) => {
    setNavigationPath([...navigationPath, relation.name]);
    setSearch("");
  }, [navigationPath]);

  const handleGoBack = useCallback(() => {
    setNavigationPath(navigationPath.slice(0, -1));
    setSearch("");
  }, [navigationPath]);

  const handleBreadcrumbClick = useCallback((path: string[]) => {
    setNavigationPath(path);
    setSearch("");
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen) {
        setNavigationPath(currentPath);
        setSearch("");
      }
    },
    [currentPath]
  );

  const currentDepth = navigationPath.length;
  const canGoBack = navigationPath.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <div className="flex flex-col">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <ScrollArea className="flex-1" orientation="horizontal">
              <div className="flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <button
                      className={cn(
                        "hover:text-primary transition-colors whitespace-nowrap",
                        index === breadcrumbs.length - 1
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                      onClick={() => handleBreadcrumbClick(crumb.path)}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </div>
            </ScrollArea>
            <Badge variant="outline" className="shrink-0 text-xs">
              {currentDepth}/{config.maxDepth}
            </Badge>
          </div>

          {/* Search and Field List */}
          <Command>
            <CommandInput
              placeholder="Rechercher des champs..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>Aucun champ trouvé.</CommandEmpty>

              {/* Recent Fields (only at root level) */}
              {recentFields.length > 0 && navigationPath.length === 0 && !search && (
                <>
                  <CommandGroup heading="Récemment utilisés">
                    {recentFields.slice(0, 5).map((path, idx) => {
                      const fieldName = path[path.length - 1];
                      const pathLabel = path.join(" → ");
                      return (
                        <CommandItem
                          key={idx}
                          value={`recent-${pathLabel}`}
                          onSelect={() => {
                            const field = schema.fields.find(
                              (f) => f.fieldName === fieldName
                            );
                            if (field) {
                              onSelect(path, fieldName, field.defaultOperator);
                              setOpen(false);
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{pathLabel}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Scalar Fields */}
              {filteredScalars.length > 0 && (
                <CommandGroup heading="Champs">
                  {filteredScalars.map((field) => (
                    <CommandItem
                      key={field.fieldName}
                      value={field.fieldName}
                      onSelect={() => handleSelectScalar(field)}
                      className="flex items-center gap-2"
                    >
                      <FieldTypeIcon type={field.baseType} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{field.fieldLabel}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{field.graphqlType}</span>
                          {field.choices && field.choices.length > 0 && (
                            <Badge variant="outline" className="text-[10px] h-4">
                              {field.choices.length} options
                            </Badge>
                          )}
                        </div>
                      </div>
                      {field.helpText && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-muted-foreground">ℹ️</div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              {field.helpText}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Relation Fields */}
              {filteredRelations.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Modèles liés (cliquer pour développer)">
                    {filteredRelations.map((relation) => (
                      <CommandItem
                        key={relation.fieldName}
                        value={`rel-${relation.fieldName}`}
                        onSelect={() => handleNavigateToRelation(relation)}
                        className="flex items-center gap-2"
                      >
                        <Link2 className="h-4 w-4 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{relation.fieldLabel}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{relation.relatedModel}</span>
                            <RelationTypeBadge type={relation.relationType} />
                          </div>
                        </div>
                        {relation.nestedSchema && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {/* Depth Limit Message */}
              {currentDepth >= config.maxDepth && (
                <>
                  <CommandSeparator />
                  <div className="p-3 text-xs text-center text-muted-foreground bg-muted/30">
                    Profondeur maximale ({config.maxDepth}) atteinte.
                    <br />
                    Seuls les champs scalaires sont disponibles à ce niveau.
                  </div>
                </>
              )}
            </CommandList>
          </Command>

          {/* Footer with field count */}
          <div className="flex items-center justify-between px-3 py-2 border-t text-xs text-muted-foreground bg-muted/20">
            <span>
              {filteredScalars.length} champ{filteredScalars.length !== 1 ? "s" : ""}
              {filteredRelations.length > 0 && (
                <>, {filteredRelations.length} relation{filteredRelations.length !== 1 ? "s" : ""}</>
              )}
            </span>
            <span className="text-[10px]">Appuyez sur ↵ pour sélectionner</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Helper: Icon for field type
const FieldTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconClass = "h-4 w-4 text-muted-foreground";
  
  switch (type) {
    case "String":
      return <Type className={iconClass} />;
    case "Number":
      return <Hash className={iconClass} />;
    case "Boolean":
      return <ToggleLeft className={iconClass} />;
    case "Date":
    case "DateTime":
      return <Calendar className={iconClass} />;
    case "JSON":
      return <Braces className={iconClass} />;
    default:
      return <Database className={iconClass} />;
  }
};

// Helper: Badge for relation type
const RelationTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const labels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    FOREIGN_KEY: { label: "FK", variant: "outline" },
    MANY_TO_MANY: { label: "M2M", variant: "secondary" },
    REVERSE_FK: { label: "Rev", variant: "outline" },
    ONE_TO_ONE: { label: "1:1", variant: "outline" },
  };
  
  const config = labels[type] ?? { label: type, variant: "outline" as const };
  
  return (
    <Badge variant={config.variant} className="text-[10px] h-4 px-1">
      {config.label}
    </Badge>
  );
};

export default FieldSelector;
