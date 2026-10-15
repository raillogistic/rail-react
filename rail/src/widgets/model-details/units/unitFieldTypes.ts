import type React from "react";

export type UnitFieldKind =
  | "text"
  | "multiline"
  | "richText"
  | "code"
  | "json"
  | "number"
  | "integer"
  | "currency"
  | "percent"
  | "ratio"
  | "scientific"
  | "delta"
  | "progress"
  | "rating"
  | "boolean"
  | "status"
  | "health"
  | "enum"
  | "multiEnum"
  | "tags"
  | "date"
  | "datetime"
  | "time"
  | "duration"
  | "relativeTime"
  | "timezone"
  | "bytes"
  | "fileSize"
  | "distance"
  | "weight"
  | "temperature"
  | "speed"
  | "id"
  | "uuid"
  | "entityRef"
  | "user"
  | "url"
  | "email"
  | "phone"
  | "image"
  | "avatar"
  | "country"
  | "language"
  | "location"
  | "masked"
  | "tokenPreview";

export type UnitFieldTone =
  | "default"
  | "muted"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type UnitFieldSize = "sm" | "md" | "lg";
export type UnitFieldAlign = "start" | "end";
export type UnitFieldMode = "labelValue" | "valueOnly";
export type UnitFieldDensity = "compact" | "normal";

export type UnitFieldNullBehavior = "empty" | "dash" | "custom";
export type UnitFieldSignDisplay = Intl.NumberFormatOptions["signDisplay"];
export type UnitFieldNotation = Intl.NumberFormatOptions["notation"];
export type UnitFieldDateStyle = Intl.DateTimeFormatOptions["dateStyle"];
export type UnitFieldTimeStyle = Intl.DateTimeFormatOptions["timeStyle"];

export type UnitFieldDurationInputUnit = "ms" | "s" | "m" | "h" | "d";
export type UnitFieldDurationStyle = "compact" | "verbose";

export type UnitFieldDistanceUnit = "m" | "km" | "mi";
export type UnitFieldWeightUnit = "g" | "kg" | "lb";
export type UnitFieldTemperatureUnit = "C" | "F";
export type UnitFieldSpeedUnit = "m/s" | "km/h" | "mph";

export type UnitFieldProgressShape = {
  current: number;
  total: number;
};

export type UnitFieldEntityRefValue = {
  id?: string | number | null;
  label?: string | null;
  href?: string | null;
};

export type UnitFieldUserValue = {
  id?: string | number | null;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  href?: string | null;
};

export type UnitFieldLocationValue = {
  lat?: number | null;
  lng?: number | null;
  label?: string | null;
  mapUrl?: string | null;
};

export type UnitFieldImageValue =
  | string
  | {
      src?: string | null;
      alt?: string | null;
      width?: number | null;
      height?: number | null;
    };

export type UnitFieldNumberFormat = {
  decimals?: number;
  compact?: boolean;
  thousandsSeparator?: boolean;
  signDisplay?: UnitFieldSignDisplay;
  notation?: UnitFieldNotation;
};

export type UnitFieldCurrencyFormat = {
  currencyCode?: string;
  currencyDisplay?: Intl.NumberFormatOptions["currencyDisplay"];
  decimals?: number;
};

export type UnitFieldPercentFormat = {
  percentBase?: 1 | 100;
  clamp?: boolean;
  decimals?: number;
  showBar?: boolean;
};

export type UnitFieldProgressFormat = {
  percentBase?: 1 | 100;
  clamp?: boolean;
  showBar?: boolean;
  decimals?: number;
};

export type UnitFieldDateTimeFormat = {
  timezone?: string;
  dateStyle?: UnitFieldDateStyle;
  timeStyle?: UnitFieldTimeStyle;
  hour12?: boolean;
};

export type UnitFieldDurationFormat = {
  inputUnit?: UnitFieldDurationInputUnit;
  style?: UnitFieldDurationStyle;
};

export type UnitFieldBytesFormat = {
  base?: 1000 | 1024;
  precision?: number;
};

export type UnitFieldEnumFormat = {
  labels?: Record<string, string>;
  unknownLabel?: string;
};

export type UnitFieldBooleanFormat = {
  trueLabel?: string;
  falseLabel?: string;
};

export type UnitFieldMaskFormat = {
  maskPattern?: "last4" | "email" | "phone" | string;
  keepStart?: number;
  keepEnd?: number;
  maskChar?: string;
  customMaskFn?: (value: string) => string;
};

export type UnitFieldTokenFormat = UnitFieldMaskFormat & {
  displayValue?: string;
};

export type UnitFieldRatingFormat = {
  max?: number;
  precision?: number;
};

export type UnitFieldMeasurementFormat = {
  inputUnit?:
    | UnitFieldDistanceUnit
    | UnitFieldWeightUnit
    | UnitFieldTemperatureUnit
    | UnitFieldSpeedUnit;
  outputUnit?:
    | UnitFieldDistanceUnit
    | UnitFieldWeightUnit
    | UnitFieldTemperatureUnit
    | UnitFieldSpeedUnit
    | "auto";
  decimals?: number;
};

export type UnitFieldUrlFormat = {
  displayDomain?: boolean;
};

export type UnitFieldLocationFormat = {
  mapLinkTemplate?: string;
};

export type UnitFieldFormat = {
  locale?: string;
  nullBehavior?: UnitFieldNullBehavior;
  customEmptyText?: string;
  number?: UnitFieldNumberFormat;
  currency?: UnitFieldCurrencyFormat;
  percent?: UnitFieldPercentFormat;
  progress?: UnitFieldProgressFormat;
  dateTime?: UnitFieldDateTimeFormat;
  duration?: UnitFieldDurationFormat;
  bytes?: UnitFieldBytesFormat;
  enum?: UnitFieldEnumFormat;
  boolean?: UnitFieldBooleanFormat;
  masked?: UnitFieldMaskFormat;
  token?: UnitFieldTokenFormat;
  rating?: UnitFieldRatingFormat;
  distance?: UnitFieldMeasurementFormat;
  weight?: UnitFieldMeasurementFormat;
  temperature?: UnitFieldMeasurementFormat;
  speed?: UnitFieldMeasurementFormat;
  url?: UnitFieldUrlFormat;
  location?: UnitFieldLocationFormat;
};

export type UnitFieldLink = {
  href?: string;
  onClick?: () => void;
  external?: boolean;
  ariaLabel?: string;
};

export type UnitFieldBadge = {
  text?: string;
  tone?: UnitFieldTone;
  fromValue?: (value: unknown) => { text: string; tone?: UnitFieldTone };
};

export type UnitFieldFormattedValue = {
  text: string;
  normalized: unknown;
  isEmpty: boolean;
};

export type UnitField = {
  id: string;
  label: string | React.ReactNode;
  value: unknown;
  kind: UnitFieldKind;
  hint?: React.ReactNode;
  hidden?: boolean;
  required?: boolean;
  emptyText: string;
  tone?: UnitFieldTone;
  size?: UnitFieldSize;
  align?: UnitFieldAlign;
  copyable?: boolean;
  copyValue?: string;
  disabled?: boolean;
  disabledReason?: string;
  format?: UnitFieldFormat;
  link?: UnitFieldLink;
  badge?: UnitFieldBadge;
  testId?: string;
  render?: (ctx: UnitFieldRenderCtx) => React.ReactNode;
};

export type UnitFieldInput = Omit<UnitField, "emptyText"> & {
  emptyText?: string;
};

export type FormatFieldValueOptions = {
  defaultLocale?: string;
  defaultTimezone?: string;
  now?: Date;
};

export type UnitFieldRendererProps = {
  field: UnitFieldInput;
  className?: string;
  mode?: UnitFieldMode;
  density?: UnitFieldDensity;
  defaultLocale?: string;
  defaultTimezone?: string;
  onCopy?: (field: UnitField, copiedText: string) => void;
  onClickValue?: (field: UnitField) => void;
};

export type UnitFieldRenderCtx = {
  field: UnitField;
  formatted: UnitFieldFormattedValue;
  mode: UnitFieldMode;
  density: UnitFieldDensity;
  defaultLocale?: string;
  defaultTimezone?: string;
  onClickValue?: (field: UnitField) => void;
  onCopy?: (field: UnitField, copiedText: string) => void;
};

export type UnitFieldRendererFn = (ctx: UnitFieldRenderCtx) => React.ReactNode;
