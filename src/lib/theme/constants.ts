/**
 * Theme System Constants
 * 
 * Centralized constants for default theme values to avoid magic strings
 */

import type { ThemeKey, ThemeMode, Layout, SidebarCollapseMode, FontSize, FontFamily, LineHeight, LetterSpacing } from './types';

export const DEFAULT_THEME: ThemeKey = 'default';
export const DEFAULT_MODE: ThemeMode = 'light';
export const DEFAULT_LAYOUT: Layout = 'vertical';
export const DEFAULT_SIDEBAR_COLLAPSE_MODE: SidebarCollapseMode = 'offcanvas';
export const DEFAULT_FONT_SIZE: FontSize = 'md';
export const DEFAULT_FONT_FAMILY: FontFamily = 'inter';
export const DEFAULT_LINE_HEIGHT: LineHeight = 'normal';
export const DEFAULT_LETTER_SPACING: LetterSpacing = 'normal';
export const DEFAULT_STORAGE_KEY = 'vite-ui-theme';
