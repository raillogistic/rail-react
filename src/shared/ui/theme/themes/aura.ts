/**
 * @module auraTheme
 * @description Theme definition for "aura".
 */

import type { ThemeDefinition } from "../types";

export const auraTheme: ThemeDefinition = {
  name: "aura",
  label: "Aura",
  radius: "1.5rem",
  light: {
    background: "#fdfdfb",
    foreground: "#15141b",
    card: "rgba(255, 255, 255, 0.6)",
    cardForeground: "#15141b",
    popover: "rgba(255, 255, 255, 0.9)",
    popoverForeground: "#15141b",
    primary: "#9d7cd8",
    primaryForeground: "#ffffff",
    secondary: "#f0ebff",
    secondaryForeground: "#583da1",
    muted: "#f4f2ff",
    mutedForeground: "#7e76a3",
    accent: "#eeeaff",
    accentForeground: "#583da1",
    destructive: "#ff5a5f",
    destructiveForeground: "#ffffff",
    border: "#e8e4ff66",
    input: "rgba(255, 255, 255, 0.5)",
    ring: "#9d7cd8",
    chart1: "#9d7cd8",
    chart2: "#7dc4e4",
    chart3: "#7cd8a7",
    chart4: "#d87ca0",
    chart5: "#d8b97c",
    sidebar: "#fdfdfb",
    sidebarForeground: "#15141b",
    sidebarPrimary: "#9d7cd8",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#eeeaff",
    sidebarAccentForeground: "#583da1",
    sidebarBorder: "#e8e4ff44",
    sidebarRing: "#9d7cd8",
    navbar: "#15141b",
    navbarForeground: "#fdfdfb",
    inputBackground: "#ffffff",
    tableHeader: "#ccf2ff",
    tableHeaderForeground: "#583da1",
    tableRowHover: "rgba(157, 124, 216, 0.05)",
    tableRowSelected: "rgba(157, 124, 216, 0.1)",
    dialog: "rgba(255, 255, 255, 0.8)",
    dialogForeground: "#15141b",
    sheet: "rgba(255, 255, 255, 0.8)",
    sheetForeground: "#15141b",
    command: "rgba(255, 255, 255, 0.8)",
    commandForeground: "#15141b",
    dropdown: "rgba(255, 255, 255, 0.8)",
    dropdownForeground: "#15141b",
    cssVars: {
      "--aura-glow": "0 8px 32px 0 rgba(157, 124, 216, 0.2)",
      "--mesh-gradient":
        "linear-gradient(225deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
    },
  },
  dark: {
    background: "#0d0c12",
    foreground: "#edecee",
    card: "rgba(27, 26, 35, 0.6)",
    cardForeground: "#edecee",
    popover: "rgba(13, 12, 18, 0.9)",
    popoverForeground: "#edecee",
    primary: "#bb9af7",
    primaryForeground: "#0d0c12",
    secondary: "#1b1a23",
    secondaryForeground: "#edecee",
    muted: "#1b1a23",
    mutedForeground: "#948eaf",
    accent: "#201f2e",
    accentForeground: "#edecee",
    destructive: "#ff5a5f",
    destructiveForeground: "#ffffff",
    border: "#2d2b45",
    input: "rgba(27, 26, 35, 0.5)",
    ring: "#bb9af7",
    chart1: "#bb9af7",
    chart2: "#7dc4e4",
    chart3: "#7cd8a7",
    chart4: "#d87ca0",
    chart5: "#d8b97c",
    sidebar: "#0d0c12",
    sidebarForeground: "#948eaf",
    sidebarPrimary: "#bb9af7",
    sidebarPrimaryForeground: "#0d0c12",
    sidebarAccent: "#1b1a23",
    sidebarAccentForeground: "#edecee",
    sidebarBorder: "#2d2b45",
    sidebarRing: "#bb9af7",
    navbar: "#060609",
    navbarForeground: "#bb9af7",
    inputBackground: "#0d0c12",
    tableHeader: "#1b1a23",
    tableHeaderForeground: "#948eaf",
    tableRowHover: "rgba(187, 154, 247, 0.08)",
    tableRowSelected: "rgba(187, 154, 247, 0.15)",
    dialog: "rgba(27, 26, 35, 0.8)",
    dialogForeground: "#edecee",
    sheet: "rgba(27, 26, 35, 0.8)",
    sheetForeground: "#edecee",
    command: "rgba(27, 26, 35, 0.8)",
    commandForeground: "#edecee",
    dropdown: "rgba(27, 26, 35, 0.8)",
    dropdownForeground: "#edecee",
    cssVars: {
      "--aura-glow": "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
      "--mesh-gradient": "linear-gradient(225deg, #2d2b45 0%, #15141b 100%)",
    },
  },
  components: {
    button: `
      border-radius: 9999px !important;
      background: linear-gradient(90deg, #9d7cd8, #bb9af7) !important;
      color: white !important;
      font-weight: 700 !important;
      border: none !important;
      box-shadow: 0 4px 15px rgba(157, 124, 216, 0.3) !important;
      transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1) !important;
    `,
    input: `
      border-radius: 1.5rem !important;
      backdrop-filter: blur(10px);
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
    `,
    card: `
      border-radius: 2rem !important;
      backdrop-filter: blur(20px);
      background: var(--card) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      box-shadow: var(--aura-glow) !important;
    `,
    navbar: `
      margin: 1rem !important;
      border-radius: 2rem !important;
      backdrop-filter: blur(12px);
      background: rgba(13, 12, 18, 0.6) !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    `,
    "tabs-list": `
      background: rgba(157, 124, 216, 0.1) !important;
      border-radius: 2rem !important;
      padding: 5px !important;
    `,
    "tabs-trigger": `
      border-radius: 1.5rem !important;
      font-weight: 700 !important;
      transition: all 0.3s ease !important;
    `,
    "model-detail": `
      border-radius: 2.5rem !important;
      background: var(--card) !important;
      backdrop-filter: blur(30px);
      padding: 40px !important;
    `,
  },
  customCss: `
    [data-theme="aura"] [data-slot="button"]:hover {
       transform: scale(1.05);
       box-shadow: 0 8px 25px rgba(157, 124, 216, 0.5) !important;
    }

    [data-theme="aura"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--primary) !important;
      color: white !important;
      box-shadow: 0 4px 15px rgba(157, 124, 216, 0.4) !important;
    }

    [data-theme="aura"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 20px rgba(157, 124, 216, 0.2) !important;
      outline: none;
    }

    [data-theme="aura"] table tr {
      background: transparent !important;
      border-bottom: 1px solid var(--border) !important;
      transition: all 0.3s ease;
    }

    [data-theme="aura"] table tr:hover {
      background: rgba(157, 124, 216, 0.05) !important;
      transform: translateX(5px);
    }
    
    [data-theme="aura"] ::selection {
      background: #9d7cd844;
    }
  `,
};
