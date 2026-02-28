/**
 * @module kyotoTheme
 * @description Theme definition for "kyoto".
 */

import type { ThemeDefinition } from "../types";

export const kyotoTheme: ThemeDefinition = {
  name: "kyoto",
  label: "Kyoto",
  radius: "0rem",
  light: {
    background: "#fdfdfb",
    foreground: "#1a1a1a",
    card: "#ffffff",
    cardForeground: "#1a1a1a",
    popover: "#ffffff",
    popoverForeground: "#1a1a1a",
    primary: "#e63946",
    primaryForeground: "#ffffff",
    secondary: "#f1f3f1",
    secondaryForeground: "#5b8c5a",
    muted: "#f1f3f1",
    mutedForeground: "#8d99ae",
    accent: "#5b8c5a",
    accentForeground: "#ffffff",
    destructive: "#c1121f",
    destructiveForeground: "#ffffff",
    border: "#1a1a1a",
    input: "#ffffff",
    ring: "#e63946",
    chart1: "#e63946",
    chart2: "#5b8c5a",
    chart3: "#1a1a1a",
    chart4: "#8d99ae",
    chart5: "#edf2f4",
    sidebar: "#fdfdfb",
    sidebarForeground: "#1a1a1a",
    sidebarPrimary: "#e63946",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#f1f3f1",
    sidebarAccentForeground: "#5b8c5a",
    sidebarBorder: "#1a1a1a11",
    sidebarRing: "#e63946",
    navbar: "#1a1a1a",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#fdfdfb",
    tableHeaderForeground: "#1a1a1a88",
    tableRowHover: "rgba(230, 57, 70, 0.05)",
    tableRowSelected: "rgba(230, 57, 70, 0.1)",
    dialog: "#ffffff",
    dialogForeground: "#1a1a1a",
    sheet: "#ffffff",
    sheetForeground: "#1a1a1a",
    command: "#ffffff",
    commandForeground: "#1a1a1a",
    dropdown: "#ffffff",
    dropdownForeground: "#1a1a1a",
    cssVars: {
      "--kyoto-shadow": "0 2px 0 0 rgba(0,0,0,0.05)",
      "--ink-border": "1px solid #1a1a1a",
    },
  },
  dark: {
    background: "#121212",
    foreground: "#fdfdfb",
    card: "#1a1a1a",
    cardForeground: "#fdfdfb",
    popover: "#121212",
    popoverForeground: "#fdfdfb",
    primary: "#e63946",
    primaryForeground: "#ffffff",
    secondary: "#1c1c1c",
    secondaryForeground: "#5b8c5a",
    muted: "#1c1c1c",
    mutedForeground: "#8d99ae",
    accent: "#5b8c5a",
    accentForeground: "#ffffff",
    destructive: "#c1121f",
    destructiveForeground: "#ffffff",
    border: "#fdfdfb",
    input: "#1a1a1a",
    ring: "#e63946",
    chart1: "#e63946",
    chart2: "#5b8c5a",
    chart3: "#1a1a1a",
    chart4: "#8d99ae",
    chart5: "#2b2d42",
    sidebar: "#0d0d0d",
    sidebarForeground: "#fdfdfb",
    sidebarPrimary: "#e63946",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#1c1c1c",
    sidebarAccentForeground: "#5b8c5a",
    sidebarBorder: "#ffffff11",
    sidebarRing: "#e63946",
    navbar: "#0d0d0d",
    navbarForeground: "#fdfdfb",
    inputBackground: "#121212",
    tableHeader: "#121212",
    tableHeaderForeground: "#fdfdfb88",
    tableRowHover: "rgba(230, 57, 70, 0.05)",
    tableRowSelected: "rgba(230, 57, 70, 0.1)",
    dialog: "#1a1a1a",
    dialogForeground: "#fdfdfb",
    sheet: "#1a1a1a",
    sheetForeground: "#fdfdfb",
    command: "#1a1a1a",
    commandForeground: "#fdfdfb",
    dropdown: "#1a1a1a",
    dropdownForeground: "#fdfdfb",
    cssVars: {
      "--kyoto-shadow": "0 2px 0 0 rgba(255,255,255,0.05)",
      "--ink-border": "1px solid #ffffff33",
    },
  },
  components: {
    button: `
      border-radius: 0 !important;
      font-weight: 500 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.15em !important;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
      border: 1px solid var(--primary) !important;
      background: transparent !important;
      color: var(--primary) !important;
      padding: 10px 24px !important;
    `,
    input: `
      border-radius: 0 !important;
      border: none !important;
      border-bottom: 1px solid var(--border) !important;
      background: transparent !important;
      padding: 0.75rem 0 !important;
      transition: border-bottom 0.3s ease !important;
    `,
    card: `
      border-radius: 0 !important;
      border: none !important;
      border-top: 5px solid var(--primary) !important;
      background: var(--card) !important;
      box-shadow: var(--kyoto-shadow) !important;
      padding: 40px !important;
    `,
    "table-header": `
      background: var(--background) !important;
      border-bottom: 2px solid var(--primary) !important;
      text-transform: uppercase !important;
      font-weight: 900 !important;
      letter-spacing: 0.2em !important;
      font-size: 0.75rem !important;
      padding: 1rem 0 !important;
    `,
    sidebar: `
      background: var(--background) !important;
      border-right: 1px solid var(--border) !important;
      padding: 1.5rem !important;
    `,
    "sidebar-inner": `
       background: transparent !important;
    `,
    "sidebar-menu-button": `
       border-radius: 0 !important;
       font-weight: 600 !important;
       text-transform: uppercase !important;
       border-bottom: 1px solid transparent !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 1px solid var(--border) !important;
      padding: 1.5rem 0 !important;
    `,
    "model-table": `
       border: none !important;
       border-top: 5px solid var(--primary) !important;
       background: var(--card) !important;
       border-radius: 0 !important;
    `,
    "dropdown-menu-content": `
       border: 1px solid var(--border) !important;
       border-radius: 0 !important;
       background: var(--popover) !important;
       box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
       padding: 0 !important;
    `,
    "dropdown-menu-item": `
       border-radius: 0 !important;
       font-weight: 500 !important;
       padding: 10px 20px !important;
    `,
    "tabs-list": `
      background: transparent !important;
      border-bottom: 1px solid var(--border) !important;
      border-radius: 0 !important;
      gap: 40px !important;
      height: auto !important;
      padding: 0 !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 600 !important;
      padding: 0 0 15px 0 !important;
      border-bottom: 2px solid transparent !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
    `,
    "tabs-content": `
       background: transparent !important;
       padding: 2.5rem 0 !important;
    `,
    "model-detail": `
      background: var(--background) !important;
      border: none !important;
      border-left: 5px solid var(--primary) !important;
      padding: 50px !important;
      border-radius: 0 !important;
    `,
  },
  customCss: `
    [data-theme="kyoto"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: white !important;
       letter-spacing: 0.2em !important;
    }

    [data-theme="kyoto"] [data-slot="tabs-trigger"][data-state="active"] {
      border-bottom: 2px solid var(--primary) !important;
      color: var(--primary) !important;
      background: transparent !important;
    }

    [data-theme="kyoto"] [data-slot="input"]:focus {
      border-bottom-color: var(--primary) !important;
      outline: none;
    }

    [data-theme="kyoto"] table th {
      text-align: left;
      font-weight: 900 !important;
      color: var(--primary) !important;
      text-transform: uppercase !important;
      font-size: 0.75rem !important;
      letter-spacing: 0.2rem !important;
    }

    [data-theme="kyoto"] table {
      border-collapse: collapse !important;
    }
    
    [data-theme="kyoto"] td, [data-theme="kyoto"] th {
      border-bottom: 1px solid var(--border) !important;
      padding: 1.25rem 0 !important;
    }

    [data-theme="kyoto"] [data-slot="dropdown-menu-item"]:focus {
       background: var(--primary) !important;
       color: white !important;
    }

    [data-theme="kyoto"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="kyoto"] [data-slot="sidebar-menu-button"][data-active="true"] {
       color: var(--primary) !important;
       border-bottom: 1px solid var(--primary) !important;
       background: transparent !important;
    }
  `,
};
