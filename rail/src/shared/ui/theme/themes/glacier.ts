/**
 * @module glacierTheme
 * @description Theme definition for "glacier".
 */

import type { ThemeDefinition } from "../types";

export const glacierTheme: ThemeDefinition = {
  name: "glacier",
  label: "Glacier",
  radius: "0rem",
  light: {
    background: "#f0f8ff",
    foreground: "#002b36",
    card: "rgba(255, 255, 255, 0.7)",
    cardForeground: "#002b36",
    popover: "rgba(255, 255, 255, 0.9)",
    popoverForeground: "#002b36",
    primary: "#00b4d8",
    primaryForeground: "#ffffff",
    secondary: "#e0f2f1",
    secondaryForeground: "#0077b6",
    muted: "#f0f9ff",
    mutedForeground: "#5c8c99",
    accent: "#caf0f8",
    accentForeground: "#03045e",
    destructive: "#d00000",
    destructiveForeground: "#ffffff",
    border: "#90e0ef66",
    input: "rgba(255, 255, 255, 0.5)",
    ring: "#00b4d8",
    chart1: "#00b4d8",
    chart2: "#0077b6",
    chart3: "#03045e",
    chart4: "#90e0ef",
    chart5: "#00b4d8",
    sidebar: "#f0f8ff",
    sidebarForeground: "#03045e",
    sidebarPrimary: "#00b4d8",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#caf0f8",
    sidebarAccentForeground: "#03045e",
    sidebarBorder: "#90e0ef44",
    sidebarRing: "#00b4d8",
    navbar: "#03045e",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#ccf2ff",
    tableHeaderForeground: "#03045e",
    tableRowHover: "rgba(0, 180, 216, 0.05)",
    tableRowSelected: "rgba(0, 180, 216, 0.1)",
    dialog: "rgba(255, 255, 255, 0.9)",
    dialogForeground: "#002b36",
    sheet: "rgba(255, 255, 255, 0.9)",
    sheetForeground: "#002b36",
    command: "rgba(255, 255, 255, 0.9)",
    commandForeground: "#002b36",
    dropdown: "rgba(255, 255, 255, 0.9)",
    dropdownForeground: "#002b36",
    cssVars: {
      "--ice-glow": "0 0 15px rgba(0, 180, 216, 0.3)",
      "--frost-blur": "blur(12px)",
    },
  },
  dark: {
    background: "#010b13",
    foreground: "#caf0f8",
    card: "rgba(10, 25, 41, 0.7)",
    cardForeground: "#caf0f8",
    popover: "rgba(1, 11, 19, 0.9)",
    popoverForeground: "#caf0f8",
    primary: "#00b4d8",
    primaryForeground: "#010b13",
    secondary: "#0077b6",
    secondaryForeground: "#ffffff",
    muted: "#0a1929",
    mutedForeground: "#48cae4",
    accent: "#023e8a",
    accentForeground: "#ffffff",
    destructive: "#ff4d6d",
    destructiveForeground: "#ffffff",
    border: "#0077b633",
    input: "rgba(10, 25, 41, 0.5)",
    ring: "#00b4d8",
    chart1: "#00b4d8",
    chart2: "#48cae4",
    chart3: "#023e8a",
    chart4: "#0077b6",
    chart5: "#caf0f8",
    sidebar: "#00050a",
    sidebarForeground: "#48cae4",
    sidebarPrimary: "#00b4d8",
    sidebarPrimaryForeground: "#010b13",
    sidebarAccent: "#023e8a",
    sidebarAccentForeground: "#ffffff",
    sidebarBorder: "#0077b633",
    sidebarRing: "#00b4d8",
    navbar: "#00050a",
    navbarForeground: "#00b4d8",
    inputBackground: "#010b13",
    tableHeader: "#0a1929",
    tableHeaderForeground: "#48cae4",
    tableRowHover: "rgba(0, 180, 216, 0.08)",
    tableRowSelected: "rgba(0, 180, 216, 0.15)",
    dialog: "rgba(10, 25, 41, 0.9)",
    dialogForeground: "#caf0f8",
    sheet: "rgba(10, 25, 41, 0.9)",
    sheetForeground: "#caf0f8",
    command: "rgba(10, 25, 41, 0.9)",
    commandForeground: "#caf0f8",
    dropdown: "rgba(10, 25, 41, 0.9)",
    dropdownForeground: "#caf0f8",
    cssVars: {
      "--ice-glow": "0 0 20px rgba(0, 180, 216, 0.5)",
      "--frost-blur": "blur(16px)",
    },
  },
  components: {
    button: `
      border-radius: 0 !important;
      border: 1px solid var(--primary) !important;
      backdrop-filter: var(--frost-blur);
      background: rgba(0, 180, 216, 0.1) !important;
      color: var(--primary) !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1em !important;
      transition: all 0.3s ease !important;
    `,
    input: `
      border-radius: 0 !important;
      background: var(--input) !important;
      backdrop-filter: var(--frost-blur);
      border: 1px solid var(--border) !important;
      color: var(--foreground) !important;
    `,
    card: `
      border-radius: 0 !important;
      backdrop-filter: var(--frost-blur);
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--ice-glow) !important;
    `,
    navbar: `
      background: rgba(3, 4, 94, 0.8) !important;
      backdrop-filter: var(--frost-blur);
      border-bottom: 2px solid var(--primary) !important;
    `,
    "tabs-list": `
      background: rgba(0, 180, 216, 0.05) !important;
      border-radius: 0 !important;
      border: 1px solid var(--border) !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      backdrop-filter: var(--frost-blur);
      border: 1px solid var(--primary) !important;
      box-shadow: var(--ice-glow) !important;
    `,
  },
  customCss: `
    [data-theme="glacier"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
       box-shadow: 0 0 25px var(--primary) !important;
    }

    [data-theme="glacier"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      text-shadow: 0 0 10px rgba(255,255,255,0.5);
    }

    [data-theme="glacier"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 15px var(--primary) !important;
      outline: none;
    }

    [data-theme="glacier"] table th {
      background: rgba(0, 180, 216, 0.2) !important;
      color: var(--primary);
      backdrop-filter: var(--frost-blur);
      text-transform: uppercase;
      font-weight: 800;
    }

    [data-theme="glacier"] .sidebar {
      background: rgba(1, 11, 19, 0.8) !important;
      backdrop-filter: var(--frost-blur);
      border-right: 1px solid var(--primary) !important;
    }
  `,
};
