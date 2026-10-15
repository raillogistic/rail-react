/**
 * @module UnitFieldRenderer
 * @description Rendu universel de champs unitaires pour les détails.
 * Chaque champ est affiché avec un label, une valeur formatée,
 * et des interactions optionnelles (copie, lien, badge).
 * Supporte 40+ types de champs (texte, booléen, date, monnaie, etc.).
 */
import * as React from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  ExternalLink,
  Hash,
  Info,
  MapPin,
  Star,
  TrendingDown,
  TrendingUp,
  XCircle,
  Banknote,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/kit/avatar";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Label } from "@/shared/ui/kit/label";
import { Progress } from "@/shared/ui/kit/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/kit/tooltip";
import { cn } from "@/shared/utils";
import {
  formatFieldValue,
  inferDeltaTone,
  normalizeUnitField,
  type FormattedLocation,
  type FormattedProgress,
  type FormattedRating,
} from "./unitFieldFormatters";
import type {
  UnitField,
  UnitFieldFormattedValue,
  UnitFieldRenderCtx,
  UnitFieldRendererFn,
  UnitFieldRendererProps,
  UnitFieldTone,
} from "./unitFieldTypes";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

/** Résout le texte du label à partir du champ. */
function resolveLabelText(field: UnitField): string {
  return typeof field.label === "string" ? field.label : field.id;
}

/** Résout le texte copiable pour le presse-papier. */
function resolveCopyText(
  field: UnitField,
  formatted: UnitFieldFormattedValue,
): string | null {
  if (typeof field.copyValue === "string" && field.copyValue.trim()) {
    return field.copyValue;
  }
  if (field.kind === "tokenPreview" && typeof field.value === "string") {
    return field.value;
  }
  if (typeof formatted.normalized === "string") {
    return formatted.normalized;
  }
  if (typeof field.value === "string") {
    return field.value;
  }
  if (typeof formatted.text === "string" && !formatted.isEmpty) {
    return formatted.text;
  }
  return null;
}

/** Convertit un ton en variante de badge. */
function toBadgeVariant(tone: UnitFieldTone): BadgeVariant {
  if (tone === "danger") return "destructive";
  if (tone === "default") return "default";
  if (tone === "muted") return "outline";
  if (tone === "success") return "secondary";
  return "secondary";
}

/** Résout le ton visuel d'un champ selon son type et sa valeur. */
function resolveFieldTone(
  field: UnitField,
  formatted: UnitFieldFormattedValue,
): UnitFieldTone {
  if (field.kind === "delta" && !formatted.isEmpty) {
    return inferDeltaTone(formatted.normalized as number | null);
  }
  if (field.kind === "health") {
    const value = String(formatted.normalized || "").toLowerCase();
    if (["ok", "healthy", "good", "pass"].includes(value)) return "success";
    if (["warn", "warning", "degraded"].includes(value)) return "warning";
    if (["error", "critical", "failed"].includes(value)) return "danger";
  }
  return field.tone ?? "default";
}

/**
 * Rendu de texte interactif (lien, bouton cliquable, ou texte simple).
 */
function renderInteractiveText(
  ctx: UnitFieldRenderCtx,
  text: React.ReactNode,
  className?: string,
): React.ReactNode {
  const { field } = ctx;
  const ariaLabel = field.link?.ariaLabel || `View ${resolveLabelText(field)}`;
  const isDisabled = Boolean(field.disabled);

  const handleClick = () => {
    if (isDisabled) return;
    field.link?.onClick?.();
    ctx.onClickValue?.(field);
  };

  if (field.link?.href) {
    return (
      <a
        href={field.link.href}
        target={field.link.external ? "_blank" : undefined}
        rel={field.link.external ? "noreferrer noopener" : undefined}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline transition-colors",
          className,
        )}
      >
        {text}
        {field.link.external && <ExternalLink className="size-3 opacity-60" />}
      </a>
    );
  }

  if (field.link?.onClick || ctx.onClickValue) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex items-center gap-1 text-left font-medium text-primary underline-offset-4 hover:underline disabled:no-underline disabled:opacity-50 transition-opacity",
          className,
        )}
      >
        {text}
      </button>
    );
  }

  return (
    <span className={cn("font-medium text-foreground/90", className)}>
      {text}
    </span>
  );
}

/** Rendu de texte brut. */
function renderPlainText(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    ctx.formatted.text,
    cn(
      "unit-field-text break-words text-sm",
      ctx.field.kind === "multiline" || ctx.field.kind === "richText"
        ? "whitespace-pre-wrap"
        : "",
    ),
  );
}

/** Rendu de code inline. */
function renderCodeText(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-xs whitespace-pre-wrap break-all border border-border/20">
      {ctx.formatted.text}
    </code>,
  );
}

/** Rendu de JSON formaté. */
function renderJsonText(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <pre className="rounded-lg border border-border/20 bg-muted/30 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
      {ctx.formatted.text}
    </pre>,
  );
}

/** Rendu de valeur booléenne avec icône. */
function renderBoolean(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = Boolean(ctx.formatted.normalized);
  return (
    <span className="inline-flex items-center gap-1.5 py-0.5">
      {normalized ? (
        <CheckCircle2 className="size-4 text-emerald-500" />
      ) : (
        <XCircle className="size-4 text-muted-foreground/40" />
      )}
      <span className="text-sm font-medium">{ctx.formatted.text}</span>
    </span>
  );
}

/** Rendu de valeur en badge coloré. */
function renderBadgeValue(ctx: UnitFieldRenderCtx): React.ReactNode {
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  return (
    <Badge
      variant={toBadgeVariant(tone)}
      className={cn(
        "unit-field-badge font-medium text-[11px] px-2 py-0.5",
        tone === "success" &&
          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
        tone === "warning" &&
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
      )}
    >
      {ctx.formatted.text}
    </Badge>
  );
}

/** Rendu de liste de tags. */
function renderTagList(ctx: UnitFieldRenderCtx): React.ReactNode {
  const values = Array.isArray(ctx.formatted.normalized)
    ? (ctx.formatted.normalized as string[])
    : [ctx.formatted.text];
  return (
    <span className="inline-flex flex-wrap gap-1 py-0.5">
      {values.map((value, index) => (
        <Badge
          key={`${value}-${index}`}
          variant="secondary"
          className="px-2 py-0.5 text-[11px] font-medium"
        >
          {value}
        </Badge>
      ))}
    </span>
  );
}

/** Rendu de barre de progression. */
function renderProgress(ctx: UnitFieldRenderCtx): React.ReactNode {
  const progress = ctx.formatted.normalized as FormattedProgress;
  const clamped = Math.min(100, Math.max(0, progress.percent));
  const showBar = ctx.field.format?.progress?.showBar ?? false;
  return (
    <div className="flex min-w-0 flex-col gap-1.5 py-0.5">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{ctx.formatted.text}</span>
        {showBar && (
          <span className="text-muted-foreground/60 text-xs">{clamped}%</span>
        )}
      </div>
      {showBar ? (
        <Progress
          value={clamped}
          className="h-1.5 border border-border/10 bg-muted/50"
          aria-label={`${resolveLabelText(ctx.field)} progress ${ctx.formatted.text}`}
        />
      ) : null}
    </div>
  );
}

/** Rendu de notation par étoiles. */
function renderRating(ctx: UnitFieldRenderCtx): React.ReactNode {
  const rating = ctx.formatted.normalized as FormattedRating;
  const rounded = Math.round(rating.value);
  const max = rating.max || 5;

  return (
    <div className="inline-flex items-center gap-2 py-0.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-3.5 transition-colors",
              i < rounded
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/20",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground/60">
        {ctx.formatted.text}
      </span>
    </div>
  );
}

/** Rendu de delta (variation positive/négative). */
function renderDelta(ctx: UnitFieldRenderCtx): React.ReactNode {
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  const numeric = Number(ctx.formatted.normalized);
  const isPositive = numeric > 0;
  const isNegative = numeric < 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 py-0.5",
        tone === "success" && "text-emerald-600 dark:text-emerald-400",
        tone === "danger" && "text-destructive",
        tone === "warning" && "text-amber-600 dark:text-amber-400",
      )}
    >
      {isPositive && <TrendingUp className="size-3.5" />}
      {isNegative && <TrendingDown className="size-3.5" />}
      <span className="font-semibold text-sm">{ctx.formatted.text}</span>
    </div>
  );
}

/** Rendu de valeur monospace (ID, UUID). */
function renderMonospaceValue(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-1.5">
      <Hash className="size-3 text-muted-foreground/40" />
      <code className="rounded-md bg-muted/40 px-1.5 py-0.5 font-mono text-[12px] font-medium text-muted-foreground/70 break-all border border-border/10">
        {ctx.formatted.text}
      </code>
    </div>,
  );
}

/** Rendu de date/heure avec icône calendrier. */
function renderDateTime(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
      <Calendar className="size-3.5 text-muted-foreground/50" />
      <span className="text-sm font-medium">{ctx.formatted.text}</span>
    </div>,
  );
}

/** Rendu de durée avec icône horloge. */
function renderDuration(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
      <Clock className="size-3.5 text-muted-foreground/50" />
      <span className="text-sm font-medium">{ctx.formatted.text}</span>
    </div>,
  );
}

/** Rendu de taille en octets avec icône base de données. */
function renderBytes(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
      <Database className="size-3.5 text-muted-foreground/50" />
      <span className="text-sm font-medium">{ctx.formatted.text}</span>
    </div>,
  );
}

/** Rendu de valeur monétaire. */
function renderCurrency(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
      <Banknote className="size-3.5 text-muted-foreground/50" />
      <span className="text-sm font-semibold text-foreground">
        {ctx.formatted.text}
      </span>
    </div>,
  );
}

/** Rendu de référence d'entité. */
function renderEntityRef(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = (ctx.formatted.normalized || {}) as {
    id?: string | number;
    label?: string;
    href?: string;
  };
  const text = normalized.label || String(normalized.id || ctx.formatted.text);
  const fieldWithHref = normalized.href
    ? { ...ctx.field, link: { ...ctx.field.link, href: normalized.href } }
    : ctx.field;
  return renderInteractiveText({ ...ctx, field: fieldWithHref }, text);
}

/** Génère les initiales d'un nom d'utilisateur. */
function userInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase() || "U";
}

/** Rendu de référence utilisateur avec avatar. */
function renderUser(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = (ctx.formatted.normalized || {}) as {
    id?: string | number;
    name?: string;
    avatarUrl?: string;
    role?: string;
    href?: string;
  };
  const displayName =
    normalized.name || String(normalized.id || ctx.formatted.text);
  const fieldWithHref = normalized.href
    ? { ...ctx.field, link: { ...ctx.field.link, href: normalized.href } }
    : ctx.field;

  return (
    <div className="flex items-center gap-2.5 py-1">
      <Avatar className="size-8 border border-border/30 shadow-sm">
        <AvatarImage src={normalized.avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-primary/5 text-[10px] font-semibold text-primary">
          {userInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 gap-0.5">
        <div className="flex items-center gap-1.5">
          {renderInteractiveText(
            { ...ctx, field: fieldWithHref },
            displayName,
            "text-sm font-medium",
          )}
          {normalized.role ? (
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[9px] font-medium border-primary/15 bg-primary/5 text-primary"
            >
              {normalized.role}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Rendu de valeur de type lien (URL, email, téléphone). */
function renderLinkLikeValue(
  ctx: UnitFieldRenderCtx,
  hrefPrefix?: string,
): React.ReactNode {
  const href =
    ctx.field.link?.href ||
    (typeof ctx.formatted.normalized === "string"
      ? `${hrefPrefix || ""}${ctx.formatted.normalized}`
      : undefined);
  const text = ctx.formatted.text || href || resolveLabelText(ctx.field);
  const fieldWithHref = href
    ? { ...ctx.field, link: { ...ctx.field.link, href } }
    : ctx.field;
  return renderInteractiveText({ ...ctx, field: fieldWithHref }, text);
}

/** Rendu d'image avec overlay au survol. */
function renderImage(ctx: UnitFieldRenderCtx): React.ReactNode {
  const image = (ctx.formatted.normalized || {}) as {
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  if (!image.src)
    return (
      <span className="text-sm italic text-muted-foreground/40">
        {ctx.formatted.text}
      </span>
    );

  const content = (
    <div className="group/img relative overflow-hidden rounded-lg border border-border/30 shadow-sm transition-all hover:shadow-md">
      <img
        src={image.src}
        alt={image.alt || resolveLabelText(ctx.field)}
        width={image.width || 80}
        height={image.height || 80}
        className="unit-field-image aspect-square h-20 w-20 object-cover transition-transform duration-300 group-hover/img:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity duration-200 group-hover/img:opacity-100">
        <ExternalLink className="size-5 text-white" />
      </div>
    </div>
  );

  if (ctx.field.link?.onClick || ctx.onClickValue) {
    return (
      <button
        type="button"
        onClick={() => {
          if (ctx.field.disabled) return;
          ctx.field.link?.onClick?.();
          ctx.onClickValue?.(ctx.field);
        }}
        aria-label={
          ctx.field.link?.ariaLabel || `Open ${resolveLabelText(ctx.field)}`
        }
        className="inline-flex transition-transform active:scale-[0.97] py-1"
      >
        {content}
      </button>
    );
  }

  if (ctx.field.link?.href) {
    return (
      <a
        href={ctx.field.link.href}
        target={ctx.field.link.external ? "_blank" : undefined}
        rel={ctx.field.link.external ? "noreferrer noopener" : undefined}
        aria-label={
          ctx.field.link.ariaLabel || `Open ${resolveLabelText(ctx.field)}`
        }
        className="inline-flex transition-transform active:scale-[0.97] py-1"
      >
        {content}
      </a>
    );
  }

  return <div className="py-1">{content}</div>;
}

/** Rendu d'avatar. */
function renderAvatar(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = (ctx.formatted.normalized || {}) as {
    src?: string;
    alt?: string;
  };
  const displayName = normalized.alt || resolveLabelText(ctx.field);

  return (
    <div className="py-1">
      <Avatar className="size-12 border border-border/30 shadow-sm">
        <AvatarImage src={normalized.src} alt={displayName} />
        <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground/50">
          {userInitials(displayName)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

/** Rendu de localisation avec lien Google Maps. */
function renderLocation(ctx: UnitFieldRenderCtx): React.ReactNode {
  const location = (ctx.formatted.normalized || {}) as FormattedLocation;
  const mapLink =
    ctx.field.link?.href ||
    location.mapUrl ||
    `https://maps.google.com/?q=${location.lat},${location.lng}`;
  return (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="flex items-center gap-2 font-medium text-foreground/80 text-sm">
        <MapPin className="size-3.5 text-primary/50" />
        <span>{ctx.formatted.text}</span>
      </div>
      {location.lat !== undefined && location.lng !== undefined ? (
        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs font-medium text-primary/70 hover:text-primary transition-colors pl-5"
        >
          View on Map
        </a>
      ) : null}
    </div>
  );
}

/** Résout un badge dynamique depuis la configuration du champ. */
function resolveDynamicBadge(
  field: UnitField,
): { text: string; tone?: UnitFieldTone } | null {
  if (field.badge?.fromValue) return field.badge.fromValue(field.value);
  if (field.badge?.text)
    return { text: field.badge.text, tone: field.badge.tone };
  return null;
}

/** Registre de rendu par type de champ. */
const unitFieldRendererRegistry: Record<
  UnitField["kind"],
  UnitFieldRendererFn
> = {
  text: renderPlainText,
  multiline: renderPlainText,
  richText: renderPlainText,
  code: renderCodeText,
  json: renderJsonText,
  number: renderPlainText,
  integer: renderPlainText,
  currency: renderCurrency,
  percent: renderPlainText,
  ratio: renderPlainText,
  scientific: renderPlainText,
  delta: renderDelta,
  progress: renderProgress,
  rating: renderRating,
  boolean: renderBoolean,
  status: renderBadgeValue,
  health: renderBadgeValue,
  enum: renderPlainText,
  multiEnum: renderTagList,
  tags: renderTagList,
  date: renderDateTime,
  datetime: renderDateTime,
  time: renderDateTime,
  duration: renderDuration,
  relativeTime: renderDuration,
  timezone: renderPlainText,
  bytes: renderBytes,
  fileSize: renderBytes,
  distance: renderPlainText,
  weight: renderPlainText,
  temperature: renderPlainText,
  speed: renderPlainText,
  id: renderMonospaceValue,
  uuid: renderMonospaceValue,
  entityRef: renderEntityRef,
  user: renderUser,
  url: (ctx) => renderLinkLikeValue(ctx),
  email: (ctx) => renderLinkLikeValue(ctx, "mailto:"),
  phone: (ctx) => renderLinkLikeValue(ctx, "tel:"),
  image: renderImage,
  avatar: renderAvatar,
  country: renderPlainText,
  language: renderPlainText,
  location: renderLocation,
  masked: renderMonospaceValue,
  tokenPreview: renderMonospaceValue,
};

type UnitFieldValueProps = {
  ctx: UnitFieldRenderCtx;
};

/**
 * Composant de valeur de champ unitaire.
 * Résout le rendu approprié et ajoute un badge dynamique si configuré.
 */
export function UnitFieldValue({ ctx }: UnitFieldValueProps) {
  const renderer = unitFieldRendererRegistry[ctx.field.kind] || renderPlainText;
  const customNode = ctx.field.render?.(ctx);
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  const dynamicBadge = resolveDynamicBadge(ctx.field);
  const valueNode = customNode !== undefined ? customNode : renderer(ctx);

  return (
    <div
      className={cn(
        "unit-field-value flex min-w-0 items-start gap-2",
        `unit-field-tone-${tone}`,
      )}
    >
      <div className="min-w-0 flex-1">{valueNode}</div>
      {dynamicBadge ? (
        <Badge
          variant={toBadgeVariant(dynamicBadge.tone ?? tone)}
          className="shrink-0 font-medium text-[10px] h-5"
        >
          {dynamicBadge.text}
        </Badge>
      ) : null}
    </div>
  );
}

/** Copie une valeur dans le presse-papier. */
async function copyTextToClipboard(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
  }
}

/**
 * Composant principal de rendu de champ unitaire.
 * Affiche un label, la valeur formatée, un indice optionnel,
 * et un bouton de copie au survol.
 */
export function UnitFieldRenderer({
  field: fieldInput,
  className,
  mode = "labelValue",
  density = "normal",
  defaultLocale,
  defaultTimezone,
  onCopy,
  onClickValue,
}: UnitFieldRendererProps) {
  const field = React.useMemo(
    () => normalizeUnitField(fieldInput),
    [fieldInput],
  );
  const formatted = React.useMemo(
    () => formatFieldValue(field, { defaultLocale, defaultTimezone }),
    [defaultLocale, defaultTimezone, field],
  );
  const labelText = resolveLabelText(field);
  const copyText = resolveCopyText(field, formatted);

  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (!copyText) return;
    try {
      await copyTextToClipboard(copyText);
      setCopied(true);
      onCopy?.(field, copyText);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permissions can fail silently in restricted contexts.
    }
  }, [copyText, field, onCopy]);

  if (field.hidden) return null;

  const ctx: UnitFieldRenderCtx = {
    field,
    formatted,
    mode,
    density,
    defaultLocale,
    defaultTimezone,
    onCopy,
    onClickValue,
  };

  const valueContent = (
    <div className="space-y-1.5">
      <UnitFieldValue ctx={ctx} />
      {field.hint ? (
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground/50 leading-tight pl-0.5">
          <Info className="size-3 shrink-0 mt-0.5 opacity-60" />
          <span>{field.hint}</span>
        </div>
      ) : null}
      {field.disabled && field.disabledReason ? (
        <div className="text-[11px] text-destructive/60 leading-tight pl-0.5 border-l-2 border-destructive/15 ml-0.5">
          {field.disabledReason}
        </div>
      ) : null}
    </div>
  );

  if (mode === "valueOnly") {
    return (
      <div
        data-testid={field.testId}
        className={cn(
          "unit-field unit-field-mode-valueOnly",
          `unit-field-density-${density}`,
          className,
        )}
      >
        {valueContent}
      </div>
    );
  }

  const isWide =
    field.size === "lg" ||
    field.kind === "json" ||
    field.kind === "richText" ||
    field.kind === "multiline";

  return (
    <TooltipProvider delayDuration={300}>
      <dl
        data-testid={field.testId}
        className={cn(
          "unit-field group/field relative min-w-0 transition-colors rounded-lg",
          `unit-field-kind-${field.kind}`,
          `unit-field-size-${field.size}`,
          `unit-field-align-${field.align}`,
          `unit-field-density-${density}`,
          density === "compact" ? "py-1.5" : "py-2.5 px-2 hover:bg-muted/20",
          className,
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col gap-1",
            field.align === "end" && "items-end",
          )}
        >
          {/* Label et bouton copier */}
          <div className="flex w-full items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5">
              <Label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                {field.label}
              </Label>
              {field.required ? (
                <span
                  aria-hidden="true"
                  className="text-destructive text-[11px]"
                >
                  *
                </span>
              ) : null}
            </dt>

            {field.copyable && copyText && !formatted.isEmpty ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-6 rounded-md opacity-0 transition-all group-hover/field:opacity-100 hover:bg-muted",
                      copied &&
                        "opacity-100 text-emerald-600 hover:text-emerald-600 bg-emerald-50",
                    )}
                    onClick={handleCopy}
                    disabled={field.disabled}
                  >
                    {copied ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span className="sr-only">Copy {labelText}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-medium">
                  {copied ? "Copied!" : "Copy"}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          {/* Valeur */}
          <dd
            className={cn(
              "text-sm leading-relaxed",
              field.align === "end" ? "text-right" : "text-left",
              formatted.isEmpty
                ? "italic text-muted-foreground/30"
                : "text-foreground/90",
              isWide ? "w-full" : "max-w-prose",
            )}
          >
            {formatted.isEmpty ? field.emptyText || "" : valueContent}
          </dd>
        </div>
      </dl>
    </TooltipProvider>
  );
}

export default UnitFieldRenderer;
