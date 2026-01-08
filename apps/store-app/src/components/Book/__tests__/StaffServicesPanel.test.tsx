/**
 * StaffServicesPanel Component Tests
 * Tests for staff and service selection panel
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StaffServicesPanel } from '../StaffServicesPanel';

describe('StaffServicesPanel', () => {
  const mockStaff = [
    { id: 'staff-1', name: 'Jane Stylist' },
    { id: 'staff-2', name: 'John Barber' },
  ];

  const mockServices = [
    { id: 'svc-1', name: 'Haircut', category: 'Hair', duration: 30, price: 25 },
    { id: 'svc-2', name: 'Color', category: 'Hair', duration: 60, price: 80 },
    { id: 'svc-3', name: 'Manicure', category: 'Nails', duration: 45, price: 35 },
  ];

  const defaultProps = {
    allStaff: mockStaff,
    activeStaffId: null,
    categories: ['All', 'Hair', 'Nails'],
    selectedCategory: 'All',
    onSelectCategory: vi.fn(),
    serviceSearch: '',
    onServiceSearch: vi.fn(),
    filteredServices: mockServices,
    onSelectStaff: vi.fn(),
    onAddService: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('staff section', () => {
    it('renders staff section title', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('Staff')).toBeInTheDocument();
    });

    it('renders staff section description', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('Select a staff member to assign services')).toBeInTheDocument();
    });

    it('renders staff buttons', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('Jane Stylist')).toBeInTheDocument();
      expect(screen.getByText('John Barber')).toBeInTheDocument();
    });

    it('shows avatar initials', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      // Both staff have names starting with J (Jane, John)
      const initials = screen.getAllByText('J');
      expect(initials.length).toBe(2);
    });

    it('shows "Tap to select" hint on each staff button', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      const hints = screen.getAllByText('Tap to select');
      expect(hints.length).toBe(2);
    });

    it('shows empty state when no staff', () => {
      render(<StaffServicesPanel {...defaultProps} allStaff={[]} />);
      expect(screen.getByText('No staff available')).toBeInTheDocument();
    });

    it('calls onSelectStaff when staff clicked', () => {
      const onSelectStaff = vi.fn();
      render(<StaffServicesPanel {...defaultProps} onSelectStaff={onSelectStaff} />);

      fireEvent.click(screen.getByText('Jane Stylist'));

      expect(onSelectStaff).toHaveBeenCalledWith('staff-1', 'Jane Stylist');
    });

    it('highlights selected staff', () => {
      const { container } = render(
        <StaffServicesPanel {...defaultProps} activeStaffId="staff-1" />
      );

      const selectedButton = container.querySelector('.border-brand-500.bg-brand-50');
      expect(selectedButton).toBeInTheDocument();
    });

    it('unselected staff has gray border', () => {
      const { container } = render(
        <StaffServicesPanel {...defaultProps} activeStaffId="staff-1" />
      );

      const unselectedButton = container.querySelector('.border-gray-200.bg-white');
      expect(unselectedButton).toBeInTheDocument();
    });
  });

  describe('services section', () => {
    it('renders services section title', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('Services')).toBeInTheDocument();
    });

    it('renders services section description', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('Pick a service to add to the selected staff')).toBeInTheDocument();
    });

    it('renders service cards', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Manicure')).toBeInTheDocument();
    });

    it('shows service category', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      const hairCategories = screen.getAllByText('Hair');
      expect(hairCategories.length).toBeGreaterThan(0);
    });

    it('shows service duration', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });

    it('shows service price', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('$25')).toBeInTheDocument();
      expect(screen.getByText('$80')).toBeInTheDocument();
      expect(screen.getByText('$35')).toBeInTheDocument();
    });

    it('shows empty state when no services', () => {
      render(<StaffServicesPanel {...defaultProps} filteredServices={[]} />);
      expect(screen.getByText('No services available')).toBeInTheDocument();
    });

    it('calls onAddService when service clicked', () => {
      const onAddService = vi.fn();
      render(
        <StaffServicesPanel
          {...defaultProps}
          activeStaffId="staff-1"
          onAddService={onAddService}
        />
      );

      fireEvent.click(screen.getByText('Haircut'));

      expect(onAddService).toHaveBeenCalledWith(mockServices[0]);
    });
  });

  describe('category pills', () => {
    it('renders all category pills', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByText('All')).toBeInTheDocument();
      // Hair appears in pills AND service cards, so use getAllByText
      expect(screen.getAllByText('Hair').length).toBeGreaterThan(0);
      // Nails appears in pills AND service cards
      expect(screen.getAllByText('Nails').length).toBeGreaterThan(0);
    });

    it('highlights selected category', () => {
      const { container } = render(
        <StaffServicesPanel {...defaultProps} selectedCategory="Hair" />
      );

      const selectedPill = container.querySelector('.bg-brand-50.text-brand-700');
      expect(selectedPill).toBeInTheDocument();
    });

    it('calls onSelectCategory when pill clicked', () => {
      const onSelectCategory = vi.fn();
      render(
        <StaffServicesPanel {...defaultProps} onSelectCategory={onSelectCategory} />
      );

      // Find the category pill button specifically (has rounded-full class)
      const hairPills = screen.getAllByText('Hair');
      // The pill button is the one with rounded-full class
      const pillButton = hairPills.find(el => el.closest('button.rounded-full'));
      if (pillButton) {
        fireEvent.click(pillButton.closest('button')!);
      }

      expect(onSelectCategory).toHaveBeenCalledWith('Hair');
    });

    it('unselected pill has gray styling', () => {
      const { container } = render(
        <StaffServicesPanel {...defaultProps} selectedCategory="All" />
      );

      const unselectedPills = container.querySelectorAll('.rounded-full.border-gray-200');
      expect(unselectedPills.length).toBeGreaterThan(0);
    });
  });

  describe('search input', () => {
    it('renders search input', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search services...')).toBeInTheDocument();
    });

    it('has search icon', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      // Search icon from lucide-react
      const searchIcon = container.querySelector('svg.lucide-search');
      expect(searchIcon).toBeInTheDocument();
    });

    it('shows current search value', () => {
      render(<StaffServicesPanel {...defaultProps} serviceSearch="Haircut" />);
      expect(screen.getByDisplayValue('Haircut')).toBeInTheDocument();
    });

    it('calls onServiceSearch on input change', () => {
      const onServiceSearch = vi.fn();
      render(
        <StaffServicesPanel {...defaultProps} onServiceSearch={onServiceSearch} />
      );

      fireEvent.change(screen.getByPlaceholderText('Search services...'), {
        target: { value: 'Color' },
      });

      expect(onServiceSearch).toHaveBeenCalledWith('Color');
    });
  });

  describe('disabled state', () => {
    it('disables staff buttons when disabled', () => {
      render(<StaffServicesPanel {...defaultProps} disabled={true} />);

      const staffButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Jane') || btn.textContent?.includes('John')
      );

      staffButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });

    it('disables service buttons when disabled', () => {
      render(
        <StaffServicesPanel
          {...defaultProps}
          disabled={true}
          activeStaffId="staff-1"
        />
      );

      const serviceButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Haircut') || btn.textContent?.includes('Color')
      );

      serviceButtons.forEach(btn => {
        expect(btn).toBeDisabled();
      });
    });

    it('disables service buttons when no staff selected', () => {
      render(<StaffServicesPanel {...defaultProps} activeStaffId={null} />);

      const haircut = screen.getByText('Haircut').closest('button');
      expect(haircut).toBeDisabled();
    });

    it('enables service buttons when staff selected', () => {
      render(<StaffServicesPanel {...defaultProps} activeStaffId="staff-1" />);

      const haircut = screen.getByText('Haircut').closest('button');
      expect(haircut).not.toBeDisabled();
    });
  });

  describe('styling', () => {
    it('has white background', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has flex layout', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      expect(container.firstChild).toHaveClass('flex', 'flex-col');
    });

    it('staff grid has 2 columns', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      const staffGrid = container.querySelector('.grid.grid-cols-2');
      expect(staffGrid).toBeInTheDocument();
    });

    it('staff buttons have rounded corners', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      const staffButton = container.querySelector('.rounded-lg.border');
      expect(staffButton).toBeInTheDocument();
    });

    it('avatar has gradient background', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      const avatar = container.querySelector('.bg-gradient-to-br');
      expect(avatar).toBeInTheDocument();
    });

    it('service buttons have border', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      const serviceButton = container.querySelector('.border.border-gray-200.rounded-lg');
      expect(serviceButton).toBeInTheDocument();
    });

    it('category pills are rounded-full', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      const pills = container.querySelectorAll('.rounded-full');
      expect(pills.length).toBeGreaterThan(0);
    });

    it('search input has focus ring styling', () => {
      const { container } = render(<StaffServicesPanel {...defaultProps} />);
      const input = container.querySelector('input.focus\\:ring-2');
      expect(input).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles staff without name gracefully', () => {
      const staffWithEmptyName = [{ id: 'staff-1', name: '' }];
      render(<StaffServicesPanel {...defaultProps} allStaff={staffWithEmptyName} />);

      // Avatar should show 'S' as fallback
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('handles single staff member', () => {
      const singleStaff = [{ id: 'staff-1', name: 'Solo Stylist' }];
      render(<StaffServicesPanel {...defaultProps} allStaff={singleStaff} />);

      expect(screen.getByText('Solo Stylist')).toBeInTheDocument();
    });

    it('handles single service', () => {
      const singleService = [
        { id: 'svc-1', name: 'Basic Cut', category: 'Hair', duration: 30, price: 20 },
      ];
      render(<StaffServicesPanel {...defaultProps} filteredServices={singleService} />);

      expect(screen.getByText('Basic Cut')).toBeInTheDocument();
    });

    it('handles no categories', () => {
      render(<StaffServicesPanel {...defaultProps} categories={[]} />);
      // Should still render services section
      expect(screen.getByText('Services')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('staff buttons are focusable', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      const staffButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Jane')
      );
      expect(staffButtons[0]).not.toBeDisabled();
    });

    it('search input is focusable', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search services...');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('service buttons have text content', () => {
      render(<StaffServicesPanel {...defaultProps} />);
      const serviceButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent?.includes('Haircut')
      );
      expect(serviceButtons[0]).toHaveTextContent('Haircut');
      expect(serviceButtons[0]).toHaveTextContent('30 min');
      expect(serviceButtons[0]).toHaveTextContent('$25');
    });
  });
});
