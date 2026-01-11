import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { AppRoutes } from './AppRoutes';

describe('App', () => {
  it('renders HomePage at root path', async () => {
    render(<App />);
    expect(await screen.findByText('Mango Check-In', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText('Client Check-In', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText('Staff Clock-In', {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it('renders powered by footer', async () => {
    render(<App />);
    expect(await screen.findByText('Powered by Mango Biz', {}, { timeout: 5000 })).toBeInTheDocument();
  });
});

describe('AppRoutes', () => {
  it('renders HomePage at root path', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByText('Mango Check-In')).toBeInTheDocument();
  });

  it('renders CheckInPage at /check-in path', async () => {
    render(
      <MemoryRouter initialEntries={['/check-in']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /Client Check-In/i })).toBeInTheDocument();
    expect(await screen.findByPlaceholderText(/Search by name or phone number/i)).toBeInTheDocument();
  });

  it('renders ClockInPage at /clock-in path', async () => {
    render(
      <MemoryRouter initialEntries={['/clock-in']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(await screen.findByRole('heading', { name: /Staff Clock-In/i })).toBeInTheDocument();
    expect(await screen.findByText(/Enter your 4-digit PIN/i)).toBeInTheDocument();
  });
});
