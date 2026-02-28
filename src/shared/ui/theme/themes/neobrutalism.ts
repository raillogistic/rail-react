/**
 * @module neobrutalismTheme
 * @description Theme definition for "neobrutalism" (Pop-Art / Corporate).
 */

import type { ThemeDefinition } from "../types";

export const neobrutalismTheme: ThemeDefinition = {
  name: "neobrutalism",
  label: "Neo Brutalism",
  radius: "0px",
  light: {
    background: "#dbeafe",
    foreground: "#000000",
    card: "#ffffff",
    cardForeground: "#000000",
    popover: "#ffffff",
    popoverForeground: "#000000",
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#fef08a",
    secondaryForeground: "#000000",
    muted: "#f3f4f6",
    mutedForeground: "#4b5563",
    accent: "#f472b6",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#000000",
    input: "#ffffff",
    ring: "#000000",
    chart1: "#f472b6",
    chart2: "#fde047",
    chart3: "#34d399",
    chart4: "#818cf8",
    chart5: "#fb923c",
    sidebar: "#ffffff",
    sidebarForeground: "#000000",
    sidebarPrimary: "#3b82f6",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#fef08a",
    sidebarAccentForeground: "#000000",
    sidebarBorder: "#000000",
    sidebarRing: "#000000",
    navbar: "#ffffff",
    navbarForeground: "#000000",
    inputBackground: "#ffffff",
    tableHeader: "#bae6fd",
    tableHeaderForeground: "#000000",
    tableRowHover: "#fef08a",
    tableRowSelected: "#fbcfe8",
    dialog: "#ffffff",
    dialogForeground: "#000000",
    sheet: "#ffffff",
    sheetForeground: "#000000",
    command: "#ffffff",
    commandForeground: "#000000",
    dropdown: "#ffffff",
    dropdownForeground: "#000000",
    cssVars: {
      "--border-strong": "#000000",
      "--shadow-strong": "#000000",
    },
  },
  dark: {
    background: "#1e1b4b",
    foreground: "#ffffff",
    card: "#312e81",
    cardForeground: "#ffffff",
    popover: "#312e81",
    popoverForeground: "#ffffff",
    primary: "#fde047",
    primaryForeground: "#000000",
    secondary: "#4ade80",
    secondaryForeground: "#000000",
    muted: "#4338ca",
    mutedForeground: "#c7d2fe",
    accent: "#f472b6",
    accentForeground: "#000000",
    destructive: "#f87171",
    destructiveForeground: "#000000",
    border: "#000000",
    input: "#4338ca",
    ring: "#000000",
    chart1: "#f472b6",
    chart2: "#fde047",
    chart3: "#34d399",
    chart4: "#818cf8",
    chart5: "#fb923c",
    sidebar: "#312e81",
    sidebarForeground: "#ffffff",
    sidebarPrimary: "#fde047",
    sidebarPrimaryForeground: "#000000",
    sidebarAccent: "#4ade80",
    sidebarAccentForeground: "#000000",
    sidebarBorder: "#000000",
    sidebarRing: "#000000",
    navbar: "#312e81",
    navbarForeground: "#ffffff",
    inputBackground: "#4338ca",
    tableHeader: "#3730a3",
    tableHeaderForeground: "#ffffff",
    tableRowHover: "#4338ca",
    tableRowSelected: "#4ade80",
    dialog: "#312e81",
    dialogForeground: "#ffffff",
    sheet: "#312e81",
    sheetForeground: "#ffffff",
    command: "#312e81",
    commandForeground: "#ffffff",
    dropdown: "#312e81",
    dropdownForeground: "#ffffff",
    cssVars: {
      "--border-strong": "#ffffff",
      "--shadow-strong": "#ffffff",
    },
  },
  components: {
    button: `
      border: 2px solid var(--border-strong) !important;
      box-shadow: 4px 4px 0 0 var(--shadow-strong) !important;
      border-radius: 0 !important;
      font-weight: 900 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.05em !important;
      transition: all 0.2s ease !important;
    `,
    input: `
      border: 2px solid var(--border-strong) !important;
      box-shadow: 4px 4px 0 0 var(--shadow-strong) !important;
      border-radius: 0 !important;
      font-weight: 700 !important;
      transition: all 0.2s ease !important;
    `,
    card: `
      border: 2px solid var(--border-strong) !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      border-radius: 0 !important;
    `,
    "table-header": `
      border-bottom: 2px solid var(--border-strong) !important;
      text-transform: uppercase !important;
      font-weight: 900 !important;
    `,
    sidebar: `
      border-right: 2px solid var(--border-strong) !important;
      background-color: var(--background) !important;
    `,
    "sidebar-inner": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      margin: 8px;
    `,
    "sidebar-menu-button": `
      border-radius: 0 !important;
      border: 2px solid transparent !important;
      transition: all 0.2s ease !important;
      font-weight: 700 !important;
    `,
    "sidebar-group-label": `
      font-weight: 900 !important;
      text-transform: uppercase !important;
      border-bottom: 2px solid var(--border-strong) !important;
      margin-bottom: 8px !important;
      padding-bottom: 4px !important;
      border-radius: 0 !important;
      color: var(--foreground) !important;
    `,
    navbar: `
      border-bottom: 4px solid var(--border-strong) !important;
      background-color: var(--background) !important;
      box-shadow: 0 4px 0 0 var(--shadow-strong) !important;
    `,
    "model-table": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      background-color: var(--card) !important;
      overflow: hidden !important;
    `,
    "table-toolbar": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      background-color: var(--background) !important;
    `,
    "model-form": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      background-color: var(--card) !important;
    `,
    "dropdown-menu-content": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      background-color: var(--dropdown) !important;
      color: var(--dropdown-foreground) !important;
      padding: 4px !important;
    `,
    "dropdown-menu-sub-content": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      background-color: var(--dropdown) !important;
      color: var(--dropdown-foreground) !important;
      padding: 4px !important;
    `,
    "dropdown-menu-item": `
      border-radius: 0 !important;
      font-weight: 700 !important;
      border: 2px solid transparent !important;
    `,
    "dropdown-menu-checkbox-item": `
      border-radius: 0 !important;
      font-weight: 700 !important;
      border: 2px solid transparent !important;
    `,
    "dropdown-menu-radio-item": `
      border-radius: 0 !important;
      font-weight: 700 !important;
      border: 2px solid transparent !important;
    `,
    "dropdown-menu-sub-trigger": `
      border-radius: 0 !important;
      font-weight: 700 !important;
      border: 2px solid transparent !important;
    `,
    "dropdown-menu-label": `
      font-weight: 900 !important;
      text-transform: uppercase !important;
      border-bottom: 2px solid var(--border-strong) !important;
      margin-bottom: 8px !important;
      padding-bottom: 4px !important;
      border-radius: 0 !important;
    `,
    "dropdown-menu-separator": `
      background-color: var(--border-strong) !important;
      height: 2px !important;
      margin: 8px -4px !important;
    `,
    "tabs-list": `
      border: 2px solid var(--border-strong) !important;
      border-radius: 0 !important;
      background-color: var(--muted) !important;
      padding: 4px !important;
      gap: 4px !important;
      height: auto !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 700 !important;
      transition: all 0.2s ease !important;
      border: 2px solid transparent !important;
      padding: 8px 16px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
      font-size: 0.75rem !important;
    `,
    "tabs-content": `
      border: 2px solid var(--border-strong) !important;
      border-top: none !important;
      background-color: var(--card) !important;
      padding: 20px !important;
      border-radius: 0 !important;
    `,
    "model-detail": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 8px 8px 0 0 var(--shadow-strong) !important;
      background-color: var(--background) !important;
      padding: 16px !important;
    `,
    "dropdown-menu-trigger[data-state=open] > button": `
      transform: translate(2px, 2px) !important;
      box-shadow: 2px 2px 0 0 var(--shadow-strong) !important;
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      border-color: var(--border-strong) !important;
    `,
  },
  customCss: `
    [data-theme="neobrutalism"] [data-slot="button"]:hover,
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-trigger"][data-state="open"] [data-slot="button"],
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-trigger"][data-state="open"] > [data-slot="button"] {
      transform: translate(-2px, -2px) !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      border: 2px solid var(--border-strong) !important;
      border-radius: 0 !important;
    }

    [data-theme="neobrutalism"] [data-slot="button"]:active {
      transform: translate(2px, 2px) !important;
      box-shadow: 2px 2px 0 0 var(--shadow-strong) !important;
    }
    
    [data-theme="neobrutalism"] [data-slot="button"][data-state="open"],
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-trigger"][data-state="open"] [data-slot="button"],
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-trigger"][data-state="open"] > [data-slot="button"] {
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      border-color: var(--border-strong) !important;
    }
    
    [data-theme="neobrutalism"] [data-slot="tabs-trigger"]:hover {
      background-color: var(--accent) !important;
      color: var(--accent-foreground) !important;
    }

    [data-theme="neobrutalism"] [data-slot="tabs-trigger"][data-state="active"] {
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      border-color: var(--border-strong) !important;
      box-shadow: 4px 4px 0 0 var(--shadow-strong) !important;
      transform: translate(-2px, -2px);
    }

    [data-theme="neobrutalism"] [data-slot="tabs-list"] {
      border-bottom-left-radius: 0 !important;
      border-bottom-right-radius: 0 !important;
      background-color: var(--background) !important;
    }

    [data-theme="neobrutalism"] [data-slot="input"]:focus-visible {
      transform: translate(2px, 2px) !important;
      box-shadow: 2px 2px 0 0 var(--shadow-strong) !important;
      outline: none !important;
      ring: 0 !important;
    }
    
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-item"]:focus,
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-checkbox-item"]:focus,
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-radio-item"]:focus,
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-sub-trigger"]:focus,
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-sub-trigger"][data-state="open"] {
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      border-color: var(--border-strong) !important;
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 0 var(--shadow-strong);
    }

    [data-theme="neobrutalism"] table {
      border: 2px solid var(--border-strong) !important;
    }
    
    [data-theme="neobrutalism"] th,
    [data-theme="neobrutalism"] td {
      border-right: 2px solid var(--border-strong) !important;
      border-bottom: 2px solid var(--border-strong) !important;
    }
    
    [data-theme="neobrutalism"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="neobrutalism"] [data-slot="sidebar-menu-button"][data-active="true"] {
      border: 2px solid var(--border-strong) !important;
      box-shadow: 4px 4px 0 0 var(--shadow-strong) !important;
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      transform: translate(-2px, -2px);
    }
  `,
};
