import React, { createContext, useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { 
  ThemeDefinition, 
  ThemeKey, 
  ThemeMode, 
  ThemeColors,
  Layout,
  SidebarCollapseMode,
  FontSize,
  FontFamily,
  LineHeight,
  LetterSpacing
} from './types';
import { themes } from './themes';
import {
  DEFAULT_THEME,
  DEFAULT_MODE,
  DEFAULT_LAYOUT,
  DEFAULT_SIDEBAR_COLLAPSE_MODE,
  DEFAULT_FONT_SIZE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_LETTER_SPACING,
  DEFAULT_STORAGE_KEY
} from './constants';
import { 
  UPDATE_MY_SETTINGS_MUTATION_RESOLVED, 
  type UpdateMySettingsResponse, 
  type UpdateMySettingsVariables 
} from '@/graphql/mutations';
import client from '@/graphql/apollo-client';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeKey;
  defaultMode?: ThemeMode;
  defaultLayout?: Layout;
  defaultSidebarCollapseMode?: SidebarCollapseMode;
  defaultFontSize?: FontSize;
  defaultFontFamily?: FontFamily;
  defaultLineHeight?: LineHeight;
  defaultLetterSpacing?: LetterSpacing;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: ThemeKey;
  mode: ThemeMode;
  layout: Layout;
  sidebarCollapseMode: SidebarCollapseMode;
  fontSize: FontSize;
  fontFamily: FontFamily;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  setTheme: (theme: ThemeKey) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setLayout: (layout: Layout) => void;
  setSidebarCollapseMode: (mode: SidebarCollapseMode) => void;
  setFontSize: (size: FontSize) => void;
  setFontFamily: (family: FontFamily) => void;
  setLineHeight: (height: LineHeight) => void;
  setLetterSpacing: (spacing: LetterSpacing) => void;
  availableThemes: ThemeDefinition[];
};

const initialState: ThemeProviderState = {
  theme: DEFAULT_THEME,
  mode: DEFAULT_MODE,
  layout: DEFAULT_LAYOUT,
  sidebarCollapseMode: DEFAULT_SIDEBAR_COLLAPSE_MODE,
  fontSize: DEFAULT_FONT_SIZE,
  fontFamily: DEFAULT_FONT_FAMILY,
  lineHeight: DEFAULT_LINE_HEIGHT,
  letterSpacing: DEFAULT_LETTER_SPACING,
  setTheme: () => {},
  setMode: () => {},
  toggleMode: () => {},
  setLayout: () => {},
  setSidebarCollapseMode: () => {},
  setFontSize: () => {},
  setFontFamily: () => {},
  setLineHeight: () => {},
  setLetterSpacing: () => {},
  availableThemes: [],
};

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  defaultMode = DEFAULT_MODE,
  defaultLayout = DEFAULT_LAYOUT,
  defaultSidebarCollapseMode = DEFAULT_SIDEBAR_COLLAPSE_MODE,
  defaultFontSize = DEFAULT_FONT_SIZE,
  defaultFontFamily = DEFAULT_FONT_FAMILY,
  defaultLineHeight = DEFAULT_LINE_HEIGHT,
  defaultLetterSpacing = DEFAULT_LETTER_SPACING,
  storageKey = DEFAULT_STORAGE_KEY,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeKey>(() => {
    return (localStorage.getItem(`${storageKey}-theme`) as ThemeKey) || defaultTheme;
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem(`${storageKey}-mode`) as ThemeMode) || defaultMode;
  });

  const [layout, setLayoutState] = useState<Layout>(() => {
    return (localStorage.getItem(`${storageKey}-layout`) as Layout) || defaultLayout;
  });

  const [sidebarCollapseMode, setSidebarCollapseModeState] = useState<SidebarCollapseMode>(() => {
    return (localStorage.getItem(`${storageKey}-sidebar-collapse`) as SidebarCollapseMode) || defaultSidebarCollapseMode;
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem(`${storageKey}-font-size`) as FontSize) || defaultFontSize;
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    return (localStorage.getItem(`${storageKey}-font-family`) as FontFamily) || defaultFontFamily;
  });

  const [lineHeight, setLineHeightState] = useState<LineHeight>(() => {
    return (localStorage.getItem(`${storageKey}-line-height`) as LineHeight) || defaultLineHeight;
  });

  const [letterSpacing, setLetterSpacingState] = useState<LetterSpacing>(() => {
    return (localStorage.getItem(`${storageKey}-letter-spacing`) as LetterSpacing) || defaultLetterSpacing;
  });

  const [updateSettings] = useMutation<UpdateMySettingsResponse, UpdateMySettingsVariables>(
    UPDATE_MY_SETTINGS_MUTATION_RESOLVED,
    { 
      client,
      ignoreResults: true // We don't need the response to update UI, as we update state optimistically
    }
  );

  const saveSetting = (variables: UpdateMySettingsVariables) => {
    updateSettings({ variables }).catch(() => {
      // Silently fail if not authenticated or network error
      // Settings will remain in localStorage and sync on next successful mutation
    });
  };

  const setTheme = (newTheme: ThemeKey) => {
    localStorage.setItem(`${storageKey}-theme`, newTheme);
    setThemeState(newTheme);
    saveSetting({ theme: newTheme });
  };

  const setMode = (newMode: ThemeMode) => {
    localStorage.setItem(`${storageKey}-mode`, newMode);
    setModeState(newMode);
    saveSetting({ mode: newMode });
  };

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  const setLayout = (newLayout: Layout) => {
    localStorage.setItem(`${storageKey}-layout`, newLayout);
    setLayoutState(newLayout);
    saveSetting({ layout: newLayout });
  };

  const setSidebarCollapseMode = (newMode: SidebarCollapseMode) => {
    localStorage.setItem(`${storageKey}-sidebar-collapse`, newMode);
    setSidebarCollapseModeState(newMode);
    saveSetting({ sidebar_collapse_mode: newMode });
  };

  const setFontSize = (newSize: FontSize) => {
    localStorage.setItem(`${storageKey}-font-size`, newSize);
    setFontSizeState(newSize);
    saveSetting({ font_size: newSize });
  };

  const setFontFamily = (newFamily: FontFamily) => {
    localStorage.setItem(`${storageKey}-font-family`, newFamily);
    setFontFamilyState(newFamily);
    saveSetting({ font_family: newFamily });
  };

  const setLineHeight = (height: LineHeight) => {
    localStorage.setItem(`${storageKey}-line-height`, height);
    setLineHeightState(height);
    // Note: Backend may not support these fields yet. Settings saved to localStorage only.
    // TODO: Add backend support for line_height and letter_spacing in UpdateMySettingsVariables
  };

  const setLetterSpacing = (spacing: LetterSpacing) => {
    localStorage.setItem(`${storageKey}-letter-spacing`, spacing);
    setLetterSpacingState(spacing);
    // Note: Backend may not support these fields yet. Settings saved to localStorage only.
    // TODO: Add backend support for line_height and letter_spacing in UpdateMySettingsVariables
  };

  useEffect(() => {
    if (defaultTheme && defaultTheme !== DEFAULT_THEME) setThemeState(defaultTheme);
    if (defaultMode && defaultMode !== DEFAULT_MODE) setModeState(defaultMode);
    if (defaultLayout && defaultLayout !== DEFAULT_LAYOUT) setLayoutState(defaultLayout);
    if (defaultSidebarCollapseMode && defaultSidebarCollapseMode !== DEFAULT_SIDEBAR_COLLAPSE_MODE) setSidebarCollapseModeState(defaultSidebarCollapseMode);
    if (defaultFontSize && defaultFontSize !== DEFAULT_FONT_SIZE) setFontSizeState(defaultFontSize);
    if (defaultFontFamily && defaultFontFamily !== DEFAULT_FONT_FAMILY) setFontFamilyState(defaultFontFamily);
    if (defaultLineHeight && defaultLineHeight !== DEFAULT_LINE_HEIGHT) setLineHeightState(defaultLineHeight);
    if (defaultLetterSpacing && defaultLetterSpacing !== DEFAULT_LETTER_SPACING) setLetterSpacingState(defaultLetterSpacing);
  }, [defaultTheme, defaultMode, defaultLayout, defaultSidebarCollapseMode, defaultFontSize, defaultFontFamily, defaultLineHeight, defaultLetterSpacing]);

  useEffect(() => {
    const root = window.document.documentElement;
    const themeDef = themes[theme];
    
    // Validate theme exists, fallback to default with warning
    if (!themeDef) {
      console.warn(`Theme "${theme}" not found, falling back to default theme`);
      const defaultThemeDef = themes[DEFAULT_THEME];
      const colors = defaultThemeDef[mode];
      applyThemeColors(root, colors, defaultThemeDef.radius);
    } else {
      const colors = themeDef[mode];
      applyThemeColors(root, colors, themeDef.radius);
    }

    // Mode Class
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    
    // Set Font attributes/vars
    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('data-font-family', fontFamily);
    root.setAttribute('data-line-height', lineHeight);
    root.setAttribute('data-letter-spacing', letterSpacing);
    
    // Set Color Scheme
    root.style.colorScheme = mode;

  }, [theme, mode, fontSize, fontFamily, lineHeight, letterSpacing]);

  // Helper function to apply theme colors
  const applyThemeColors = (root: HTMLElement, colors: ThemeColors, radius: string) => {
    // Helper to set CSS Prop
    const setProperty = (key: string, value: string) => {
      root.style.setProperty(key, value);
    };

    // Helper to convert camelCase to kebab-case, handling numbers correctly
    const toKebabCase = (str: string) => {
      return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')  // Insert hyphen between lowercase and uppercase
        .replace(/([a-z])(\d)/g, '$1-$2')      // Insert hyphen between letter and number
        .toLowerCase();
    };

    // Set Colors
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--${toKebabCase(key)}`;
      setProperty(cssVar, value);
    });

    // Set Radius
    setProperty('--radius', radius);
  };

  const value = {
    theme,
    mode,
    layout,
    sidebarCollapseMode,
    fontSize,
    fontFamily,
    lineHeight,
    letterSpacing,
    setTheme,
    setMode,
    toggleMode,
    setLayout,
    setSidebarCollapseMode,
    setFontSize,
    setFontFamily,
    setLineHeight,
    setLetterSpacing,
    availableThemes: Object.values(themes),
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
