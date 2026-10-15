/**
 * @module nordTheme
 * @description Theme definition for "nord".
 */

import type { ThemeDefinition } from "../types";

export const nordTheme: ThemeDefinition = {
  name: "nord",
  label: "Nord",
  radius: "0.25rem",
  light: {
    background: "#eceff4",
    foreground: "#2e3440",
    card: "#e5e9f0",
    cardForeground: "#2e3440",
    popover: "#eceff4",
    popoverForeground: "#2e3440",
    primary: "#5e81ac",
    primaryForeground: "#eceff4",
    secondary: "#d8dee9",
    secondaryForeground: "#2e3440",
    muted: "#d8dee9",
    mutedForeground: "#4c566a",
    accent: "#88c0d0",
    accentForeground: "#2e3440",
    destructive: "#bf616a",
    destructiveForeground: "#eceff4",
    border: "#d8dee9",
    input: "#ffffff",
    ring: "#5e81ac",
    chart1: "#81a1c1",
    chart2: "#88c0d0",
    chart3: "#8fbcbb",
    chart4: "#5e81ac",
    chart5: "#4c566a",
    sidebar: "#e5e9f0",
    sidebarForeground: "#2e3440",
    sidebarPrimary: "#5e81ac",
    sidebarPrimaryForeground: "#eceff4",
    sidebarAccent: "#d8dee9",
    sidebarAccentForeground: "#2e3440",
    sidebarBorder: "#ced5e0",
    sidebarRing: "#5e81ac",
    navbar: "#2e3440",
    navbarForeground: "#eceff4",
    inputBackground: "#ffffff",
    tableHeader: "#d8dee9",
    tableHeaderForeground: "#4c566a",
    tableRowHover: "#e5e9f0",
    tableRowSelected: "#d8dee9",
    dialog: "#e5e9f0",
    dialogForeground: "#2e3440",
    sheet: "#e5e9f0",
    sheetForeground: "#2e3440",
    command: "#e5e9f0",
    commandForeground: "#2e3440",
    dropdown: "#e5e9f0",
    dropdownForeground: "#2e3440",
    cssVars: {
      "--nord-shadow": "0 2px 10px rgba(46, 52, 64, 0.05)",
      "--arctic-bg": "#eceff4",
    },
  },
  dark: {
    background: "#2e3440",
    foreground: "#eceff4",
    card: "#3b4252",
    cardForeground: "#eceff4",
    popover: "#2e3440",
    popoverForeground: "#eceff4",
    primary: "#88c0d0",
    primaryForeground: "#2e3440",
    secondary: "#434c5e",
    secondaryForeground: "#eceff4",
    muted: "#434c5e",
    mutedForeground: "#d8dee9",
    accent: "#81a1c1",
    accentForeground: "#eceff4",
    destructive: "#bf616a",
    destructiveForeground: "#eceff4",
    border: "#434c5e",
    input: "#3b4252",
    ring: "#88c0d0",
    chart1: "#88c0d0",
    chart2: "#81a1c1",
    chart3: "#5e81ac",
    chart4: "#8fbcbb",
    chart5: "#eceff4",
    sidebar: "#242933",
    sidebarForeground: "#d8dee9",
    sidebarPrimary: "#88c0d0",
    sidebarPrimaryForeground: "#2e3440",
    sidebarAccent: "#3b4252",
    sidebarAccentForeground: "#eceff4",
    sidebarBorder: "#434c5e",
    sidebarRing: "#88c0d0",
    navbar: "#242933",
    navbarForeground: "#88c0d0",
    inputBackground: "#2e3440",
    tableHeader: "#3b4252",
    tableHeaderForeground: "#d8dee9",
    tableRowHover: "#3b4252",
    tableRowSelected: "#434c5e",
    dialog: "#3b4252",
    dialogForeground: "#eceff4",
    sheet: "#3b4252",
    sheetForeground: "#eceff4",
    command: "#3b4252",
    commandForeground: "#eceff4",
    dropdown: "#3b4252",
    dropdownForeground: "#eceff4",
    cssVars: {
      "--nord-shadow": "0 4px 20px rgba(0, 0, 0, 0.2)",
      "--arctic-bg": "#2e3440",
    },
  },
  components: {
    button: `
      border-radius: 4px !important;
      font-weight: 500 !important;
      transition: background 0.2s ease !important;
      border: 1px solid rgba(0,0,0,0.05) !important;
    `,
    input: `
      border-radius: 4px !important;
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
      transition: all 0.2s ease !important;
    `,
    card: `
      border-radius: 0.5rem !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--nord-shadow) !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 2px solid var(--primary) !important;
    `,
    "tabs-list": `
      background: var(--secondary) !important;
      border-radius: 0.25rem !important;
    `,
    "tabs-trigger": `
      border-radius: 0.125rem !important;
      font-weight: 500 !important;
      margin: 2px !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      border-radius: 0.5rem !important;
      border: 1px solid var(--border) !important;
    `,
  },
  customCss: `
    [data-theme="nord"] [data-slot="button"]:hover {
       background: var(--accent) !important;
       color: var(--accent-foreground) !important;
    }

    [data-theme="nord"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--background) !important;
      color: var(--primary) !important;
    }

    [data-theme="nord"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      outline: none;
    }

    [data-theme="nord"] table th {
      background: var(--secondary) !important;
      color: var(--primary);
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    [data-theme="nord"] .site-header {
      background: var(--background) !important;
    }
  `,
};
