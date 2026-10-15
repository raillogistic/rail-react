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
    secondary: "#fde047",
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
    sidebarAccent: "#fde047",
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
      "--success-brutal": "#4ade80",
      "--error-brutal": "#fca5a5",
      "--info-brutal": "#bae6fd",
      "--pink-brutal": "#fbcfe8",
      "--purple-brutal": "#c4b5fd",
    },
  },
  dark: {
    background: "#000000",
    foreground: "#ffffff",
    card: "#111111",
    cardForeground: "#ffffff",
    popover: "#111111",
    popoverForeground: "#ffffff",
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#fde047",
    secondaryForeground: "#000000",
    muted: "#1a1a1a",
    mutedForeground: "#a1a1aa",
    accent: "#f472b6",
    accentForeground: "#000000",
    destructive: "#f87171",
    destructiveForeground: "#000000",
    border: "#ffffff",
    input: "#1a1a1a",
    ring: "#ffffff",
    chart1: "#f472b6",
    chart2: "#fde047",
    chart3: "#34d399",
    chart4: "#818cf8",
    chart5: "#fb923c",
    sidebar: "#0a0a0a",
    sidebarForeground: "#ffffff",
    sidebarPrimary: "#3b82f6",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#fde047",
    sidebarAccentForeground: "#000000",
    sidebarBorder: "#ffffff",
    sidebarRing: "#ffffff",
    navbar: "#0a0a0a",
    navbarForeground: "#ffffff",
    inputBackground: "#1a1a1a",
    tableHeader: "#1a1a1a",
    tableHeaderForeground: "#ffffff",
    tableRowHover: "#262626",
    tableRowSelected: "#333333",
    dialog: "#111111",
    dialogForeground: "#ffffff",
    sheet: "#111111",
    sheetForeground: "#ffffff",
    command: "#111111",
    commandForeground: "#ffffff",
    dropdown: "#111111",
    dropdownForeground: "#ffffff",
    cssVars: {
      "--border-strong": "#ffffff",
      "--shadow-strong": "#ffffff",
      "--success-brutal": "#10b981",
      "--error-brutal": "#ef4444",
      "--info-brutal": "#3b82f6",
      "--pink-brutal": "#f472b6",
      "--purple-brutal": "#818cf8",
    },
  },
  components: {
    button: `
      border: 2px solid var(--border-strong) !important;
      box-shadow: 6px 6px 0 0 var(--shadow-strong) !important;
      border-radius: 0 !important;
      font-weight: 950 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    `,
    input: `
      border: 2px solid var(--border-strong) !important;
      box-shadow: 4px 4px 0 0 var(--shadow-strong) !important;
      border-radius: 0 !important;
      font-weight: 700 !important;
      transition: all 0.2s ease !important;
      background-color: var(--input-background) !important;
      color: var(--foreground) !important;
    `,
    card: `
      border: 2px solid var(--border-strong) !important;
      box-shadow: 10px 10px 0 0 var(--shadow-strong) !important;
      border-radius: 0 !important;
      background-color: var(--card) !important;
    `,
    "table-header": `
      background-color: var(--table-header) !important;
      border-bottom: 2px solid var(--border-strong) !important;
      text-transform: uppercase !important;
      font-weight: 950 !important;
      letter-spacing: 0.1em !important;
    `,
    sidebar: `
      border-right: 2px solid var(--border-strong) !important;
      background-color: var(--background) !important;
    `,
    "sidebar-inner": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 10px 10px 0 0 var(--shadow-strong) !important;
      margin: 12px;
      background-color: var(--sidebar) !important;
    `,
    navbar: `
      border-bottom: 4px solid var(--border-strong) !important;
      background-color: var(--navbar) !important;
      box-shadow: 0 4px 0 0 var(--shadow-strong) !important;
    `,
    "model-table": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 10px 10px 0 0 var(--shadow-strong) !important;
      background-color: var(--card) !important;
      overflow: hidden !important;
    `,
    "table-toolbar": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 8px 8px 0 0 var(--shadow-strong) !important;
      background-color: var(--background) !important;
      margin-bottom: 1.5rem !important;
    `,
    "model-form": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 10px 10px 0 0 var(--shadow-strong) !important;
      background-color: var(--card) !important;
    `,
    "dropdown-menu-content": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 8px 8px 0 0 var(--shadow-strong) !important;
      background-color: var(--dropdown) !important;
      color: var(--dropdown-foreground) !important;
      padding: 6px !important;
    `,
    "tabs-list": `
      border: 2px solid var(--border-strong) !important;
      border-radius: 0 !important;
      background-color: var(--background) !important;
      padding: 6px !important;
      gap: 6px !important;
      height: auto !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 950 !important;
      transition: all 0.2s ease !important;
      padding: 12px 24px !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
    `,
    "tabs-content": `
      border: 2px solid var(--border-strong) !important;
      border-top: none !important;
      background-color: var(--card) !important;
      padding: 32px !important;
      border-radius: 0 !important;
    `,
    "model-detail": `
      border: 4px solid var(--border-strong) !important;
      border-radius: 0 !important;
      box-shadow: 12px 12px 0 0 var(--shadow-strong) !important;
      background-color: var(--card) !important;
      color: var(--card-foreground) !important;
      padding: 32px !important;
    `,
  },
  customCss: `
    [data-theme="neobrutalism"] {
       --white: #ffffff; /* Keeping as a reference but using theme vars instead */
    }

    [data-theme="neobrutalism"] main {
       background-size: 30px 30px;
       background-image: 
        linear-gradient(to right, var(--border) 0.1px, transparent 1px),
        linear-gradient(to bottom, var(--border) 0.1px, transparent 1px);
       position: relative;
    }

    [data-theme="neobrutalism"] [data-slot="button"]:hover,
    [data-theme="neobrutalism"] [data-slot="dropdown-menu-trigger"][data-state="open"] [data-slot="button"] {
      transform: translate(-3px, -3px) !important;
      box-shadow: 10px 10px 0 0 var(--shadow-strong) !important;
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
    }

    [data-theme="neobrutalism"] [data-slot="button"]:active {
      transform: translate(3px, 3px) !important;
      box-shadow: 0 0 0 0 var(--shadow-strong) !important;
    }
    
    [data-theme="neobrutalism"] [data-slot="input"]:focus-visible {
      transform: translate(4px, 4px) !important;
      box-shadow: 0 0 0 0 var(--shadow-strong) !important;
      background-color: var(--purple-brutal) !important;
      outline: none !important;
    }

    [data-theme="neobrutalism"] [data-slot="tabs-trigger"][data-state="active"] {
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      box-shadow: 8px 8px 0 0 var(--shadow-strong) !important;
      transform: translate(-4px, -4px);
    }

    [data-theme="neobrutalism"] [data-slot="tabs-trigger"]:hover:not([data-state="active"]) {
      background-color: var(--accent) !important;
      color: var(--accent-foreground) !important;
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 0 var(--shadow-strong) !important;
    }

    [data-theme="neobrutalism"] [data-slot="dropdown-menu-item"]:focus {
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 0 var(--shadow-strong);
    }

    [data-theme="neobrutalism"] table {
      border: 2px solid var(--border-strong) !important;
      background-color: var(--card) !important;
    }
    
    [data-theme="neobrutalism"] th,
    [data-theme="neobrutalism"] td {
      border-right: 2px solid var(--border-strong) !important;
      border-bottom: 2px solid var(--border-strong) !important;
    }
    
    [data-theme="neobrutalism"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="neobrutalism"] [data-slot="sidebar-menu-button"][data-active="true"] {
      border: 2px solid var(--border-strong) !important;
      box-shadow: 8px 8px 0 0 var(--shadow-strong) !important;
      background-color: var(--primary) !important;
      color: var(--primary-foreground) !important;
      transform: translate(-3px, -3px);
    }
  `,
};
