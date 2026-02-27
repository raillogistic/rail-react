import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { gql, useApolloClient } from '@apollo/client';
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
  CREATE_USER_SETTINGS_MUTATION_RESOLVED,
  UPDATE_USER_SETTINGS_MUTATION_RESOLVED,
  type CreateUserSettingsResponse,
  type CreateUserSettingsVariables,
  type UpdateUserSettingsResponse,
  type UpdateUserSettingsVariables,
  type UserSettingsInputPayload,
} from '@/shared/api/graphql/legacy/mutations';
import { AUTH_SESSION_EVENT } from '@/shared/api/auth/token-storage';

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

const loadedFontFamilies = new Set<FontFamily>([
  "inter",
  "system",
  "mono",
  "serif",
]);

const fontFamilyLoaders: Partial<
  Record<FontFamily, Array<() => Promise<unknown>>>
> = {
  "open-sans": [
    () => import("@fontsource/open-sans/400.css"),
    () => import("@fontsource/open-sans/700.css"),
  ],
  roboto: [
    () => import("@fontsource/roboto/400.css"),
    () => import("@fontsource/roboto/500.css"),
    () => import("@fontsource/roboto/700.css"),
  ],
  lato: [
    () => import("@fontsource/lato/400.css"),
    () => import("@fontsource/lato/700.css"),
  ],
  montserrat: [
    () => import("@fontsource/montserrat/400.css"),
    () => import("@fontsource/montserrat/700.css"),
  ],
  "source-code-pro": [
    () => import("@fontsource/source-code-pro/400.css"),
    () => import("@fontsource/source-code-pro/700.css"),
  ],
  "playfair-display": [
    () => import("@fontsource/playfair-display/400.css"),
    () => import("@fontsource/playfair-display/700.css"),
  ],
  "fira-code": [
    () => import("@fontsource/fira-code/400.css"),
    () => import("@fontsource/fira-code/700.css"),
  ],
  oxanium: [
    () => import("@fontsource/oxanium/400.css"),
    () => import("@fontsource/oxanium/700.css"),
    () => import("@fontsource/oxanium/800.css"),
  ],
  geist: [() => import("./fonts/geist.css")],
  "baloo-tamma-2": [() => import("./fonts/baloo-tamma-2.css")],
};

const ensureFontFamilyLoaded = async (family: FontFamily) => {
  if (loadedFontFamilies.has(family)) {
    return;
  }

  const loaders = fontFamilyLoaders[family] ?? [];
  if (!loaders.length) {
    loadedFontFamilies.add(family);
    return;
  }

  await Promise.all(loaders.map((loader) => loader()));
  loadedFontFamilies.add(family);
};

const GET_CURRENT_USER_SETTINGS_RECORD = gql`
  query GetCurrentUserSettingsRecord {
    me {
      id
      settings {
        id
        theme
        mode
        layout
        sidebarCollapseMode
        fontSize
        fontFamily
      }
    }
  }
`;

type CurrentUserSettingsRecordResponse = {
  me?: {
    id?: string | null;
    settings?: {
      id?: string | null;
      theme?: string | null;
      mode?: string | null;
      layout?: string | null;
      sidebarCollapseMode?: string | null;
      fontSize?: string | null;
      fontFamily?: string | null;
    } | null;
  } | null;
};

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
  const apolloClient = useApolloClient();
  const [sessionHydrationKey, setSessionHydrationKey] = useState(0);
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

  const settingsIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleSessionChange = () => {
      setSessionHydrationKey((prev) => prev + 1);
    };

    window.addEventListener(AUTH_SESSION_EVENT, handleSessionChange);
    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, handleSessionChange);
    };
  }, []);

  useEffect(() => {
    const applyResolvedSettings = (settings: {
      id?: string | number | null;
      theme?: string | null;
      mode?: string | null;
      layout?: string | null;
      sidebar_collapse_mode?: string | null;
      font_size?: string | null;
      font_family?: string | null;
      sidebarCollapseMode?: string | null;
      fontSize?: string | null;
      fontFamily?: string | null;
    }) => {
      if (settings.id != null) {
        settingsIdRef.current = String(settings.id);
      }

      const resolvedTheme = settings.theme;
      const resolvedMode = settings.mode;
      const resolvedLayout = settings.layout;
      const resolvedSidebar =
        settings.sidebar_collapse_mode ?? settings.sidebarCollapseMode;
      const resolvedFontSize = settings.font_size ?? settings.fontSize;
      const resolvedFontFamily = settings.font_family ?? settings.fontFamily;

      if (resolvedTheme) {
        localStorage.setItem(`${storageKey}-theme`, resolvedTheme);
        setThemeState(resolvedTheme as ThemeKey);
      }
      if (resolvedMode) {
        localStorage.setItem(`${storageKey}-mode`, resolvedMode);
        setModeState(resolvedMode as ThemeMode);
      }
      if (resolvedLayout) {
        localStorage.setItem(`${storageKey}-layout`, resolvedLayout);
        setLayoutState(resolvedLayout as Layout);
      }
      if (resolvedSidebar) {
        localStorage.setItem(`${storageKey}-sidebar-collapse`, resolvedSidebar);
        setSidebarCollapseModeState(resolvedSidebar as SidebarCollapseMode);
      }
      if (resolvedFontSize) {
        localStorage.setItem(`${storageKey}-font-size`, resolvedFontSize);
        setFontSizeState(resolvedFontSize as FontSize);
      }
      if (resolvedFontFamily) {
        localStorage.setItem(`${storageKey}-font-family`, resolvedFontFamily);
        setFontFamilyState(resolvedFontFamily as FontFamily);
      }
    };

    // Apply local fallback immediately while waiting for server-authoritative values.
    const persistedTheme = localStorage.getItem(`${storageKey}-theme`);
    const persistedMode = localStorage.getItem(`${storageKey}-mode`);
    const persistedLayout = localStorage.getItem(`${storageKey}-layout`);
    const persistedSidebarCollapseMode = localStorage.getItem(`${storageKey}-sidebar-collapse`);
    const persistedFontSize = localStorage.getItem(`${storageKey}-font-size`);
    const persistedFontFamily = localStorage.getItem(`${storageKey}-font-family`);
    const persistedLineHeight = localStorage.getItem(`${storageKey}-line-height`);
    const persistedLetterSpacing = localStorage.getItem(`${storageKey}-letter-spacing`);

    if (persistedTheme) {
      setThemeState(persistedTheme as ThemeKey);
    }
    if (persistedMode) {
      setModeState(persistedMode as ThemeMode);
    }
    if (persistedLayout) {
      setLayoutState(persistedLayout as Layout);
    }
    if (persistedSidebarCollapseMode) {
      setSidebarCollapseModeState(persistedSidebarCollapseMode as SidebarCollapseMode);
    }
    if (persistedFontSize) {
      setFontSizeState(persistedFontSize as FontSize);
    }
    if (persistedFontFamily) {
      setFontFamilyState(persistedFontFamily as FontFamily);
    }
    if (persistedLineHeight) {
      setLineHeightState(persistedLineHeight as LineHeight);
    }
    if (persistedLetterSpacing) {
      setLetterSpacingState(persistedLetterSpacing as LetterSpacing);
    }

    let cancelled = false;

    const hydrateFromBackend = async () => {
      try {
        const { data } = await apolloClient.query<CurrentUserSettingsRecordResponse>({
          query: GET_CURRENT_USER_SETTINGS_RECORD,
          // Always force latest server settings on refresh/startup.
          fetchPolicy: 'network-only',
        });

        if (cancelled) {
          return;
        }

        const resolvedUserId = data?.me?.id ? String(data.me.id) : null;
        currentUserIdRef.current = resolvedUserId;

        const settings = data?.me?.settings;
        if (!settings) {
          settingsIdRef.current = null;
          return;
        }

        // Server settings are authoritative and override local fallback.
        applyResolvedSettings(settings);
      } catch {
        // keep local/default values when backend settings cannot be fetched
      }
    };

    void hydrateFromBackend();

    return () => {
      cancelled = true;
    };
  }, [apolloClient, storageKey, sessionHydrationKey]);

  const [createUserSettings] = useMutation<
    CreateUserSettingsResponse,
    CreateUserSettingsVariables
  >(
    CREATE_USER_SETTINGS_MUTATION_RESOLVED,
    {
      ignoreResults: true,
    }
  );

  const [updateUserSettings] = useMutation<
    UpdateUserSettingsResponse,
    UpdateUserSettingsVariables
  >(
    UPDATE_USER_SETTINGS_MUTATION_RESOLVED,
    {
      ignoreResults: true,
    }
  );

  const buildSettingsInput = useCallback(
    (
      payload: Partial<{
        theme: string;
        mode: string;
        layout: string;
        sidebar_collapse_mode: string;
        font_size: string;
        font_family: string;
      }>
    ): UserSettingsInputPayload => {
      const input: UserSettingsInputPayload = {};
      if (payload.theme !== undefined) input.theme = payload.theme;
      if (payload.mode !== undefined) input.mode = payload.mode;
      if (payload.layout !== undefined) input.layout = payload.layout;
      if (payload.sidebar_collapse_mode !== undefined) {
        input.sidebarCollapseMode = payload.sidebar_collapse_mode;
      }
      if (payload.font_size !== undefined) {
        input.fontSize = payload.font_size;
      }
      if (payload.font_family !== undefined) {
        input.fontFamily = payload.font_family;
      }
      return input;
    },
    []
  );

  const resolveSettingsContext = useCallback(async () => {
    if (currentUserIdRef.current && settingsIdRef.current) {
      return {
        userId: currentUserIdRef.current,
        settingsId: settingsIdRef.current,
      };
    }

    try {
      const { data } = await apolloClient.query<CurrentUserSettingsRecordResponse>({
        query: GET_CURRENT_USER_SETTINGS_RECORD,
        fetchPolicy: 'network-only',
      });

      const resolvedUserId = data?.me?.id ? String(data.me.id) : currentUserIdRef.current;
      const resolvedSettingsId = data?.me?.settings?.id
        ? String(data.me.settings.id)
        : settingsIdRef.current;

      if (resolvedUserId) {
        currentUserIdRef.current = resolvedUserId;
      }
      if (resolvedSettingsId) {
        settingsIdRef.current = resolvedSettingsId;
      }
    } catch {
      // keep local refs only
    }

    return {
      userId: currentUserIdRef.current,
      settingsId: settingsIdRef.current,
    };
  }, [apolloClient]);

  const saveSetting = useCallback(
    async (
      payload: Partial<{
        theme: string;
        mode: string;
        layout: string;
        sidebar_collapse_mode: string;
        font_size: string;
        font_family: string;
      }>
    ) => {
      const inputPayload = buildSettingsInput(payload);
      if (!Object.keys(inputPayload).length) {
        return;
      }

      const { userId, settingsId } = await resolveSettingsContext();
      if (!userId) {
        return;
      }

      try {
        if (settingsId) {
          await updateUserSettings({
            variables: {
              id: settingsId,
              input: inputPayload,
            },
          });
          return;
        }

        const response = await createUserSettings({
          variables: {
            input: {
              user: userId,
              ...inputPayload,
            },
          },
        });

        const createdSettingsId = response.data?.create_user_settings?.object?.id;
        if (createdSettingsId) {
          settingsIdRef.current = String(createdSettingsId);
        }
      } catch {
        // Silently fail if not authenticated or network error.
      }
    },
    [buildSettingsInput, createUserSettings, resolveSettingsContext, updateUserSettings]
  );

  const setTheme = (newTheme: ThemeKey) => {
    localStorage.setItem(`${storageKey}-theme`, newTheme);
    setThemeState(newTheme);
    void saveSetting({ theme: newTheme });
  };

  const setMode = (newMode: ThemeMode) => {
    localStorage.setItem(`${storageKey}-mode`, newMode);
    setModeState(newMode);
    void saveSetting({ mode: newMode });
  };

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  const setLayout = (newLayout: Layout) => {
    localStorage.setItem(`${storageKey}-layout`, newLayout);
    setLayoutState(newLayout);
    void saveSetting({ layout: newLayout });
  };

  const setSidebarCollapseMode = (newMode: SidebarCollapseMode) => {
    localStorage.setItem(`${storageKey}-sidebar-collapse`, newMode);
    setSidebarCollapseModeState(newMode);
    void saveSetting({ sidebar_collapse_mode: newMode });
  };

  const setFontSize = (newSize: FontSize) => {
    localStorage.setItem(`${storageKey}-font-size`, newSize);
    setFontSizeState(newSize);
    void saveSetting({ font_size: newSize });
  };

  const setFontFamily = (newFamily: FontFamily) => {
    localStorage.setItem(`${storageKey}-font-family`, newFamily);
    setFontFamilyState(newFamily);
    void saveSetting({ font_family: newFamily });
  };

  const setLineHeight = (height: LineHeight) => {
    localStorage.setItem(`${storageKey}-line-height`, height);
    setLineHeightState(height);
    // Note: Backend may not support these fields yet. Settings saved to localStorage only.
    // TODO: Add backend support for line_height and letter_spacing in UserSettings model input.
  };

  const setLetterSpacing = (spacing: LetterSpacing) => {
    localStorage.setItem(`${storageKey}-letter-spacing`, spacing);
    setLetterSpacingState(spacing);
    // Note: Backend may not support these fields yet. Settings saved to localStorage only.
    // TODO: Add backend support for line_height and letter_spacing in UserSettings model input.
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
    void ensureFontFamilyLoaded(fontFamily).catch((error) => {
      console.warn(`[ThemeProvider] Failed to load font family "${fontFamily}"`, error);
    });
  }, [fontFamily]);

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
