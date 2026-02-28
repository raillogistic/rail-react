/**
 * @module cyberpunkTheme
 * @description Theme definition for "cyberpunk".
 */

import type { ThemeDefinition } from "../types";

export const cyberpunkTheme: ThemeDefinition = {
  name: "cyberpunk",
  label: "Cyberpunk",
  radius: "0rem",
  light: {
    background: "#fdfdfd",
    foreground: "#000000",
    card: "#ffffff",
    cardForeground: "#000000",
    popover: "#ffffff",
    popoverForeground: "#000000",
    primary: "#ff00ff",
    primaryForeground: "#ffffff",
    secondary: "#00ffff",
    secondaryForeground: "#000000",
    muted: "#f0f0f0",
    mutedForeground: "#666666",
    accent: "#ffff00",
    accentForeground: "#000000",
    destructive: "#ff3e3e",
    destructiveForeground: "#ffffff",
    border: "#d1d1d1",
    input: "#ffffff",
    ring: "#ff00ff",
    chart1: "#ff00ff",
    chart2: "#00ffff",
    chart3: "#ffff00",
    chart4: "#000000",
    chart5: "#666666",
    sidebar: "#ffffff",
    sidebarForeground: "#000000",
    sidebarPrimary: "#ff00ff",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#00ffff",
    sidebarAccentForeground: "#000000",
    sidebarBorder: "#e5e5e5",
    sidebarRing: "#ff00ff",
    navbar: "#000000",
    navbarForeground: "#00ffff",
    inputBackground: "#ffffff",
    tableHeader: "#f9f9f9",
    tableHeaderForeground: "#666666",
    tableRowHover: "#00ffff11",
    tableRowSelected: "#00ffff22",
    dialog: "#ffffff",
    dialogForeground: "#000000",
    sheet: "#ffffff",
    sheetForeground: "#000000",
    command: "#ffffff",
    commandForeground: "#000000",
    dropdown: "#ffffff",
    dropdownForeground: "#000000",
    cssVars: {
      "--neon-primary": "#ff00ff",
      "--neon-secondary": "#00ffff",
      "--neon-accent": "#ffff00",
      "--glow-intensity": "0.5",
      "--glitch-duration": "0.2s",
    },
  },
  dark: {
    background: "#050505",
    foreground: "#00ffff",
    card: "#0a0a0a",
    cardForeground: "#00ffff",
    popover: "#000000",
    popoverForeground: "#00ffff",
    primary: "#ff00ff",
    primaryForeground: "#ffffff",
    secondary: "#ffff00",
    secondaryForeground: "#000000",
    muted: "#1a1a1a",
    mutedForeground: "#ff00ffcc",
    accent: "#ff00ff",
    accentForeground: "#ffffff",
    destructive: "#ff0033",
    destructiveForeground: "#ffffff",
    border: "#ff00ff33",
    input: "#000000",
    ring: "#00ffff",
    chart1: "#ff00ff",
    chart2: "#00ffff",
    chart3: "#ffff00",
    chart4: "#00ff00",
    chart5: "#ffffff",
    sidebar: "#000000",
    sidebarForeground: "#ff00ff",
    sidebarPrimary: "#00ffff",
    sidebarPrimaryForeground: "#000000",
    sidebarAccent: "#ff00ff33",
    sidebarAccentForeground: "#ff00ff",
    sidebarBorder: "#ff00ff33",
    sidebarRing: "#00ffff",
    navbar: "#000000",
    navbarForeground: "#ff00ff",
    inputBackground: "#000000",
    tableHeader: "#0a0a0a",
    tableHeaderForeground: "#ff00ffaa",
    tableRowHover: "#ff00ff11",
    tableRowSelected: "#ff00ff22",
    dialog: "#0a0a0a",
    dialogForeground: "#00ffff",
    sheet: "#0a0a0a",
    sheetForeground: "#00ffff",
    command: "#0a0a0a",
    commandForeground: "#00ffff",
    dropdown: "#0a0a0a",
    dropdownForeground: "#00ffff",
    cssVars: {
      "--neon-primary": "#ff00ff",
      "--neon-secondary": "#00ffff",
      "--neon-accent": "#ffff00",
      "--glow-intensity": "0.8",
      "--glitch-duration": "0.15s",
    },
  },
  components: {
    button: `
      clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
      border: 1px solid var(--primary) !important;
      background: transparent !important;
      color: var(--primary) !important;
      font-weight: 800 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.15em !important;
      transition: all 0.3s ease !important;
      text-shadow: 0 0 5px var(--primary);
    `,
    input: `
      border: 1px solid var(--border) !important;
      background: var(--background) !important;
      color: var(--foreground) !important;
      border-radius: 0 !important;
      font-family: var(--font-mono) !important;
    `,
    card: `
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      border-radius: 0 !important;
      position: relative;
      overflow: hidden;
    `,
    navbar: `
      border-bottom: 2px solid var(--primary) !important;
      box-shadow: 0 0 15px var(--primary) !important;
    `,
    "tabs-list": `
      background: transparent !important;
      border-bottom: 2px solid var(--muted) !important;
      border-radius: 0 !important;
      gap: 10px !important;
    `,
    "tabs-trigger": `
      border-radius: 0 !important;
      font-weight: 700 !important;
      color: var(--muted-foreground) !important;
      border-bottom: 2px solid transparent !important;
      transition: all 0.2s ease !important;
      text-transform: uppercase !important;
    `,
    "model-table": `
      border: 1px solid var(--border) !important;
      border-radius: 0 !important;
    `,
    "model-detail": `
       border-left: 5px solid var(--primary) !important;
       background: var(--card) !important;
       box-shadow: 10px 0 20px -10px var(--primary) !important;
    `,
  },
  customCss: `
    [data-theme="cyberpunk"] [data-slot="button"]:hover {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      box-shadow: 0 0 20px var(--primary) !important;
      transform: skew(-5deg);
    }

    [data-theme="cyberpunk"] [data-slot="tabs-trigger"][data-state="active"] {
      color: var(--primary) !important;
      border-bottom: 2px solid var(--primary) !important;
      text-shadow: 0 0 8px var(--primary);
      background: var(--primary-foreground) !important;
    }

    [data-theme="cyberpunk"] [data-slot="input"]:focus {
      border-color: var(--secondary) !important;
      box-shadow: 0 0 10px var(--secondary) !important;
      outline: none;
    }

    [data-theme="cyberpunk"] table th {
      background: var(--primary) !important;
      color: var(--primary-foreground) !important;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.2em;
    }

    [data-theme="cyberpunk"] .card::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--primary), transparent);
      animation: scanline 2s linear infinite;
    }

    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(1000%); }
    }
  `,
};
