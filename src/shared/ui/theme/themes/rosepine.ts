/**
 * @module rosepineTheme
 * @description Theme definition for "rosepine".
 */

import type { ThemeDefinition } from "../types";

export const rosepineTheme: ThemeDefinition = {
  name: "rosepine",
  label: "Rose Pine",
  radius: "1rem",
  light: {
    background: "#faf4ed",
    foreground: "#575279",
    card: "#fffaf3",
    cardForeground: "#575279",
    popover: "#fffaf3",
    popoverForeground: "#575279",
    primary: "#d7827e",
    primaryForeground: "#faf4ed",
    secondary: "#f2e9e1",
    secondaryForeground: "#575279",
    muted: "#f2e9e1",
    mutedForeground: "#9893a5",
    accent: "#dfdad9",
    accentForeground: "#575279",
    destructive: "#b4637a",
    destructiveForeground: "#faf4ed",
    border: "#dfdad9",
    input: "#ffffff",
    ring: "#d7827e",
    chart1: "#d7827e",
    chart2: "#286983",
    chart3: "#56949f",
    chart4: "#907aa9",
    chart5: "#ea9d34",
    sidebar: "#f2e9e1",
    sidebarForeground: "#575279",
    sidebarPrimary: "#d7827e",
    sidebarPrimaryForeground: "#faf4ed",
    sidebarAccent: "#dfdad9",
    sidebarAccentForeground: "#575279",
    sidebarBorder: "#dfdad9",
    sidebarRing: "#d7827e",
    navbar: "#d7827e",
    navbarForeground: "#faf4ed",
    inputBackground: "#faf4ed",
    tableHeader: "#f2e9e1",
    tableHeaderForeground: "#9893a5",
    tableRowHover: "rgba(215, 130, 126, 0.05)",
    tableRowSelected: "rgba(215, 130, 126, 0.1)",
    dialog: "#fffaf3",
    dialogForeground: "#575279",
    sheet: "#fffaf3",
    sheetForeground: "#575279",
    command: "#fffaf3",
    commandForeground: "#575279",
    dropdown: "#fffaf3",
    dropdownForeground: "#575279",
    cssVars: {
      "--pine-shadow": "0 10px 25px rgba(87, 82, 121, 0.05)",
      "--gold-accent": "#ea9d34",
    },
  },
  dark: {
    background: "#191724",
    foreground: "#e0def4",
    card: "#1f1d2e",
    cardForeground: "#e0def4",
    popover: "#1f1d2e",
    popoverForeground: "#e0def4",
    primary: "#ebbcba",
    primaryForeground: "#191724",
    secondary: "#26233a",
    secondaryForeground: "#e0def4",
    muted: "#26233a",
    mutedForeground: "#908caa",
    accent: "#403d52",
    accentForeground: "#e0def4",
    destructive: "#eb6f92",
    destructiveForeground: "#191724",
    border: "#403d52",
    input: "#1f1d2e",
    ring: "#ebbcba",
    chart1: "#ebbcba",
    chart2: "#31748f",
    chart3: "#9ccfd8",
    chart4: "#c4a7e7",
    chart5: "#f6c177",
    sidebar: "#191724",
    sidebarForeground: "#908caa",
    sidebarPrimary: "#ebbcba",
    sidebarPrimaryForeground: "#191724",
    sidebarAccent: "#26233a",
    sidebarAccentForeground: "#e0def4",
    sidebarBorder: "#403d52",
    sidebarRing: "#ebbcba",
    navbar: "#191724",
    navbarForeground: "#e0def4",
    inputBackground: "#191724",
    tableHeader: "#26233a",
    tableHeaderForeground: "#908caa",
    tableRowHover: "rgba(235, 188, 186, 0.05)",
    tableRowSelected: "rgba(235, 188, 186, 0.1)",
    dialog: "#1f1d2e",
    dialogForeground: "#e0def4",
    sheet: "#1f1d2e",
    sheetForeground: "#e0def4",
    command: "#1f1d2e",
    commandForeground: "#e0def4",
    dropdown: "#1f1d2e",
    dropdownForeground: "#e0def4",
    cssVars: {
      "--pine-shadow": "0 15px 35px rgba(0, 0, 0, 0.3)",
      "--gold-accent": "#f6c177",
    },
  },
  components: {
    button: `
      border-radius: 9999px !important;
      font-weight: 600 !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      color: var(--foreground) !important;
    `,
    input: `
      border-radius: 0.75rem !important;
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
      padding: 0.75rem 1.25rem !important;
    `,
    card: `
      border-radius: 1.5rem !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--pine-shadow) !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 2px solid var(--primary) !important;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    `,
    "tabs-list": `
      background: var(--secondary) !important;
      border-radius: 1rem !important;
      padding: 6px !important;
    `,
    "tabs-trigger": `
      border-radius: 0.75rem !important;
      font-weight: 600 !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      border-radius: 2rem !important;
      border: 2px solid var(--border) !important;
      padding: 40px !important;
    `,
  },
  customCss: `
    [data-theme="rosepine"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
       transform: translateY(-2px);
       box-shadow: 0 5px 15px rgba(215, 130, 126, 0.4) !important;
       border-color: var(--primary) !important;
    }

    [data-theme="rosepine"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--background) !important;
      color: var(--primary) !important;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05) !important;
    }

    [data-theme="rosepine"] table tr {
      border-bottom: 1px solid var(--border) !important;
    }

    [data-theme="rosepine"] table th {
      color: var(--primary);
      text-transform: italic;
      font-family: serif;
      font-size: 1.1rem;
      font-weight: 500;
    }

    [data-theme="rosepine"] .sidebar {
      background: var(--background) !important;
      border-right: 1px solid var(--border) !important;
    }
  `,
};
