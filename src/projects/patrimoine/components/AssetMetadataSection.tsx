/**
 * Section dynamique de métadonnées d'un bien.
 *
 * Affiche les champs de métadonnées définis pour la catégorie/famille
 * sélectionnée dans le formulaire de bien. Gère le rendu dynamique
 * des champs selon leur type (texte, nombre, date, booléen, etc.).
 *
 * @module patrimoine/components/AssetMetadataSection
 */
import React, {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Loader2, Database, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/shared/utils";
import {
  useAssetMetadataDefinitions,
  type MetadataFieldDefinition,
  type MetadataSection,
} from "../hooks/useAssetMetadata";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Props du composant AssetMetadataSection. */
export interface AssetMetadataSectionProps {
  /** ID de la catégorie sélectionnée dans le formulaire parent */
  categoryId: string | null;
  /** ID de la famille sélectionnée dans le formulaire parent */
  familyId: string | null;
  /** Valeurs actuelles des métadonnées (dictionnaire) */
  values: Record<string, any>;
  /** Callback lors d'un changement de valeur */
  onChange: (key: string, value: any) => void;
  /** Classe CSS additionnelle */
  className?: string;
}

/** Méthodes exposées au parent via la ref. */
export interface AssetMetadataSectionHandle {
  /**
   * Valide les champs obligatoires avant la soumission.
   * @returns Un tableau de messages d'erreur si la validation échoue, sinon un tableau vide.
   */
  validate: () => string[];
  /** Indique si des champs de métadonnées sont disponibles pour la catégorie/famille courante */
  hasFields: boolean;
}

// ─── Sous-composants ────────────────────────────────────────────────────────

/**
 * Champ de formulaire dynamique pour un item de métadonnée.
 */
function MetadataFieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: MetadataFieldDefinition;
  value: unknown;
  onChange: (definitionItemId: string, value: unknown) => void;
  error?: string;
}) {
  const inputId = `metadata-${field.fieldKey}`;

  const handleChange = useCallback(
    (newValue: unknown) => {
      onChange(field.fieldKey, newValue);
    },
    [field.fieldKey, onChange],
  );

  const baseInputClass = cn(
    "w-full rounded-lg border border-border/50 bg-background/80 px-3 py-2",
    "text-sm text-foreground placeholder:text-muted-foreground/50",
    "transition-all duration-200",
    "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
    "hover:border-border/80",
    error && "border-destructive/50 bg-destructive/5 focus:border-destructive/80 focus:ring-destructive/20"
  );

  const renderInput = () => {
    switch (field.fieldType) {
      case "text":
        return (
          <input
            id={inputId}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClass}
            placeholder={`Saisir ${field.label.toLowerCase()}`}
          />
        );

      case "number":
        return (
          <input
            id={inputId}
            type="number"
            value={value !== null && value !== undefined ? String(value) : ""}
            onChange={(e) =>
              handleChange(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            className={baseInputClass}
            placeholder="0"
            step="any"
          />
        );

      case "date":
        return (
          <input
            id={inputId}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value || null)}
            className={baseInputClass}
          />
        );

      case "boolean":
        return (
          <label
            htmlFor={inputId}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="relative">
              <input
                id={inputId}
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleChange(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className={cn(
                  "h-5 w-9 rounded-full transition-colors duration-200",
                  "bg-muted-foreground/20 peer-checked:bg-primary",
                  "after:content-[''] after:absolute after:top-0.5 after:left-0.5",
                  "after:h-4 after:w-4 after:rounded-full after:bg-white",
                  "after:transition-transform after:duration-200",
                  "peer-checked:after:translate-x-4",
                )}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {value ? "Oui" : "Non"}
            </span>
          </label>
        );

      case "select":
      case "multiselect":
      default:
        return (
          <input
            id={inputId}
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClass}
            placeholder={`Saisir ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground/80"
      >
        {field.label}
        {field.isRequired && (
          <span className="text-destructive text-xs">*</span>
        )}
      </label>
      {renderInput()}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

/**
 * Section repliable regroupant les champs de métadonnées d'une même définition.
 */
function MetadataSectionGroup({
  section,
  values,
  onChange,
  errors,
}: {
  section: MetadataSection;
  values: Record<string, any>;
  onChange: (definitionItemKey: string, value: unknown) => void;
  errors: Map<string, string>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-border/30 bg-background/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full items-center justify-between px-4 py-3",
          "text-sm font-semibold text-foreground/90",
          "transition-colors duration-150 hover:bg-muted/30",
        )}
      >
        <span className="flex items-center gap-2">
          <Database className="size-3.5 text-primary/60" />
          {section.name}
          <span className="text-xs text-muted-foreground/50 font-normal">
            ({section.fields.length} champ
            {section.fields.length > 1 ? "s" : ""})
          </span>
        </span>
        {isExpanded ? (
          <ChevronDown className="size-4 text-muted-foreground/40" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground/40" />
        )}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 sm:grid-cols-2">
          {section.fields.map((field) => (
            <MetadataFieldInput
              key={field.fieldKey}
              field={field}
              value={values[field.fieldKey]}
              onChange={onChange}
              error={errors.get(field.fieldKey)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

/**
 * Section de formulaire pour les métadonnées dynamiques d'un bien.
 *
 * Ce composant est conçu pour être utilisé conjointement avec le
 * formulaire principal (AssetForm).
 */
export const AssetMetadataSection = forwardRef<
  AssetMetadataSectionHandle,
  AssetMetadataSectionProps
>(function AssetMetadataSection(
  { categoryId, familyId, values, onChange, className },
  ref,
) {
  // ── Chargement des définitions ──────────────────────────────────────────
  const {
    sections,
    allFields,
    loading: definitionsLoading,
    hasDefinitions,
  } = useAssetMetadataDefinitions({ categoryId, familyId });

  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(
    new Map(),
  );

  // ── Exposition de l'API au parent ───────────────────────────────────────
  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        if (!hasDefinitions) return [];
        const errors: string[] = [];
        const newErrors = new Map<string, string>();
        for (const field of allFields) {
          const value = values[field.fieldKey];
          if (
            field.isRequired &&
            (value === undefined || value === null || value === "")
          ) {
            errors.push(`Le champ "${field.label}" est requis.`);
            newErrors.set(field.fieldKey, "Ce champ est requis");
          }
        }
        setValidationErrors(newErrors);
        return errors;
      },
      hasFields: hasDefinitions,
    }),
    [hasDefinitions, allFields, values],
  );

  // ── Rendu ───────────────────────────────────────────────────────────────
  const isLoading = definitionsLoading;

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground/60",
          className,
        )}
      >
        <Loader2 className="size-4 animate-spin" />
        <span>Chargement des métadonnées...</span>
      </div>
    );
  }

  if (!categoryId) {
    return null;
  }

  if (!hasDefinitions) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground/40",
          className,
        )}
      >
        <Database className="size-4" />
        <span>Aucune métadonnée définie pour cette catégorie.</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* En-tête de section */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-6 w-1 rounded-full bg-primary/40" />
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            Informations Complémentaires
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            Attributs spécifiques à la catégorie et famille du bien.
          </p>
        </div>
      </div>

      {/* Sections de métadonnées */}
      <div className="space-y-3">
        {sections.map((section) => (
          <MetadataSectionGroup
            key={section.definitionId}
            section={section}
            values={values || {}}
            onChange={(key, val) => {
              setValidationErrors((prev) => {
                if (prev.has(key)) {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
                }
                return prev;
              });
              onChange(key, val);
            }}
            errors={validationErrors}
          />
        ))}
      </div>
    </div>
  );
});

export default AssetMetadataSection;
