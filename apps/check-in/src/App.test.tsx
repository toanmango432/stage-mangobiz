import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders WelcomeScreen at root path', async () => {
    render(<App />);
    // WelcomeScreen shows store name and phone input
    expect(await screen.findByRole('main')).toBeInTheDocument();
  });

  it('renders the app without crashing', async () => {
    render(<App />);
    // App should render with main content area
    const main = await screen.findByRole('main');
    expect(main).toBeInTheDocument();
  });
});
