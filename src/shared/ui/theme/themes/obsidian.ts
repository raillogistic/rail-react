/**
 * @module obsidianTheme
 * @description Theme definition for "obsidian".
 */

import type { ThemeDefinition } from "../types";

export const obsidianTheme: ThemeDefinition = {
  name: "obsidian",
  label: "Obsidian",
  radius: "0.25rem",
  light: {
    background: "#f4f4f5",
    foreground: "#09090b",
    card: "#ffffff",
    cardForeground: "#09090b",
    popover: "#ffffff",
    popoverForeground: "#09090b",
    primary: "#18181b",
    primaryForeground: "#ffffff",
    secondary: "#f4f4f5",
    secondaryForeground: "#18181b",
    muted: "#f4f4f5",
    mutedForeground: "#71717a",
    accent: "#ff0000", // Tactical red accent
    accentForeground: "#ffffff",
    destructive: "#7f1d1d",
    destructiveForeground: "#ffffff",
    border: "#18181b",
    input: "#ffffff",
    ring: "#18181b",
    chart1: "#18181b",
    chart2: "#71717a",
    chart3: "#ff0000",
    chart4: "#a1a1aa",
    chart5: "#09090b",
    sidebar: "#f4f4f5",
    sidebarForeground: "#18181b",
    sidebarPrimary: "#18181b",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#e4e4e7",
    sidebarAccentForeground: "#18181b",
    sidebarBorder: "#18181b",
    sidebarRing: "#18181b",
    navbar: "#09090b",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#f4f4f5",
    tableHeaderForeground: "#71717a",
    tableRowHover: "#f4f4f5",
    tableRowSelected: "#e4e4e7",
    dialog: "#ffffff",
    dialogForeground: "#09090b",
    sheet: "#ffffff",
    sheetForeground: "#09090b",
    command: "#ffffff",
    commandForeground: "#09090b",
    dropdown: "#ffffff",
    dropdownForeground: "#09090b",
    cssVars: {
      "--tactical-shadow": "0 2px 4px rgba(0, 0, 0, 0.1)",
      "--hexagon-pattern": "radial-gradient(#000000 1px, transparent 1px)",
    },
  },
  dark: {
    background: "#050505",
    foreground: "#fafafa",
    card: "#0a0a0a",
    cardForeground: "#fafafa",
    popover: "#050505",
    popoverForeground: "#fafafa",
    primary: "#ffffff",
    primaryForeground: "#050505",
    secondary: "#0d0d0d",
    secondaryForeground: "#ffffff",
    muted: "#0d0d0d",
    mutedForeground: "#525252",
    accent: "#ff0000", // Tactical red accent
    accentForeground: "#ffffff",
    destructive: "#7f1d1d",
    destructiveForeground: "#ffffff",
    border: "#ffffff",
    input: "#0a0a0a",
    ring: "#ffffff",
    chart1: "#ffffff",
    chart2: "#525252",
    chart3: "#ff0000",
    chart4: "#262626",
    chart5: "#fafafa",
    sidebar: "#000000",
    sidebarForeground: "#525252",
    sidebarPrimary: "#ffffff",
    sidebarPrimaryForeground: "#000000",
    sidebarAccent: "#0a0a0a",
    sidebarAccentForeground: "#ffffff",
    sidebarBorder: "#ffffff33",
    sidebarRing: "#ffffff",
    navbar: "#000000",
    navbarForeground: "#ffffff",
    inputBackground: "#050505",
    tableHeader: "#0d0d0d",
    tableHeaderForeground: "#525252",
    tableRowHover: "#0d0d0d",
    tableRowSelected: "#1a1a1a",
    dialog: "#0a0a0a",
    dialogForeground: "#fafafa",
    sheet: "#0a0a0a",
    sheetForeground: "#fafafa",
    command: "#0a0a0a",
    commandForeground: "#fafafa",
    dropdown: "#0a0a0a",
    dropdownForeground: "#fafafa",
    cssVars: {
      "--tactical-shadow": "0 4px 10px rgba(0, 0, 0, 0.5)",
      "--hexagon-pattern": "radial-gradient(#ffffff0a 1px, transparent 1px)",
    },
  },
  components: {
    button: `
      border-radius: 4px !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.15em !important;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border: 1px solid var(--border) !important;
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      padding: 12px 24px !important;
    `,
    input: `
      border-radius: 4px !important;
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
      color: var(--foreground) !important;
      transition: all 0.2s ease !important;
    `,
    card: `
      border-radius: 6px !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--tactical-shadow) !important;
      position: relative;
      overflow: hidden;
    `,
    "table-header": `
      background: var(--secondary) !important;
      border-bottom: 2px solid var(--accent) !important;
      text-transform: uppercase !important;
      font-weight: 950 !important;
      letter-spacing: 0.1em !important;
      font-size: 0.7rem !important;
    `,
    sidebar: `
      background: var(--background) !important;
      border-right: 1px solid var(--border) !important;
    `,
    "sidebar-inner": `
       background: transparent !important;
    `,
    "sidebar-menu-button": `
       border-radius: 4px !important;
       font-weight: 800 !important;
       text-transform: uppercase !important;
       letter-spacing: 0.05em !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 3px solid var(--accent) !important;
    `,
    "model-table": `
       border: 1px solid var(--border) !important;
       border-radius: 8px !important;
       background: var(--card) !important;
       box-shadow: var(--tactical-shadow) !important;
       overflow: hidden !important;
    `,
    "dropdown-menu-content": `
       border: 2px solid var(--border) !important;
       border-radius: 4px !important;
       background: var(--popover) !important;
       padding: 0 !important;
       box-shadow: var(--tactical-shadow) !important;
    `,
    "dropdown-menu-item": `
       border-radius: 0 !important;
       font-weight: 800 !important;
       text-transform: uppercase !important;
       padding: 12px 20px !important;
       border-bottom: 1px solid var(--border) !important;
    `,
    "tabs-list": `
      background: var(--secondary) !important;
      border-radius: 4px !important;
      padding: 4px !important;
      border: 1px solid var(--border) !important;
      height: auto !important;
    `,
    "tabs-trigger": `
      border-radius: 2px !important;
      font-weight: 800 !important;
      transition: all 0.2s ease !important;
      text-transform: uppercase !important;
      padding: 10px 15px !important;
    `,
    "tabs-content": `
       border: 1px solid var(--border) !important;
       border-top: none !important;
       background: var(--card) !important;
       padding: 30px !important;
    `,
    "model-detail": `
      background: var(--background) !important;
      border: 1px solid var(--border) !important;
      padding: 40px !important;
      border-left: 12px solid var(--accent) !important;
      border-radius: 12px !important;
    `,
  },
  customCss: `
    [data-theme="obsidian"] [data-slot="button"]:hover {
       background: var(--accent) !important;
       color: white !important;
       border-color: var(--accent) !important;
       transform: scale(1.02);
    }

    [data-theme="obsidian"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--accent) !important;
      color: white !important;
    }

    [data-theme="obsidian"] [data-slot="input"]:focus {
      border-color: var(--accent) !important;
      box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.3) !important;
      outline: none;
    }

    [data-theme="obsidian"] table th {
      border-right: 1px solid var(--border) !important;
      border-bottom: 2px solid var(--accent) !important;
      color: var(--primary) !important;
      font-weight: 900 !important;
    }

    [data-theme="obsidian"] [data-slot="dropdown-menu-item"]:focus {
       background: var(--accent) !important;
       color: white !important;
    }

    [data-theme="obsidian"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="obsidian"] [data-slot="sidebar-menu-button"][data-active="true"] {
       background: var(--accent) !important;
       color: white !important;
       border-color: var(--accent) !important;
    }

    [data-theme="obsidian"] [data-slot="card"]::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: var(--hexagon-pattern);
      background-size: 20px 20px;
      pointer-events: none;
      z-index: 0;
      opacity: 0.1;
    }
  `,
};
