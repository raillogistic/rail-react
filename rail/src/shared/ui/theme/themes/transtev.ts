/**
 * @module transtevTheme
 * @description Theme definition for "transtev", based on the company logo colors. Green is the background, Orange is primary. No blue.
 */

import type { ThemeDefinition } from "../types";

export const transtevTheme: ThemeDefinition = {
  name: "transtev",
  label: "Transtev",
  radius: "0.5rem",
  light: {
    background: "#27a844", // Corporate Vibrant Green
    foreground: "#ffffff",
    card: "#ffffff",
    cardForeground: "#1f2937",
    popover: "#ffffff",
    popoverForeground: "#1f2937",
    primary: "#f97316", // Corporate Orange (No blue!)
    primaryForeground: "#ffffff",
    secondary: "#e5e7eb",
    secondaryForeground: "#1f2937",
    muted: "#f3f4f6",
    mutedForeground: "#4b5563",
    accent: "#f97316", // Corporate Orange
    accentForeground: "#ffffff",
    destructive: "#ef4444", 
    destructiveForeground: "#ffffff",
    border: "#d1d5db",
    input: "#ffffff",
    ring: "#f97316",
    chart1: "#ffffff", 
    chart2: "#f97316", // Orange
    chart3: "#27a844", // Green
    chart4: "#4f46e5", // Indigo (charts only)
    chart5: "#6b7280", // Slate
    sidebar: "#1f8736", // Slightly darker green
    sidebarForeground: "#ffffff",
    sidebarPrimary: "#f97316",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#27a844",
    sidebarAccentForeground: "#ffffff",
    sidebarBorder: "#1b782f",
    sidebarRing: "#ffffff",
    navbar: "#27a844",
    navbarForeground: "#ffffff",
    inputBackground: "#ffffff",
    tableHeader: "#ffffff",
    tableHeaderForeground: "#374151",
    tableRowHover: "#f9fafb",
    tableRowSelected: "#fff7ed", // Light orange selected state
    dialog: "#ffffff",
    dialogForeground: "#1f2937",
    sheet: "#ffffff",
    sheetForeground: "#1f2937",
    command: "#ffffff",
    commandForeground: "#1f2937",
    dropdown: "#ffffff",
    dropdownForeground: "#1f2937",
    cssVars: {
      "--transtev-shadow": "0 10px 30px -10px rgba(39, 168, 68, 0.3)",
      "--header-border-rgb": "249, 115, 22",
    },
  },
  dark: {
    background: "#0c1f14", // Very dark green background
    foreground: "#f9fafb",
    card: "#111827",
    cardForeground: "#f9fafb",
    popover: "#111827",
    popoverForeground: "#f9fafb",
    primary: "#fb923c", // Brighter Orange
    primaryForeground: "#111827",
    secondary: "#1f2937",
    secondaryForeground: "#f3f4f6",
    muted: "#1f2937",
    mutedForeground: "#9ca3af",
    accent: "#fb923c", // Orange
    accentForeground: "#111827",
    destructive: "#ef4444", 
    destructiveForeground: "#ffffff",
    border: "#1f2937",
    input: "#111827",
    ring: "#fb923c",
    chart1: "#fb923c", // Orange
    chart2: "#27a844", // Green
    chart3: "#60a5fa", // Lighter Blue (charts only)
    chart4: "#fb923c", // Lighter Orange
    chart5: "#9ca3af", // Slate
    sidebar: "#08140c", // Even darker green
    sidebarForeground: "#d1d5db",
    sidebarPrimary: "#fb923c",
    sidebarPrimaryForeground: "#111827",
    sidebarAccent: "#0c1f14",
    sidebarAccentForeground: "#fb923c",
    sidebarBorder: "#1f2937",
    sidebarRing: "#fb923c",
    navbar: "#08140c",
    navbarForeground: "#d1d5db",
    inputBackground: "#111827",
    tableHeader: "#111827",
    tableHeaderForeground: "#9ca3af",
    tableRowHover: "#1f2937",
    tableRowSelected: "#431407", // Dark orange selected state
    dialog: "#111827",
    dialogForeground: "#f9fafb",
    sheet: "#111827",
    sheetForeground: "#f9fafb",
    command: "#111827",
    commandForeground: "#f9fafb",
    dropdown: "#111827",
    dropdownForeground: "#f9fafb",
    cssVars: {
      "--transtev-shadow": "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      "--header-border-rgb": "251, 146, 60",
    },
  },
  components: {
    button: `
      font-weight: 600 !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      border-radius: 0.5rem !important;
      letter-spacing: 0.02em !important;
    `,
    input: `
      border-radius: 0.5rem !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
      transition: all 0.2s ease !important;
    `,
    card: `
      border-radius: 0.75rem !important;
      border: 1px solid var(--border) !important;
      background: var(--card) !important;
      box-shadow: var(--transtev-shadow) !important;
      overflow: hidden;
    `,
    navbar: `
      border-bottom: 1px solid rgba(255,255,255,0.1) !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
    `,
    "site-header": `
      border-bottom: 2px solid var(--primary) !important;
    `,
    "tabs-list": `
      background: var(--muted) !important;
      border-radius: 0.5rem !important;
      padding: 0.25rem !important;
    `,
    "tabs-trigger": `
      border-radius: 0.375rem !important;
      font-weight: 600 !important;
      transition: all 0.2s !important;
      color: var(--card-foreground) !important;
    `,
  },
  customCss: `
    /* Primary buttons */
    [data-theme="transtev"] [data-slot="button"][data-variant="default"] {
       background-color: var(--primary) !important;
       color: var(--primary-foreground) !important;
       box-shadow: 0 4px 6px -1px rgba(var(--header-border-rgb), 0.2), 0 2px 4px -1px rgba(var(--header-border-rgb), 0.1) !important;
    }
    [data-theme="transtev"] [data-slot="button"][data-variant="default"]:hover {
       background-color: color-mix(in srgb, var(--primary) 85%, black) !important;
       transform: translateY(-2px);
       box-shadow: 0 10px 15px -3px rgba(var(--header-border-rgb), 0.3), 0 4px 6px -2px rgba(var(--header-border-rgb), 0.15) !important;
    }

    /* Accent & Secondary */
    [data-theme="transtev"] [data-slot="button"][data-variant="outline"]:hover,
    [data-theme="transtev"] [data-slot="button"][data-variant="secondary"]:hover {
       background-color: var(--secondary) !important;
       color: var(--primary) !important;
       border-color: var(--primary) !important;
    }

    [data-theme="transtev"] [data-slot="tabs-trigger"][data-state="active"] {
      background: var(--card) !important;
      color: var(--primary) !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
    }
    
    [data-theme="transtev"] [data-slot="tabs-trigger"]:not([data-state="active"]) {
      color: var(--muted-foreground) !important;
    }

    /* Inputs Focus */
    [data-theme="transtev"] [data-slot="input"]:focus-visible,
    [data-theme="transtev"] input:focus,
    [data-theme="transtev"] select:focus,
    [data-theme="transtev"] textarea:focus {
      border-color: var(--primary) !important;
      box-shadow: 0 0 0 3px rgba(var(--header-border-rgb), 0.15) !important;
      outline: none !important;
      color: var(--card-foreground) !important;
    }
    
    [data-theme="transtev"] [data-slot="input"] {
      color: var(--card-foreground) !important;
    }

    /* Beautiful Tables */
    [data-theme="transtev"] table {
      border-collapse: separate;
      border-spacing: 0;
    }
    [data-theme="transtev"] table th {
      background: var(--card) !important;
      color: var(--card-foreground);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.75rem 1rem !important;
      border-bottom: 2px solid var(--border) !important;
    }
    [data-theme="transtev"] table td {
      border-bottom: 1px solid var(--border) !important;
      color: var(--card-foreground) !important;
    }
    [data-theme="transtev"] table tr:last-child td {
      border-bottom: none !important;
    }
    
    /* Nav & Sidebar active states in Primary Color */
    [data-theme="transtev"] .sidebar-item-active {
        color: var(--primary) !important;
        background-color: rgba(255, 255, 255, 0.9) !important;
        border-right: 3px solid var(--primary) !important;
    }
    
    /* Make text on cards dark */
    [data-theme="transtev"] .card, 
    [data-theme="transtev"] [data-slot="card"] {
      color: var(--card-foreground) !important;
    }
    
    [data-theme="transtev"] h1, 
    [data-theme="transtev"] h2, 
    [data-theme="transtev"] h3, 
    [data-theme="transtev"] h4, 
    [data-theme="transtev"] h5, 
    [data-theme="transtev"] h6 {
       color: currentColor;
    }
  `,
};
