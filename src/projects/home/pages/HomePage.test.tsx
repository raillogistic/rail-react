/** Verify the empty application's welcome screen. */
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { HomePage } from './HomePage';

it('shows the commandes platform welcome screen', () => {
  render(<HomePage />);
  expect(screen.getByRole('heading', { level: 1, name: 'Plateforme de commandes' })).toBeInTheDocument();
  expect(screen.getByText('Votre espace de travail est prêt.')).toBeInTheDocument();
});
