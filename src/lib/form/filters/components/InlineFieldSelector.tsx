/**
 * InlineFieldSelector - Field selector with recent, favorites, and quick filters.
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Link2,
  Star,
  Clock,
  Zap,
} from "lucide-react";
import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
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
import { cn } from "@/lib/utils";
import type {
  UnifiedFilterSchema,
  FilterableField,
  RelationFilter,
  NestedFilterConfig,
} from "../types";
import { FieldTypeIcon } from "./InlineFieldSelectorIcons";

export interface InlineFieldSelectorProps {
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  currentPath?: string[];
  onSelect: (fieldPath: string[], fieldName: string, defaultOperator: string) => void;
  trigger: React.ReactNode;
  recentFields?: string[][];
  favoriteFields?: string[][];
}

export const InlineFieldSelector: React.FC<InlineFieldSelectorProps> = ({
  schema,
  config,
  currentPath = [],
  onSelect,
  trigger,
  recentFields = [],
  favoriteFields = [],
}) => {
  const [open, setOpen] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string[]>(currentPath);
  const [search, setSearch] = useState("");

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

  const quickFilters = useMemo(() => {
    if (navigationPath.length > 0) return [];
    return schema.fields
      .filter((field) => field.uiHints.showInQuickFilter)
      .sort((a, b) => (a.uiHints.priority ?? 999) - (b.uiHints.priority ?? 999));
  }, [schema.fields, navigationPath.length]);

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

  const handleNavigateToRelation = useCallback(
    (relation: RelationFilter) => {
      setNavigationPath([...navigationPath, relation.name]);
      setSearch("");
    },
    [navigationPath]
  );

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

  const handleQuickSelect = useCallback(
    (field: FilterableField) => {
      onSelect([field.name], field.name, field.defaultOperator);
      setOpen(false);
    },
    [onSelect]
  );

  const resolvePathFields = useCallback(
    (paths: string[][]) => {
      return paths
        .map((path) => {
          const fieldName = path[path.length - 1];
          const field = schema.fields.find((f) => f.name === fieldName || f.fieldName === fieldName);
          return field ? { field, path } : null;
        })
        .filter(Boolean) as Array<{ field: FilterableField; path: string[] }>;
    },
    [schema.fields]
  );

  const recentResolved = useMemo(() => resolvePathFields(recentFields), [resolvePathFields, recentFields]);
  const favoriteResolved = useMemo(() => resolvePathFields(favoriteFields), [resolvePathFields, favoriteFields]);

  const canGoBack = navigationPath.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="flex flex-col">
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
            <div className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  <button
                    className={cn(
                      "hover:text-primary transition-colors truncate",
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
            <Badge variant="outline" className="shrink-0 text-xs h-5">
              {navigationPath.length}/{config.maxDepth}
            </Badge>
          </div>

          <Command>
            <CommandInput
              placeholder="Search fields..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No fields found</CommandEmpty>

              {navigationPath.length === 0 && !search && favoriteResolved.length > 0 && (
                <>
                  <CommandGroup heading={
                    <div className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span>Favorites</span>
                    </div>
                  }>
                    {favoriteResolved.map(({ field, path }) => (
                      <CommandItem
                        key={`fav-${field.fieldName}`}
                        value={`favorite-${field.fieldName}`}
                        onSelect={() => {
                          onSelect(path, field.name, field.defaultOperator);
                          setOpen(false);
                        }}
                        className="flex items-center gap-2"
                      >
                        <FieldTypeIcon type={field.baseType} />
                        <span className="truncate">{path.join(" -> ")}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {navigationPath.length === 0 && !search && recentResolved.length > 0 && (
                <>
                  <CommandGroup heading={
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-sky-500" />
                      <span>Recent</span>
                    </div>
                  }>
                    {recentResolved.slice(0, 5).map(({ field, path }) => (
                      <CommandItem
                        key={`recent-${field.fieldName}`}
                        value={`recent-${field.fieldName}`}
                        onSelect={() => {
                          onSelect(path, field.name, field.defaultOperator);
                          setOpen(false);
                        }}
                        className="flex items-center gap-2"
                      >
                        <FieldTypeIcon type={field.baseType} />
                        <span className="truncate">{path.join(" -> ")}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {navigationPath.length === 0 && !search && quickFilters.length > 0 && (
                <>
                  <CommandGroup heading={
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-orange-500" />
                      <span>Quick Filters</span>
                    </div>
                  }>
                    {quickFilters.map((field) => (
                      <CommandItem
                        key={`quick-${field.fieldName}`}
                        value={`quick-${field.fieldName}`}
                        onSelect={() => handleQuickSelect(field)}
                        className="flex items-center gap-2"
                      >
                        <FieldTypeIcon type={field.baseType} />
                        <span className="truncate">{field.fieldLabel}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {filteredScalars.length > 0 && (
                <CommandGroup heading="Fields">
                  {filteredScalars.map((field) => (
                    <CommandItem
                      key={field.fieldName}
                      value={field.fieldName}
                      onSelect={() => handleSelectScalar(field)}
                      className="flex items-center gap-2"
                    >
                      <FieldTypeIcon type={field.baseType} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">{field.fieldLabel}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {field.graphqlType}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredRelations.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="Related">
                    {filteredRelations.map((relation) => (
                      <CommandItem
                        key={relation.fieldName}
                        value={`rel-${relation.fieldName}`}
                        onSelect={() => handleNavigateToRelation(relation)}
                        className="flex items-center gap-2"
                      >
                        <Link2 className="h-3.5 w-3.5 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">{relation.fieldLabel}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {relation.relatedModel}
                          </div>
                        </div>
                        {relation.nestedSchema && (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {navigationPath.length >= config.maxDepth && (
                <>
                  <CommandSeparator />
                  <div className="p-3 text-xs text-center text-muted-foreground bg-muted/30">
                    Max depth ({config.maxDepth}) reached
                  </div>
                </>
              )}
            </CommandList>
          </Command>

          <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground bg-muted/20">
            {filteredScalars.length} field{filteredScalars.length !== 1 ? "s" : ""}
            {filteredRelations.length > 0 && (
              <>, {filteredRelations.length} related</>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default InlineFieldSelector;
