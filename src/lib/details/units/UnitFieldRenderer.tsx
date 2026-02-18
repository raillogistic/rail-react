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
  User as UserIcon,
  XCircle,
  Banknote,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/components/ui/avatar";
import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
import { Label } from "@/lib/components/ui/label";
import { Progress } from "@/lib/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/lib/components/ui/tooltip";
import { cn } from "@/lib/utils";
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

function resolveLabelText(field: UnitField): string {
  return typeof field.label === "string" ? field.label : field.id;
}

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

function toBadgeVariant(tone: UnitFieldTone): BadgeVariant {
  if (tone === "danger") return "destructive";
  if (tone === "default") return "default";
  if (tone === "muted") return "outline";
  if (tone === "success") return "secondary"; // Or a custom success variant if available
  return "secondary";
}

function resolveFieldTone(field: UnitField, formatted: UnitFieldFormattedValue): UnitFieldTone {
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
          "inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline",
          className,
        )}
      >
        {text}
        {field.link.external && <ExternalLink className="size-3 opacity-70" />}
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
          "inline-flex items-center gap-1 text-left font-semibold text-primary underline-offset-4 hover:underline disabled:no-underline disabled:opacity-60",
          className,
        )}
      >
        {text}
      </button>
    );
  }

  return <span className={cn("font-semibold text-foreground", className)}>{text}</span>;
}

function renderPlainText(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    ctx.formatted.text,
    cn(
      "unit-field-text break-words",
      ctx.field.kind === "multiline" || ctx.field.kind === "richText"
        ? "whitespace-pre-wrap"
        : "",
    ),
  );
}

function renderCodeText(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs whitespace-pre-wrap break-all border border-border/50">
      {ctx.formatted.text}
    </code>,
  );
}

function renderJsonText(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <pre className="rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all shadow-inner">
      {ctx.formatted.text}
    </pre>,
  );
}

function renderBoolean(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = Boolean(ctx.formatted.normalized);
  return (
    <span className="inline-flex items-center gap-1.5 py-0.5">
      {normalized ? (
        <CheckCircle2 className="size-4 text-emerald-500 shadow-sm" />
      ) : (
        <XCircle className="size-4 text-destructive shadow-sm" />
      )}
      <span className="text-sm font-bold tracking-tight">{ctx.formatted.text}</span>
    </span>
  );
}

function renderBadgeValue(ctx: UnitFieldRenderCtx): React.ReactNode {
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  return (
    <Badge
      variant={toBadgeVariant(tone)}
      className={cn(
        "unit-field-badge font-bold uppercase tracking-wider text-[10px] px-2 py-0.5",
        tone === "success" && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
        tone === "warning" && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
      )}
    >
      {ctx.formatted.text}
    </Badge>
  );
}

function renderTagList(ctx: UnitFieldRenderCtx): React.ReactNode {
  const values = Array.isArray(ctx.formatted.normalized)
    ? (ctx.formatted.normalized as string[])
    : [ctx.formatted.text];
  return (
    <span className="inline-flex flex-wrap gap-1.5 py-0.5">
      {values.map((value, index) => (
        <Badge key={`${value}-${index}`} variant="secondary" className="px-2 py-0.5 text-[10px] font-bold">
          {value}
        </Badge>
      ))}
    </span>
  );
}

function renderProgress(ctx: UnitFieldRenderCtx): React.ReactNode {
  const progress = ctx.formatted.normalized as FormattedProgress;
  const clamped = Math.min(100, Math.max(0, progress.percent));
  const showBar = ctx.field.format?.progress?.showBar ?? false;
  return (
    <div className="flex min-w-0 flex-col gap-2 py-0.5">
      <div className="flex items-center justify-between text-xs font-bold">
        <span>{ctx.formatted.text}</span>
        {showBar && <span className="text-muted-foreground/70">{clamped}%</span>}
      </div>
      {showBar ? (
        <Progress
          value={clamped}
          className="h-2 border border-border/20 bg-muted"
          aria-label={`${resolveLabelText(ctx.field)} progress ${ctx.formatted.text}`}
        />
      ) : null}
    </div>
  );
}

function renderRating(ctx: UnitFieldRenderCtx): React.ReactNode {
  const rating = ctx.formatted.normalized as FormattedRating;
  const rounded = Math.round(rating.value);
  const max = rating.max || 5;

  return (
    <div className="inline-flex items-center gap-2.5 py-0.5">
      <div className="flex items-center gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-4",
              i < rounded ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "fill-muted text-muted-foreground/30",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-muted-foreground/70">{ctx.formatted.text}</span>
    </div>
  );
}

function renderDelta(ctx: UnitFieldRenderCtx): React.ReactNode {
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  const numeric = Number(ctx.formatted.normalized);
  const isPositive = numeric > 0;
  const isNegative = numeric < 0;

  return (
    <div className={cn("inline-flex items-center gap-1.5 py-0.5",
      tone === "success" && "text-emerald-600 dark:text-emerald-400",
      tone === "danger" && "text-destructive",
      tone === "warning" && "text-amber-600 dark:text-amber-400"
    )}>
      {isPositive && <TrendingUp className="size-4" />}
      {isNegative && <TrendingDown className="size-4" />}
      <span className="font-extrabold tracking-tight text-sm">{ctx.formatted.text}</span>
    </div>
  );
}

function renderMonospaceValue(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-1.5">
      <Hash className="size-3 text-muted-foreground/50" />
      <code className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] font-bold text-muted-foreground/80 break-all border border-border/10">
        {ctx.formatted.text}
      </code>
    </div>,
  );
}

function renderDateTime(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
      <Calendar className="size-3.5 text-muted-foreground/60" />
      <span className="text-sm">{ctx.formatted.text}</span>
    </div>,
  );
}

function renderDuration(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
      <Clock className="size-3.5 text-muted-foreground/60" />
      <span className="text-sm font-bold tracking-tight">{ctx.formatted.text}</span>
    </div>,
  );
}

function renderBytes(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
      <Database className="size-3.5 text-muted-foreground/60" />
      <span className="text-sm font-bold tracking-tight">{ctx.formatted.text}</span>
    </div>,
  );
}

function renderCurrency(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <div className="flex items-center gap-2 py-0.5">
       <Banknote className="size-3.5 text-muted-foreground/60" />
       <span className="text-sm font-bold tracking-tight text-foreground">{ctx.formatted.text}</span>
    </div>,
  );
}

function renderEntityRef(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = (ctx.formatted.normalized || {}) as {
    id?: string | number;
    label?: string;
    href?: string;
  };
  const text = normalized.label || String(normalized.id || ctx.formatted.text);
  const fieldWithHref = normalized.href ? { ...ctx.field, link: { ...ctx.field.link, href: normalized.href } } : ctx.field;
  return renderInteractiveText({ ...ctx, field: fieldWithHref }, text);
}

function userInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return `${first}${second}`.toUpperCase() || "U";
}

function renderUser(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = (ctx.formatted.normalized || {}) as {
    id?: string | number;
    name?: string;
    avatarUrl?: string;
    role?: string;
    href?: string;
  };
  const displayName = normalized.name || String(normalized.id || ctx.formatted.text);
  const fieldWithHref = normalized.href ? { ...ctx.field, link: { ...ctx.field.link, href: normalized.href } } : ctx.field;

  return (
    <div className="flex items-center gap-3 py-1">
      <Avatar className="size-9 border-2 border-background shadow-sm ring-1 ring-border/50">
        <AvatarImage src={normalized.avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-primary/5 text-[11px] font-extrabold text-primary">
          {userInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 gap-0.5">
        <div className="flex items-center gap-1.5">
          {renderInteractiveText({ ...ctx, field: fieldWithHref }, displayName, "text-sm font-bold")}
          {normalized.role ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
              {normalized.role}
            </Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}

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
  const fieldWithHref = href ? { ...ctx.field, link: { ...ctx.field.link, href } } : ctx.field;
  return renderInteractiveText({ ...ctx, field: fieldWithHref }, text);
}

function renderImage(ctx: UnitFieldRenderCtx): React.ReactNode {
  const image = (ctx.formatted.normalized || {}) as {
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  if (!image.src) return <span className="text-sm italic text-muted-foreground/50">{ctx.formatted.text}</span>;

  const content = (
    <div className="group relative overflow-hidden rounded-lg border-2 border-background shadow-md ring-1 ring-border/50 transition-all hover:shadow-lg">
      <img
        src={image.src}
        alt={image.alt || resolveLabelText(ctx.field)}
        width={image.width || 80}
        height={image.height || 80}
        className="unit-field-image aspect-square h-20 w-20 object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <ExternalLink className="size-6 text-white" />
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
        aria-label={ctx.field.link?.ariaLabel || `Open ${resolveLabelText(ctx.field)}`}
        className="inline-flex transition-transform active:scale-95 py-1"
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
        aria-label={ctx.field.link.ariaLabel || `Open ${resolveLabelText(ctx.field)}`}
        className="inline-flex transition-transform active:scale-95 py-1"
      >
        {content}
      </a>
    );
  }

  return <div className="py-1">{content}</div>;
}

function renderAvatar(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = (ctx.formatted.normalized || {}) as {
    src?: string;
    alt?: string;
  };
  const displayName = normalized.alt || resolveLabelText(ctx.field);

  return (
    <div className="py-1">
      <Avatar className="size-14 border-2 border-background shadow-md ring-1 ring-border/40">
        <AvatarImage src={normalized.src} alt={displayName} />
        <AvatarFallback className="bg-muted text-lg font-black uppercase tracking-tighter text-muted-foreground/50">
          {userInitials(displayName)}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

function renderLocation(ctx: UnitFieldRenderCtx): React.ReactNode {
  const location = (ctx.formatted.normalized || {}) as FormattedLocation;
  const mapLink =
    ctx.field.link?.href ||
    location.mapUrl ||
    `https://maps.google.com/?q=${location.lat},${location.lng}`;
  return (
    <div className="flex flex-col gap-1.5 py-0.5">
      <div className="flex items-center gap-2 font-bold tracking-tight text-foreground/90">
        <MapPin className="size-3.5 text-primary/60" />
        <span>{ctx.formatted.text}</span>
      </div>
      {location.lat !== undefined && location.lng !== undefined ? (
        <a
          href={mapLink}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[11px] font-black uppercase tracking-widest text-primary/80 hover:text-primary transition-colors pl-5"
        >
          View on Map
        </a>
      ) : null}
    </div>
  );
}

function resolveDynamicBadge(field: UnitField): { text: string; tone?: UnitFieldTone } | null {
  if (field.badge?.fromValue) return field.badge.fromValue(field.value);
  if (field.badge?.text) return { text: field.badge.text, tone: field.badge.tone };
  return null;
}

const unitFieldRendererRegistry: Record<UnitField["kind"], UnitFieldRendererFn> = {
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

export function UnitFieldValue({ ctx }: UnitFieldValueProps) {
  const renderer = unitFieldRendererRegistry[ctx.field.kind] || renderPlainText;
  const customNode = ctx.field.render?.(ctx);
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  const dynamicBadge = resolveDynamicBadge(ctx.field);
  const valueNode = customNode !== undefined ? customNode : renderer(ctx);

  return (
    <div
      className={cn(
        "unit-field-value flex min-w-0 items-start gap-3",
        `unit-field-tone-${tone}`,
      )}
    >
      <div className="min-w-0 flex-1">{valueNode}</div>
      {dynamicBadge ? (
        <Badge variant={toBadgeVariant(dynamicBadge.tone ?? tone)} className="shrink-0 font-black uppercase tracking-tighter text-[9px] h-5 shadow-sm">
          {dynamicBadge.text}
        </Badge>
      ) : null}
    </div>
  );
}

async function copyTextToClipboard(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
  }
}

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
  const field = React.useMemo(() => normalizeUnitField(fieldInput), [fieldInput]);
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
    <div className="space-y-2">
      <UnitFieldValue ctx={ctx} />
      {field.hint ? (
        <div className="flex items-start gap-1.5 text-[11px] font-medium text-muted-foreground/60 leading-tight pl-1">
          <Info className="size-3 shrink-0 mt-0.5 opacity-70" />
          <span>{field.hint}</span>
        </div>
      ) : null}
      {field.disabled && field.disabledReason ? (
        <div className="text-[11px] font-bold text-destructive/70 leading-tight pl-1 border-l-2 border-destructive/20 ml-1">
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

  const isWide = field.size === "full" || field.kind === "json" || field.kind === "richText" || field.kind === "multiline";

  return (
    <TooltipProvider delayDuration={400}>
      <dl
        data-testid={field.testId}
        className={cn(
          "unit-field group/field relative min-w-0 transition-all rounded-xl",
          `unit-field-kind-${field.kind}`,
          `unit-field-size-${field.size}`,
          `unit-field-align-${field.align}`,
          `unit-field-density-${density}`,
          density === "compact" ? "py-1" : "py-3 px-1 hover:bg-muted/30",
          className,
        )}
      >
        <div className={cn("flex min-w-0 flex-col gap-1.5", field.align === "end" && "items-end")}>
          <div className="flex w-full items-center justify-between gap-2">
            <dt className="flex items-center gap-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                {field.label}
              </Label>
              {field.required ? (
                <span aria-hidden="true" className="text-destructive font-black text-[11px] -mt-1">
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
                      "size-7 opacity-0 transition-all group-hover/field:opacity-100 hover:bg-background shadow-sm border border-transparent hover:border-border/50",
                      copied && "opacity-100 text-emerald-600 hover:text-emerald-600 border-emerald-200 bg-emerald-50",
                    )}
                    onClick={handleCopy}
                    disabled={field.disabled}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    <span className="sr-only">Copy {labelText}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[10px] font-black uppercase tracking-widest bg-foreground text-background">
                  {copied ? "Copied!" : "Copy to clipboard"}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>

          <dd
            className={cn(
              "text-sm leading-relaxed",
              field.align === "end" ? "text-right" : "text-left",
              formatted.isEmpty ? "italic text-muted-foreground/30 font-normal" : "font-semibold text-foreground/90",
              isWide ? "w-full" : "max-w-prose",
            )}
          >
            {formatted.isEmpty ? field.emptyValue || "" : valueContent}
          </dd>
        </div>
      </dl>
    </TooltipProvider>
  );
}

export default UnitFieldRenderer;
