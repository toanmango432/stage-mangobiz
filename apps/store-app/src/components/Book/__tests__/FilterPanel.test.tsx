/**
 * FilterPanel Component Tests
 * Tests for filter controls for status, staff, and services
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel, AppointmentFilters } from '../FilterPanel';

describe('FilterPanel', () => {
  const defaultProps = {
    onFilterChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders filter button', () => {
      render(<FilterPanel {...defaultProps} />);
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });

    it('renders filter icon', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);
      // Lucide renamed Filter to funnel in newer versions
      const icon = container.querySelector('.lucide-funnel, .lucide-filter');
      expect(icon).toBeInTheDocument();
    });

    it('renders chevron icon', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);
      const chevron = container.querySelector('.lucide-chevron-down');
      expect(chevron).toBeInTheDocument();
    });

    it('dropdown is closed by default', () => {
      render(<FilterPanel {...defaultProps} />);
      expect(screen.queryByText('Filter Appointments')).not.toBeInTheDocument();
    });
  });

  describe('dropdown toggle', () => {
    it('opens dropdown when filter button is clicked', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Filter Appointments')).toBeInTheDocument();
    });

    it('closes dropdown when filter button is clicked again', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Filter Appointments')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.queryByText('Filter Appointments')).not.toBeInTheDocument();
    });

    it('closes dropdown when close button is clicked', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Filter Appointments')).toBeInTheDocument();

      // Click X button
      const closeButton = container.querySelector('.lucide-x')?.parentElement;
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton!);

      expect(screen.queryByText('Filter Appointments')).not.toBeInTheDocument();
    });

    it('rotates chevron when open', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      const chevron = container.querySelector('.lucide-chevron-down');
      expect(chevron).toHaveClass('rotate-180');
    });
  });

  describe('search filter', () => {
    it('renders search input in dropdown', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByPlaceholderText('Client name, phone, service...')).toBeInTheDocument();
    });

    it('renders search label', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Search')).toBeInTheDocument();
    });

    it('calls onFilterChange when search value changes', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));

      const searchInput = screen.getByPlaceholderText('Client name, phone, service...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      expect(handleFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'John' })
      );
    });
  });

  describe('status filter', () => {
    it('renders status label', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders all status options', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Checked In')).toBeInTheDocument();
      expect(screen.getByText('In Service')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('No Show')).toBeInTheDocument();
    });

    it('selects status when clicked', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));

      expect(handleFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: ['scheduled'] })
      );
    });

    it('deselects status when clicked again', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));

      // Select
      fireEvent.click(screen.getByText('Scheduled'));
      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: ['scheduled'] })
      );

      // Deselect
      fireEvent.click(screen.getByText('Scheduled'));
      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: [] })
      );
    });

    it('allows multiple status selections', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));
      fireEvent.click(screen.getByText('Checked In'));

      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: ['scheduled', 'checked-in'] })
      );
    });

    it('shows check icon for selected status', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      // No check icons initially (Lucide renamed CheckCircle to circle-check-big)
      let checkIcons = container.querySelectorAll('.lucide-circle-check-big, .lucide-check-circle');
      expect(checkIcons.length).toBe(0);

      // Click scheduled
      fireEvent.click(screen.getByText('Scheduled'));

      // Now there should be a check icon
      checkIcons = container.querySelectorAll('.lucide-circle-check-big, .lucide-check-circle');
      expect(checkIcons.length).toBeGreaterThan(0);
    });
  });

  describe('service type filter', () => {
    it('renders service type label', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Service Type')).toBeInTheDocument();
    });

    it('renders all service types', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      expect(screen.getByText('Hair')).toBeInTheDocument();
      expect(screen.getByText('Nails')).toBeInTheDocument();
      expect(screen.getByText('Facial')).toBeInTheDocument();
      expect(screen.getByText('Massage')).toBeInTheDocument();
      expect(screen.getByText('Waxing')).toBeInTheDocument();
      expect(screen.getByText('Makeup')).toBeInTheDocument();
    });

    it('selects service type when clicked', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Hair'));

      expect(handleFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ serviceTypes: ['Hair'] })
      );
    });

    it('deselects service type when clicked again', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));

      // Select
      fireEvent.click(screen.getByText('Nails'));
      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ serviceTypes: ['Nails'] })
      );

      // Deselect
      fireEvent.click(screen.getByText('Nails'));
      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ serviceTypes: [] })
      );
    });

    it('allows multiple service type selections', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Hair'));
      fireEvent.click(screen.getByText('Nails'));

      expect(handleFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ serviceTypes: ['Hair', 'Nails'] })
      );
    });
  });

  describe('active filter count', () => {
    it('does not show badge when no filters active', () => {
      render(<FilterPanel {...defaultProps} />);
      // The badge would show a number, so look for no number elements in the button
      const button = screen.getByText('Filters').parentElement;
      const badge = button?.querySelector('.bg-brand-600');
      expect(badge).not.toBeInTheDocument();
    });

    it('shows badge with count when status filter is active', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));

      const button = screen.getByText('Filters').parentElement;
      const badge = button?.querySelector('.bg-brand-600');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('1');
    });

    it('shows badge with count when multiple filters are active', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));
      fireEvent.click(screen.getByText('Hair'));

      const button = screen.getByText('Filters').parentElement;
      const badge = button?.querySelector('.bg-brand-600');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('2');
    });

    it('includes search in filter count', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      const searchInput = screen.getByPlaceholderText('Client name, phone, service...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      const button = screen.getByText('Filters').parentElement;
      const badge = button?.querySelector('.bg-brand-600');
      expect(badge).toBeInTheDocument();
      expect(badge?.textContent).toBe('1');
    });
  });

  describe('clear filters', () => {
    it('does not show clear button when no filters active', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
    });

    it('shows clear button when filters are active', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));

      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('clears all filters when clicked', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));

      // Add some filters
      fireEvent.click(screen.getByText('Scheduled'));
      fireEvent.click(screen.getByText('Hair'));

      const searchInput = screen.getByPlaceholderText('Client name, phone, service...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Clear all
      fireEvent.click(screen.getByText('Clear All'));

      expect(handleFilterChange).toHaveBeenLastCalledWith({
        search: '',
        status: [],
        serviceTypes: [],
        dateRange: 'today',
      });
    });

    it('removes badge after clearing filters', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));

      // Badge should exist
      let button = screen.getByText('Filters').parentElement;
      let badge = button?.querySelector('.bg-brand-600');
      expect(badge).toBeInTheDocument();

      // Clear all
      fireEvent.click(screen.getByText('Clear All'));

      // Badge should be gone
      button = screen.getByText('Filters').parentElement;
      badge = button?.querySelector('.bg-brand-600');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('filter button changes style when filters are active', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      let button = screen.getByText('Filters').parentElement;
      expect(button).toHaveClass('border-gray-300');

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));

      button = screen.getByText('Filters').parentElement;
      expect(button).toHaveClass('border-brand-500');
      expect(button).toHaveClass('bg-brand-50');
    });

    it('filter button changes style when dropdown is open', () => {
      render(<FilterPanel {...defaultProps} />);

      // Initially gray border
      let button = screen.getByText('Filters').parentElement;
      expect(button).toHaveClass('border-gray-300');

      // Open dropdown
      fireEvent.click(screen.getByText('Filters'));

      // Now brand color
      button = screen.getByText('Filters').parentElement;
      expect(button).toHaveClass('border-brand-500');
    });

    it('dropdown has shadow styling', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      const dropdown = container.querySelector('.shadow-2xl');
      expect(dropdown).toBeInTheDocument();
    });

    it('selected status button has brand border', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));

      const scheduledButton = screen.getByText('Scheduled').closest('button');
      expect(scheduledButton).toHaveClass('border-brand-500');
    });

    it('selected service type chip has brand background', () => {
      render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Hair'));

      const hairButton = screen.getByText('Hair').closest('button');
      expect(hairButton).toHaveClass('bg-brand-600');
      expect(hairButton).toHaveClass('text-white');
    });
  });

  describe('filter values', () => {
    it('maintains separate state for each filter type', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));

      // Add status filter
      fireEvent.click(screen.getByText('Scheduled'));

      // Add service type filter
      fireEvent.click(screen.getByText('Hair'));

      // Add search filter
      const searchInput = screen.getByPlaceholderText('Client name, phone, service...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      // Check final filter state
      const lastCall = handleFilterChange.mock.calls[handleFilterChange.mock.calls.length - 1][0];
      expect(lastCall.status).toEqual(['scheduled']);
      expect(lastCall.serviceTypes).toEqual(['Hair']);
      expect(lastCall.search).toEqual('John');
    });

    it('initial dateRange is today', () => {
      const handleFilterChange = vi.fn();
      render(<FilterPanel onFilterChange={handleFilterChange} />);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Scheduled'));

      expect(handleFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ dateRange: 'today' })
      );
    });
  });

  describe('status color indicators', () => {
    it('scheduled status has blue color', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      const scheduledButton = screen.getByText('Scheduled').closest('button');
      const colorDot = scheduledButton?.querySelector('.bg-blue-500');
      expect(colorDot).toBeInTheDocument();
    });

    it('checked-in status has brand color', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      const checkedInButton = screen.getByText('Checked In').closest('button');
      const colorDot = checkedInButton?.querySelector('.bg-brand-500');
      expect(colorDot).toBeInTheDocument();
    });

    it('completed status has gray color', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      const completedButton = screen.getByText('Completed').closest('button');
      const colorDot = completedButton?.querySelector('.bg-gray-500');
      expect(colorDot).toBeInTheDocument();
    });

    it('cancelled status has red color', () => {
      const { container } = render(<FilterPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Filters'));

      const cancelledButton = screen.getByText('Cancelled').closest('button');
      const colorDot = cancelledButton?.querySelector('.bg-red-500');
      expect(colorDot).toBeInTheDocument();
    });
  });
});
