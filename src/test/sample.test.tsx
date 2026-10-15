import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

function App() {
  return (
    <div>
      <h1>Hello Vite + React</h1>
    </div>
  );
}

describe('App', () => {
  it('renders headline', () => {
    render(<App />);
    const headline = screen.getByText(/Hello Vite \+ React/i);
    expect(headline).toBeInTheDocument();
  });
});
