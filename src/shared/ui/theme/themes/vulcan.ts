/**
 * @module vulcanTheme
 * @description Theme definition for "vulcan".
 */

import type { ThemeDefinition } from "../types";

export const vulcanTheme: ThemeDefinition = {
  name: "vulcan",
  label: "Vulcan",
  radius: "0rem",
  light: {
    background: "#fdf8f4",
    foreground: "#2c1810",
    card: "#ffffff",
    cardForeground: "#2c1810",
    popover: "#ffffff",
    popoverForeground: "#2c1810",
    primary: "#d9480f",
    primaryForeground: "#ffffff",
    secondary: "#fff4e6",
    secondaryForeground: "#d9480f",
    muted: "#fff4e6",
    mutedForeground: "#862e08",
    accent: "#f76707",
    accentForeground: "#ffffff",
    destructive: "#c92a2a",
    destructiveForeground: "#ffffff",
    border: "#2c1810",
    input: "#ffffff",
    ring: "#d9480f",
    chart1: "#d9480f",
    chart2: "#f76707",
    chart3: "#ff922b",
    chart4: "#ffa94d",
    chart5: "#ffc078",
    sidebar: "#fff4e6",
    sidebarForeground: "#2c1810",
    sidebarPrimary: "#d9480f",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#fd7e1422",
    sidebarAccentForeground: "#d9480f",
    sidebarBorder: "#2c1810",
    sidebarRing: "#d9480f",
    navbar: "#2c1810",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#fff4e6",
    tableHeaderForeground: "#d9480f",
    tableRowHover: "rgba(217, 72, 15, 0.05)",
    tableRowSelected: "rgba(217, 72, 15, 0.1)",
    dialog: "#ffffff",
    dialogForeground: "#2c1810",
    sheet: "#ffffff",
    sheetForeground: "#2c1810",
    command: "#ffffff",
    commandForeground: "#2c1810",
    dropdown: "#ffffff",
    dropdownForeground: "#2c1810",
    cssVars: {
      "--vulcan-shadow": "6px 6px 0px #2c1810",
      "--heat-glow": "0 0 10px rgba(217, 72, 15, 0.2)",
    },
  },
  dark: {
    background: "#0c0502",
    foreground: "#ffd8a8",
    card: "#180a05",
    cardForeground: "#ffd8a8",
    popover: "#0c0502",
    popoverForeground: "#ffd8a8",
    primary: "#f76707",
    primaryForeground: "#0c0502",
    secondary: "#2c1810",
    secondaryForeground: "#f76707",
    muted: "#2c1810",
    mutedForeground: "#d9480f",
    accent: "#f76707",
    accentForeground: "#0c0502",
    destructive: "#c92a2a",
    destructiveForeground: "#ffffff",
    border: "#ffd8a8",
    input: "#0c0502",
    ring: "#f76707",
    chart1: "#f76707",
    chart2: "#d9480f",
    chart3: "#862e08",
    chart4: "#fd7e14",
    chart5: "#ffd8a8",
    sidebar: "#000000",
    sidebarForeground: "#d9480f",
    sidebarPrimary: "#f76707",
    sidebarPrimaryForeground: "#0c0502",
    sidebarAccent: "#180a05",
    sidebarAccentForeground: "#ffd8a8",
    sidebarBorder: "#ffd8a833",
    sidebarRing: "#f76707",
    navbar: "#000000",
    navbarForeground: "#f76707",
    inputBackground: "#0c0502",
    tableHeader: "#2c1810",
    tableHeaderForeground: "#f76707",
    tableRowHover: "rgba(247, 103, 7, 0.1)",
    tableRowSelected: "rgba(247, 103, 7, 0.15)",
    dialog: "#180a05",
    dialogForeground: "#ffd8a8",
    sheet: "#180a05",
    sheetForeground: "#ffd8a8",
    command: "#180a05",
    commandForeground: "#ffd8a8",
    dropdown: "#180a05",
    dropdownForeground: "#ffd8a8",
    cssVars: {
      "--vulcan-shadow": "8px 8px 0px #000000",
      "--heat-glow": "0 0 20px rgba(247, 103, 7, 0.4)",
    },
  },
  components: {
    button: `
      border-radius: 0 !important;
      border: 3px solid var(--border) !important;
      background: transparent !important;
      color: var(--primary) !important;
      text-transform: uppercase !important;
      font-weight: 900 !important;
      letter-spacing: 0.1em !important;
      transition: all 0.2s ease-in-out !important;
      box-shadow: var(--vulcan-shadow) !important;
    `,
    input: `
      border-radius: 0 !important;
      border: 2px solid var(--border) !important;
      background: var(--input) !important;
      color: var(--foreground) !important;
      font-weight: 600 !important;
      box-shadow: 3px 3px 0px var(--border);
    `,
    card: `
      border-radius: 0 !important;
      border: 2px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--vulcan-shadow) !important;
      border-left: 10px solid var(--primary) !important;
      position: relative;
    `,
    "table-header": `
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      text-transform: uppercase !important;
      font-weight: 900 !important;
      border-bottom: 3px solid var(--border) !important;
    `,
    sidebar: `
      background: var(--background) !important;
      border-right: 4px solid var(--primary) !important;
    `,
    "sidebar-inner": `
       background: transparent !important;
    `,
    "sidebar-menu-button": `
       border-radius: 0 !important;
       font-weight: 800 !important;
       text-transform: uppercase !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 4px solid var(--primary) !important;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    `,
    "model-table": `
       border: 3px solid var(--border) !important;
       border-radius: 0 !important;
       background: var(--card) !important;
       box-shadow: var(--vulcan-shadow) !important;
    `,
    "dropdown-menu-content": `
       border: 3px solid var(--border) !important;
       border-radius: 0 !important;
       box-shadow: var(--vulcan-shadow) !important;
       background: var(--popover) !important;
       padding: 0 !important;
    `,
    "dropdown-menu-item": `
       border-radius: 0 !important;
       font-weight: 800 !important;
       text-transform: uppercase !important;
       border-bottom: 1px solid var(--border) !important;
    `,
    "tabs-list": `
      background: var(--secondary) !important;
      border: 3px solid var(--border) !important;
      border-radius: 0 !important;
      padding: 4px !important;
      gap: 4px !important;
      height: auto !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      border: 2px solid transparent !important;
      transition: all 0.2s ease !important;
    `,
    "tabs-content": `
       border: 3px solid var(--border) !important;
       border-top: none !important;
       background: var(--card) !important;
       padding: 20px !important;
    `,
    "model-detail": `
      background: var(--background) !important;
      border: 4px solid var(--primary) !important;
      box-shadow: var(--heat-glow), var(--vulcan-shadow) !important;
      padding: 40px !important;
      border-radius: 0 !important;
    `,
  },
  customCss: `
    [data-theme="vulcan"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
       transform: translate(-3px, -3px);
       box-shadow: 10px 10px 0px var(--border) !important;
    }

    [data-theme="vulcan"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      border-color: var(--border) !important;
      transform: translateY(-2px);
      box-shadow: 4px 4px 0px var(--border);
    }

    [data-theme="vulcan"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 4px 4px 0px var(--primary) !important;
      outline: none;
    }

    [data-theme="vulcan"] table th {
      color: var(--primary-foreground) !important;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 0.1em;
    }

    [data-theme="vulcan"] [data-slot="dropdown-menu-item"]:focus {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
    }

    [data-theme="vulcan"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="vulcan"] [data-slot="sidebar-menu-button"][data-active="true"] {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
       border-color: var(--border) !important;
       box-shadow: 4px 4px 0px var(--border) !important;
       transform: translate(-2px, -2px);
    }
    
    [data-theme="vulcan"] .card::before {
      content: "";
      position: absolute;
      top: 0; right: 0;
      border-style: solid;
      border-width: 0 20px 20px 0;
      border-color: transparent var(--primary) transparent transparent;
    }
  `,
};
