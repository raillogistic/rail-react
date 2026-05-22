import type {
  FormatFieldValueOptions,
  UnitField,
  UnitFieldBooleanFormat,
  UnitFieldBytesFormat,
  UnitFieldCurrencyFormat,
  UnitFieldDateTimeFormat,
  UnitFieldDurationFormat,
  UnitFieldDurationInputUnit,
  UnitFieldEnumFormat,
  UnitFieldFormattedValue,
  UnitFieldInput,
  UnitFieldMaskFormat,
  UnitFieldMeasurementFormat,
  UnitFieldPercentFormat,
  UnitFieldProgressFormat,
  UnitFieldProgressShape,
  UnitFieldRatingFormat,
  UnitFieldTokenFormat,
  UnitFieldUserValue,
} from "./unitFieldTypes";

const DEFAULT_EMPTY_TEXT = "-";
const DEFAULT_LOCALE = "en-US";
const DEFAULT_TIMEZONE = "UTC";

const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const relativeTimeFormatterCache = new Map<string, Intl.RelativeTimeFormat>();
const displayNamesCache = new Map<string, Intl.DisplayNames>();

type NumberLike = number | `${number}`;

export type FormattedProgress = {
  percent: number;
  text: string;
  current?: number;
  total?: number;
};

export type FormattedRating = {
  value: number;
  max: number;
  text: string;
};

export type FormattedLocation = {
  lat: number;
  lng: number;
  text: string;
  mapUrl?: string;
};

function cacheKey(locale: string, options: object): string {
  return `${locale}:${JSON.stringify(options)}`;
}

function getNumberFormatter(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = cacheKey(locale, options);
  let formatter = numberFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getDateTimeFormatter(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = cacheKey(locale, options);
  let formatter = dateTimeFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getRelativeTimeFormatter(
  locale: string,
  options: Intl.RelativeTimeFormatOptions,
): Intl.RelativeTimeFormat {
  const key = cacheKey(locale, options);
  let formatter = relativeTimeFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, options);
    relativeTimeFormatterCache.set(key, formatter);
  }
  return formatter;
}

function getDisplayNames(
  locale: string,
  type: "language" | "region",
): Intl.DisplayNames | null {
  if (typeof Intl.DisplayNames !== "function") {
    return null;
  }

  const key = `${locale}:${type}`;
  let formatter = displayNamesCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.DisplayNames([locale], { type });
      displayNamesCache.set(key, formatter);
    } catch {
      return null;
    }
  }
  return formatter;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  return null;
}

function stripRichText(value: string): string {
  return value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeLocale(
  field: UnitField,
  options?: FormatFieldValueOptions,
): string {
  return field.format?.locale || options?.defaultLocale || DEFAULT_LOCALE;
}

function normalizeTimezone(
  field: UnitField,
  options?: FormatFieldValueOptions,
): string {
  return (
    field.format?.dateTime?.timezone ||
    options?.defaultTimezone ||
    DEFAULT_TIMEZONE
  );
}

function resolveEmptyText(field: UnitField): string {
  const behavior = field.format?.nullBehavior;
  if (behavior === "empty") return "";
  if (behavior === "dash") return "-";
  if (behavior === "custom") {
    return field.format?.customEmptyText ?? field.emptyText;
  }
  return field.emptyText;
}

function emptyResult(field: UnitField): UnitFieldFormattedValue {
  return {
    text: resolveEmptyText(field),
    normalized: null,
    isEmpty: true,
  };
}

function nonEmptyResult(
  text: string,
  normalized: unknown = text,
): UnitFieldFormattedValue {
  return {
    text,
    normalized,
    isEmpty: false,
  };
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function normalizeUnitField(field: UnitFieldInput): UnitField {
  return {
    ...field,
    emptyText: field.emptyText ?? DEFAULT_EMPTY_TEXT,
    tone: field.tone ?? "default",
    size: field.size ?? "md",
    align: field.align ?? "start",
    copyable: field.copyable ?? false,
  };
}

export function formatNumber(
  value: unknown,
  format: UnitField["format"]["number"] = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return null;

  const decimals =
    typeof format?.decimals === "number" ? Math.max(0, format.decimals) : null;
  const notation = format?.compact ? "compact" : format?.notation;

  const formatter = getNumberFormatter(locale, {
    notation,
    signDisplay: format?.signDisplay,
    useGrouping:
      typeof format?.thousandsSeparator === "boolean"
        ? format.thousandsSeparator
        : undefined,
    maximumFractionDigits: decimals ?? undefined,
    minimumFractionDigits: decimals ?? undefined,
  });
  return formatter.format(numeric);
}

export function formatCurrency(
  value: unknown,
  format: UnitFieldCurrencyFormat = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return null;

  const decimals =
    typeof format?.decimals === "number" ? Math.max(0, format.decimals) : 2;
  const formatter = getNumberFormatter(locale, {
    style: "currency",
    currency: format.currencyCode || "USD",
    currencyDisplay: format.currencyDisplay || "symbol",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
  return formatter.format(numeric);
}

export function formatPercent(
  value: unknown,
  format: UnitFieldPercentFormat = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return null;

  const base = format.percentBase ?? 1;
  let ratio = base === 100 ? numeric / 100 : numeric;
  if (format.clamp) {
    ratio = clamp(ratio, 0, 1);
  }

  const formatter = getNumberFormatter(locale, {
    style: "percent",
    maximumFractionDigits: format.decimals ?? 0,
    minimumFractionDigits: format.decimals ?? 0,
  });
  return formatter.format(ratio);
}

export function formatDateTime(
  value: unknown,
  format: UnitFieldDateTimeFormat = {},
  locale = DEFAULT_LOCALE,
  kind: "date" | "datetime" | "time" = "datetime",
): string | null {
  const date = toDate(value);
  if (!date) return null;

  const dateStyle = format.dateStyle ?? (kind === "time" ? undefined : "medium");
  const timeStyle =
    format.timeStyle ?? (kind === "date" ? undefined : "short");

  const formatter = getDateTimeFormatter(locale, {
    dateStyle,
    timeStyle,
    hour12: format.hour12,
    timeZone: format.timezone,
  });
  return formatter.format(date);
}

function durationToMs(value: number, unit: UnitFieldDurationInputUnit): number {
  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    case "ms":
    default:
      return value;
  }
}

function pluralize(value: number, singular: string, plural: string): string {
  return `${value} ${Math.abs(value) === 1 ? singular : plural}`;
}

export function formatDuration(
  value: unknown,
  format: UnitFieldDurationFormat = {},
): string | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return null;

  const unit = format.inputUnit ?? "ms";
  const style = format.style ?? "compact";
  let ms = durationToMs(numeric, unit);
  const isNegative = ms < 0;
  ms = Math.abs(ms);

  const day = Math.floor(ms / (24 * 60 * 60 * 1000));
  ms -= day * 24 * 60 * 60 * 1000;
  const hour = Math.floor(ms / (60 * 60 * 1000));
  ms -= hour * 60 * 60 * 1000;
  const minute = Math.floor(ms / (60 * 1000));
  ms -= minute * 60 * 1000;
  const second = Math.floor(ms / 1000);
  ms -= second * 1000;

  const signPrefix = isNegative ? "-" : "";
  if (style === "verbose") {
    const verboseParts = [
      day ? pluralize(day, "day", "days") : null,
      hour ? pluralize(hour, "hour", "hours") : null,
      minute ? pluralize(minute, "minute", "minutes") : null,
      second ? pluralize(second, "second", "seconds") : null,
      !day && !hour && !minute && !second
        ? pluralize(ms, "millisecond", "milliseconds")
        : null,
    ].filter(Boolean);
    return `${signPrefix}${verboseParts.join(" ")}`;
  }

  const compactParts = [
    day ? `${day}d` : null,
    hour ? `${hour}h` : null,
    minute ? `${minute}m` : null,
    second ? `${second}s` : null,
    !day && !hour && !minute && !second ? `${ms}ms` : null,
  ].filter(Boolean);
  return `${signPrefix}${compactParts.join(" ")}`;
}

export function formatBytes(
  value: unknown,
  format: UnitFieldBytesFormat = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return null;

  const base = format.base ?? 1024;
  const precision =
    typeof format.precision === "number" ? Math.max(0, format.precision) : 2;

  const units =
    base === 1000
      ? ["B", "KB", "MB", "GB", "TB", "PB"]
      : ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];

  const abs = Math.abs(numeric);
  let idx = 0;
  let display = abs;

  while (display >= base && idx < units.length - 1) {
    display /= base;
    idx += 1;
  }

  const formatter = getNumberFormatter(locale, {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  });
  const sign = numeric < 0 ? "-" : "";
  return `${sign}${formatter.format(display)} ${units[idx]}`;
}

function maskEmail(value: string): string {
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) return value;
  if (localPart.length <= 2) return `${localPart[0] ?? "*"}*@${domain}`;
  const middleCount = Math.max(1, localPart.length - 2);
  return `${localPart.slice(0, 1)}${"*".repeat(middleCount)}${localPart.slice(-1)}@${domain}`;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  const tail = digits.slice(-4);
  const masked = `${"*".repeat(Math.max(0, digits.length - 4))}${tail}`;
  return masked;
}

export function maskValue(
  value: unknown,
  format: UnitFieldMaskFormat = {},
): string | null {
  const raw = toStringValue(value);
  if (!raw) return null;

  if (typeof format.customMaskFn === "function") {
    return format.customMaskFn(raw);
  }

  if (format.maskPattern === "email") return maskEmail(raw);
  if (format.maskPattern === "phone") return maskPhone(raw);
  if (format.maskPattern === "last4") {
    const tail = raw.slice(-4);
    return `${"*".repeat(Math.max(0, raw.length - 4))}${tail}`;
  }

  const keepStart = Math.max(0, format.keepStart ?? 0);
  const keepEnd = Math.max(0, format.keepEnd ?? 4);
  const maskChar = hasText(format.maskChar) ? format.maskChar[0] : "*";
  const maskedCount = Math.max(0, raw.length - keepStart - keepEnd);
  if (maskedCount <= 0) {
    return maskChar.repeat(raw.length);
  }
  return `${raw.slice(0, keepStart)}${maskChar.repeat(maskedCount)}${raw.slice(raw.length - keepEnd)}`;
}

export function formatTokenPreview(
  value: unknown,
  format: UnitFieldTokenFormat = {},
): string | null {
  if (hasText(format.displayValue)) {
    return format.displayValue;
  }

  return maskValue(value, {
    ...format,
    keepStart: format.keepStart ?? 6,
    keepEnd: format.keepEnd ?? 0,
    maskChar: format.maskChar ?? "*",
  });
}

function parseProgressShape(value: unknown): UnitFieldProgressShape | null {
  if (!value || typeof value !== "object") return null;
  const maybeCurrent = toFiniteNumber(
    (value as Record<string, unknown>).current,
  );
  const maybeTotal = toFiniteNumber((value as Record<string, unknown>).total);
  if (maybeCurrent === null || maybeTotal === null || maybeTotal === 0) {
    return null;
  }
  return { current: maybeCurrent, total: maybeTotal };
}

export function formatProgress(
  value: unknown,
  format: UnitFieldProgressFormat = {},
  locale = DEFAULT_LOCALE,
): FormattedProgress | null {
  const ratioValue = parseProgressShape(value);
  let percent: number;
  let current: number | undefined;
  let total: number | undefined;

  if (ratioValue) {
    current = ratioValue.current;
    total = ratioValue.total;
    percent = (ratioValue.current / ratioValue.total) * 100;
  } else {
    const numeric = toFiniteNumber(value);
    if (numeric === null) return null;
    const base =
      format.percentBase ??
      (Math.abs(numeric) <= 1 ? (1 as const) : (100 as const));
    percent = base === 1 ? numeric * 100 : numeric;
  }

  if (format.clamp) {
    percent = clamp(percent, 0, 100);
  }

  const text =
    formatPercent(percent, { percentBase: 100, decimals: format.decimals }, locale) ||
    `${percent.toFixed(0)}%`;
  return { percent, text, current, total };
}

export function formatRating(
  value: unknown,
  format: UnitFieldRatingFormat = {},
  locale = DEFAULT_LOCALE,
): FormattedRating | null {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return null;

  const max = Math.max(1, format.max ?? 5);
  const precision = Math.max(0, format.precision ?? 1);
  const normalized = clamp(numeric, 0, max);
  const formatter = getNumberFormatter(locale, {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  });

  return {
    value: normalized,
    max,
    text: `${formatter.format(normalized)} / ${formatter.format(max)}`,
  };
}

function normalizeEnumValue(
  value: unknown,
  format: UnitFieldEnumFormat = {},
): string | null {
  const raw = toStringValue(value);
  if (!raw) return null;
  if (format.labels && Object.prototype.hasOwnProperty.call(format.labels, raw)) {
    return format.labels[raw];
  }
  if (format.unknownLabel) {
    return format.unknownLabel;
  }
  return raw;
}

function normalizeBooleanValue(
  value: unknown,
  format: UnitFieldBooleanFormat = {},
): string | null {
  const trueLabel = format.trueLabel ?? "Oui";
  const falseLabel = format.falseLabel ?? "Non";

  if (typeof value === "boolean") {
    return value ? trueLabel : falseLabel;
  }
  if (value === 1 || value === "1" || value === "true") return trueLabel;
  if (value === 0 || value === "0" || value === "false") return falseLabel;
  return null;
}

function normalizeArrayOfStrings(value: unknown): string[] | null {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => toStringValue(item))
      .filter((item): item is string => Boolean(item));
    return normalized.length ? normalized : null;
  }
  if (typeof value === "string" && value.includes(",")) {
    const normalized = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    return normalized.length ? normalized : null;
  }
  const single = toStringValue(value);
  return single ? [single] : null;
}

function normalizeCountryCode(value: unknown): string | null {
  const code = toStringValue(value);
  return code ? code.toUpperCase() : null;
}

function normalizeLanguageCode(value: unknown): string | null {
  const code = toStringValue(value);
  return code ? code.toLowerCase() : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function formatDistanceValue(
  value: unknown,
  format: UnitFieldMeasurementFormat = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const raw = asRecord(value);
  const inputUnit = (raw?.unit as string) || format.inputUnit || "m";
  const parsedValue = toFiniteNumber(raw?.value ?? value);
  if (parsedValue === null) return null;

  const toMeters: Record<string, number> = { m: 1, km: 1000, mi: 1609.344 };
  const meters = parsedValue * (toMeters[inputUnit] ?? 1);

  const outputUnit =
    format.outputUnit && format.outputUnit !== "auto"
      ? format.outputUnit
      : Math.abs(meters) >= 1000
        ? "km"
        : "m";
  const converted = meters / (toMeters[outputUnit] ?? 1);
  const formatted = formatNumber(
    converted,
    { decimals: format.decimals ?? (outputUnit === "m" ? 0 : 2) },
    locale,
  );
  return formatted ? `${formatted} ${outputUnit}` : null;
}

function formatWeightValue(
  value: unknown,
  format: UnitFieldMeasurementFormat = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const raw = asRecord(value);
  const inputUnit = (raw?.unit as string) || format.inputUnit || "g";
  const parsedValue = toFiniteNumber(raw?.value ?? value);
  if (parsedValue === null) return null;

  const toGrams: Record<string, number> = { g: 1, kg: 1000, lb: 453.59237 };
  const grams = parsedValue * (toGrams[inputUnit] ?? 1);
  const outputUnit =
    format.outputUnit && format.outputUnit !== "auto"
      ? format.outputUnit
      : Math.abs(grams) >= 1000
        ? "kg"
        : "g";
  const converted = grams / (toGrams[outputUnit] ?? 1);
  const formatted = formatNumber(
    converted,
    { decimals: format.decimals ?? (outputUnit === "g" ? 0 : 2) },
    locale,
  );
  return formatted ? `${formatted} ${outputUnit}` : null;
}

function formatTemperatureValue(
  value: unknown,
  format: UnitFieldMeasurementFormat = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const raw = asRecord(value);
  const inputUnit = (raw?.unit as string) || format.inputUnit || "C";
  const parsedValue = toFiniteNumber(raw?.value ?? value);
  if (parsedValue === null) return null;

  const celsius = inputUnit === "F" ? ((parsedValue - 32) * 5) / 9 : parsedValue;
  const outputUnit =
    format.outputUnit && format.outputUnit !== "auto"
      ? format.outputUnit
      : inputUnit;
  const converted = outputUnit === "F" ? (celsius * 9) / 5 + 32 : celsius;
  const formatted = formatNumber(
    converted,
    { decimals: format.decimals ?? 1, signDisplay: "auto" },
    locale,
  );
  return formatted ? `${formatted} ${outputUnit}` : null;
}

function formatSpeedValue(
  value: unknown,
  format: UnitFieldMeasurementFormat = {},
  locale = DEFAULT_LOCALE,
): string | null {
  const raw = asRecord(value);
  const inputUnit = (raw?.unit as string) || format.inputUnit || "m/s";
  const parsedValue = toFiniteNumber(raw?.value ?? value);
  if (parsedValue === null) return null;

  const toMetersPerSecond: Record<string, number> = {
    "m/s": 1,
    "km/h": 0.2777777778,
    mph: 0.44704,
  };
  const mps = parsedValue * (toMetersPerSecond[inputUnit] ?? 1);
  const outputUnit =
    format.outputUnit && format.outputUnit !== "auto"
      ? format.outputUnit
      : inputUnit;
  const converted = mps / (toMetersPerSecond[outputUnit] ?? 1);
  const formatted = formatNumber(converted, { decimals: format.decimals ?? 2 }, locale);
  return formatted ? `${formatted} ${outputUnit}` : null;
}

function formatRelativeTime(
  value: unknown,
  locale = DEFAULT_LOCALE,
  now = new Date(),
): string | null {
  let deltaMs: number | null = null;
  if (typeof value === "number") {
    if (Math.abs(value) > 1_000_000_000_000) {
      const date = toDate(value);
      if (!date) return null;
      deltaMs = date.getTime() - now.getTime();
    } else {
      deltaMs = value;
    }
  } else {
    const date = toDate(value);
    if (!date) return null;
    deltaMs = date.getTime() - now.getTime();
  }

  const seconds = deltaMs / 1000;
  const absSeconds = Math.abs(seconds);

  const unitCandidates: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const [unit, factor] =
    unitCandidates.find(([, valueFactor]) => absSeconds >= valueFactor) ||
    unitCandidates[unitCandidates.length - 1];
  const rounded = Math.round(seconds / factor);
  const formatter = getRelativeTimeFormatter(locale, { numeric: "auto" });
  return formatter.format(rounded, unit);
}

export function isValidTimeZone(value: string): boolean {
  try {
    getDateTimeFormatter(DEFAULT_LOCALE, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function formatTimezone(value: unknown, locale = DEFAULT_LOCALE): string | null {
  const timezone = toStringValue(value);
  if (!timezone || !isValidTimeZone(timezone)) return null;

  try {
    const parts = getDateTimeFormatter(locale, {
      timeZone: timezone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === "timeZoneName")?.value;
    return offset ? `${timezone} (${offset})` : timezone;
  } catch {
    return timezone;
  }
}

function formatUrlValue(value: unknown, displayDomain = false): string | null {
  const raw = toStringValue(value);
  if (!raw) return null;

  if (!displayDomain) return raw;
  try {
    const url = new URL(raw);
    return url.hostname;
  } catch {
    return raw;
  }
}

function normalizeLocation(
  value: unknown,
  format: UnitField["format"]["location"] = {},
): FormattedLocation | null {
  let lat: number | null = null;
  let lng: number | null = null;

  if (Array.isArray(value) && value.length >= 2) {
    lat = toFiniteNumber(value[0]);
    lng = toFiniteNumber(value[1]);
  } else if (typeof value === "string" && value.includes(",")) {
    const [rawLat, rawLng] = value.split(",");
    lat = toFiniteNumber(rawLat);
    lng = toFiniteNumber(rawLng);
  } else {
    const record = asRecord(value);
    lat = toFiniteNumber(record?.lat);
    lng = toFiniteNumber(record?.lng);
  }

  if (lat === null || lng === null) return null;
  const text = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  const mapUrl = hasText(format?.mapLinkTemplate)
    ? format.mapLinkTemplate
        .replace("{lat}", String(lat))
        .replace("{lng}", String(lng))
    : undefined;

  return {
    lat,
    lng,
    text,
    mapUrl,
  };
}

function normalizeEntityRef(value: unknown): {
  id?: string | number;
  label?: string;
  href?: string;
} | null {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const id = record.id as string | number | undefined;
    const label = toStringValue(record.label ?? record.name ?? record.title ?? id);
    const href = toStringValue(record.href);
    if (id === undefined && !label) return null;
    return { id, label: label ?? undefined, href: href ?? undefined };
  }

  const text = toStringValue(value);
  return text ? { id: text, label: text } : null;
}

function normalizeUser(value: unknown): UnitFieldUserValue | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const name = toStringValue(record.name ?? record.fullName ?? record.username);
  const id = record.id as string | number | null | undefined;
  if (!name && id === undefined) return null;

  return {
    id,
    name: name ?? undefined,
    avatarUrl: toStringValue(record.avatarUrl ?? record.avatar) ?? undefined,
    role: toStringValue(record.role) ?? undefined,
    href: toStringValue(record.href) ?? undefined,
  };
}

function normalizeImage(value: unknown): {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
} | null {
  if (typeof value === "string") {
    const src = value.trim();
    return src ? { src } : null;
  }
  const record = asRecord(value);
  if (!record) return null;
  const src = toStringValue(record.src ?? record.url);
  if (!src) return null;
  return {
    src,
    alt: toStringValue(record.alt) ?? undefined,
    width: toFiniteNumber(record.width) ?? undefined,
    height: toFiniteNumber(record.height) ?? undefined,
  };
}

function formatJsonValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return trimmed;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}

export function formatFieldValue(
  fieldInput: UnitFieldInput,
  options?: FormatFieldValueOptions,
): UnitFieldFormattedValue {
  const field = normalizeUnitField(fieldInput);
  const locale = normalizeLocale(field, options);
  const timezone = normalizeTimezone(field, options);
  const now = options?.now ?? new Date();

  if (
    field.value === null ||
    field.value === undefined ||
    field.value === "" ||
    (typeof field.value === "number" && Number.isNaN(field.value))
  ) {
    return emptyResult(field);
  }

  switch (field.kind) {
    case "text":
    case "multiline":
    case "code": {
      const text = toStringValue(field.value);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "richText": {
      const text = toStringValue(field.value);
      if (!text) return emptyResult(field);
      const normalized = stripRichText(text);
      return normalized ? nonEmptyResult(normalized, normalized) : emptyResult(field);
    }
    case "json": {
      const text = formatJsonValue(field.value);
      return text ? nonEmptyResult(text, field.value) : emptyResult(field);
    }
    case "number": {
      const text = formatNumber(field.value, field.format?.number, locale);
      return text ? nonEmptyResult(text, toFiniteNumber(field.value)) : emptyResult(field);
    }
    case "scientific": {
      const text = formatNumber(
        field.value,
        { ...field.format?.number, notation: "scientific" },
        locale,
      );
      return text ? nonEmptyResult(text, toFiniteNumber(field.value)) : emptyResult(field);
    }
    case "integer": {
      const text = formatNumber(
        field.value,
        { ...field.format?.number, decimals: 0 },
        locale,
      );
      return text ? nonEmptyResult(text, toFiniteNumber(field.value)) : emptyResult(field);
    }
    case "currency": {
      const text = formatCurrency(field.value, field.format?.currency, locale);
      return text ? nonEmptyResult(text, toFiniteNumber(field.value)) : emptyResult(field);
    }
    case "percent": {
      const text = formatPercent(field.value, field.format?.percent, locale);
      return text ? nonEmptyResult(text, toFiniteNumber(field.value)) : emptyResult(field);
    }
    case "ratio": {
      const progress = formatProgress(
        field.value,
        {
          ...field.format?.progress,
          percentBase: field.format?.progress?.percentBase ?? 1,
        },
        locale,
      );
      if (progress) {
        return nonEmptyResult(progress.text, progress);
      }

      if (Array.isArray(field.value) && field.value.length >= 2) {
        const left = toFiniteNumber(field.value[0]);
        const right = toFiniteNumber(field.value[1]);
        if (left !== null && right !== null) {
          const text = `${left} / ${right}`;
          return nonEmptyResult(text, { current: left, total: right });
        }
      }
      return emptyResult(field);
    }
    case "delta": {
      const numberFormat = {
        ...field.format?.number,
        signDisplay: field.format?.number?.signDisplay ?? "always",
      };
      const text = formatNumber(field.value, numberFormat, locale);
      return text ? nonEmptyResult(text, toFiniteNumber(field.value)) : emptyResult(field);
    }
    case "progress": {
      const progress = formatProgress(field.value, field.format?.progress, locale);
      return progress ? nonEmptyResult(progress.text, progress) : emptyResult(field);
    }
    case "rating": {
      const rating = formatRating(field.value, field.format?.rating, locale);
      return rating ? nonEmptyResult(rating.text, rating) : emptyResult(field);
    }
    case "boolean": {
      const text = normalizeBooleanValue(field.value, field.format?.boolean);
      return text
        ? nonEmptyResult(text, text === (field.format?.boolean?.trueLabel ?? "Oui"))
        : emptyResult(field);
    }
    case "status":
    case "health": {
      const text = toStringValue(field.value);
      return text ? nonEmptyResult(text, text.toLowerCase()) : emptyResult(field);
    }
    case "enum": {
      const text = normalizeEnumValue(field.value, field.format?.enum);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "multiEnum": {
      const values = normalizeArrayOfStrings(field.value);
      if (!values) return emptyResult(field);
      const mapped = values.map((entry) => normalizeEnumValue(entry, field.format?.enum) || entry);
      return nonEmptyResult(mapped.join(", "), mapped);
    }
    case "tags": {
      const values = normalizeArrayOfStrings(field.value);
      return values ? nonEmptyResult(values.join(", "), values) : emptyResult(field);
    }
    case "date": {
      const text = formatDateTime(
        field.value,
        { ...field.format?.dateTime, timezone },
        locale,
        "date",
      );
      return text ? nonEmptyResult(text, toDate(field.value)) : emptyResult(field);
    }
    case "datetime": {
      const text = formatDateTime(
        field.value,
        { ...field.format?.dateTime, timezone },
        locale,
        "datetime",
      );
      return text ? nonEmptyResult(text, toDate(field.value)) : emptyResult(field);
    }
    case "time": {
      const text = formatDateTime(
        field.value,
        { ...field.format?.dateTime, timezone },
        locale,
        "time",
      );
      return text ? nonEmptyResult(text, toDate(field.value)) : emptyResult(field);
    }
    case "duration": {
      const text = formatDuration(field.value, field.format?.duration);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "relativeTime": {
      const text = formatRelativeTime(field.value, locale, now);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "timezone": {
      const text = formatTimezone(field.value, locale);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "bytes":
    case "fileSize": {
      const text = formatBytes(field.value, field.format?.bytes, locale);
      return text ? nonEmptyResult(text, toFiniteNumber(field.value)) : emptyResult(field);
    }
    case "distance": {
      const text = formatDistanceValue(field.value, field.format?.distance, locale);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "weight": {
      const text = formatWeightValue(field.value, field.format?.weight, locale);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "temperature": {
      const text = formatTemperatureValue(
        field.value,
        field.format?.temperature,
        locale,
      );
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "speed": {
      const text = formatSpeedValue(field.value, field.format?.speed, locale);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "id":
    case "uuid": {
      const text = toStringValue(field.value);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "entityRef": {
      const normalized = normalizeEntityRef(field.value);
      if (!normalized) return emptyResult(field);
      return nonEmptyResult(normalized.label || String(normalized.id || ""), normalized);
    }
    case "user": {
      const normalized = normalizeUser(field.value);
      if (!normalized) return emptyResult(field);
      const display = normalized.name || String(normalized.id || "");
      return display ? nonEmptyResult(display, normalized) : emptyResult(field);
    }
    case "url": {
      const text = formatUrlValue(
        field.value,
        field.format?.url?.displayDomain ?? false,
      );
      return text ? nonEmptyResult(text, formatUrlValue(field.value, false)) : emptyResult(field);
    }
    case "email":
    case "phone": {
      const text = toStringValue(field.value);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "image":
    case "avatar": {
      const normalized = normalizeImage(field.value);
      if (!normalized?.src) return emptyResult(field);
      return nonEmptyResult(normalized.alt || normalized.src, normalized);
    }
    case "country": {
      const code = normalizeCountryCode(field.value);
      if (!code) return emptyResult(field);
      const display = getDisplayNames(locale, "region")?.of(code) || code;
      return nonEmptyResult(display, { code, label: display });
    }
    case "language": {
      const code = normalizeLanguageCode(field.value);
      if (!code) return emptyResult(field);
      const display = getDisplayNames(locale, "language")?.of(code) || code;
      return nonEmptyResult(display, { code, label: display });
    }
    case "location": {
      const normalized = normalizeLocation(field.value, field.format?.location);
      return normalized ? nonEmptyResult(normalized.text, normalized) : emptyResult(field);
    }
    case "masked": {
      const text = maskValue(field.value, field.format?.masked);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    case "tokenPreview": {
      const text = formatTokenPreview(field.value, field.format?.token);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
    default: {
      const text = toStringValue(field.value);
      return text ? nonEmptyResult(text, text) : emptyResult(field);
    }
  }
}

export function inferDeltaTone(value: NumberLike | null): UnitField["tone"] {
  const numeric = toFiniteNumber(value);
  if (numeric === null) return "default";
  if (numeric > 0) return "success";
  if (numeric < 0) return "danger";
  return "muted";
}
