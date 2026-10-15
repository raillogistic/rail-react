/**
 * @module pulsarTheme
 * @description Theme definition for "pulsar".
 */

import type { ThemeDefinition } from "../types";

export const pulsarTheme: ThemeDefinition = {
  name: "pulsar",
  label: "Pulsar",
  radius: "1rem",
  light: {
    background: "#fdf8ff",
    foreground: "#240b36",
    card: "rgba(255, 255, 255, 0.7)",
    cardForeground: "#240b36",
    popover: "rgba(255, 255, 255, 0.9)",
    popoverForeground: "#240b36",
    primary: "#c31432",
    primaryForeground: "#ffffff",
    secondary: "#f3e1f5",
    secondaryForeground: "#c31432",
    muted: "#f3e1f5",
    mutedForeground: "#c3143266",
    accent: "#ff0080",
    accentForeground: "#ffffff",
    destructive: "#b91d73",
    destructiveForeground: "#ffffff",
    border: "#c3143233",
    input: "rgba(255, 255, 255, 0.5)",
    ring: "#c31432",
    chart1: "#c31432",
    chart2: "#240b36",
    chart3: "#ff0080",
    chart4: "#00d1ff",
    chart5: "#7000ff",
    sidebar: "#fdf8ff",
    sidebarForeground: "#240b36",
    sidebarPrimary: "#c31432",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#f3e1f5",
    sidebarAccentForeground: "#c31432",
    sidebarBorder: "#c3143222",
    sidebarRing: "#c31432",
    navbar: "#240b36",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#f3e1f5",
    tableHeaderForeground: "#240b36",
    tableRowHover: "rgba(195, 20, 50, 0.05)",
    tableRowSelected: "rgba(195, 20, 50, 0.1)",
    dialog: "rgba(255, 255, 255, 0.9)",
    dialogForeground: "#240b36",
    sheet: "rgba(255, 255, 255, 0.9)",
    sheetForeground: "#240b36",
    command: "rgba(255, 255, 255, 0.9)",
    commandForeground: "#240b36",
    dropdown: "rgba(255, 255, 255, 0.9)",
    dropdownForeground: "#240b36",
    cssVars: {
      "--pulsar-glow": "0 0 15px rgba(195, 20, 50, 0.2)",
      "--grid-line": "rgba(195, 20, 50, 0.05)",
    },
  },
  dark: {
    background: "#0d0216",
    foreground: "#f3e1f5",
    card: "rgba(23, 6, 38, 0.7)",
    cardForeground: "#f3e1f5",
    popover: "rgba(13, 2, 22, 0.95)",
    popoverForeground: "#f3e1f5",
    primary: "#ff0080",
    primaryForeground: "#ffffff",
    secondary: "#240b36",
    secondaryForeground: "#ff0080",
    muted: "#240b36",
    mutedForeground: "#ff008066",
    accent: "#00d1ff",
    accentForeground: "#ffffff",
    destructive: "#b91d73",
    destructiveForeground: "#ffffff",
    border: "#ff008044",
    input: "rgba(23, 6, 38, 0.5)",
    ring: "#ff0080",
    chart1: "#ff0080",
    chart2: "#240b36",
    chart3: "#00d1ff",
    chart4: "#c31432",
    chart5: "#7000ff",
    sidebar: "#08010d",
    sidebarForeground: "#ff008088",
    sidebarPrimary: "#ff0080",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#240b36",
    sidebarAccentForeground: "#ff0080",
    sidebarBorder: "#ff008044",
    sidebarRing: "#ff0080",
    navbar: "#08010d",
    navbarForeground: "#ff0080",
    inputBackground: "#0d0216",
    tableHeader: "#240b36",
    tableHeaderForeground: "#ff0080",
    tableRowHover: "rgba(255, 0, 128, 0.1)",
    tableRowSelected: "rgba(255, 0, 128, 0.15)",
    dialog: "rgba(23, 6, 38, 0.9)",
    dialogForeground: "#f3e1f5",
    sheet: "rgba(23, 6, 38, 0.9)",
    sheetForeground: "#f3e1f5",
    command: "rgba(23, 6, 38, 0.9)",
    commandForeground: "#f3e1f5",
    dropdown: "rgba(23, 6, 38, 0.9)",
    dropdownForeground: "#f3e1f5",
    cssVars: {
      "--pulsar-glow": "0 0 25px rgba(255, 0, 128, 0.4)",
      "--grid-line": "rgba(255, 0, 128, 0.1)",
    },
  },
  components: {
    button: `
      border-radius: 0.5rem !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.1rem !important;
      transition: all 0.3s ease !important;
      border: 2px solid var(--primary) !important;
      background: transparent !important;
      color: var(--primary) !important;
      box-shadow: var(--pulsar-glow) !important;
    `,
    input: `
      border-radius: 0.5rem !important;
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease !important;
    `,
    card: `
      border-radius: 1rem !important;
      backdrop-filter: blur(20px);
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--pulsar-glow) !important;
      position: relative;
    `,
    "table-header": `
      background: rgba(255, 0, 128, 0.1) !important;
      border-bottom: 2px solid var(--primary) !important;
      text-transform: uppercase !important;
      font-weight: 900 !important;
      letter-spacing: 0.15em !important;
    `,
    sidebar: `
      background: var(--background) !important;
      border-right: 2px solid var(--primary) !important;
    `,
    "sidebar-inner": `
       background: transparent !important;
    `,
    "sidebar-menu-button": `
       border-radius: 0.5rem !important;
       font-weight: 700 !important;
       transition: all 0.2s ease !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 3px solid var(--primary) !important;
      box-shadow: 0 4px 20px rgba(255, 0, 128, 0.2);
    `,
    "model-table": `
       border: 2px solid var(--border) !important;
       border-radius: 1rem !important;
       background: var(--card) !important;
       backdrop-filter: blur(20px);
       overflow: hidden !important;
    `,
    "dropdown-menu-content": `
       border: 2px solid var(--border) !important;
       border-radius: 0.75rem !important;
       background: var(--popover) !important;
       backdrop-filter: blur(15px);
       padding: 8px !important;
       box-shadow: var(--pulsar-glow) !important;
    `,
    "dropdown-menu-item": `
       border-radius: 0.5rem !important;
       font-weight: 700 !important;
    `,
    "tabs-list": `
      background: var(--secondary) !important;
      border-radius: 0.75rem !important;
      padding: 5px !important;
      backdrop-filter: blur(10px);
    `,
    "tabs-trigger": `
      border-radius: 0.5rem !important;
      font-weight: 800 !important;
      transition: all 0.2s ease !important;
    `,
    "tabs-content": `
       background: transparent !important;
       padding: 1.5rem 0 !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      border-radius: 2rem !important;
      backdrop-filter: blur(30px);
      padding: 40px !important;
      border: 2px solid var(--primary) !important;
      box-shadow: var(--pulsar-glow) !important;
    `,
  },
  customCss: `
    [data-theme="pulsar"] [data-slot="button"]:hover {
       background: var(--primary) !important;
       color: white !important;
       transform: scale(1.05);
       box-shadow: 0 0 40px var(--primary) !important;
    }

    [data-theme="pulsar"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--primary) !important;
      color: white !important;
      box-shadow: 0 0 20px var(--primary) !important;
    }

    [data-theme="pulsar"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 15px var(--primary) !important;
      outline: none;
    }

    [data-theme="pulsar"] table th {
      color: var(--primary) !important;
      text-transform: uppercase;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-shadow: 0 0 10px rgba(255, 0, 128, 0.4);
    }

    [data-theme="pulsar"] [data-slot="dropdown-menu-item"]:focus {
       background: var(--primary) !important;
       color: white !important;
       box-shadow: 0 0 15px var(--primary) !important;
    }

    [data-theme="pulsar"] [data-slot="sidebar-menu-button"]:hover,
    [data-theme="pulsar"] [data-slot="sidebar-menu-button"][data-active="true"] {
       background: var(--primary) !important;
       color: white !important;
       box-shadow: 0 0 15px var(--primary) !important;
    }

    [data-theme="pulsar"] .card::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(var(--grid-line) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
      background-size: 20px 20px;
      pointer-events: none;
      z-index: -1;
      opacity: 0.5;
    }
  `,
};
