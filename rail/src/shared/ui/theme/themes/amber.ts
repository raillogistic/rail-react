/**
 * @module amberTheme
 * @description Theme definition for "amber".
 */

import type { ThemeDefinition } from "../types";

export const amberTheme: ThemeDefinition = {
  name: "amber",
  label: "Amber",
  radius: "0rem",
  light: {
    background: "#fdf8e6",
    foreground: "#78350f",
    card: "#fffbeb",
    cardForeground: "#78350f",
    popover: "#ffffff",
    popoverForeground: "#78350f",
    primary: "#d97706",
    primaryForeground: "#ffffff",
    secondary: "#fef3c7",
    secondaryForeground: "#92400e",
    muted: "#fef3c7",
    mutedForeground: "#d97706",
    accent: "#f59e0b",
    accentForeground: "#ffffff",
    destructive: "#b91c1c",
    destructiveForeground: "#ffffff",
    border: "#fde68a",
    input: "#ffffff",
    ring: "#d97706",
    chart1: "#d97706",
    chart2: "#f59e0b",
    chart3: "#b45309",
    chart4: "#92400e",
    chart5: "#78350f",
    sidebar: "#fffbeb",
    sidebarForeground: "#78350f",
    sidebarPrimary: "#d97706",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#fde68a",
    sidebarAccentForeground: "#78350f",
    sidebarBorder: "#fde68a",
    sidebarRing: "#d97706",
    navbar: "#451a03",
    navbarForeground: "#fbbf24",
    inputBackground: "#ffffff",
    tableHeader: "#fef3c7",
    tableHeaderForeground: "#78350f",
    tableRowHover: "#fde68a44",
    tableRowSelected: "#fde68a88",
    dialog: "#fffbeb",
    dialogForeground: "#78350f",
    sheet: "#fffbeb",
    sheetForeground: "#78350f",
    command: "#fffbeb",
    commandForeground: "#78350f",
    dropdown: "#fffbeb",
    dropdownForeground: "#78350f",
    cssVars: {
      "--terminal-glow": "0 0 10px rgba(217, 119, 6, 0.4)",
      "--scan-opacity": "0.03",
    },
  },
  dark: {
    background: "#0a0500",
    foreground: "#fbbf24",
    card: "#120a00",
    cardForeground: "#fbbf24",
    popover: "#0a0500",
    popoverForeground: "#fbbf24",
    primary: "#fbbf24",
    primaryForeground: "#0a0500",
    secondary: "#1a1000",
    secondaryForeground: "#fbbf24",
    muted: "#1a1000",
    mutedForeground: "#d97706",
    accent: "#fbbf24",
    accentForeground: "#0a0500",
    destructive: "#ff4d4d",
    destructiveForeground: "#ffffff",
    border: "#d9770644",
    input: "#0a0500",
    ring: "#fbbf24",
    chart1: "#fbbf24",
    chart2: "#f59e0b",
    chart3: "#d97706",
    chart4: "#b45309",
    chart5: "#92400e",
    sidebar: "#000000",
    sidebarForeground: "#d97706",
    sidebarPrimary: "#fbbf24",
    sidebarPrimaryForeground: "#0a0500",
    sidebarAccent: "#120a00",
    sidebarAccentForeground: "#fbbf24",
    sidebarBorder: "#d9770633",
    sidebarRing: "#fbbf24",
    navbar: "#000000",
    navbarForeground: "#fbbf24",
    inputBackground: "#0a0500",
    tableHeader: "#1a1000",
    tableHeaderForeground: "#fbbf2488",
    tableRowHover: "#fbbf2411",
    tableRowSelected: "#fbbf2422",
    dialog: "#120a00",
    dialogForeground: "#fbbf24",
    sheet: "#120a00",
    sheetForeground: "#fbbf24",
    command: "#120a00",
    commandForeground: "#fbbf24",
    dropdown: "#120a00",
    dropdownForeground: "#fbbf24",
    cssVars: {
      "--terminal-glow": "0 0 15px rgba(251, 191, 36, 0.6)",
      "--scan-opacity": "0.1",
    },
  },
  components: {
    button: `
      border-radius: 0 !important;
      border: 2px solid var(--primary) !important;
      background: transparent !important;
      color: var(--primary) !important;
      text-transform: uppercase !important;
      letter-spacing: 0.15rem !important;
      font-weight: 800 !important;
      text-shadow: 0 0 5px var(--primary);
      transition: all 0.2s steps(4) !important;
    `,
    input: `
      border-radius: 0 !important;
      border: 1px solid var(--primary) !important;
      background: var(--background) !important;
      color: var(--primary) !important;
      font-family: var(--font-mono) !important;
      caret-color: var(--primary);
    `,
    card: `
      border-radius: 0 !important;
      border: 1px solid var(--primary) !important;
      background: var(--card) !important;
      position: relative;
      overflow: hidden;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 3px solid var(--primary) !important;
    `,
    "tabs-list": `
      background: transparent !important;
      border: 1px solid var(--border) !important;
      border-radius: 0 !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 800 !important;
      color: var(--muted-foreground) !important;
      text-transform: uppercase !important;
    `,
    "model-detail": `
      background: var(--background) !important;
      border: 2px solid var(--primary) !important;
      box-shadow: var(--terminal-glow) !important;
    `,
  },
  customCss: `
    [data-theme="amber"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: var(--primary-foreground) !important;
       box-shadow: 0 0 20px var(--primary) !important;
    }

    [data-theme="amber"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
    }

    [data-theme="amber"] [data-slot="input"]:focus {
       outline: none;
       box-shadow: 0 0 10px var(--primary) !important;
    }

    [data-theme="amber"] table th {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      text-transform: uppercase;
      font-weight: 900;
    }

    [data-theme="amber"] .card::before {
      content: " ";
      display: block;
      position: absolute;
      top: 0; left: 0; bottom: 0; right: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      z-index: 2;
      background-size: 100% 2px, 3px 100%;
      pointer-events: none;
      opacity: var(--scan-opacity);
    }

    @keyframes flicker {
      0% { opacity: 0.27861; }
      5% { opacity: 0.34769; }
      10% { opacity: 0.23604; }
      15% { opacity: 0.90626; }
      20% { opacity: 0.18128; }
      25% { opacity: 0.83891; }
      30% { opacity: 0.65583; }
      35% { opacity: 0.57807; }
      40% { opacity: 0.26559; }
      45% { opacity: 0.84693; }
      50% { opacity: 0.96019; }
      55% { opacity: 0.08594; }
      60% { opacity: 0.20313; }
      65% { opacity: 0.71988; }
      70% { opacity: 0.53455; }
      75% { opacity: 0.37288; }
      80% { opacity: 0.71428; }
      85% { opacity: 0.70419; }
      90% { opacity: 0.7003; }
      95% { opacity: 0.36108; }
      100% { opacity: 0.24387; }
    }
    
    [data-theme="amber"] .flicker {
       animation: flicker 0.15s infinite;
    }
  `,
};
