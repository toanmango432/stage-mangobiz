import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders the main logo and title', () => {
    render(<HomePage />);
    
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('Mango Check-In')).toBeInTheDocument();
    expect(screen.getByText('Welcome! Please select an option below')).toBeInTheDocument();
  });

  it('renders the Client Check-In option', () => {
    render(<HomePage />);
    
    expect(screen.getByRole('link', { name: /client check-in/i })).toBeInTheDocument();
    expect(screen.getByText('Walk-in registration and service selection')).toBeInTheDocument();
  });

  it('renders the Staff Clock-In option', () => {
    render(<HomePage />);
    
    expect(screen.getByRole('link', { name: /staff clock-in/i })).toBeInTheDocument();
    expect(screen.getByText('Clock in/out with your PIN')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(<HomePage />);
    
    const checkInLink = screen.getByRole('link', { name: /client check-in/i });
    const clockInLink = screen.getByRole('link', { name: /staff clock-in/i });
    
    expect(checkInLink).toHaveAttribute('href', '/check-in');
    expect(clockInLink).toHaveAttribute('href', '/clock-in');
  });

  it('renders the footer', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Powered by Mango Biz')).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<HomePage />);
    
    const container = screen.getByText('Mango Check-In').closest('div')?.parentElement;
    expect(container).toHaveClass('min-h-screen');
  });
});
