export type ThemeMode = "light" | "dark";

export type Layout = "vertical" | "horizontal" | "mixed";
export type SidebarCollapseMode = "offcanvas" | "icon";
export type FontSize = "sm" | "md" | "lg" | "xl";
export type LineHeight = "compact" | "normal" | "relaxed";
export type LetterSpacing = "tight" | "normal" | "wide";
export type FontFamily =
  | "inter"
  | "roboto"
  | "system"
  | "mono"
  | "serif"
  | "open-sans"
  | "lato"
  | "montserrat"
  | "source-code-pro"
  | "playfair-display"
  | "fira-code"
  | "oxanium"
  | "geist"
  | "baloo-tamma-2";

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
  navbar: string;
  navbarForeground: string;
  inputBackground: string;
  tableHeader: string;
  tableHeaderForeground: string;
  tableRowHover: string;
  tableRowSelected: string;
  dialog: string;
  dialogForeground: string;
  sheet: string;
  sheetForeground: string;
  command: string;
  commandForeground: string;
  dropdown: string;
  dropdownForeground: string;
  cssVars?: Record<string, string>;
}

export type ThemeComponentStyles = {
  [slot: string]: string;
};

export interface ThemeDefinition {
  name: string;
  label: string;
  light: ThemeColors;
  dark: ThemeColors;
  radius: string;
  cssVars?: Record<string, string>;
  components?: ThemeComponentStyles;
  customCss?: string;
}

export type ThemeKey = string;
export type ThemeName = ThemeKey;
