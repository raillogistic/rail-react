import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";

export function calculateDatePreset(key: string): [string, string?] {
  const now = new Date();
  const today = startOfDay(now);

  switch (key) {
    case "today":
      return [format(today, "yyyy-MM-dd")];
    case "yesterday":
      return [format(subDays(today, 1), "yyyy-MM-dd")];
    case "thisWeek":
      return [
        format(startOfWeek(today), "yyyy-MM-dd"),
        format(endOfWeek(today), "yyyy-MM-dd"),
      ];
    case "lastWeek": {
      const lastWeek = subWeeks(today, 1);
      return [
        format(startOfWeek(lastWeek), "yyyy-MM-dd"),
        format(endOfWeek(lastWeek), "yyyy-MM-dd"),
      ];
    }
    case "thisMonth":
      return [
        format(startOfMonth(today), "yyyy-MM-dd"),
        format(endOfMonth(today), "yyyy-MM-dd"),
      ];
    case "lastMonth": {
      const lastMonth = subMonths(today, 1);
      return [
        format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      ];
    }
    case "thisQuarter":
      return [
        format(startOfQuarter(today), "yyyy-MM-dd"),
        format(endOfQuarter(today), "yyyy-MM-dd"),
      ];
    case "thisYear":
      return [
        format(startOfYear(today), "yyyy-MM-dd"),
        format(endOfYear(today), "yyyy-MM-dd"),
      ];
    case "last30Days":
      return [
        format(subDays(today, 30), "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd"),
      ];
    case "last90Days":
      return [
        format(subDays(today, 90), "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd"),
      ];
    default:
      return [format(today, "yyyy-MM-dd")];
  }
}
