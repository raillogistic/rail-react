/**
 * @module transtevTheme
 * @description Theme definition for "transtev", based on the company logo colors (Navy Blue, Green & Orange).
 */

import type { ThemeDefinition } from "../types";

export const transtevTheme: ThemeDefinition = {
  name: "transtev",
  label: "Transtev",
  radius: "0.375rem",
  light: {
    background: "#ffffff",
    foreground: "#0f172a",
    card: "#ffffff",
    cardForeground: "#0f172a",
    popover: "#ffffff",
    popoverForeground: "#0f172a",
    primary: "#252852", // Corporate Navy Blue
    primaryForeground: "#ffffff",
    secondary: "#f1f5f9",
    secondaryForeground: "#1e293b",
    muted: "#f1f5f9",
    mutedForeground: "#64748b",
    accent: "#2a9d49", // Corporate Green
    accentForeground: "#ffffff",
    destructive: "#e65925", // Corporate Orange from Arabic text (used for destructive/warning)
    destructiveForeground: "#ffffff",
    border: "#e2e8f0",
    input: "#ffffff",
    ring: "#2a9d49",
    chart1: "#252852", // Navy
    chart2: "#2a9d49", // Green
    chart3: "#e65925", // Orange
    chart4: "#4f46e5", // Indigo
    chart5: "#64748b", // Slate
    sidebar: "#f8fafc",
    sidebarForeground: "#0f172a",
    sidebarPrimary: "#252852",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#f1f5f9",
    sidebarAccentForeground: "#2a9d49",
    sidebarBorder: "#e2e8f0",
    sidebarRing: "#252852",
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
      "--transtev-shadow": "0 4px 14px 0 rgba(37, 40, 82, 0.08)",
    },
  },
  dark: {
    background: "#020617",
    foreground: "#f8fafc",
    card: "#0f172a",
    cardForeground: "#f8fafc",
    popover: "#0f172a",
    popoverForeground: "#f8fafc",
    primary: "#4a55c2", // Brighter navy blue for dark mode visibility
    primaryForeground: "#ffffff",
    secondary: "#1e293b",
    secondaryForeground: "#f1f5f9",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    accent: "#38b859", // Brighter Green
    accentForeground: "#ffffff",
    destructive: "#f76b36", // Brighter Orange
    destructiveForeground: "#ffffff",
    border: "#1e293b",
    input: "#0f172a",
    ring: "#38b859",
    chart1: "#4a55c2", // Navy
    chart2: "#38b859", // Green
    chart3: "#f76b36", // Orange
    chart4: "#6366f1", // Indigo
    chart5: "#94a3b8", // Slate
    sidebar: "#090d18", // Very dark navy-slate
    sidebarForeground: "#cbd5e1",
    sidebarPrimary: "#4a55c2",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#1e293b",
    sidebarAccentForeground: "#38b859",
    sidebarBorder: "#1e293b",
    sidebarRing: "#4a55c2",
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
      "--transtev-shadow": "0 4px 14px 0 rgba(0, 0, 0, 0.5)",
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
      box-shadow: var(--transtev-shadow) !important;
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
    /* Primary buttons use the corporate navy blue */
    [data-theme="transtev"] [data-slot="button"][data-variant="default"] {
       background-color: var(--primary) !important;
       color: var(--primary-foreground) !important;
    }
    [data-theme="transtev"] [data-slot="button"][data-variant="default"]:hover {
       background-color: color-mix(in srgb, var(--primary) 85%, black) !important;
       box-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 40%, transparent) !important;
    }

    /* Accent uses the corporate green */
    [data-theme="transtev"] [data-slot="button"][data-variant="outline"]:hover,
    [data-theme="transtev"] [data-slot="button"][data-variant="secondary"]:hover {
       background-color: var(--accent) !important;
       color: var(--accent-foreground) !important;
       border-color: var(--accent) !important;
    }

    [data-theme="transtev"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--background) !important;
      color: var(--accent) !important;
      border-bottom: 2px solid var(--accent) !important;
      border-radius: 0.25rem 0.25rem 0 0 !important;
    }

    [data-theme="transtev"] [data-slot="input"]:focus-visible {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 1px var(--accent) !important;
      outline: none !important;
    }

    [data-theme="transtev"] table th {
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
