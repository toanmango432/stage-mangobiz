import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  describe('Default error (generic)', () => {
    it('should render with default generic error', () => {
      render(<ErrorState />);
      
      expect(screen.getByText('Oops!')).toBeInTheDocument();
      expect(screen.getByText('Something unexpected happened. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Network error', () => {
    it('should render network error state', () => {
      render(<ErrorState type="network" />);
      
      expect(screen.getByText('Connection Lost')).toBeInTheDocument();
      expect(screen.getByText('Please check your internet connection and try again.')).toBeInTheDocument();
    });
  });

  describe('Not found error', () => {
    it('should render not-found error state', () => {
      render(<ErrorState type="not-found" />);
      
      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText("We couldn't find what you're looking for.")).toBeInTheDocument();
    });
  });

  describe('Server error', () => {
    it('should render server error state', () => {
      render(<ErrorState type="server" />);
      
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText('Our system is having trouble. Please try again in a moment.')).toBeInTheDocument();
    });
  });

  describe('Custom title and message', () => {
    it('should override default title and message', () => {
      render(
        <ErrorState 
          type="generic" 
          title="Custom Title" 
          message="Custom message here" 
        />
      );
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message here')).toBeInTheDocument();
    });
  });

  describe('Retry button', () => {
    it('should render retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      render(<ErrorState onRetry={onRetry} />);
      
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should call onRetry when button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorState onRetry={onRetry} />);
      
      fireEvent.click(screen.getByRole('button', { name: /try again/i }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not render retry button when onRetry is not provided', () => {
      render(<ErrorState />);
      
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  describe('Start Over button', () => {
    it('should render start over button when onStartOver is provided', () => {
      const onStartOver = vi.fn();
      render(<ErrorState onStartOver={onStartOver} />);
      
      expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument();
    });

    it('should call onStartOver when button is clicked', () => {
      const onStartOver = vi.fn();
      render(<ErrorState onStartOver={onStartOver} />);
      
      fireEvent.click(screen.getByRole('button', { name: /start over/i }));
      expect(onStartOver).toHaveBeenCalledTimes(1);
    });

    it('should not render start over button when onStartOver is not provided', () => {
      render(<ErrorState />);
      
      expect(screen.queryByRole('button', { name: /start over/i })).not.toBeInTheDocument();
    });
  });

  describe('Front desk hint', () => {
    it('should show front desk hint when showFrontDeskHint is true', () => {
      render(<ErrorState showFrontDeskHint={true} />);
      
      expect(screen.getByText(/having trouble.*front desk/i)).toBeInTheDocument();
    });

    it('should not show front desk hint by default', () => {
      render(<ErrorState />);
      
      expect(screen.queryByText(/having trouble.*front desk/i)).not.toBeInTheDocument();
    });
  });

  describe('Multiple buttons', () => {
    it('should render both buttons when both handlers provided', () => {
      const onRetry = vi.fn();
      const onStartOver = vi.fn();
      render(<ErrorState onRetry={onRetry} onStartOver={onStartOver} />);
      
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument();
    });
  });
});
