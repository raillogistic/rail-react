/**
 * @module atlantisTheme
 * @description Theme definition for "atlantis".
 */

import type { ThemeDefinition } from "../types";

export const atlantisTheme: ThemeDefinition = {
  name: "atlantis",
  label: "Atlantis",
  radius: "1.5rem",
  light: {
    background: "#f0f9ff",
    foreground: "#0c4a6e",
    card: "rgba(255, 255, 255, 0.6)",
    cardForeground: "#0c4a6e",
    popover: "rgba(255, 255, 255, 0.9)",
    popoverForeground: "#0c4a6e",
    primary: "#0ea5e9",
    primaryForeground: "#ffffff",
    secondary: "#e0f2fe",
    secondaryForeground: "#0369a1",
    muted: "#f0f9ff",
    mutedForeground: "#0ea5e988",
    accent: "#7dd3fc",
    accentForeground: "#0c4a6e",
    destructive: "#f43f5e",
    destructiveForeground: "#ffffff",
    border: "#bae6fd66",
    input: "rgba(255, 255, 255, 0.5)",
    ring: "#0ea5e9",
    chart1: "#0ea5e9",
    chart2: "#2dd4bf",
    chart3: "#f43f5e",
    chart4: "#fbbf24",
    chart5: "#818cf8",
    sidebar: "#f0f9ff",
    sidebarForeground: "#0369a1",
    sidebarPrimary: "#0ea5e9",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#e0f2fe",
    sidebarAccentForeground: "#0369a1",
    sidebarBorder: "#bae6fd44",
    sidebarRing: "#0ea5e9",
    navbar: "#0c4a6e",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#ccf2ff",
    tableHeaderForeground: "#0369a1",
    tableRowHover: "rgba(14, 165, 233, 0.05)",
    tableRowSelected: "rgba(14, 165, 233, 0.1)",
    dialog: "rgba(255, 255, 255, 0.8)",
    dialogForeground: "#0c4a6e",
    sheet: "rgba(255, 255, 255, 0.8)",
    sheetForeground: "#0c4a6e",
    command: "rgba(255, 255, 255, 0.8)",
    commandForeground: "#0c4a6e",
    dropdown: "rgba(255, 255, 255, 0.8)",
    dropdownForeground: "#0c4a6e",
    cssVars: {
      "--ocean-glow": "0 8px 32px 0 rgba(14, 165, 233, 0.2)",
      "--wave-blur": "blur(15px)",
    },
  },
  dark: {
    background: "#020617",
    foreground: "#bae6fd",
    card: "rgba(15, 23, 42, 0.6)",
    cardForeground: "#bae6fd",
    popover: "rgba(2, 6, 23, 0.9)",
    popoverForeground: "#bae6fd",
    primary: "#38bdf8",
    primaryForeground: "#020617",
    secondary: "#0f172a",
    secondaryForeground: "#38bdf8",
    muted: "#0f172a",
    mutedForeground: "#38bdf866",
    accent: "#0ea5e9",
    accentForeground: "#ffffff",
    destructive: "#f43f5e",
    destructiveForeground: "#ffffff",
    border: "#1e293b",
    input: "rgba(15, 23, 42, 0.5)",
    ring: "#38bdf8",
    chart1: "#38bdf8",
    chart2: "#2dd4bf",
    chart3: "#f43f5e",
    chart4: "#fbbf24",
    chart5: "#818cf8",
    sidebar: "#010409",
    sidebarForeground: "#38bdf8",
    sidebarPrimary: "#38bdf8",
    sidebarPrimaryForeground: "#020617",
    sidebarAccent: "#0f172a",
    sidebarAccentForeground: "#38bdf8",
    sidebarBorder: "#1e293b",
    sidebarRing: "#38bdf8",
    navbar: "#010409",
    navbarForeground: "#38bdf8",
    inputBackground: "#020617",
    tableHeader: "#0f172a",
    tableHeaderForeground: "#38bdf8",
    tableRowHover: "rgba(56, 189, 248, 0.08)",
    tableRowSelected: "rgba(56, 189, 248, 0.15)",
    dialog: "rgba(15, 23, 42, 0.8)",
    dialogForeground: "#bae6fd",
    sheet: "rgba(15, 23, 42, 0.8)",
    sheetForeground: "#bae6fd",
    command: "rgba(15, 23, 42, 0.8)",
    commandForeground: "#bae6fd",
    dropdown: "rgba(15, 23, 42, 0.8)",
    dropdownForeground: "#bae6fd",
    cssVars: {
      "--ocean-glow": "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
      "--wave-blur": "blur(20px)",
    },
  },
  components: {
    button: `
      border-radius: 9999px !important;
      background: linear-gradient(135deg, #0ea5e9, #38bdf8) !important;
      color: white !important;
      font-weight: 700 !important;
      border: none !important;
      box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3) !important;
      transition: all 0.4s ease !important;
    `,
    input: `
      border-radius: 1.5rem !important;
      backdrop-filter: var(--wave-blur);
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
      transition: all 0.3s ease !important;
    `,
    card: `
      border-radius: 2.5rem !important;
      backdrop-filter: var(--wave-blur);
      background: var(--card) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      box-shadow: var(--ocean-glow) !important;
      overflow: hidden;
    `,
    "table-header": `
      background: rgba(14, 165, 233, 0.1) !important;
      border-bottom: 2px solid var(--border) !important;
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
      margin: 1.5rem !important;
      border-radius: 2rem !important;
      backdrop-filter: var(--wave-blur);
      background: rgba(12, 74, 110, 0.6) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    `,
    "model-table": `
      border-radius: 2.5rem !important;
      backdrop-filter: var(--wave-blur);
      background: var(--card) !important;
      border: 1px solid var(--border) !important;
      overflow: hidden !important;
    `,
    "dropdown-menu-content": `
      border-radius: 1.5rem !important;
      backdrop-filter: var(--wave-blur);
      background: var(--popover) !important;
      border: 1px solid var(--border) !important;
      box-shadow: var(--ocean-glow) !important;
      padding: 8px !important;
    `,
    "dropdown-menu-item": `
      border-radius: 9999px !important;
      padding: 8px 16px !important;
    `,
    "tabs-list": `
      background: rgba(14, 165, 233, 0.1) !important;
      border-radius: 2.5rem !important;
      padding: 6px !important;
      backdrop-filter: var(--wave-blur);
    `,
    "tabs-trigger": `
      border-radius: 1.75rem !important;
      font-weight: 700 !important;
      transition: all 0.3s ease !important;
    `,
    "tabs-content": `
       background: transparent !important;
       padding: 1.5rem 0 !important;
    `,
    "model-detail": `
      border-radius: 3rem !important;
      background: var(--card) !important;
      backdrop-filter: var(--wave-blur);
      padding: 50px !important;
      border: 1px solid var(--primary) !important;
      box-shadow: var(--ocean-glow) !important;
    `,
  },
  customCss: `
    [data-theme="atlantis"] [data-slot="button"]:hover {
       transform: translateY(-3px) scale(1.02);
       box-shadow: 0 12px 30px rgba(14, 165, 233, 0.5) !important;
    }

    [data-theme="atlantis"] [data-slot="tabs-trigger"][data-state="active"] {
      background: white !important;
      color: var(--primary) !important;
      box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3) !important;
    }

    [data-theme="atlantis"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 15px var(--primary) !important;
      outline: none;
    }

    [data-theme="atlantis"] table th {
      color: var(--primary) !important;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 0.1em;
    }

    [data-theme="atlantis"] [data-slot="dropdown-menu-item"]:focus {
       background: var(--primary) !important;
       color: white !important;
    }

    [data-theme="atlantis"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="atlantis"] [data-slot="sidebar-menu-button"][data-active="true"] {
       background: var(--sidebar-accent) !important;
       color: var(--sidebar-accent-foreground) !important;
       box-shadow: 0 4px 10px rgba(14, 165, 233, 0.2) !important;
    }

    [data-theme="atlantis"] [data-slot="card"]::after {
      content: "";
      position: absolute;
      top: -10%; left: -10%; right: -10%; bottom: -10%;
      background: radial-gradient(circle at center, rgba(14, 165, 233, 0.05) 0%, transparent 70%);
      pointer-events: none;
      z-index: -1;
    }
  `,
};
