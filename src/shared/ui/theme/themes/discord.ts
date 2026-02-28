/**
 * @module discordTheme
 * @description Theme definition for "discord".
 */

import type { ThemeDefinition } from "../types";

export const discordTheme: ThemeDefinition = {
  name: "discord",
  label: "Discord",
  radius: "0.5rem",
  light: {
    background: "#ffffff",
    foreground: "#23272a",
    card: "#f2f3f5",
    cardForeground: "#23272a",
    popover: "#ffffff",
    popoverForeground: "#23272a",
    primary: "#5865f2",
    primaryForeground: "#ffffff",
    secondary: "#e3e5e8",
    secondaryForeground: "#23272a",
    muted: "#e3e5e8",
    mutedForeground: "#747f8d",
    accent: "#ebedef",
    accentForeground: "#23272a",
    destructive: "#ed4245",
    destructiveForeground: "#ffffff",
    border: "#e3e5e8",
    input: "#ffffff",
    ring: "#5865f2",
    chart1: "#5865f2",
    chart2: "#57f287",
    chart3: "#fee75c",
    chart4: "#ed4245",
    chart5: "#eb459e",
    sidebar: "#f2f3f5",
    sidebarForeground: "#23272a",
    sidebarPrimary: "#5865f2",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#e3e5e8",
    sidebarAccentForeground: "#23272a",
    sidebarBorder: "#e3e5e8",
    sidebarRing: "#5865f2",
    navbar: "#23272a",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#e3e5e8",
    tableHeaderForeground: "#747f8d",
    tableRowHover: "rgba(88, 101, 242, 0.05)",
    tableRowSelected: "rgba(88, 101, 242, 0.1)",
    dialog: "#ffffff",
    dialogForeground: "#23272a",
    sheet: "#ffffff",
    sheetForeground: "#23272a",
    command: "#ffffff",
    commandForeground: "#23272a",
    dropdown: "#ffffff",
    dropdownForeground: "#23272a",
    cssVars: {
      "--blurple": "#5865f2",
      "--green-indicator": "#57f287",
    },
  },
  dark: {
    background: "#313338",
    foreground: "#dbdee1",
    card: "#2b2d31",
    cardForeground: "#dbdee1",
    popover: "#2b2d31",
    popoverForeground: "#dbdee1",
    primary: "#5865f2",
    primaryForeground: "#ffffff",
    secondary: "#232428",
    secondaryForeground: "#dbdee1",
    muted: "#232428",
    mutedForeground: "#949ba4",
    accent: "#404249",
    accentForeground: "#ffffff",
    destructive: "#ed4245",
    destructiveForeground: "#ffffff",
    border: "#1e1f22",
    input: "#1e1f22",
    ring: "#5865f2",
    chart1: "#5865f2",
    chart2: "#57f287",
    chart3: "#fee75c",
    chart4: "#ed4245",
    chart5: "#eb459e",
    sidebar: "#1e1f22",
    sidebarForeground: "#949ba4",
    sidebarPrimary: "#5865f2",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#35373c",
    sidebarAccentForeground: "#dbdee1",
    sidebarBorder: "#1e1f22",
    sidebarRing: "#5865f2",
    navbar: "#1e1f22",
    navbarForeground: "#ffffff",
    inputBackground: "#313338",
    tableHeader: "#2b2d31",
    tableHeaderForeground: "#949ba4",
    tableRowHover: "rgba(255, 255, 255, 0.03)",
    tableRowSelected: "rgba(255, 255, 255, 0.05)",
    dialog: "#313338",
    dialogForeground: "#dbdee1",
    sheet: "#313338",
    sheetForeground: "#dbdee1",
    command: "#313338",
    commandForeground: "#dbdee1",
    dropdown: "#313338",
    dropdownForeground: "#dbdee1",
    cssVars: {
      "--blurple": "#5865f2",
      "--green-indicator": "#57f287",
    },
  },
  components: {
    button: `
      border-radius: 3px !important;
      font-weight: 500 !important;
      transition: background-color 0.17s ease, color 0.17s ease !important;
      border: none !important;
      padding: 10px 20px !important;
    `,
    input: `
      border-radius: 4px !important;
      background: var(--input) !important;
      border: 1px solid transparent !important;
      color: var(--foreground) !important;
    `,
    card: `
      border-radius: 8px !important;
      background: var(--card) !important;
      border: none !important;
    `,
    navbar: `
      background: var(--background) !important;
      border-bottom: 1px solid var(--border) !important;
    `,
    "tabs-list": `
      background: transparent !important;
      gap: 16px !important;
    `,
    "tabs-trigger": `
      border-radius: 4px !important;
      font-weight: 500 !important;
      padding: 8px 16px !important;
      color: var(--muted-foreground) !important;
    `,
    "model-detail": `
      background: var(--card) !important;
      border-radius: 12px !important;
      padding: 30px !important;
    `,
  },
  customCss: `
    [data-theme="discord"] [data-slot="button"]:hover {
       background: #4752c4 !important;
    }
    
    [data-theme="discord"] [data-slot="button"][data-state="open"] {
       background: #4752c4 !important;
    }

    [data-theme="discord"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--accent) !important;
      color: var(--foreground) !important;
    }

    [data-theme="discord"] [data-slot="input"]:focus {
      border-color: var(--primary) !important;
      outline: none;
    }

    [data-theme="discord"] table th {
      color: var(--muted-foreground);
      text-transform: uppercase;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    
    [data-theme="discord"] .sidebar-link[data-active="true"] {
      background: var(--sidebar-accent) !important;
      color: var(--foreground) !important;
      border-radius: 4px;
    }
  `,
};
