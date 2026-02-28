/**
 * @module zenithTheme
 * @description Theme definition for "zenith".
 */

import type { ThemeDefinition } from "../types";

export const zenithTheme: ThemeDefinition = {
  name: "zenith",
  label: "Zenith",
  radius: "2rem",
  light: {
    background: "#f0f4f8",
    foreground: "#112240",
    card: "rgba(255, 255, 255, 0.7)",
    cardForeground: "#112240",
    popover: "rgba(255, 255, 255, 0.95)",
    popoverForeground: "#112240",
    primary: "#0070f3",
    primaryForeground: "#ffffff",
    secondary: "#e1eaf2",
    secondaryForeground: "#0070f3",
    muted: "#e1eaf2",
    mutedForeground: "#4b5563",
    accent: "#00d1ff",
    accentForeground: "#ffffff",
    destructive: "#ff4d4d",
    destructiveForeground: "#ffffff",
    border: "#cbd5e1",
    input: "rgba(255, 255, 255, 0.5)",
    ring: "#0070f3",
    chart1: "#0070f3",
    chart2: "#00d1ff",
    chart3: "#7000f3",
    chart4: "#f30070",
    chart5: "#00f370",
    sidebar: "#f8fafc",
    sidebarForeground: "#112240",
    sidebarPrimary: "#0070f3",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#e1eaf2",
    sidebarAccentForeground: "#0070f3",
    sidebarBorder: "#e2e8f0",
    sidebarRing: "#0070f3",
    navbar: "#112240",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#e1eaf2",
    tableHeaderForeground: "#112240",
    tableRowHover: "rgba(0, 112, 243, 0.05)",
    tableRowSelected: "rgba(0, 112, 243, 0.1)",
    dialog: "rgba(255, 255, 255, 0.9)",
    dialogForeground: "#112240",
    sheet: "rgba(255, 255, 255, 0.9)",
    sheetForeground: "#112240",
    command: "rgba(255, 255, 255, 0.9)",
    commandForeground: "#112240",
    dropdown: "rgba(255, 255, 255, 0.9)",
    dropdownForeground: "#112240",
    cssVars: {
      "--zenith-glow": "0 0 20px rgba(0, 112, 243, 0.2)",
      "--zenith-glass": "blur(12px) saturate(180%)",
    },
  },
  dark: {
    background: "#020c1b",
    foreground: "#e6f1ff",
    card: "rgba(10, 25, 47, 0.7)",
    cardForeground: "#e6f1ff",
    popover: "rgba(10, 25, 47, 0.95)",
    popoverForeground: "#e6f1ff",
    primary: "#64ffda",
    primaryForeground: "#020c1b",
    secondary: "#112240",
    secondaryForeground: "#64ffda",
    muted: "#112240",
    mutedForeground: "#8892b0",
    accent: "#64ffda",
    accentForeground: "#020c1b",
    destructive: "#f56565",
    destructiveForeground: "#ffffff",
    border: "#233554",
    input: "rgba(10, 25, 47, 0.5)",
    ring: "#64ffda",
    chart1: "#64ffda",
    chart2: "#0a192f",
    chart3: "#112240",
    chart4: "#233554",
    chart5: "#ccd6f6",
    sidebar: "#010811",
    sidebarForeground: "#8892b0",
    sidebarPrimary: "#64ffda",
    sidebarPrimaryForeground: "#020c1b",
    sidebarAccent: "#112240",
    sidebarAccentForeground: "#64ffda",
    sidebarBorder: "#112240",
    sidebarRing: "#64ffda",
    navbar: "#010811",
    navbarForeground: "#64ffda",
    inputBackground: "#020c1b",
    tableHeader: "#112240",
    tableHeaderForeground: "#64ffda",
    tableRowHover: "rgba(100, 255, 218, 0.08)",
    tableRowSelected: "rgba(100, 255, 218, 0.15)",
    dialog: "rgba(10, 25, 47, 0.9)",
    dialogForeground: "#e6f1ff",
    sheet: "rgba(10, 25, 47, 0.9)",
    sheetForeground: "#e6f1ff",
    command: "rgba(10, 25, 47, 0.9)",
    commandForeground: "#e6f1ff",
    dropdown: "rgba(10, 25, 47, 0.9)",
    dropdownForeground: "#e6f1ff",
    cssVars: {
      "--zenith-glow": "0 0 30px rgba(100, 255, 218, 0.3)",
      "--zenith-glass": "blur(20px) saturate(200%)",
    },
  },
  components: {
    button: `
      border-radius: 9999px !important;
      font-weight: 700 !important;
      letter-spacing: 0.05em !important;
      transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1) !important;
      border: 1px solid var(--primary) !important;
      backdrop-filter: var(--zenith-glass);
      background: transparent !important;
      color: var(--primary) !important;
    `,
    input: `
      border-radius: 1.5rem !important;
      background: var(--input) !important;
      backdrop-filter: var(--zenith-glass);
      border: 1px solid var(--border) !important;
      color: var(--foreground) !important;
      transition: all 0.3s ease !important;
    `,
    card: `
      border-radius: 2rem !important;
      backdrop-filter: var(--zenith-glass);
      border: 1px solid rgba(255,255,255,0.1) !important;
      background: var(--card) !important;
      box-shadow: var(--zenith-glow) !important;
    `,
    "table-header": `
      background: rgba(100, 255, 218, 0.05) !important;
      border-bottom: 1px solid var(--border) !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
    `,
    sidebar: `
      background: var(--background) !important;
      border-right: 1px solid var(--border) !important;
    `,
    "sidebar-inner": `
       background: transparent !important;
    `,
    "sidebar-menu-button": `
      border-radius: 9999px !important;
      transition: all 0.3s ease !important;
    `,
    navbar: `
      margin: 1rem !important;
      border-radius: 2rem !important;
      backdrop-filter: var(--zenith-glass);
      background: rgba(2, 12, 27, 0.6) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    `,
    "model-table": `
      border-radius: 2rem !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      backdrop-filter: var(--zenith-glass);
      overflow: hidden !important;
    `,
    "dropdown-menu-content": `
      border-radius: 1.5rem !important;
      backdrop-filter: var(--zenith-glass);
      background: var(--popover) !important;
      border: 1px solid var(--border) !important;
      box-shadow: var(--zenith-glow) !important;
      padding: 8px !important;
    `,
    "dropdown-menu-item": `
      border-radius: 9999px !important;
      padding: 8px 16px !important;
    `,
    "tabs-list": `
      background: rgba(100, 255, 218, 0.05) !important;
      border-radius: 2rem !important;
      padding: 5px !important;
      backdrop-filter: var(--zenith-glass);
    `,
    "tabs-trigger": `
      border-radius: 1.5rem !important;
      font-weight: 700 !important;
      transition: all 0.3s ease !important;
    `,
    "tabs-content": `
      border-radius: 1.5rem !important;
      background: transparent !important;
      padding: 1rem 0 !important;
    `,
    "model-detail": `
      border-radius: 3.5rem !important;
      background: var(--card) !important;
      backdrop-filter: var(--zenith-glass);
      padding: 40px !important;
      border: 1px solid var(--primary) !important;
      box-shadow: var(--zenith-glow) !important;
    `,
  },
  customCss: `
    [data-theme="zenith"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
       box-shadow: 0 0 30px var(--primary) !important;
       transform: translateY(-2px);
    }

    [data-theme="zenith"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      box-shadow: 0 4px 15px rgba(100, 255, 218, 0.4) !important;
    }

    [data-theme="zenith"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 15px var(--primary) !important;
      outline: none;
    }

    [data-theme="zenith"] table th {
      color: var(--primary);
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 0.1em;
    }

    [data-theme="zenith"] [data-slot="dropdown-menu-item"]:focus {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      box-shadow: 0 0 10px var(--primary) !important;
    }
    
    [data-theme="zenith"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="zenith"] [data-slot="sidebar-menu-button"][data-active="true"] {
      background: var(--sidebar-accent) !important;
      color: var(--sidebar-accent-foreground) !important;
      box-shadow: 0 0 15px var(--sidebar-accent) !important;
    }
  `,
};
