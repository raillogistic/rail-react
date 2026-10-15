/**
 * @module evergreenTheme
 * @description Theme definition for "evergreen".
 */

import type { ThemeDefinition } from "../types";

export const evergreenTheme: ThemeDefinition = {
  name: "evergreen",
  label: "Evergreen",
  radius: "0.25rem",
  light: {
    background: "#f4f5f2",
    foreground: "#1a2420",
    card: "#ffffff",
    cardForeground: "#1a2420",
    popover: "#ffffff",
    popoverForeground: "#1a2420",
    primary: "#2d5a27",
    primaryForeground: "#ffffff",
    secondary: "#e8ede7",
    secondaryForeground: "#2d5a27",
    muted: "#eef1ee",
    mutedForeground: "#5c7066",
    accent: "#dce5dc",
    accentForeground: "#1a2420",
    destructive: "#a63a3a",
    destructiveForeground: "#ffffff",
    border: "#dce5dc",
    input: "#ffffff",
    ring: "#2d5a27",
    chart1: "#2d5a27",
    chart2: "#4a7c44",
    chart3: "#70a36a",
    chart4: "#9bc995",
    chart5: "#c7e6c3",
    sidebar: "#e8ede7",
    sidebarForeground: "#1a2420",
    sidebarPrimary: "#2d5a27",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#dce5dc",
    sidebarAccentForeground: "#1a2420",
    sidebarBorder: "#cedbd2",
    sidebarRing: "#2d5a27",
    navbar: "#1a2b18",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#e8ede7",
    tableHeaderForeground: "#5c7066",
    tableRowHover: "#f4f5f2",
    tableRowSelected: "#dce5dc",
    dialog: "#ffffff",
    dialogForeground: "#1a2420",
    sheet: "#ffffff",
    sheetForeground: "#1a2420",
    command: "#ffffff",
    commandForeground: "#1a2420",
    dropdown: "#ffffff",
    dropdownForeground: "#1a2420",
    cssVars: {
      "--forest-glow": "0 4px 15px rgba(45, 90, 39, 0.08)",
      "--wood-accent": "#8b5e3c",
    },
  },
  dark: {
    background: "#0a120b",
    foreground: "#e1e8e2",
    card: "#121d14",
    cardForeground: "#e1e8e2",
    popover: "#0a120b",
    popoverForeground: "#e1e8e2",
    primary: "#4f9d44",
    primaryForeground: "#0a120b",
    secondary: "#162b1b",
    secondaryForeground: "#e1e8e2",
    muted: "#162b1b",
    mutedForeground: "#7fa388",
    accent: "#1d3a24",
    accentForeground: "#e1e8e2",
    destructive: "#7f2d2d",
    destructiveForeground: "#ffffff",
    border: "#1d3a24",
    input: "#162b1b",
    ring: "#4f9d44",
    chart1: "#4f9d44",
    chart2: "#2d5a27",
    chart3: "#70a36a",
    chart4: "#9bc995",
    chart5: "#e1e8e2",
    sidebar: "#060d07",
    sidebarForeground: "#a1c2ac",
    sidebarPrimary: "#4f9d44",
    sidebarPrimaryForeground: "#0a120b",
    sidebarAccent: "#162b1b",
    sidebarAccentForeground: "#e1e8e2",
    sidebarBorder: "#1d3a24",
    sidebarRing: "#4f9d44",
    navbar: "#060d07",
    navbarForeground: "#e1e8e2",
    inputBackground: "#0a120b",
    tableHeader: "#162b1b",
    tableHeaderForeground: "#7fa388",
    tableRowHover: "#162b1b",
    tableRowSelected: "#1d3a24",
    dialog: "#121d14",
    dialogForeground: "#e1e8e2",
    sheet: "#121d14",
    sheetForeground: "#e1e8e2",
    command: "#121d14",
    commandForeground: "#e1e8e2",
    dropdown: "#121d14",
    dropdownForeground: "#e1e8e2",
    cssVars: {
      "--forest-glow": "0 8px 25px rgba(0, 0, 0, 0.4)",
      "--wood-accent": "#a67c52",
    },
  },
  components: {
    button: `
      border-radius: 4px !important;
      font-weight: 600 !important;
      transition: all 0.2s ease !important;
      border: none !important;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
    `,
    input: `
      border-radius: 4px !important;
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
    `,
    card: `
      border-radius: 8px !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--forest-glow) !important;
    `,
    navbar: `
      background: var(--navbar) !important;
      border-bottom: 3px solid var(--primary) !important;
    `,
    "tabs-list": `
      background: var(--secondary) !important;
      border-radius: 6px !important;
      padding: 3px !important;
    `,
    "tabs-trigger": `
      border-radius: 4px !important;
      font-weight: 700 !important;
      transition: all 0.2s ease !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      border-radius: 12px !important;
      border: 1px solid var(--border) !important;
      padding: 30px !important;
    `,
  },
  customCss: `
    [data-theme="evergreen"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       transform: translateY(-1px);
       box-shadow: 0 5px 15px rgba(45, 90, 39, 0.3) !important;
    }

    [data-theme="evergreen"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--background) !important;
      color: var(--primary) !important;
    }

    [data-theme="evergreen"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 8px rgba(45, 90, 39, 0.2) !important;
      outline: none;
    }

    [data-theme="evergreen"] table th {
      background: var(--secondary) !important;
      color: var(--primary);
      text-transform: uppercase;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.1em;
    }
    
    [data-theme="evergreen"] [data-slot="sidebar-link"][data-active="true"] {
      color: var(--primary) !important;
      background: var(--secondary) !important;
      border-right: 4px solid var(--primary) !important;
    }
  `,
};
