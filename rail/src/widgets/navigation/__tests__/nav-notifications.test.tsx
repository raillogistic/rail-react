/** Notification integration is optional and does not assume an application schema. */
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import application from '@rail/application';
import { NavNotifications } from '../nav-notifications';
vi.mock('@rail/application', () => ({ default: {} }));
afterEach(() => { delete application.slots; });

it('renders no notifications without an application integration', () => {
  expect(render(<NavNotifications />).container).toBeEmptyDOMElement();
});
it('renders the supplied notification integration', () => {
  application.slots = { Notifications: () => <button>Notifications</button> };
  render(<NavNotifications />);
  expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
});
