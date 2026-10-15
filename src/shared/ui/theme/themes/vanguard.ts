/**
 * @module vanguardTheme
 * @description Theme definition for "vanguard".
 */

import type { ThemeDefinition } from "../types";

export const vanguardTheme: ThemeDefinition = {
  name: "vanguard",
  label: "Vanguard",
  radius: "0rem",
  light: {
    background: "#ffffff",
    foreground: "#121212",
    card: "#fafafa",
    cardForeground: "#121212",
    popover: "#ffffff",
    popoverForeground: "#121212",
    primary: "#d4af37", // Metallic Gold
    primaryForeground: "#000000",
    secondary: "#1a1a1a",
    secondaryForeground: "#ffffff",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    accent: "#d4af37",
    accentForeground: "#000000",
    destructive: "#991b1b",
    destructiveForeground: "#ffffff",
    border: "#e5e5e5",
    input: "#ffffff",
    ring: "#d4af37",
    chart1: "#d4af37",
    chart2: "#1a1a1a",
    chart3: "#737373",
    chart4: "#a3a3a3",
    chart5: "#d4d4d4",
    sidebar: "#121212",
    sidebarForeground: "#ffffff",
    sidebarPrimary: "#d4af37",
    sidebarPrimaryForeground: "#000000",
    sidebarAccent: "#1a1a1a",
    sidebarAccentForeground: "#ffffff",
    sidebarBorder: "#1f1f1f",
    sidebarRing: "#d4af37",
    navbar: "#000000",
    navbarForeground: "#d4af37",
    inputBackground: "#ffffff",
    tableHeader: "#fafafa",
    tableHeaderForeground: "#121212",
    tableRowHover: "#f5f5f5",
    tableRowSelected: "#d4af3715",
    dialog: "#ffffff",
    dialogForeground: "#121212",
    sheet: "#ffffff",
    sheetForeground: "#121212",
    command: "#ffffff",
    commandForeground: "#121212",
    dropdown: "#ffffff",
    dropdownForeground: "#121212",
    cssVars: {
      "--gold-glimmer": "linear-gradient(45deg, #d4af37, #f7e08b, #d4af37)",
      "--border-thin": "0.5px solid rgba(0,0,0,0.1)",
    },
  },
  dark: {
    background: "#080808",
    foreground: "#f5f5f5",
    card: "#0d0d0d",
    cardForeground: "#f5f5f5",
    popover: "#080808",
    popoverForeground: "#f5f5f5",
    primary: "#c5a028",
    primaryForeground: "#000000",
    secondary: "#f5f5f5",
    secondaryForeground: "#080808",
    muted: "#171717",
    mutedForeground: "#a3a3a3",
    accent: "#c5a028",
    accentForeground: "#000000",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#262626",
    input: "#0d0d0d",
    ring: "#c5a028",
    chart1: "#c5a028",
    chart2: "#f5f5f5",
    chart3: "#a3a3a3",
    chart4: "#525252",
    chart5: "#262626",
    sidebar: "#000000",
    sidebarForeground: "#f5f5f5",
    sidebarPrimary: "#c5a028",
    sidebarPrimaryForeground: "#000000",
    sidebarAccent: "#0d0d0d",
    sidebarAccentForeground: "#f5f5f5",
    sidebarBorder: "#171717",
    sidebarRing: "#c5a028",
    navbar: "#000000",
    navbarForeground: "#c5a028",
    inputBackground: "#080808",
    tableHeader: "#0d0d0d",
    tableHeaderForeground: "#a3a3a3",
    tableRowHover: "#121212",
    tableRowSelected: "#c5a02815",
    dialog: "#0d0d0d",
    dialogForeground: "#f5f5f5",
    sheet: "#0d0d0d",
    sheetForeground: "#f5f5f5",
    command: "#0d0d0d",
    commandForeground: "#f5f5f5",
    dropdown: "#0d0d0d",
    dropdownForeground: "#f5f5f5",
    cssVars: {
      "--gold-glimmer": "linear-gradient(45deg, #c5a028, #eecd5d, #c5a028)",
      "--border-thin": "0.5px solid rgba(255,255,255,0.1)",
    },
  },
  components: {
    button: `
      border-radius: 0 !important;
      border: 1px solid var(--primary) !important;
      text-transform: uppercase !important;
      letter-spacing: 0.2em !important;
      font-weight: 300 !important;
      font-size: 0.75rem !important;
      transition: all 0.5s ease !important;
      background: transparent !important;
      color: var(--foreground) !important;
    `,
    input: `
      border-radius: 0 !important;
      border: none !important;
      border-bottom: 1px solid var(--border) !important;
      background: transparent !important;
      padding-left: 0 !important;
      transition: border-color 0.4s ease !important;
    `,
    card: `
      border-radius: 0 !important;
      border: var(--border-thin) !important;
      background: var(--card) !important;
    `,
    navbar: `
      border-bottom: 1px solid var(--primary) !important;
      background: var(--background) !important;
    `,
    "tabs-list": `
      background: transparent !important;
      border-bottom: 1px solid var(--border) !important;
      border-radius: 0 !important;
      height: 40px !important;
      gap: 30px !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 400 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
      font-size: 0.7rem !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      padding: 0 0 10px 0 !important;
      color: var(--muted-foreground) !important;
    `,
    "model-detail": `
      border: 1px solid var(--border) !important;
      background: var(--background) !important;
      padding: 40px !important;
    `,
  },
  customCss: `
    [data-theme="vanguard"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
       letter-spacing: 0.3em !important;
    }

    [data-theme="vanguard"] [data-slot="tabs-trigger"][data-state="active"] {
      color: var(--primary) !important;
      border-bottom: 2px solid var(--primary) !important;
      background: transparent !important;
    }

    [data-theme="vanguard"] [data-slot="input"]:focus {
      border-bottom-color: var(--primary) !important;
      outline: none;
    }

    [data-theme="vanguard"] table th {
      text-transform: uppercase;
      font-size: 0.65rem;
      letter-spacing: 0.15em;
      font-weight: 600;
      color: var(--primary);
      border-bottom: 1px solid var(--primary) !important;
    }

    [data-theme="vanguard"] .site-header {
      padding-top: 1rem !important;
      padding-bottom: 1rem !important;
    }
    
    [data-theme="vanguard"] [data-slot="sidebar-link"][data-active="true"] {
      color: var(--primary) !important;
      font-weight: 700 !important;
      border-left: 2px solid var(--primary) !important;
    }
  `,
};
