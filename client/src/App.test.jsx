import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renders the portfolio hero', () => {
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('heading', { name: /I build thoughtful\s*digital products\./i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Explore my work/i })).toHaveAttribute('href', '#work');
});
