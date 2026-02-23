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

import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Textarea } from "@/shared/ui/kit/textarea";
import { Switch } from "@/shared/ui/kit/switch";
import { Badge } from "@/shared/ui/kit/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/kit/collapsible";
import { Alert, AlertDescription } from "@/shared/ui/kit/alert";
import { ScrollArea } from "@/shared/ui/kit/scroll-area";

import type { FilterGroup, UnifiedFilterSchema, FilterPreset } from "../types";
import { serializeFilterToGraphQL } from "../serializer";
import { countConditions } from "../state";

// GraphQL Mutations
const CREATE_SAVED_FILTER = gql`
  mutation CreateSavedFilter($input: CreateSavedFilterInput!) {
    createSavedFilter(input: $input) {
      ok
      errors {
        field
        message
        code
      }
      object {
        id
        name
        description
        filterJson
        isShared
      }
    }
  }
`;

const UPDATE_SAVED_FILTER = gql`
  mutation UpdateSavedFilter($id: ID!, $input: UpdateSavedFilterInput!) {
    updateSavedFilter(id: $id, input: $input) {
      ok
      errors {
        field
        message
        code
      }
      object {
        id
        name
        description
        filterJson
        isShared
      }
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
  existingNames?: string[];
  canShare?: boolean;
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
  existingNames = [],
  canShare = true,
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
    if (!canShare && isShared) {
      setIsShared(false);
    }
  }, [canShare, isShared]);

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
  const normalizedName = name.trim().toLowerCase();
  const duplicateName = normalizedName.length > 0
    ? existingNames.some((existing) => {
        if (!existing) return false;
        if (existingFilter && existing === existingFilter.name) return false;
        return existing.trim().toLowerCase() == normalizedName;
      })
    : false;

  const formatMutationErrors = useCallback(
    (errors: Array<{ field?: string | null; message?: string | null }>) => {
      return errors
        .map((entry) => {
          const message = entry.message?.trim();
          if (!message) return null;
          const field = entry.field?.trim();
          return field ? `${field}: ${message}` : message;
        })
        .filter(Boolean)
        .join(" | ");
    },
    [],
  );

  // Validation
  const validation = React.useMemo(() => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push("Le nom est requis");
    } else if (name.trim().length < 3) {
      errors.push("Le nom doit contenir au moins 3 caractères");
    } else if (name.trim().length > 100) {
      errors.push("Le nom doit contenir moins de 100 caractères");
    }

    if (description.length > 500) {
      errors.push("La description doit contenir moins de 500 caractères");
    }

    if (conditionCount === 0) {
      errors.push("Le filtre doit avoir au moins une condition avec une valeur");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [name, description, conditionCount, duplicateName]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validation.isValid) return;
    setError(null);
    const filterJson = JSON.stringify(serializedFilter);
    try {
      if (isEditing && existingFilter) {
        const response = await updateFilter({
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
        const payload = response.data?.updateSavedFilter;
        if (!payload?.ok) {
          const mutationError = formatMutationErrors(payload?.errors ?? []);
          setError(mutationError || "Echec de la mise a jour du filtre.");
          return;
        }
      } else {
        const response = await createFilter({
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
        const payload = response.data?.createSavedFilter;
        if (!payload?.ok) {
          const mutationError = formatMutationErrors(payload?.errors ?? []);
          setError(mutationError || "Echec de l'enregistrement du filtre.");
          return;
        }
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message ?? "Echec de l'enregistrement du filtre. Veuillez reessayer.");
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
    formatMutationErrors,
    onSaved,
    onOpenChange,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            {isEditing ? "Mettre à jour le filtre enregistré" : "Enregistrer le filtre"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Mettez à jour votre configuration de filtre enregistré."
              : "Enregistrez votre configuration actuelle pour un accès rapide plus tard."}
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
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="filter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Commandes de grande valeur, Produits actifs..."
              maxLength={100}
              disabled={loading}
              autoFocus
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Donnez un nom mémorable à votre filtre</span>
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
              placeholder="Description optionnelle de ce que montre ce filtre..."
              rows={2}
              maxLength={500}
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Aidez les autres à comprendre ce filtre</span>
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
                  {isShared ? "Partagé avec l'équipe" : "Filtre privé"}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {isShared
                  ? "Les autres membres de l'équipe peuvent voir et utiliser ce filtre"
                  : "Vous seul pouvez voir ce filtre"}
              </p>
            </div>
            <Switch
              id="filter-shared"
              checked={isShared}
              onCheckedChange={setIsShared}
              disabled={loading || !canShare}
            />
          </div>

          {/* Filter summary */}
          <div className="rounded-lg border bg-muted/30">
            <Collapsible open={showPreview} onOpenChange={setShowPreview}>
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>Aperçu du filtre</span>
                    <Badge variant="secondary" className="h-5">
                      {conditionCount} condition{conditionCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {showPreview ? "Masquer" : "Afficher"}
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
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!validation.isValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Mise à jour..." : "Enregistrement..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Mettre à jour le filtre" : "Enregistrer le filtre"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveFilterDialog;

