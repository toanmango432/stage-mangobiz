import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { AppRoutes } from './AppRoutes';

describe('App', () => {
  it('renders HomePage at root path', () => {
    render(<App />);
    expect(screen.getByText('Mango Check-In')).toBeInTheDocument();
    expect(screen.getByText('Client Check-In')).toBeInTheDocument();
    expect(screen.getByText('Staff Clock-In')).toBeInTheDocument();
  });

  it('renders powered by footer', () => {
    render(<App />);
    expect(screen.getByText('Powered by Mango Biz')).toBeInTheDocument();
  });
});

describe('AppRoutes', () => {
  it('renders HomePage at root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Mango Check-In')).toBeInTheDocument();
  });

  it('renders CheckInPage at /check-in path', () => {
    render(
      <MemoryRouter initialEntries={['/check-in']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Client Check-In/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by name or phone number/i)).toBeInTheDocument();
  });

  it('renders ClockInPage at /clock-in path', () => {
    render(
      <MemoryRouter initialEntries={['/clock-in']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Staff Clock-In/i })).toBeInTheDocument();
    expect(screen.getByText(/Enter your 4-digit PIN/i)).toBeInTheDocument();
  });
});
