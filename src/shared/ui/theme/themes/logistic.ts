/**
 * @module logisticTheme
 * @description Theme definition for "logistic", based on the company logo colors (Blue & Orange).
 */

import type { ThemeDefinition } from "../types";

export const logisticTheme: ThemeDefinition = {
  name: "logistic",
  label: "Logistic",
  radius: "0.375rem",
  light: {
    background: "#ffffff",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    popover: "#ffffff",
    popoverForeground: "#0f172a",
    primary: "#1e3a8a", // Corporate Blue
    primaryForeground: "#ffffff",
    secondary: "#f1f5f9",
    secondaryForeground: "#1e293b",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    accent: "#f97316", // Vibrant Orange
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#e2e8f0",
    input: "#ffffff",
    ring: "#f97316",
    chart1: "#1e3a8a", // Blue
    chart2: "#f97316", // Orange
    chart3: "#3b82f6", // Lighter Blue
    chart4: "#fb923c", // Lighter Orange
    chart5: "#64748b", // Slate
    sidebar: "#f8fafc",
    sidebarForeground: "#0f172a",
    sidebarPrimary: "#1e3a8a",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#f1f5f9",
    sidebarAccentForeground: "#f97316",
    sidebarBorder: "#e2e8f0",
    sidebarRing: "#1e3a8a",
    navbar: "#ffffff",
    navbarForeground: "#0f172a",
    inputBackground: "#ffffff",
    tableHeader: "#f8fafc",
    tableHeaderForeground: "#64748b",
    tableRowHover: "#f1f5f9",
    tableRowSelected: "#e0e7ff",
    dialog: "#ffffff",
    dialogForeground: "#0f172a",
    sheet: "#ffffff",
    sheetForeground: "#0f172a",
    command: "#ffffff",
    commandForeground: "#0f172a",
    dropdown: "#ffffff",
    dropdownForeground: "#0f172a",
    cssVars: {
      "--logistic-shadow": "0 4px 14px 0 rgba(30, 58, 138, 0.08)",
    },
  },
  dark: {
    background: "#020617",
    foreground: "#f8fafc",
    card: "#0f172a",
    cardForeground: "#f8fafc",
    popover: "#0f172a",
    popoverForeground: "#f8fafc",
    primary: "#3b82f6", // Brighter blue for dark mode visibility
    primaryForeground: "#ffffff",
    secondary: "#1e293b",
    secondaryForeground: "#f1f5f9",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    accent: "#f97316", // Vibrant Orange
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#1e293b",
    input: "#0f172a",
    ring: "#f97316",
    chart1: "#3b82f6", // Blue
    chart2: "#f97316", // Orange
    chart3: "#60a5fa", // Lighter Blue
    chart4: "#fb923c", // Lighter Orange
    chart5: "#94a3b8", // Slate
    sidebar: "#090d18", // Very dark blue-slate
    sidebarForeground: "#cbd5e1",
    sidebarPrimary: "#3b82f6",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#1e293b",
    sidebarAccentForeground: "#f97316",
    sidebarBorder: "#1e293b",
    sidebarRing: "#3b82f6",
    navbar: "#090d18",
    navbarForeground: "#cbd5e1",
    inputBackground: "#0f172a",
    tableHeader: "#0f172a",
    tableHeaderForeground: "#94a3b8",
    tableRowHover: "#1e293b",
    tableRowSelected: "#1e3a8a",
    dialog: "#0f172a",
    dialogForeground: "#f8fafc",
    sheet: "#0f172a",
    sheetForeground: "#f8fafc",
    command: "#0f172a",
    commandForeground: "#f8fafc",
    dropdown: "#0f172a",
    dropdownForeground: "#f8fafc",
    cssVars: {
      "--logistic-shadow": "0 4px 14px 0 rgba(0, 0, 0, 0.5)",
    },
  },
  components: {
    button: `
      font-weight: 600 !important;
      transition: all 0.2s ease !important;
      border-radius: 0.375rem !important;
    `,
    input: `
      border-radius: 0.375rem !important;
      transition: all 0.2s ease !important;
    `,
    card: `
      border-radius: 0.5rem !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--logistic-shadow) !important;
    `,
    navbar: `
      border-bottom: 2px solid var(--accent) !important;
    `,
    "tabs-list": `
      background: var(--muted) !important;
      border-radius: 0.375rem !important;
    `,
    "tabs-trigger": `
      border-radius: 0.25rem !important;
      font-weight: 500 !important;
    `,
  },
  customCss: `
    /* Primary buttons use the corporate blue */
    [data-theme="logistic"] [data-slot="button"][data-variant="default"] {
       background-color: var(--primary) !important;
       color: var(--primary-foreground) !important;
    }
    [data-theme="logistic"] [data-slot="button"][data-variant="default"]:hover {
       background-color: color-mix(in srgb, var(--primary) 90%, black) !important;
       box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 40%, transparent) !important;
    }

    /* Accent uses the vibrant orange */
    [data-theme="logistic"] [data-slot="button"][data-variant="outline"]:hover,
    [data-theme="logistic"] [data-slot="button"][data-variant="secondary"]:hover {
       background-color: var(--accent) !important;
       color: var(--accent-foreground) !important;
       border-color: var(--accent) !important;
    }

    [data-theme="logistic"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--background) !important;
      color: var(--accent) !important;
      border-bottom: 2px solid var(--accent) !important;
      border-radius: 0.25rem 0.25rem 0 0 !important;
    }

    [data-theme="logistic"] [data-slot="input"]:focus-visible {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 1px var(--accent) !important;
      outline: none !important;
    }

    [data-theme="logistic"] table th {
      background: var(--background) !important;
      color: var(--primary);
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      border-bottom: 2px solid var(--border) !important;
    }
  `,
};
