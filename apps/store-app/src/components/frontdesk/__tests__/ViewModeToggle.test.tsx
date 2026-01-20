/**
 * ViewModeToggle Component Tests
 * Tests for grid/list view toggle functionality
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock Tippy to avoid React hooks issues in tests
vi.mock('@tippyjs/react', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

import { ViewModeToggle } from '../ViewModeToggle';

describe('ViewModeToggle', () => {
  const defaultProps = {
    viewMode: 'list' as const,
    onViewModeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders list view button', () => {
      render(<ViewModeToggle {...defaultProps} />);
      expect(screen.getByLabelText('List View')).toBeInTheDocument();
    });

    it('renders grid view button', () => {
      render(<ViewModeToggle {...defaultProps} />);
      expect(screen.getByLabelText('Grid View')).toBeInTheDocument();
    });

    it('renders both buttons', () => {
      render(<ViewModeToggle {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('renders list icon', () => {
      const { container } = render(<ViewModeToggle {...defaultProps} />);
      const listIcon = container.querySelector('.lucide-list');
      expect(listIcon).toBeInTheDocument();
    });

    it('renders grid icon', () => {
      const { container } = render(<ViewModeToggle {...defaultProps} />);
      // Grid icon uses lucide-grid-2-x-2 or similar class
      const gridIcon = container.querySelector('svg:not(.lucide-list)');
      // Check that we have at least 2 SVGs (list and grid icons)
      const allIcons = container.querySelectorAll('svg');
      expect(allIcons.length).toBe(2);
    });
  });

  describe('view mode state', () => {
    it('shows list button as active when viewMode is list', () => {
      render(<ViewModeToggle {...defaultProps} viewMode="list" />);
      const listButton = screen.getByLabelText('List View');
      expect(listButton).toHaveAttribute('aria-pressed', 'true');
      expect(listButton).toHaveClass('bg-white');
    });

    it('shows grid button as inactive when viewMode is list', () => {
      render(<ViewModeToggle {...defaultProps} viewMode="list" />);
      const gridButton = screen.getByLabelText('Grid View');
      expect(gridButton).toHaveAttribute('aria-pressed', 'false');
      expect(gridButton).not.toHaveClass('bg-white');
    });

    it('shows grid button as active when viewMode is grid', () => {
      render(<ViewModeToggle {...defaultProps} viewMode="grid" />);
      const gridButton = screen.getByLabelText('Grid View');
      expect(gridButton).toHaveAttribute('aria-pressed', 'true');
      expect(gridButton).toHaveClass('bg-white');
    });

    it('shows list button as inactive when viewMode is grid', () => {
      render(<ViewModeToggle {...defaultProps} viewMode="grid" />);
      const listButton = screen.getByLabelText('List View');
      expect(listButton).toHaveAttribute('aria-pressed', 'false');
      expect(listButton).not.toHaveClass('bg-white');
    });
  });

  describe('click handling', () => {
    it('calls onViewModeChange with "list" when list button is clicked', () => {
      const handleChange = vi.fn();
      render(
        <ViewModeToggle
          viewMode="grid"
          onViewModeChange={handleChange}
        />
      );

      fireEvent.click(screen.getByLabelText('List View'));
      expect(handleChange).toHaveBeenCalledWith('list');
    });

    it('calls onViewModeChange with "grid" when grid button is clicked', () => {
      const handleChange = vi.fn();
      render(
        <ViewModeToggle
          viewMode="list"
          onViewModeChange={handleChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Grid View'));
      expect(handleChange).toHaveBeenCalledWith('grid');
    });

    it('calls onViewModeChange when clicking already active mode', () => {
      const handleChange = vi.fn();
      render(
        <ViewModeToggle
          viewMode="list"
          onViewModeChange={handleChange}
        />
      );

      fireEvent.click(screen.getByLabelText('List View'));
      expect(handleChange).toHaveBeenCalledWith('list');
    });
  });

  describe('size variants', () => {
    it('applies medium size by default', () => {
      const { container } = render(<ViewModeToggle {...defaultProps} />);
      // Both icons should have default stroke width
      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('stroke-width', '2');
      });
    });

    it('renders sm size', () => {
      render(<ViewModeToggle {...defaultProps} size="sm" />);
      // Component should render without error
      expect(screen.getByLabelText('List View')).toBeInTheDocument();
    });

    it('renders md size', () => {
      render(<ViewModeToggle {...defaultProps} size="md" />);
      // Component should render without error
      expect(screen.getByLabelText('List View')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct aria-label on list button', () => {
      render(<ViewModeToggle {...defaultProps} />);
      expect(screen.getByLabelText('List View')).toBeInTheDocument();
    });

    it('has correct aria-label on grid button', () => {
      render(<ViewModeToggle {...defaultProps} />);
      expect(screen.getByLabelText('Grid View')).toBeInTheDocument();
    });

    it('has aria-pressed attribute on buttons', () => {
      render(<ViewModeToggle {...defaultProps} viewMode="list" />);
      const listButton = screen.getByLabelText('List View');
      const gridButton = screen.getByLabelText('Grid View');

      expect(listButton).toHaveAttribute('aria-pressed');
      expect(gridButton).toHaveAttribute('aria-pressed');
    });

    it('buttons are focusable', () => {
      render(<ViewModeToggle {...defaultProps} />);
      const listButton = screen.getByLabelText('List View');
      listButton.focus();
      expect(document.activeElement).toBe(listButton);
    });
  });

  describe('styling', () => {
    it('has wrapper with correct container styling', () => {
      const { container } = render(<ViewModeToggle {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('inline-flex');
      expect(wrapper).toHaveClass('bg-slate-100');
      expect(wrapper).toHaveClass('rounded-lg');
    });

    it('active button has shadow styling', () => {
      render(<ViewModeToggle {...defaultProps} viewMode="list" />);
      const listButton = screen.getByLabelText('List View');
      expect(listButton).toHaveClass('shadow-sm');
    });

    it('inactive button does not have shadow styling', () => {
      render(<ViewModeToggle {...defaultProps} viewMode="list" />);
      const gridButton = screen.getByLabelText('Grid View');
      expect(gridButton).not.toHaveClass('shadow-sm');
    });
  });
});
