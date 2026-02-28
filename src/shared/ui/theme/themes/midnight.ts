/**
 * @module midnightTheme
 * @description Theme definition for "midnight".
 */

import type { ThemeDefinition } from "../types";

export const midnightTheme: ThemeDefinition = {
  name: "midnight",
  label: "Midnight",
  radius: "0.5rem",
  light: {
    background: "#ffffff",
    foreground: "#020617",
    card: "#f8fafc",
    cardForeground: "#020617",
    popover: "#ffffff",
    popoverForeground: "#020617",
    primary: "#0f172a",
    primaryForeground: "#ffffff",
    secondary: "#f1f5f9",
    secondaryForeground: "#020617",
    muted: "#f8fafc",
    mutedForeground: "#64748b",
    accent: "#334155",
    accentForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    border: "#e2e8f0",
    input: "#ffffff",
    ring: "#0f172a",
    chart1: "#0f172a",
    chart2: "#334155",
    chart3: "#475569",
    chart4: "#64748b",
    chart5: "#94a3b8",
    sidebar: "#f8fafc",
    sidebarForeground: "#020617",
    sidebarPrimary: "#0f172a",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#f1f5f9",
    sidebarAccentForeground: "#020617",
    sidebarBorder: "#e2e8f0",
    sidebarRing: "#0f172a",
    navbar: "#020617",
    navbarForeground: "#f8fafc",
    inputBackground: "#ffffff",
    tableHeader: "#f1f5f9",
    tableHeaderForeground: "#64748b",
    tableRowHover: "#f8fafc",
    tableRowSelected: "#e2e8f0",
    dialog: "#ffffff",
    dialogForeground: "#020617",
    sheet: "#ffffff",
    sheetForeground: "#020617",
    command: "#ffffff",
    commandForeground: "#020617",
    dropdown: "#ffffff",
    dropdownForeground: "#020617",
    cssVars: {
      "--midnight-glow": "0 0 20px rgba(15, 23, 42, 0.1)",
      "--star-dust":
        "radial-gradient(circle, rgba(15, 23, 42, 0.05) 1px, transparent 1px)",
    },
  },
  dark: {
    background: "#020617",
    foreground: "#f8fafc",
    card: "#070e1a",
    cardForeground: "#f8fafc",
    popover: "#020617",
    popoverForeground: "#f8fafc",
    primary: "#38bdf8",
    primaryForeground: "#020617",
    secondary: "#0f172a",
    secondaryForeground: "#f8fafc",
    muted: "#0f172a",
    mutedForeground: "#94a3b8",
    accent: "#1e293b",
    accentForeground: "#f8fafc",
    destructive: "#7f1d1d",
    destructiveForeground: "#ffffff",
    border: "#1e293b",
    input: "#070e1a",
    ring: "#38bdf8",
    chart1: "#38bdf8",
    chart2: "#0ea5e9",
    chart3: "#0284c7",
    chart4: "#0369a1",
    chart5: "#075985",
    sidebar: "#010409",
    sidebarForeground: "#94a3b8",
    sidebarPrimary: "#38bdf8",
    sidebarPrimaryForeground: "#020617",
    sidebarAccent: "#0f172a",
    sidebarAccentForeground: "#f8fafc",
    sidebarBorder: "#1e293b",
    sidebarRing: "#38bdf8",
    navbar: "#010409",
    navbarForeground: "#38bdf8",
    inputBackground: "#020617",
    tableHeader: "#0f172a",
    tableHeaderForeground: "#94a3b8",
    tableRowHover: "#0f172a",
    tableRowSelected: "#1e293b",
    dialog: "#070e1a",
    dialogForeground: "#f8fafc",
    sheet: "#070e1a",
    sheetForeground: "#f8fafc",
    command: "#070e1a",
    commandForeground: "#f8fafc",
    dropdown: "#070e1a",
    dropdownForeground: "#f8fafc",
    cssVars: {
      "--midnight-glow": "0 0 30px rgba(56, 189, 248, 0.2)",
      "--star-dust":
        "radial-gradient(circle, rgba(56, 189, 248, 0.1) 1px, transparent 1px)",
    },
  },
  components: {
    button: `
      border-radius: 0.5rem !important;
      font-weight: 600 !important;
      transition: all 0.3s ease !important;
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
    `,
    input: `
      border-radius: 0.5rem !important;
      background: var(--input) !important;
      border: 1px solid var(--border) !important;
      color: var(--foreground) !important;
    `,
    card: `
      border-radius: 1rem !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--midnight-glow) !important;
      position: relative;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 2px solid var(--primary) !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `,
    "tabs-list": `
      background: var(--muted) !important;
      border-radius: 0.75rem !important;
      padding: 4px !important;
    `,
    "tabs-trigger": `
      border-radius: 0.5rem !important;
      font-weight: 600 !important;
      transition: all 0.2s ease !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      border-radius: 1.5rem !important;
      padding: 30px !important;
      box-shadow: var(--midnight-glow) !important;
    `,
  },
  customCss: `
    [data-theme="midnight"] [data-slot="button"]:hover {
       transform: translateY(-1px);
       box-shadow: 0 0 25px var(--primary) !important;
    }

    [data-theme="midnight"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--background) !important;
      color: var(--primary) !important;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
    }

    [data-theme="midnight"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 10px var(--primary) !important;
      outline: none;
    }

    [data-theme="midnight"] table th {
      background: rgba(56, 189, 248, 0.05) !important;
      color: var(--primary);
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    [data-theme="midnight"] .card::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image: var(--star-dust);
      background-size: 40px 40px;
      pointer-events: none;
      opacity: 0.5;
    }
  `,
};
