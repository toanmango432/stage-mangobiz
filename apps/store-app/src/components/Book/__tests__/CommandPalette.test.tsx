/**
 * CommandPalette Component Tests
 * Tests for keyboard command palette visibility and basic behavior
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Mock cmdk before importing the component
vi.mock('cmdk', () => ({
  Command: Object.assign(
    ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="cmdk-root" className={className}>{children}</div>
    ),
    {
      Input: ({ placeholder, className, autoFocus }: { placeholder?: string; className?: string; autoFocus?: boolean }) => (
        <input
          data-testid="cmdk-input"
          placeholder={placeholder}
          className={className}
          autoFocus={autoFocus}
        />
      ),
      List: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="cmdk-list" className={className}>{children}</div>
      ),
      Empty: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="cmdk-empty" className={className}>{children}</div>
      ),
      Group: ({ heading, children, className }: { heading?: string; children: React.ReactNode; className?: string }) => (
        <div data-testid={`cmdk-group-${heading?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`} className={className}>
          {heading && <div data-testid="cmdk-group-heading">{heading}</div>}
          {children}
        </div>
      ),
      Item: ({ children, onSelect, className, value }: { children: React.ReactNode; onSelect?: () => void; className?: string; value?: string }) => (
        <div
          data-testid={`cmdk-item-${value?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}
          className={className}
          onClick={onSelect}
          role="option"
        >
          {children}
        </div>
      ),
    }
  ),
}));

// Mock store hooks
const mockDispatch = vi.fn();
vi.mock('../../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: vi.fn((selector) => selector({ appointments: {} })),
}));

// Mock appointmentsSlice actions
vi.mock('../../../store/slices/appointmentsSlice', () => ({
  openCreateModal: vi.fn(() => ({ type: 'appointments/openCreateModal' })),
  setSelectedDate: vi.fn((date: Date) => ({ type: 'appointments/setSelectedDate', payload: date })),
  setViewMode: vi.fn((mode: string) => ({ type: 'appointments/setViewMode', payload: mode })),
  clearFilters: vi.fn(() => ({ type: 'appointments/clearFilters' })),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import component after mocks
import { CommandPalette } from '../CommandPalette';
import {
  openCreateModal,
  setSelectedDate,
  setViewMode,
  clearFilters,
} from '../../../store/slices/appointmentsSlice';

describe('CommandPalette', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      const { container } = render(<CommandPalette {...defaultProps} isOpen={true} />);
      // Command palette has fixed positioning overlay
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(<CommandPalette {...defaultProps} isOpen={false} />);
      const overlay = container.querySelector('.fixed.inset-0');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('overlay', () => {
    it('has backdrop blur effect', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const backdrop = container.querySelector('.backdrop-blur-sm');
      expect(backdrop).toBeInTheDocument();
    });

    it('has dark semi-transparent background', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const backdrop = container.querySelector('.bg-black\\/50');
      expect(backdrop).toBeInTheDocument();
    });

    it('has high z-index for layering', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const overlay = container.querySelector('.z-\\[9999\\]');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('modal container', () => {
    it('has max width constraint', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const modal = container.querySelector('.max-w-2xl');
      expect(modal).toBeInTheDocument();
    });

    it('is vertically positioned from top', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const modal = container.querySelector('.mt-\\[10vh\\]');
      expect(modal).toBeInTheDocument();
    });

    it('has entrance animation', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const modal = container.querySelector('.animate-in');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('renders search input', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('cmdk-input');
      expect(input).toBeInTheDocument();
    });

    it('has placeholder text', () => {
      render(<CommandPalette {...defaultProps} />);
      const input = screen.getByTestId('cmdk-input');
      expect(input).toHaveAttribute('placeholder', expect.stringContaining('command'));
    });

    it('has search icon', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const searchIcon = container.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    it('closes on Escape key when open', async () => {
      const onClose = vi.fn();
      render(<CommandPalette isOpen={true} onClose={onClose} />);

      await act(async () => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('click outside', () => {
    it('renders click-outside overlay', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      // The click outside element has both aria-hidden and -z-10 class (to be behind content)
      const clickOutside = container.querySelector('.-z-10[aria-hidden="true"]');
      expect(clickOutside).toBeInTheDocument();
    });

    it('click outside overlay calls onClose when clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<CommandPalette isOpen={true} onClose={onClose} />);

      // Select the click outside overlay specifically (has -z-10 class)
      const clickOutside = container.querySelector('.-z-10[aria-hidden="true"]');
      expect(clickOutside).toBeInTheDocument();

      // Click handler is attached - dispatchEvent triggers the onClick
      if (clickOutside) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        clickOutside.dispatchEvent(clickEvent);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('footer', () => {
    it('renders footer with keyboard hints', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('navigate')).toBeInTheDocument();
    });

    it('shows select hint', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('select')).toBeInTheDocument();
    });

    it('shows ESC key hint', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('ESC')).toBeInTheDocument();
    });

    it('shows command count', () => {
      render(<CommandPalette {...defaultProps} />);
      // The component shows "X commands available"
      expect(screen.getByText(/commands? available/)).toBeInTheDocument();
    });
  });

  describe('command styling', () => {
    it('command container has shadow', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const command = container.querySelector('.shadow-2xl');
      expect(command).toBeInTheDocument();
    });

    it('command container has rounded corners', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const command = container.querySelector('.rounded-lg');
      expect(command).toBeInTheDocument();
    });

    it('command container has border', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const command = container.querySelector('.border-slate-200');
      expect(command).toBeInTheDocument();
    });

    it('command container has white background', () => {
      const { container } = render(<CommandPalette {...defaultProps} />);
      const command = container.querySelector('.bg-white');
      expect(command).toBeInTheDocument();
    });
  });

  describe('command groups', () => {
    it('renders Appointments group', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-group-appointments')).toBeInTheDocument();
    });

    it('renders Views group', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-group-views')).toBeInTheDocument();
    });

    it('renders Navigation group', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-group-navigation')).toBeInTheDocument();
    });

    it('renders Settings group', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-group-settings')).toBeInTheDocument();
    });

    it('renders group headings', () => {
      render(<CommandPalette {...defaultProps} />);
      const headings = screen.getAllByTestId('cmdk-group-heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('commands', () => {
    it('renders New Appointment command', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-item-new-appointment')).toBeInTheDocument();
    });

    it('renders Search Appointments command', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-item-search-appointments')).toBeInTheDocument();
    });

    it('renders Go to Today command', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-item-go-to-today')).toBeInTheDocument();
    });

    it('renders Day View command', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-item-day-view')).toBeInTheDocument();
    });

    it('renders Week View command', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-item-week-view')).toBeInTheDocument();
    });

    it('renders Month View command', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-item-month-view')).toBeInTheDocument();
    });

    it('renders Clear All Filters command', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByTestId('cmdk-item-clear-all-filters')).toBeInTheDocument();
    });
  });

  describe('command actions', () => {
    it('dispatches openCreateModal when New Appointment is clicked', () => {
      render(<CommandPalette {...defaultProps} />);

      const item = screen.getByTestId('cmdk-item-new-appointment');
      fireEvent.click(item);

      expect(openCreateModal).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('dispatches setSelectedDate with today when Go to Today is clicked', () => {
      render(<CommandPalette {...defaultProps} />);

      const item = screen.getByTestId('cmdk-item-go-to-today');
      fireEvent.click(item);

      expect(setSelectedDate).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('dispatches setViewMode day when Day View is clicked', () => {
      render(<CommandPalette {...defaultProps} />);

      const item = screen.getByTestId('cmdk-item-day-view');
      fireEvent.click(item);

      expect(setViewMode).toHaveBeenCalledWith('day');
      expect(mockDispatch).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('dispatches setViewMode week when Week View is clicked', () => {
      render(<CommandPalette {...defaultProps} />);

      const item = screen.getByTestId('cmdk-item-week-view');
      fireEvent.click(item);

      expect(setViewMode).toHaveBeenCalledWith('week');
      expect(mockDispatch).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('dispatches setViewMode month when Month View is clicked', () => {
      render(<CommandPalette {...defaultProps} />);

      const item = screen.getByTestId('cmdk-item-month-view');
      fireEvent.click(item);

      expect(setViewMode).toHaveBeenCalledWith('month');
      expect(mockDispatch).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('dispatches clearFilters when Clear All Filters is clicked', () => {
      render(<CommandPalette {...defaultProps} />);

      const item = screen.getByTestId('cmdk-item-clear-all-filters');
      fireEvent.click(item);

      expect(clearFilters).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('command descriptions', () => {
    it('renders command descriptions', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('Create a new appointment booking')).toBeInTheDocument();
    });

    it('renders view mode descriptions', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('Switch to day schedule view')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts display', () => {
    it('shows N shortcut for New Appointment', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('N')).toBeInTheDocument();
    });

    it('shows T shortcut for Go to Today', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('shows number shortcuts for views', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('navigation keyboard hints', () => {
    it('shows up arrow key', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('shows down arrow key', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('shows enter key', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('↵')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state text', () => {
      render(<CommandPalette {...defaultProps} />);
      expect(screen.getByText('No commands found.')).toBeInTheDocument();
    });
  });

  describe('localStorage integration', () => {
    it('loads recent actions from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['new-appointment']));
      render(<CommandPalette {...defaultProps} />);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('command-palette-recent');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      // Should not throw
      expect(() => render(<CommandPalette {...defaultProps} />)).not.toThrow();
    });
  });
});
