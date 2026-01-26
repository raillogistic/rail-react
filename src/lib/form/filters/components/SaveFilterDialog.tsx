/**
 * SaveFilterDialog - Create/Edit Saved Filter
 * 
 * Features:
 * - Create new saved filters
 * - Edit existing saved filters
 * - Name and description fields
 * - Share with team toggle
 * - Preview of filter conditions
 * - Validation with error messages
 * - Loading states
 */

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, gql } from "@apollo/client";
import {
  Save,
  Loader2,
  Share2,
  Lock,
  Eye,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import { Label } from "@/lib/components/ui/label";
import { Textarea } from "@/lib/components/ui/textarea";
import { Switch } from "@/lib/components/ui/switch";
import { Badge } from "@/lib/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/lib/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/lib/components/ui/collapsible";
import { Alert, AlertDescription } from "@/lib/components/ui/alert";
import { ScrollArea } from "@/lib/components/ui/scroll-area";

import type { FilterGroup, UnifiedFilterSchema, FilterPreset } from "../types";
import { serializeFilterToGraphQL } from "../serializer";
import { countConditions } from "../state";

// GraphQL Mutations
const CREATE_SAVED_FILTER = gql`
  mutation CreateSavedFilter($input: SavedFilterInput!) {
    createSavedFilter(input: $input) {
      id
      name
      description
      filterJson
      isShared
    }
  }
`;

const UPDATE_SAVED_FILTER = gql`
  mutation UpdateSavedFilter($id: ID!, $input: SavedFilterUpdateInput!) {
    updateSavedFilter(id: $id, input: $input) {
      id
      name
      description
      filterJson
      isShared
    }
  }
`;

export interface SaveFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName: string;
  filterState: FilterGroup;
  schema: UnifiedFilterSchema;
  maxDepth: number;
  existingFilter?: FilterPreset;
  onSaved: () => void;
}

export const SaveFilterDialog: React.FC<SaveFilterDialogProps> = ({
  open,
  onOpenChange,
  modelName,
  filterState,
  schema,
  maxDepth,
  existingFilter,
  onSaved,
}) => {
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const [createFilter, { loading: creating }] = useMutation(CREATE_SAVED_FILTER);
  const [updateFilter, { loading: updating }] = useMutation(UPDATE_SAVED_FILTER);

  const loading = creating || updating;
  const isEditing = !!existingFilter;

  // Initialize form when editing
  useEffect(() => {
    if (open) {
      if (existingFilter) {
        setName(existingFilter.name);
        setDescription(existingFilter.description ?? "");
        setIsShared(existingFilter.isShared ?? false);
      } else {
        setName("");
        setDescription("");
        setIsShared(false);
      }
      setError(null);
      setShowPreview(false);
    }
  }, [open, existingFilter]);

  // Serialize current filter state
  const serializedFilter = React.useMemo(() => {
    return serializeFilterToGraphQL(filterState, schema, maxDepth);
  }, [filterState, schema, maxDepth]);

  const conditionCount = countConditions(filterState);

  // Validation
  const validation = React.useMemo(() => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push("Name is required");
    } else if (name.trim().length < 3) {
      errors.push("Name must be at least 3 characters");
    } else if (name.trim().length > 100) {
      errors.push("Name must be less than 100 characters");
    }

    if (description.length > 500) {
      errors.push("Description must be less than 500 characters");
    }

    if (conditionCount === 0) {
      errors.push("Filter must have at least one condition with a value");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [name, description, conditionCount]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validation.isValid) return;

    setError(null);

    const filterJson = JSON.stringify(serializedFilter);

    try {
      if (isEditing && existingFilter) {
        await updateFilter({
          variables: {
            id: existingFilter.id,
            input: {
              name: name.trim(),
              description: description.trim() || null,
              filterJson,
              isShared,
            },
          },
        });
      } else {
        await createFilter({
          variables: {
            input: {
              name: name.trim(),
              description: description.trim() || null,
              modelName,
              filterJson,
              isShared,
            },
          },
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? "Failed to save filter. Please try again.");
    }
  }, [
    validation.isValid,
    serializedFilter,
    isEditing,
    existingFilter,
    name,
    description,
    isShared,
    modelName,
    createFilter,
    updateFilter,
    onSaved,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {isEditing ? "Update Saved Filter" : "Save Filter"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your saved filter configuration."
              : "Save your current filter configuration for quick access later."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="filter-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="filter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value Orders, Active Products..."
              maxLength={100}
              disabled={loading}
              autoFocus
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Give your filter a memorable name</span>
              <span>{name.length}/100</span>
            </div>
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="filter-description">Description</Label>
            <Textarea
              id="filter-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this filter shows..."
              rows={2}
              maxLength={500}
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Help others understand this filter</span>
              <span>{description.length}/500</span>
            </div>
          </div>

          {/* Share toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {isShared ? (
                  <Share2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="filter-shared" className="font-medium">
                  {isShared ? "Shared with team" : "Private filter"}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {isShared
                  ? "Other team members can see and use this filter"
                  : "Only you can see this filter"}
              </p>
            </div>
            <Switch
              id="filter-shared"
              checked={isShared}
              onCheckedChange={setIsShared}
              disabled={loading}
            />
          </div>

          {/* Filter summary */}
          <div className="rounded-lg border bg-muted/30">
            <Collapsible open={showPreview} onOpenChange={setShowPreview}>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Filter Preview</span>
                    <Badge variant="secondary" className="h-5">
                      {conditionCount} condition{conditionCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {showPreview ? "Hide" : "Show"}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t p-3">
                  <ScrollArea className="h-32">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {JSON.stringify(serializedFilter, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Validation errors */}
          {!validation.isValid && validation.errors.length > 0 && (
            <div className="space-y-1">
              {validation.errors.map((err, idx) => (
                <p key={idx} className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!validation.isValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update Filter" : "Save Filter"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveFilterDialog;
