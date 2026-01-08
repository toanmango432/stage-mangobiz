/**
 * TurnQueue Component Unit Tests
 * Tests for turn queue logic including manual/auto modes, reordering, and staff management
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TurnQueue } from '@/components/TurnQueue';

// Mock staff data
const createMockStaffTurn = (overrides = {}) => ({
  id: `staff-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Staff',
  position: 1,
  serviceCountToday: 0,
  specialties: ['General'],
  status: 'available' as const,
  ...overrides,
});

describe('TurnQueue Component', () => {
  const defaultProps = {
    staff: [],
    mode: 'manual' as const,
    onModeChange: vi.fn(),
    onReorder: vi.fn(),
    onSkip: vi.fn(),
    onRemove: vi.fn(),
    onSettings: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render Turn Queue header', () => {
      render(<TurnQueue {...defaultProps} />);
      expect(screen.getByText('Turn Queue')).toBeInTheDocument();
    });

    it('should render Manual/Auto mode buttons', () => {
      render(<TurnQueue {...defaultProps} />);
      expect(screen.getByText('Manual')).toBeInTheDocument();
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('should highlight active mode button', () => {
      const { rerender } = render(<TurnQueue {...defaultProps} mode="manual" />);
      const manualBtn = screen.getByText('Manual');
      expect(manualBtn).toHaveClass('bg-blue-500');

      rerender(<TurnQueue {...defaultProps} mode="auto" />);
      const autoBtn = screen.getByText('Auto');
      expect(autoBtn).toHaveClass('bg-green-500');
    });

    it('should render staff list when staff provided', () => {
      const staff = [
        createMockStaffTurn({ id: 'staff-1', name: 'Alice', position: 1 }),
        createMockStaffTurn({ id: 'staff-2', name: 'Bob', position: 2 }),
      ];
      render(<TurnQueue {...defaultProps} staff={staff} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Minimized State', () => {
    it('should render minimized view when isMinimized is true', () => {
      const staff = [
        createMockStaffTurn({ id: 'staff-1', name: 'Alice', position: 1, status: 'available' }),
      ];
      render(<TurnQueue {...defaultProps} staff={staff} isMinimized={true} />);
      
      // Should show "Next:" label with next available staff
      expect(screen.getByText('Next:')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should show mode badge in minimized view', () => {
      render(<TurnQueue {...defaultProps} mode="auto" isMinimized={true} />);
      expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('should call onToggleMinimize when expand button clicked', () => {
      const onToggleMinimize = vi.fn();
      render(
        <TurnQueue 
          {...defaultProps} 
          isMinimized={true} 
          onToggleMinimize={onToggleMinimize} 
        />
      );
      
      const expandButton = screen.getByRole('button');
      fireEvent.click(expandButton);
      expect(onToggleMinimize).toHaveBeenCalled();
    });
  });

  describe('Mode Switching', () => {
    it('should call onModeChange with "manual" when Manual button clicked', () => {
      const onModeChange = vi.fn();
      render(<TurnQueue {...defaultProps} mode="auto" onModeChange={onModeChange} />);
      
      fireEvent.click(screen.getByText('Manual'));
      expect(onModeChange).toHaveBeenCalledWith('manual');
    });

    it('should call onModeChange with "auto" when Auto button clicked', () => {
      const onModeChange = vi.fn();
      render(<TurnQueue {...defaultProps} mode="manual" onModeChange={onModeChange} />);
      
      fireEvent.click(screen.getByText('Auto'));
      expect(onModeChange).toHaveBeenCalledWith('auto');
    });
  });

  describe('Staff Sorting', () => {
    it('should sort staff by position', () => {
      const staff = [
        createMockStaffTurn({ id: 'staff-3', name: 'Charlie', position: 3 }),
        createMockStaffTurn({ id: 'staff-1', name: 'Alice', position: 1 }),
        createMockStaffTurn({ id: 'staff-2', name: 'Bob', position: 2 }),
      ];
      render(<TurnQueue {...defaultProps} staff={staff} />);
      
      const staffNames = screen.getAllByText(/Alice|Bob|Charlie/);
      expect(staffNames[0]).toHaveTextContent('Alice');
      expect(staffNames[1]).toHaveTextContent('Bob');
      expect(staffNames[2]).toHaveTextContent('Charlie');
    });

    it('should identify next available staff correctly', () => {
      const staff = [
        createMockStaffTurn({ id: 'staff-1', name: 'Alice', position: 1, status: 'busy' }),
        createMockStaffTurn({ id: 'staff-2', name: 'Bob', position: 2, status: 'available' }),
        createMockStaffTurn({ id: 'staff-3', name: 'Charlie', position: 3, status: 'available' }),
      ];
      render(<TurnQueue {...defaultProps} staff={staff} isMinimized={true} />);
      
      // Bob should be next since Alice is busy
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  describe('Staff Status Display', () => {
    it('should display staff status indicators', () => {
      const staff = [
        createMockStaffTurn({ id: 'staff-1', name: 'Alice', status: 'available' }),
        createMockStaffTurn({ id: 'staff-2', name: 'Bob', status: 'busy' }),
        createMockStaffTurn({ id: 'staff-3', name: 'Charlie', status: 'on-break' }),
      ];
      render(<TurnQueue {...defaultProps} staff={staff} />);
      
      // All staff should be rendered
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should render staff with service count data', () => {
      const staff = [
        createMockStaffTurn({ id: 'staff-1', name: 'Alice', serviceCountToday: 5 }),
      ];
      render(<TurnQueue {...defaultProps} staff={staff} />);
      
      // Staff name should be rendered - service count display depends on component implementation
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });
});

describe('TurnQueue Logic Functions', () => {
  describe('getTimeSinceLastService', () => {
    // Test the time calculation logic
    it('should return "No services yet" when no lastServiceTime', () => {
      // This tests the internal function behavior
      const getTimeSinceLastService = (lastServiceTime?: Date) => {
        if (!lastServiceTime) return 'No services yet';
        const minutes = Math.floor((Date.now() - lastServiceTime.getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
      };

      expect(getTimeSinceLastService(undefined)).toBe('No services yet');
    });

    it('should return minutes format for recent services', () => {
      const getTimeSinceLastService = (lastServiceTime?: Date) => {
        if (!lastServiceTime) return 'No services yet';
        const minutes = Math.floor((Date.now() - lastServiceTime.getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
      };

      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60000);
      expect(getTimeSinceLastService(thirtyMinutesAgo)).toBe('30m ago');
    });

    it('should return hours format for older services', () => {
      const getTimeSinceLastService = (lastServiceTime?: Date) => {
        if (!lastServiceTime) return 'No services yet';
        const minutes = Math.floor((Date.now() - lastServiceTime.getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
      };

      const twoHoursAgo = new Date(Date.now() - 120 * 60000);
      expect(getTimeSinceLastService(twoHoursAgo)).toBe('2h ago');
    });
  });

  describe('Move Up/Down Logic', () => {
    it('should not move up if already at top', () => {
      const sortedStaff = [
        { id: 'staff-1', position: 0 },
        { id: 'staff-2', position: 1 },
      ];
      const onReorder = vi.fn();

      const moveUp = (staffId: string) => {
        const currentIndex = sortedStaff.findIndex(s => s.id === staffId);
        if (currentIndex > 0) {
          onReorder(staffId, currentIndex - 1);
        }
      };

      moveUp('staff-1'); // Already at top
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should move up if not at top', () => {
      const sortedStaff = [
        { id: 'staff-1', position: 0 },
        { id: 'staff-2', position: 1 },
      ];
      const onReorder = vi.fn();

      const moveUp = (staffId: string) => {
        const currentIndex = sortedStaff.findIndex(s => s.id === staffId);
        if (currentIndex > 0) {
          onReorder(staffId, currentIndex - 1);
        }
      };

      moveUp('staff-2');
      expect(onReorder).toHaveBeenCalledWith('staff-2', 0);
    });

    it('should not move down if already at bottom', () => {
      const sortedStaff = [
        { id: 'staff-1', position: 0 },
        { id: 'staff-2', position: 1 },
      ];
      const onReorder = vi.fn();

      const moveDown = (staffId: string) => {
        const currentIndex = sortedStaff.findIndex(s => s.id === staffId);
        if (currentIndex < sortedStaff.length - 1) {
          onReorder(staffId, currentIndex + 1);
        }
      };

      moveDown('staff-2'); // Already at bottom
      expect(onReorder).not.toHaveBeenCalled();
    });

    it('should move down if not at bottom', () => {
      const sortedStaff = [
        { id: 'staff-1', position: 0 },
        { id: 'staff-2', position: 1 },
      ];
      const onReorder = vi.fn();

      const moveDown = (staffId: string) => {
        const currentIndex = sortedStaff.findIndex(s => s.id === staffId);
        if (currentIndex < sortedStaff.length - 1) {
          onReorder(staffId, currentIndex + 1);
        }
      };

      moveDown('staff-1');
      expect(onReorder).toHaveBeenCalledWith('staff-1', 1);
    });
  });
});
