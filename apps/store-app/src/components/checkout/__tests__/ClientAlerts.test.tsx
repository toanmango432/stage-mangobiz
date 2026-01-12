import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ClientAlerts, { ClientAlertData } from '../ClientAlerts';

// Mock the UI components
vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => open ? <div role="alertdialog">{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children }: any) => <button>{children}</button>,
}));

describe('ClientAlerts', () => {
  const mockOnDismissAlert = vi.fn();
  const mockOnBlockedOverride = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render nothing when client is null', () => {
      const { container } = render(<ClientAlerts client={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when client has no alerts', () => {
      const client: ClientAlertData = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const { container } = render(<ClientAlerts client={client} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('allergy alert', () => {
    it('should render allergy alert with red styling', () => {
      const client: ClientAlertData = {
        firstName: 'John',
        lastName: 'Doe',
        allergies: ['Latex', 'Acetone'],
      };
      render(<ClientAlerts client={client} />);

      const alert = screen.getByTestId('alert-allergy');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('bg-red-50');
      expect(screen.getByText('Allergy Alert')).toBeInTheDocument();
      expect(screen.getByText('Latex, Acetone')).toBeInTheDocument();
    });

    it('should be dismissible', () => {
      const client: ClientAlertData = {
        allergies: ['Latex'],
      };
      render(
        <ClientAlerts
          client={client}
          onDismissAlert={mockOnDismissAlert}
        />
      );

      const dismissBtn = screen.getByTestId('button-dismiss-allergy');
      fireEvent.click(dismissBtn);

      expect(mockOnDismissAlert).toHaveBeenCalledWith('allergy');
    });
  });

  describe('staff notes alert', () => {
    it('should render staff notes alert with amber styling', () => {
      const client: ClientAlertData = {
        staffAlert: {
          message: 'Prefers quiet service',
          createdByName: 'Jane Smith',
        },
      };
      render(<ClientAlerts client={client} />);

      const alert = screen.getByTestId('alert-notes');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('bg-amber-50');
      expect(screen.getByText('Staff Notes')).toBeInTheDocument();
      expect(screen.getByText('Prefers quiet service')).toBeInTheDocument();
    });

    it('should show simple notes when staffAlert not present', () => {
      const client: ClientAlertData = {
        notes: 'First-time client',
      };
      render(<ClientAlerts client={client} />);

      expect(screen.getByText('First-time client')).toBeInTheDocument();
    });

    it('should be dismissible', () => {
      const client: ClientAlertData = {
        notes: 'Test note',
      };
      render(
        <ClientAlerts
          client={client}
          onDismissAlert={mockOnDismissAlert}
        />
      );

      const dismissBtn = screen.getByTestId('button-dismiss-notes');
      fireEvent.click(dismissBtn);

      expect(mockOnDismissAlert).toHaveBeenCalledWith('notes');
    });
  });

  describe('outstanding balance alert', () => {
    it('should render balance alert with orange styling', () => {
      const client: ClientAlertData = {
        outstandingBalance: 45.50,
      };
      render(<ClientAlerts client={client} />);

      const alert = screen.getByTestId('alert-balance');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('bg-orange-50');
      expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
      expect(screen.getByText('$45.50 due')).toBeInTheDocument();
    });

    it('should not render when balance is zero', () => {
      const client: ClientAlertData = {
        outstandingBalance: 0,
      };
      const { container } = render(<ClientAlerts client={client} />);
      expect(container.firstChild).toBeNull();
    });

    it('should be dismissible', () => {
      const client: ClientAlertData = {
        outstandingBalance: 100,
      };
      render(
        <ClientAlerts
          client={client}
          onDismissAlert={mockOnDismissAlert}
        />
      );

      const dismissBtn = screen.getByTestId('button-dismiss-balance');
      fireEvent.click(dismissBtn);

      expect(mockOnDismissAlert).toHaveBeenCalledWith('balance');
    });
  });

  describe('blocked client', () => {
    it('should show blocked dialog when client is blocked', async () => {
      const client: ClientAlertData = {
        firstName: 'John',
        lastName: 'Doe',
        isBlocked: true,
        blockReason: 'no_show',
        blockReasonNote: 'Multiple no-shows',
      };

      render(
        <ClientAlerts
          client={client}
          onBlockedOverride={mockOnBlockedOverride}
        />
      );

      // Wait for dialog to appear (it's shown on next tick)
      await vi.waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument();
      });
    });
  });

  describe('multiple alerts', () => {
    it('should render all alert types when present', () => {
      const client: ClientAlertData = {
        allergies: ['Latex'],
        notes: 'VIP client',
        outstandingBalance: 25.00,
      };
      render(<ClientAlerts client={client} />);

      expect(screen.getByTestId('alert-allergy')).toBeInTheDocument();
      expect(screen.getByTestId('alert-notes')).toBeInTheDocument();
      expect(screen.getByTestId('alert-balance')).toBeInTheDocument();
    });

    it('should dismiss alerts independently', () => {
      const client: ClientAlertData = {
        allergies: ['Latex'],
        notes: 'VIP client',
      };
      const { rerender } = render(
        <ClientAlerts
          client={client}
          onDismissAlert={mockOnDismissAlert}
        />
      );

      // Dismiss allergy alert
      fireEvent.click(screen.getByTestId('button-dismiss-allergy'));

      // Allergy alert should be gone, notes should remain
      expect(screen.queryByTestId('alert-allergy')).not.toBeInTheDocument();
      expect(screen.getByTestId('alert-notes')).toBeInTheDocument();
    });
  });

  describe('checkout blocking', () => {
    it('should track which alerts have been acknowledged', () => {
      const client: ClientAlertData = {
        allergies: ['Latex'],
      };

      const { rerender } = render(
        <ClientAlerts
          client={client}
          onDismissAlert={mockOnDismissAlert}
        />
      );

      // Initially visible
      expect(screen.getByTestId('alert-allergy')).toBeInTheDocument();

      // After dismissing
      fireEvent.click(screen.getByTestId('button-dismiss-allergy'));

      // Should be hidden
      expect(screen.queryByTestId('alert-allergy')).not.toBeInTheDocument();
    });
  });
});
