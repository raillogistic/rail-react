/**
 * EnhancedFieldSelector - Advanced field selector with categorized fields and tree navigation
 *
 * Features:
 * - Ordered fields: Recent → Quick → Simple → Nested Rel → ManyToMany
 * - Tree view option for related fields
 * - Breadcrumb navigation for nested schemas
 * - Lazy loading support for relation schemas
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Link2,
  Hash,
  Calendar,
  ToggleLeft,
  Type,
  Braces,
  Clock,
  Star,
  Zap,
  GitBranch,
  Layers,
  Plus,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { cn } from "@/lib/utils";

import type {
  UnifiedFilterSchema,
  FilterableField,
  RelationFilter,
  NestedFilterConfig,
} from "../types";

// ============================================================================
// Types
// ============================================================================

export interface EnhancedFieldSelectorProps {
  schema: UnifiedFilterSchema;
  config: NestedFilterConfig;
  currentPath?: string[];
  onSelect: (
    fieldPath: string[],
    fieldName: string,
    defaultOperator: string,
  ) => void;
  recentFields?: string[][];
  favoriteFields?: string[][];
  /** Render related fields as an expandable tree instead of navigation */
  relationsAsTree?: boolean;
  /** Called when a relation needs its schema loaded */
  onLoadRelationSchema?: (relationName: string) => Promise<void>;
  children: React.ReactNode;
}

interface CategorizedFields {
  recent: Array<{ path: string[]; field: FilterableField }>;
  quick: FilterableField[];
  simple: FilterableField[];
  simpleRelations: RelationFilter[];
  nestedRelations: RelationFilter[];
  manyToMany: RelationFilter[];
}

interface RelationTreeNodeProps {
  relation: RelationFilter;
  basePath: string[];
  depth: number;
  maxDepth: number;
  onSelectField: (
    fieldPath: string[],
    fieldName: string,
    defaultOperator: string,
  ) => void;
  onLoadSchema?: (relationName: string) => Promise<void>;
}

// ============================================================================
// Field Type Icon
// ============================================================================

const FieldTypeIcon: React.FC<{ type: string; className?: string }> = ({
  type,
  className,
}) => {
  const iconClass = cn("h-3.5 w-3.5 text-muted-foreground", className);

  switch (type) {
    case "String":
      return <Type className={iconClass} />;
    case "Number":
    case "Integer":
    case "Float":
    case "Decimal":
      return <Hash className={iconClass} />;
    case "Boolean":
      return <ToggleLeft className={iconClass} />;
    case "Date":
    case "DateTime":
      return <Calendar className={iconClass} />;
    case "JSON":
      return <Braces className={iconClass} />;
    default:
      return null;
  }
};

// ============================================================================
// Relation Type Icon
// ============================================================================

const RelationTypeIcon: React.FC<{
  type: RelationFilter["relationType"];
  className?: string;
}> = ({ type, className }) => {
  const iconClass = cn("h-3.5 w-3.5", className);

  switch (type) {
    case "FOREIGN_KEY":
    case "ONE_TO_ONE":
      return <Link2 className={cn(iconClass, "text-blue-500")} />;
    case "REVERSE_FK":
      return <GitBranch className={cn(iconClass, "text-green-500")} />;
    case "MANY_TO_MANY":
      return <Layers className={cn(iconClass, "text-purple-500")} />;
    default:
      return <Link2 className={cn(iconClass, "text-muted-foreground")} />;
  }
};

// ============================================================================
// Relation Tree Node (for tree view mode)
// ============================================================================

const RelationTreeNode: React.FC<RelationTreeNodeProps> = ({
  relation,
  basePath,
  depth,
  maxDepth,
  onSelectField,
  onLoadSchema,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentPath = [...basePath, relation.name];
  const canExpand = depth < maxDepth && relation.nestedSchema;
  const needsLoad = depth < maxDepth && !relation.nestedSchema;

  const handleToggle = useCallback(async () => {
    if (needsLoad && onLoadSchema) {
      setIsLoading(true);
      try {
        await onLoadSchema(relation.name);
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(!isOpen);
  }, [needsLoad, onLoadSchema, relation.name, isOpen]);

  const nestedFields = relation.nestedSchema?.fields ?? [];
  const nestedRelations = relation.nestedSchema?.relationFilters ?? [];

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={canExpand || needsLoad ? handleToggle : undefined}
    >
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm",
            "transition-colors",
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {canExpand || needsLoad ? (
            <span className="shrink-0">
              {isLoading ? (
                <span className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full inline-block" />
              ) : isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          ) : (
            <span className="w-3" />
          )}
          <RelationTypeIcon type={relation.relationType} />
          <span className="flex-1 truncate font-medium">
            {relation.fieldLabel}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 shrink-0">
            {relation.relatedModel}
          </Badge>
        </div>
      </CollapsibleTrigger>

      {canExpand && (
        <CollapsibleContent>
          {/* Nested scalar fields */}
          {nestedFields.map((field) => (
            <div
              key={field.name}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm"
              style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
              onClick={() =>
                onSelectField(
                  [...currentPath, field.name],
                  field.name,
                  field.defaultOperator,
                )
              }
            >
              <span className="w-3" />
              <FieldTypeIcon type={field.baseType} />
              <span className="flex-1 truncate">{field.fieldLabel}</span>
              <span className="text-[10px] text-muted-foreground">
                {field.graphqlType}
              </span>
            </div>
          ))}

          {/* Nested relations (recursive) */}
          {nestedRelations.map((nestedRel) => (
            <RelationTreeNode
              key={nestedRel.name}
              relation={nestedRel}
              basePath={currentPath}
              depth={depth + 1}
              maxDepth={maxDepth}
              onSelectField={onSelectField}
              onLoadSchema={onLoadSchema}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
};

// ============================================================================
// Field Categorization
// ============================================================================

function categorizeFields(
  schema: UnifiedFilterSchema,
  recentFields: string[][],
  favoriteFields: string[][],
): CategorizedFields {
  const recentSet = new Set(recentFields.map((p) => p.join(".")));
  const favoriteSet = new Set(favoriteFields.map((p) => p.join(".")));

  // Build recent fields with their field objects
  const recent: CategorizedFields["recent"] = [];
  for (const path of recentFields.slice(0, 5)) {
    const fieldName = path[path.length - 1];
    // Try to find in direct fields first
    const field = schema.fields.find(
      (f) => f.name === fieldName || f.fieldName === fieldName,
    );
    if (field && path.length === 1) {
      recent.push({ path, field });
    }
  }

  // Categorize scalar fields
  const quick: FilterableField[] = [];
  const simple: FilterableField[] = [];

  for (const field of schema.fields) {
    const isRecent = recentSet.has(field.name);
    const isFavorite = favoriteSet.has(field.name);
    const isQuick = field.uiHints?.showInQuickFilter || isFavorite;

    // Skip if already in recent
    if (isRecent) continue;

    if (isQuick) {
      quick.push(field);
    } else {
      simple.push(field);
    }
  }

  // Sort quick by priority
  quick.sort((a, b) => (b.uiHints?.priority ?? 0) - (a.uiHints?.priority ?? 0));

  // Categorize relations
  const simpleRelations: RelationFilter[] = [];
  const nestedRelations: RelationFilter[] = [];
  const manyToMany: RelationFilter[] = [];

  for (const rel of schema.relationFilters) {
    const isNestedRel =
      rel.name.endsWith("Rel") || rel.fieldName.endsWith("_rel");

    if (rel.relationType === "MANY_TO_MANY") {
      manyToMany.push(rel);
    } else if (isNestedRel) {
      nestedRelations.push(rel);
    } else {
      // FK, O2O, Reverse FK
      simpleRelations.push(rel);
    }
  }

  return {
    recent,
    quick,
    simple,
    simpleRelations,
    nestedRelations,
    manyToMany,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export const EnhancedFieldSelector: React.FC<EnhancedFieldSelectorProps> = ({
  schema,
  config,
  currentPath = [],
  onSelect,
  recentFields = [],
  favoriteFields = [],
  relationsAsTree = false,
  onLoadRelationSchema,
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string[]>(currentPath);
  const [search, setSearch] = useState("");

  // Resolve current schema based on navigation path
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

  // Categorize fields
  const categorized = useMemo(() => {
    if (!currentSchema) {
      return {
        recent: [],
        quick: [],
        simple: [],
        simpleRelations: [],
        nestedRelations: [],
        manyToMany: [],
      };
    }
    return categorizeFields(currentSchema, recentFields, favoriteFields);
  }, [currentSchema, recentFields, favoriteFields]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search) return categorized;

    const lower = search.toLowerCase();
    const matchField = (f: FilterableField) =>
      f.name.toLowerCase().includes(lower) ||
      f.fieldLabel.toLowerCase().includes(lower);
    const matchRelation = (r: RelationFilter) =>
      r.name.toLowerCase().includes(lower) ||
      r.fieldLabel.toLowerCase().includes(lower) ||
      r.relatedModel.toLowerCase().includes(lower);

    return {
      recent: categorized.recent.filter((r) => matchField(r.field)),
      quick: categorized.quick.filter(matchField),
      simple: categorized.simple.filter(matchField),
      simpleRelations: categorized.simpleRelations.filter(matchRelation),
      nestedRelations: categorized.nestedRelations.filter(matchRelation),
      manyToMany: categorized.manyToMany.filter(matchRelation),
    };
  }, [categorized, search]);

  const currentDepth = navigationPath.length;
  const canGoDeeper = currentDepth < config.maxDepth;

  // Handlers
  const handleSelectScalar = useCallback(
    (field: FilterableField) => {
      const fullPath = [...navigationPath, field.name];
      onSelect(fullPath, field.name, field.defaultOperator);
      setOpen(false);
      setNavigationPath(currentPath);
      setSearch("");
    },
    [navigationPath, onSelect, currentPath],
  );

  const handleNavigateToRelation = useCallback(
    (relation: RelationFilter) => {
      setNavigationPath([...navigationPath, relation.name]);
      setSearch("");
    },
    [navigationPath],
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
    [currentPath],
  );

  const handleTreeFieldSelect = useCallback(
    (fieldPath: string[], fieldName: string, defaultOperator: string) => {
      onSelect(fieldPath, fieldName, defaultOperator);
      setOpen(false);
      setSearch("");
    },
    [onSelect],
  );

  const canGoBack = navigationPath.length > 0;

  // Render field item
  const renderFieldItem = (field: FilterableField, key: string) => (
    <CommandItem
      key={key}
      value={`field-${field.name}`}
      onSelect={() => handleSelectScalar(field)}
      className="flex items-center gap-2"
    >
      <FieldTypeIcon type={field.baseType} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs">{field.fieldLabel}</div>
        {field.helpText && (
          <div className="text-[10px] text-muted-foreground truncate">
            {field.helpText}
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">
        {field.graphqlType}
      </span>
    </CommandItem>
  );

  // Render relation item (navigation mode)
  const renderRelationItem = (relation: RelationFilter) => (
    <CommandItem
      key={relation.name}
      value={`rel-${relation.name}`}
      onSelect={() => handleNavigateToRelation(relation)}
      className="flex items-center gap-2"
    >
      <RelationTypeIcon type={relation.relationType} />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs">{relation.fieldLabel}</div>
        <div className="text-[10px] text-muted-foreground">
          {relation.relatedModel}
        </div>
      </div>
      {relation.nestedSchema && (
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      )}
    </CommandItem>
  );

  const totalFieldCount =
    filtered.quick.length +
    filtered.simple.length +
    filtered.simpleRelations.length +
    filtered.nestedRelations.length +
    filtered.manyToMany.length;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <div className="flex flex-col max-h-[480px]">
          {/* Breadcrumb navigation */}
          <div className="flex items-center gap-1 p-2 border-b bg-muted/30 shrink-0">
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
                        : "text-muted-foreground",
                    )}
                    onClick={() => handleBreadcrumbClick(crumb.path)}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <Badge variant="outline" className="shrink-0 text-xs h-5">
              {currentDepth}/{config.maxDepth}
            </Badge>
          </div>

          {/* Command menu */}
          <Command className="flex-1 overflow-hidden">
            <CommandInput
              placeholder="Search fields..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[360px]">
              <CommandEmpty>No fields found</CommandEmpty>

              {/* Recent fields */}
              {filtered.recent.length > 0 &&
                navigationPath.length === 0 &&
                !search && (
                  <>
                    <CommandGroup
                      heading={
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Recent
                        </span>
                      }
                    >
                      {filtered.recent.map(({ path, field }) => (
                        <CommandItem
                          key={path.join(".")}
                          value={`recent-${path.join(".")}`}
                          onSelect={() => {
                            onSelect(path, field.name, field.defaultOperator);
                            setOpen(false);
                          }}
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground mr-2" />
                          <span className="truncate">{field.fieldLabel}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

              {/* Quick/Favorite fields */}
              {filtered.quick.length > 0 && (
                <>
                  <CommandGroup
                    heading={
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" />
                        Quick Filters
                      </span>
                    }
                  >
                    {filtered.quick.map((field) =>
                      renderFieldItem(field, `quick-${field.name}`),
                    )}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Simple scalar fields */}
              {filtered.simple.length > 0 && (
                <CommandGroup heading="Fields">
                  {filtered.simple.map((field) =>
                    renderFieldItem(field, `simple-${field.name}`),
                  )}
                </CommandGroup>
              )}

              {/* Simple relations (FK, O2O, Reverse FK) */}
              {filtered.simpleRelations.length > 0 && canGoDeeper && (
                <>
                  <CommandSeparator />
                  <CommandGroup
                    heading={
                      <span className="flex items-center gap-1.5">
                        <Link2 className="h-3 w-3" />
                        Related
                      </span>
                    }
                  >
                    {relationsAsTree ? (
                      // Tree view mode
                      <div className="py-1">
                        {filtered.simpleRelations.map((rel) => (
                          <RelationTreeNode
                            key={rel.name}
                            relation={rel}
                            basePath={navigationPath}
                            depth={currentDepth}
                            maxDepth={config.maxDepth}
                            onSelectField={handleTreeFieldSelect}
                            onLoadSchema={onLoadRelationSchema}
                          />
                        ))}
                      </div>
                    ) : (
                      // Navigation mode
                      filtered.simpleRelations.map(renderRelationItem)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Nested relations (ending with Rel) */}
              {filtered.nestedRelations.length > 0 && canGoDeeper && (
                <>
                  <CommandSeparator />
                  <CommandGroup
                    heading={
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="h-3 w-3" />
                        Nested Relations
                      </span>
                    }
                  >
                    {relationsAsTree ? (
                      <div className="py-1">
                        {filtered.nestedRelations.map((rel) => (
                          <RelationTreeNode
                            key={rel.name}
                            relation={rel}
                            basePath={navigationPath}
                            depth={currentDepth}
                            maxDepth={config.maxDepth}
                            onSelectField={handleTreeFieldSelect}
                            onLoadSchema={onLoadRelationSchema}
                          />
                        ))}
                      </div>
                    ) : (
                      filtered.nestedRelations.map(renderRelationItem)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Many-to-Many relations */}
              {filtered.manyToMany.length > 0 && canGoDeeper && (
                <>
                  <CommandSeparator />
                  <CommandGroup
                    heading={
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3 w-3" />
                        Many-to-Many
                      </span>
                    }
                  >
                    {relationsAsTree ? (
                      <div className="py-1">
                        {filtered.manyToMany.map((rel) => (
                          <RelationTreeNode
                            key={rel.name}
                            relation={rel}
                            basePath={navigationPath}
                            depth={currentDepth}
                            maxDepth={config.maxDepth}
                            onSelectField={handleTreeFieldSelect}
                            onLoadSchema={onLoadRelationSchema}
                          />
                        ))}
                      </div>
                    ) : (
                      filtered.manyToMany.map(renderRelationItem)
                    )}
                  </CommandGroup>
                </>
              )}

              {/* Max depth notice */}
              {!canGoDeeper && (
                <>
                  <CommandSeparator />
                  <div className="p-3 text-xs text-center text-muted-foreground bg-muted/30">
                    Max depth ({config.maxDepth}) reached
                  </div>
                </>
              )}
            </CommandList>
          </Command>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground bg-muted/20 shrink-0">
            {totalFieldCount} field{totalFieldCount !== 1 ? "s" : ""} available
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedFieldSelector;
