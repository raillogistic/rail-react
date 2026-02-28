/**
 * @module notionTheme
 * @description Theme definition for "notion".
 */

import type { ThemeDefinition } from "../types";

export const notionTheme: ThemeDefinition = {
  name: "notion",
  label: "Notion",
  radius: "0.125rem",
  light: {
    background: "#ffffff",
    foreground: "#37352f",
    card: "#ffffff",
    cardForeground: "#37352f",
    popover: "#ffffff",
    popoverForeground: "#37352f",
    primary: "#37352f",
    primaryForeground: "#ffffff",
    secondary: "#f7f6f3",
    secondaryForeground: "#37352f",
    muted: "#f7f6f3",
    mutedForeground: "rgba(55, 53, 47, 0.65)",
    accent: "#efefef",
    accentForeground: "#37352f",
    destructive: "#eb5757",
    destructiveForeground: "#ffffff",
    border: "#e9e9e9",
    input: "#f7f6f3", // Light gray inputs like notion
    ring: "#37352f",
    chart1: "#37352f",
    chart2: "#9d9d9d",
    chart3: "#eb5757",
    chart4: "#d9730d",
    chart5: "#448361",
    sidebar: "#f7f6f3",
    sidebarForeground: "#37352f",
    sidebarPrimary: "#37352f",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#ebeaea",
    sidebarAccentForeground: "#37352f",
    sidebarBorder: "#edebe9",
    sidebarRing: "#37352f",
    navbar: "#ffffff",
    navbarForeground: "#37352f",
    inputBackground: "#ffffff",
    tableHeader: "#f7f6f3",
    tableHeaderForeground: "rgba(55, 53, 47, 0.5)",
    tableRowHover: "#f1f1ef",
    tableRowSelected: "#ebeaea",
    dialog: "#ffffff",
    dialogForeground: "#37352f",
    sheet: "#ffffff",
    sheetForeground: "#37352f",
    command: "#ffffff",
    commandForeground: "#37352f",
    dropdown: "#ffffff",
    dropdownForeground: "#37352f",
  },
  dark: {
    background: "#191919",
    foreground: "#ffffff",
    card: "#202020",
    cardForeground: "#ffffff",
    popover: "#191919",
    popoverForeground: "#ffffff",
    primary: "#ffffff",
    primaryForeground: "#191919",
    secondary: "#252525",
    secondaryForeground: "#ffffff",
    muted: "#252525",
    mutedForeground: "rgba(255, 255, 255, 0.45)",
    accent: "#333333",
    accentForeground: "#ffffff",
    destructive: "#ff6b6b",
    destructiveForeground: "#ffffff",
    border: "#2f2f2f",
    input: "#252525",
    ring: "#ffffff",
    chart1: "#ffffff",
    chart2: "#a3a3a3",
    chart3: "#ff6b6b",
    chart4: "#f59e0b",
    chart5: "#10b981",
    sidebar: "#202020",
    sidebarForeground: "#a3a3a3",
    sidebarPrimary: "#ffffff",
    sidebarPrimaryForeground: "#191919",
    sidebarAccent: "#2f2f2f",
    sidebarAccentForeground: "#ffffff",
    sidebarBorder: "#2f2f2f",
    sidebarRing: "#ffffff",
    navbar: "#191919",
    navbarForeground: "#ffffff",
    inputBackground: "#191919",
    tableHeader: "#252525",
    tableHeaderForeground: "rgba(255, 255, 255, 0.45)",
    tableRowHover: "#2f2f2f",
    tableRowSelected: "#333333",
    dialog: "#202020",
    dialogForeground: "#ffffff",
    sheet: "#202020",
    sheetForeground: "#ffffff",
    command: "#202020",
    commandForeground: "#ffffff",
    dropdown: "#202020",
    dropdownForeground: "#ffffff",
  },
  components: {
    button: `
      border-radius: 3px !important;
      font-weight: 500 !important;
      font-size: 0.875rem !important;
      transition: background 0.2s ease !important;
      border: 1px solid var(--border) !important;
      background: transparent !important;
      color: var(--foreground) !important;
    `,
    input: `
      border-radius: 3px !important;
      border: 1px solid var(--border) !important;
      background: var(--input) !important;
    `,
    card: `
      border-radius: 4px !important;
      background: var(--card) !important;
      border: 1px solid var(--border) !important;
      box-shadow: none !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 1px solid var(--border) !important;
    `,
    "tabs-list": `
      background: transparent !important;
      border-bottom: 1px solid var(--border) !important;
      border-radius: 0 !important;
      gap: 20px !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 500 !important;
      border-bottom: 2px solid transparent !important;
      padding: 0 0 8px 0 !important;
    `,
  },
  customCss: `
    [data-theme="notion"] [data-slot="button"]:hover {
       background: var(--accent) !important;
    }

    [data-theme="notion"] [data-slot="tabs-trigger"][data-state="active"] {
      border-bottom: 2px solid var(--primary) !important;
      color: var(--primary) !important;
      background: transparent !important;
    }

    [data-theme="notion"] [data-slot="input"]:focus {
      box-shadow: 0 0 0 2px var(--accent) !important;
      outline: none;
    }

    [data-theme="notion"] table th {
      text-transform: uppercase;
      font-size: 0.65rem;
      letter-spacing: 0.05em;
      font-weight: 600;
      color: var(--muted-foreground);
    }
    
    [data-theme="notion"] .sidebar-menu-button {
      border-radius: 3px !important;
      margin: 2px 8px !important;
    }

    [data-theme="notion"] .site-header {
      padding-top: 0.5rem !important;
      padding-bottom: 0.5rem !important;
    }
  `,
};
