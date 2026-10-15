/**
 * @module botanistTheme
 * @description Theme definition for "botanist".
 */

import type { ThemeDefinition } from "../types";

export const botanistTheme: ThemeDefinition = {
  name: "botanist",
  label: "Botanist",
  radius: "1.25rem",
  light: {
    background: "#fdfefb",
    foreground: "#1a1d1a",
    card: "#ffffff",
    cardForeground: "#1a1d1a",
    popover: "#ffffff",
    popoverForeground: "#1a1d1a",
    primary: "#4f722c",
    primaryForeground: "#ffffff",
    secondary: "#f1f5ef",
    secondaryForeground: "#3a4d39",
    muted: "#f4f7f4",
    mutedForeground: "#7a8a7a",
    accent: "#ecf2eb",
    accentForeground: "#3a4d39",
    destructive: "#bc4749",
    destructiveForeground: "#ffffff",
    border: "#e6ede6",
    input: "#fdfefb",
    ring: "#4f722c",
    chart1: "#4f722c",
    chart2: "#3a4d39",
    chart3: "#a9af7e",
    chart4: "#e2e4c0",
    chart5: "#1a1d1a",
    sidebar: "#f8fbf7",
    sidebarForeground: "#1a1d1a",
    sidebarPrimary: "#4f722c",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#ecf2eb",
    sidebarAccentForeground: "#3a4d39",
    sidebarBorder: "#eef2ee",
    sidebarRing: "#4f722c",
    navbar: "#2d3d2c",
    navbarForeground: "#fdfefb",
    inputBackground: "#ffffff",
    tableHeader: "#f8faf7",
    tableHeaderForeground: "#7a8a7a",
    tableRowHover: "#f1f5ef",
    tableRowSelected: "#ecf2eb",
    dialog: "#ffffff",
    dialogForeground: "#1a1d1a",
    sheet: "#ffffff",
    sheetForeground: "#1a1d1a",
    command: "#ffffff",
    commandForeground: "#1a1d1a",
    dropdown: "#ffffff",
    dropdownForeground: "#1a1d1a",
    cssVars: {
      "--leaf-shadow": "0 10px 40px -10px rgba(79, 114, 44, 0.15)",
      "--soft-border": "1px solid rgba(79, 114, 44, 0.1)",
    },
  },
  dark: {
    background: "#0d0f0d",
    foreground: "#e8ede8",
    card: "#151815",
    cardForeground: "#e8ede8",
    popover: "#0d0f0d",
    popoverForeground: "#e8ede8",
    primary: "#7da645",
    primaryForeground: "#0d0f0d",
    secondary: "#1a1d1a",
    secondaryForeground: "#e8ede8",
    muted: "#1a1d1a",
    mutedForeground: "#8fa38f",
    accent: "#222922",
    accentForeground: "#e8ede8",
    destructive: "#d9534f",
    destructiveForeground: "#ffffff",
    border: "#222922",
    input: "#151815",
    ring: "#7da645",
    chart1: "#7da645",
    chart2: "#4f722c",
    chart3: "#a9af7e",
    chart4: "#8fa38f",
    chart5: "#e8ede8",
    sidebar: "#080a08",
    sidebarForeground: "#8fa38f",
    sidebarPrimary: "#7da645",
    sidebarPrimaryForeground: "#0d0f0d",
    sidebarAccent: "#151815",
    sidebarAccentForeground: "#e8ede8",
    sidebarBorder: "#1a1d1a",
    sidebarRing: "#7da645",
    navbar: "#080a08",
    navbarForeground: "#7da645",
    inputBackground: "#0d0f0d",
    tableHeader: "#151815",
    tableHeaderForeground: "#8fa38f",
    tableRowHover: "#1a1d1a",
    tableRowSelected: "#222922",
    dialog: "#151815",
    dialogForeground: "#e8ede8",
    sheet: "#151815",
    sheetForeground: "#e8ede8",
    command: "#151815",
    commandForeground: "#e8ede8",
    dropdown: "#151815",
    dropdownForeground: "#e8ede8",
    cssVars: {
      "--leaf-shadow": "0 10px 40px -10px rgba(0, 0, 0, 0.4)",
      "--soft-border": "1px solid rgba(125, 166, 69, 0.1)",
    },
  },
  components: {
    button: `
      border-radius: 9999px !important;
      font-weight: 600 !important;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      box-shadow: 0 4px 14px 0 rgba(0,0,0,0.05) !important;
    `,
    input: `
      border-radius: 1rem !important;
      background: var(--background) !important;
      border: 1px solid var(--border) !important;
      padding-left: 1.25rem !important;
      padding-right: 1.25rem !important;
    `,
    card: `
      border-radius: 1.5rem !important;
      border: var(--soft-border) !important;
      box-shadow: var(--leaf-shadow) !important;
      background: var(--card) !important;
    `,
    navbar: `
      backdrop-filter: blur(8px);
      background: rgba(45, 61, 44, 0.8) !important;
      margin: 10px !important;
      border-radius: 1.5rem !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    `,
    "tabs-list": `
      background: var(--muted) !important;
      border-radius: 2rem !important;
      padding: 6px !important;
    `,
    "tabs-trigger": `
      border-radius: 1.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      border-radius: 2rem !important;
      padding: 30px !important;
      box-shadow: var(--leaf-shadow) !important;
    `,
  },
  customCss: `
    [data-theme="botanist"] [data-slot="button"]:hover {
       transform: translateY(-2px) scale(1.02);
       box-shadow: 0 8px 30px rgba(79, 114, 44, 0.2) !important;
    }

    [data-theme="botanist"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      box-shadow: 0 4px 12px rgba(79, 114, 44, 0.2) !important;
    }

    [data-theme="botanist"] [data-slot="sidebar-menu-button"]:hover {
      border-radius: 1rem !important;
      background: var(--accent) !important;
    }

    [data-theme="botanist"] table {
      border-collapse: separate !important;
      border-spacing: 0 8px !important;
    }

    [data-theme="botanist"] table tr {
      background: var(--card) !important;
      transition: transform 0.2s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    [data-theme="botanist"] table tr:hover {
      transform: scale(1.005);
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }

    [data-theme="botanist"] table td, [data-theme="botanist"] table th {
      border: none !important;
    }

    [data-theme="botanist"] table td:first-child { border-radius: 1rem 0 0 1rem !important; }
    [data-theme="botanist"] table td:last-child { border-radius: 0 1rem 1rem 0 !important; }
  `,
};
