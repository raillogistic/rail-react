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
} from '@/graphql/mutations';
import { useAuthContext } from '@/auth/context';

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
  const { user } = useAuthContext();
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
  const hydratedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      currentUserIdRef.current = String(user.id);
    }

    const userSettings = (user?.settings as { id?: string | number } | undefined) ?? undefined;
    if (userSettings?.id != null) {
      settingsIdRef.current = String(userSettings.id);
    }
  }, [user?.id, user?.settings]);

  useEffect(() => {
    const userId = user?.id ? String(user.id) : null;
    if (!userId) {
      hydratedUserIdRef.current = null;
      return;
    }
    if (hydratedUserIdRef.current === userId) {
      return;
    }

    const userSettings = (user?.settings as {
      id?: string | number;
      theme?: string;
      mode?: string;
      layout?: string;
      sidebar_collapse_mode?: string;
      font_size?: string;
      font_family?: string;
      sidebarCollapseMode?: string;
      fontSize?: string;
      fontFamily?: string;
    } | undefined) ?? undefined;

    // Fast path: settings already available from auth context, apply immediately.
    if (userSettings) {
      if (userSettings.id != null) {
        settingsIdRef.current = String(userSettings.id);
      }
      const resolvedTheme = userSettings.theme;
      const resolvedMode = userSettings.mode;
      const resolvedLayout = userSettings.layout;
      const resolvedSidebar =
        userSettings.sidebar_collapse_mode ?? userSettings.sidebarCollapseMode;
      const resolvedFontSize = userSettings.font_size ?? userSettings.fontSize;
      const resolvedFontFamily = userSettings.font_family ?? userSettings.fontFamily;

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

      hydratedUserIdRef.current = userId;
      return;
    }

    // If persisted user-specific settings exist, keep them without waiting for network.
    const persistedTheme = localStorage.getItem(`${storageKey}-theme`);
    const persistedMode = localStorage.getItem(`${storageKey}-mode`);
    const persistedLayout = localStorage.getItem(`${storageKey}-layout`);
    const persistedSidebarCollapseMode = localStorage.getItem(`${storageKey}-sidebar-collapse`);
    const persistedFontSize = localStorage.getItem(`${storageKey}-font-size`);
    const persistedFontFamily = localStorage.getItem(`${storageKey}-font-family`);
    const persistedLineHeight = localStorage.getItem(`${storageKey}-line-height`);
    const persistedLetterSpacing = localStorage.getItem(`${storageKey}-letter-spacing`);
    const hasPersistedUserSettings =
      !!persistedTheme || !!persistedMode || !!persistedLayout;
    if (hasPersistedUserSettings) {
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
      hydratedUserIdRef.current = userId;
      return;
    }

    let cancelled = false;

    const hydrateFromBackend = async () => {
      try {
        const { data } = await apolloClient.query<CurrentUserSettingsRecordResponse>({
          query: GET_CURRENT_USER_SETTINGS_RECORD,
          // Prefer cache first to avoid visible post-load switch when `me` is already cached.
          fetchPolicy: 'cache-first',
        });

        if (cancelled) {
          return;
        }

        const settings = data?.me?.settings;
        if (!settings) {
          hydratedUserIdRef.current = userId;
          return;
        }

        if (settings.id != null) {
          settingsIdRef.current = String(settings.id);
        }

        if (settings.theme) {
          localStorage.setItem(`${storageKey}-theme`, settings.theme);
          setThemeState(settings.theme as ThemeKey);
        }
        if (settings.mode) {
          localStorage.setItem(`${storageKey}-mode`, settings.mode);
          setModeState(settings.mode as ThemeMode);
        }
        if (settings.layout) {
          localStorage.setItem(`${storageKey}-layout`, settings.layout);
          setLayoutState(settings.layout as Layout);
        }
        if (settings.sidebarCollapseMode) {
          localStorage.setItem(`${storageKey}-sidebar-collapse`, settings.sidebarCollapseMode);
          setSidebarCollapseModeState(settings.sidebarCollapseMode as SidebarCollapseMode);
        }
        if (settings.fontSize) {
          localStorage.setItem(`${storageKey}-font-size`, settings.fontSize);
          setFontSizeState(settings.fontSize as FontSize);
        }
        if (settings.fontFamily) {
          localStorage.setItem(`${storageKey}-font-family`, settings.fontFamily);
          setFontFamilyState(settings.fontFamily as FontFamily);
        }

        hydratedUserIdRef.current = userId;
      } catch {
        // keep local/default values when backend settings cannot be fetched
      }
    };

    void hydrateFromBackend();

    return () => {
      cancelled = true;
    };
  }, [apolloClient, storageKey, user?.id, user?.settings]);

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
    const localUserId = user?.id ? String(user.id) : null;
    if (localUserId) {
      currentUserIdRef.current = localUserId;
    }
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
  }, [apolloClient, user?.id]);

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
