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
  const { sidebarMode, fontSize, setSidebarMode } = useTheme();
  return <>
    <output aria-label="sidebar mode">{sidebarMode}</output>
    <output aria-label="font size">{fontSize}</output>
    <button onClick={() => setSidebarMode('icons')}>Menu avec icônes</button>
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
  localStorage.setItem('sidebar-test-font-size', 'lg');
  renderSidebar();
  expect(screen.getByLabelText('sidebar mode')).toHaveTextContent('complete');
  expect(screen.getByLabelText('font size')).toHaveTextContent('lg');
});

it('allows a session change but returns to the complete sidebar on reopening', () => {
  const view = renderSidebar();
  fireEvent.click(screen.getByRole('button', { name: 'Menu avec icônes' }));
  expect(screen.getByLabelText('sidebar mode')).toHaveTextContent('icons');
  view.unmount();
  renderSidebar();
  expect(screen.getByLabelText('sidebar mode')).toHaveTextContent('complete');
});
