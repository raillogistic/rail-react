import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  formatProgress,
  maskValue,
} from "./unitFieldFormatters";

function compactSpaces(value: string): string {
  return value.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
}

describe("unitFieldFormatters", () => {
  it("formats number with decimal precision", () => {
    expect(formatNumber(12345.678, { decimals: 2 }, "en-US")).toBe("12,345.68");
  });

  it("formats currency with locale and code", () => {
    const value = formatCurrency(
      1234.5,
      { currencyCode: "USD", decimals: 2 },
      "en-US",
    );
    expect(compactSpaces(value || "")).toBe("$1,234.50");
  });

  it("formats percent from base=1 values", () => {
    expect(formatPercent(0.256, { percentBase: 1, decimals: 1 }, "en-US")).toBe(
      "25.6%",
    );
  });

  it("returns empty for invalid datetime input", () => {
    expect(formatDateTime("not-a-date", {}, "en-US", "datetime")).toBeNull();
  });

  it("converts duration units correctly", () => {
    expect(formatDuration(3600, { inputUnit: "s", style: "compact" })).toBe("1h");
  });

  it("formats bytes with base 1000 and 1024", () => {
    expect(formatBytes(1024, { base: 1000, precision: 2 }, "en-US")).toBe(
      "1.02 KB",
    );
    expect(formatBytes(1024, { base: 1024, precision: 2 }, "en-US")).toBe(
      "1.00 KiB",
    );
  });

  it("masks values with keep-end and email patterns", () => {
    expect(maskValue("1234567890", { keepStart: 0, keepEnd: 4, maskChar: "*" })).toBe(
      "******7890",
    );
    expect(maskValue("person@example.com", { maskPattern: "email" })).toMatch(
      /^p\*+n@example\.com$/,
    );
  });

  it("normalizes progress from ratio shape", () => {
    const progress = formatProgress(
      { current: 25, total: 50 },
      { clamp: true, decimals: 0 },
      "en-US",
    );
    expect(progress).not.toBeNull();
    expect(progress?.percent).toBe(50);
    expect(progress?.current).toBe(25);
    expect(progress?.total).toBe(50);
    expect(progress?.text).toBe("50%");
  });
});
