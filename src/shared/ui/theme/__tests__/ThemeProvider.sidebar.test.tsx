/** Every application opening starts with a complete sidebar while other preferences remain saved. */
import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../useTheme';

vi.mock('@/shared/api/auth/token-storage', () => ({
  AUTH_SESSION_EVENT: 'auth-session-change',
  tokenStorage: { hasValidSession: () => false, getAccessToken: () => null },
}));

/** Expose the actual provider state and its appearance selector action. */
function SidebarProbe() {
  const {
    layout, navigationPattern, sidebarMode, sidebarCollapseMode, fontSize,
    setLayout, setNavigationPattern, setSidebarMode, setSidebarCollapseMode,
  } = useTheme();
  return <>
    <output aria-label="sidebar mode">{sidebarMode}</output>
    <output aria-label="font size">{fontSize}</output>
    <output aria-label="layout">{layout}</output>
    <output aria-label="navigation pattern">{navigationPattern}</output>
    <output aria-label="collapse mode">{sidebarCollapseMode}</output>
    <button onClick={() => {
      setLayout('horizontal');
      setNavigationPattern('rail-flyout');
      setSidebarMode('icons');
      setSidebarCollapseMode('icon');
    }}>Menu avec icônes</button>
  </>;
}

/** Mount the shared provider without making backend requests. */
function renderSidebar() {
  return render(<MockedProvider><ThemeProvider storageKey="sidebar-test"><SidebarProbe /></ThemeProvider></MockedProvider>);
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

it('uses the complete sidebar for a new application', () => {
  renderSidebar();
  expect(screen.getByLabelText('sidebar mode')).toHaveTextContent('complete');
  expect(document.documentElement).toHaveAttribute('data-sidebar-mode', 'complete');
});

it('ignores a legacy icons choice without resetting other appearance preferences', () => {
  localStorage.setItem('sidebar-test-sidebar-mode', 'icons');
  localStorage.setItem('sidebar-test-layout', 'horizontal');
  localStorage.setItem('sidebar-test-navigation-pattern', 'rail-flyout');
  localStorage.setItem('sidebar-test-sidebar-collapse', 'icon');
  localStorage.setItem('sidebar-test-font-size', 'lg');
  renderSidebar();
  expect(screen.getByLabelText('sidebar mode')).toHaveTextContent('complete');
  expect(screen.getByLabelText('font size')).toHaveTextContent('lg');
  expect(screen.getByLabelText('layout')).toHaveTextContent('vertical');
  expect(screen.getByLabelText('navigation pattern')).toHaveTextContent('secondary-sidebar');
  expect(screen.getByLabelText('collapse mode')).toHaveTextContent('offcanvas');
});

it('ignores obsolete layout setters and maintains the complete sidebar', () => {
  const view = renderSidebar();
  fireEvent.click(screen.getByRole('button', { name: 'Menu avec icônes' }));
  expect(screen.getByLabelText('sidebar mode')).toHaveTextContent('complete');
  expect(screen.getByLabelText('layout')).toHaveTextContent('vertical');
  expect(screen.getByLabelText('navigation pattern')).toHaveTextContent('secondary-sidebar');
  expect(screen.getByLabelText('collapse mode')).toHaveTextContent('offcanvas');
  expect(localStorage.getItem('sidebar-test-layout')).toBeNull();
  expect(localStorage.getItem('sidebar-test-navigation-pattern')).toBeNull();
  expect(localStorage.getItem('sidebar-test-sidebar-collapse')).toBeNull();
  view.unmount();
  renderSidebar();
  expect(screen.getByLabelText('sidebar mode')).toHaveTextContent('complete');
});
