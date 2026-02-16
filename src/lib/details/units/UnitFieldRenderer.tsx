import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/lib/components/ui/avatar";
import { Badge } from "@/lib/components/ui/badge";
import { Button } from "@/lib/components/ui/button";
import { Progress } from "@/lib/components/ui/progress";
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
        className={cn("underline underline-offset-4", className)}
      >
        {text}
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
          "text-left underline underline-offset-4 disabled:no-underline disabled:opacity-60",
          className,
        )}
      >
        {text}
      </button>
    );
  }

  return <span className={className}>{text}</span>;
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
    <code className="font-mono text-xs whitespace-pre-wrap break-all">
      {ctx.formatted.text}
    </code>,
  );
}

function renderJsonText(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <pre className="font-mono text-xs whitespace-pre-wrap break-all">
      {ctx.formatted.text}
    </pre>,
  );
}

function renderBoolean(ctx: UnitFieldRenderCtx): React.ReactNode {
  const normalized = Boolean(ctx.formatted.normalized);
  const indicator = normalized ? "True" : "False";
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true">{normalized ? "[Y]" : "[N]"}</span>
      {renderInteractiveText(ctx, `${ctx.formatted.text} (${indicator})`)}
    </span>
  );
}

function renderBadgeValue(ctx: UnitFieldRenderCtx): React.ReactNode {
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  return (
    <Badge
      variant={toBadgeVariant(tone)}
      className={cn("unit-field-badge", `unit-field-tone-${tone}`)}
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
    <span className="inline-flex flex-wrap gap-1">
      {values.map((value, index) => (
        <Badge key={`${value}-${index}`} variant="outline">
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
    <div className="flex min-w-0 flex-col gap-1">
      <span>{ctx.formatted.text}</span>
      {showBar ? (
        <Progress
          value={clamped}
          aria-label={`${resolveLabelText(ctx.field)} progress ${ctx.formatted.text}`}
        />
      ) : null}
    </div>
  );
}

function renderRating(ctx: UnitFieldRenderCtx): React.ReactNode {
  const rating = ctx.formatted.normalized as FormattedRating;
  const rounded = Math.round(rating.value);
  const stars = `${"★".repeat(rounded)}${"☆".repeat(Math.max(0, rating.max - rounded))}`;
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true">{stars}</span>
      <span>{ctx.formatted.text}</span>
    </span>
  );
}

function renderDelta(ctx: UnitFieldRenderCtx): React.ReactNode {
  const tone = resolveFieldTone(ctx.field, ctx.formatted);
  const numeric = Number(ctx.formatted.normalized);
  const deltaText =
    Number.isFinite(numeric) && numeric > 0
      ? "Increase"
      : Number.isFinite(numeric) && numeric < 0
        ? "Decrease"
        : "No change";
  return (
    <span className={cn("inline-flex items-center gap-2", `unit-field-tone-${tone}`)}>
      <span>{ctx.formatted.text}</span>
      <Badge variant={toBadgeVariant(tone)}>{deltaText}</Badge>
    </span>
  );
}

function renderMonospaceValue(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderInteractiveText(
    ctx,
    <code className="font-mono text-xs break-all">{ctx.formatted.text}</code>,
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
    <span className="inline-flex items-center gap-2">
      <Avatar className="size-7">
        <AvatarImage src={normalized.avatarUrl} alt={displayName} />
        <AvatarFallback>{userInitials(displayName)}</AvatarFallback>
      </Avatar>
      <span className="inline-flex items-center gap-1">
        {renderInteractiveText({ ...ctx, field: fieldWithHref }, displayName)}
        {normalized.role ? <Badge variant="outline">{normalized.role}</Badge> : null}
      </span>
    </span>
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
  if (!image.src) return <span>{ctx.formatted.text}</span>;

  const content = (
    <img
      src={image.src}
      alt={image.alt || resolveLabelText(ctx.field)}
      width={image.width || 64}
      height={image.height || 64}
      className="unit-field-image h-16 w-16 rounded border object-cover"
      loading="lazy"
    />
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
        className="inline-flex"
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
        className="inline-flex"
      >
        {content}
      </a>
    );
  }

  return content;
}

function renderAvatar(ctx: UnitFieldRenderCtx): React.ReactNode {
  return renderImage(ctx);
}

function renderLocation(ctx: UnitFieldRenderCtx): React.ReactNode {
  const location = (ctx.formatted.normalized || {}) as FormattedLocation;
  const mapLink =
    ctx.field.link?.href ||
    location.mapUrl ||
    `https://maps.google.com/?q=${location.lat},${location.lng}`;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{ctx.formatted.text}</span>
      {location.lat !== undefined && location.lng !== undefined ? (
        <a href={mapLink} target="_blank" rel="noreferrer noopener">
          Open map
        </a>
      ) : null}
    </span>
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
  currency: renderPlainText,
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
  date: renderPlainText,
  datetime: renderPlainText,
  time: renderPlainText,
  duration: renderPlainText,
  relativeTime: renderPlainText,
  timezone: renderPlainText,
  bytes: renderPlainText,
  fileSize: renderPlainText,
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
        "unit-field-value flex min-w-0 items-start gap-2",
        `unit-field-tone-${tone}`,
      )}
    >
      <div className="min-w-0 flex-1">{valueNode}</div>
      {dynamicBadge ? (
        <Badge variant={toBadgeVariant(dynamicBadge.tone ?? tone)}>
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

  const handleCopy = React.useCallback(async () => {
    if (!copyText) return;
    try {
      await copyTextToClipboard(copyText);
      onCopy?.(field, copyText);
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
    <>
      <UnitFieldValue ctx={ctx} />
      {field.hint ? (
        <div className="text-xs text-muted-foreground">{field.hint}</div>
      ) : null}
      {field.disabled && field.disabledReason ? (
        <div className="text-xs text-muted-foreground">{field.disabledReason}</div>
      ) : null}
    </>
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

  return (
    <dl
      data-testid={field.testId}
      className={cn(
        "unit-field unit-field-mode-labelValue",
        `unit-field-kind-${field.kind}`,
        `unit-field-size-${field.size}`,
        `unit-field-align-${field.align}`,
        `unit-field-density-${density}`,
        "min-w-0",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <dt className="text-xs text-muted-foreground">
            {field.label}
            {field.required ? (
              <span aria-hidden="true" className="ml-1">
                *
              </span>
            ) : null}
          </dt>
          <dd
            className={cn(
              "mt-1 text-sm",
              field.align === "end" ? "text-right" : "text-left",
              formatted.isEmpty ? "text-muted-foreground" : "",
            )}
          >
            {valueContent}
          </dd>
        </div>
        {field.copyable && copyText ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label={`Copy ${labelText}`}
            onClick={handleCopy}
            disabled={field.disabled}
            className="shrink-0"
          >
            Copy
          </Button>
        ) : null}
      </div>
    </dl>
  );
}

export default UnitFieldRenderer;
