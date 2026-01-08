/**
 * @file WalkInSidebar.test.tsx
 * @description Tests for WalkInSidebar - Draggable walk-in queue panel
 *
 * Test coverage:
 * - Collapsed state (minimal width, count badge, expand button)
 * - Expanded state (header, list, controls)
 * - Toggle expand/collapse list
 * - Toggle collapse sidebar
 * - Walk-in filtering (only 'waiting' status)
 * - Drag and drop functionality
 * - Empty state rendering
 * - Count badge display
 * - Styling and animations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WalkInSidebar } from '../WalkInSidebar';

// Mock LegacyWalkIn factory
function createMockWalkIn(overrides: any = {}): any {
  return {
    id: 'walkin-1',
    clientName: 'John Doe',
    phone: '555-1234',
    partySize: 1,
    requestedService: 'Haircut',
    arrivalTime: new Date('2026-01-15T10:00:00'),
    status: 'waiting',
    ...overrides,
  };
}

describe('WalkInSidebar', () => {
  const mockOnDragStart = vi.fn();
  const mockOnAssignStaff = vi.fn();

  const defaultProps = {
    walkIns: [createMockWalkIn()],
    onDragStart: mockOnDragStart,
    onAssignStaff: mockOnAssignStaff,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Expanded State (Default)', () => {
    it('renders Walk-Ins title', () => {
      render(<WalkInSidebar {...defaultProps} />);
      expect(screen.getByText('Walk-Ins')).toBeInTheDocument();
    });

    it('shows waiting count in header', () => {
      render(<WalkInSidebar {...defaultProps} />);
      expect(screen.getByText('1 waiting')).toBeInTheDocument();
    });

    it('shows multiple waiting count', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1' }),
        createMockWalkIn({ id: 'w2' }),
        createMockWalkIn({ id: 'w3' }),
      ];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);
      expect(screen.getByText('3 waiting')).toBeInTheDocument();
    });

    it('filters out assigned walk-ins from count', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1', status: 'waiting' }),
        createMockWalkIn({ id: 'w2', status: 'assigned' }),
        createMockWalkIn({ id: 'w3', status: 'waiting' }),
      ];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);
      expect(screen.getByText('2 waiting')).toBeInTheDocument();
    });

    it('shows zero waiting when all assigned', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1', status: 'assigned' }),
        createMockWalkIn({ id: 'w2', status: 'assigned' }),
      ];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);
      expect(screen.getByText('0 waiting')).toBeInTheDocument();
    });

    it('renders Users icon in header', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const iconContainer = container.querySelector('.from-brand-500.to-brand-600');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer?.querySelector('svg')).toBeInTheDocument();
    });

    it('has expand/collapse list button', () => {
      render(<WalkInSidebar {...defaultProps} />);
      expect(screen.getByLabelText('Collapse list')).toBeInTheDocument();
    });

    it('has collapse sidebar button', () => {
      render(<WalkInSidebar {...defaultProps} />);
      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();
    });
  });

  describe('Walk-In List Display', () => {
    it('renders walk-in cards for waiting walk-ins', () => {
      render(<WalkInSidebar {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders multiple walk-in cards', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1', clientName: 'Alice' }),
        createMockWalkIn({ id: 'w2', clientName: 'Bob' }),
      ];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('does not render assigned walk-ins', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1', clientName: 'Waiting', status: 'waiting' }),
        createMockWalkIn({ id: 'w2', clientName: 'Assigned', status: 'assigned' }),
      ];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);
      expect(screen.getByText('Waiting')).toBeInTheDocument();
      expect(screen.queryByText('Assigned')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no waiting walk-ins', () => {
      render(<WalkInSidebar {...defaultProps} walkIns={[]} />);
      // EmptyState component renders for type="walkins"
      // The exact text depends on EmptyState implementation
      expect(screen.getByText('0 waiting')).toBeInTheDocument();
    });

    it('shows empty state when all are assigned', () => {
      const walkIns = [createMockWalkIn({ status: 'assigned' })];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);
      expect(screen.getByText('0 waiting')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse List Toggle', () => {
    it('hides list when collapse list button clicked', () => {
      render(<WalkInSidebar {...defaultProps} />);

      // Initially the list is visible
      expect(screen.getByText('John Doe')).toBeInTheDocument();

      // Click collapse list button
      fireEvent.click(screen.getByLabelText('Collapse list'));

      // List should be hidden (but walk-in data might still be there, check for container)
      // The walk-in cards are in the list section that gets hidden
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('shows expand button after collapsing list', () => {
      render(<WalkInSidebar {...defaultProps} />);

      // Click collapse list button
      fireEvent.click(screen.getByLabelText('Collapse list'));

      // Button should now say "Expand list"
      expect(screen.getByLabelText('Expand list')).toBeInTheDocument();
    });

    it('expands list when expand button clicked', () => {
      render(<WalkInSidebar {...defaultProps} />);

      // Collapse first
      fireEvent.click(screen.getByLabelText('Collapse list'));
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

      // Now expand
      fireEvent.click(screen.getByLabelText('Expand list'));
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('header title also toggles list', () => {
      render(<WalkInSidebar {...defaultProps} />);

      // Click on the Walk-Ins title area
      const titleButton = screen.getByText('Walk-Ins').closest('button');
      if (titleButton) {
        fireEvent.click(titleButton);
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      }
    });
  });

  describe('Sidebar Collapse', () => {
    it('collapses to minimal width when collapse sidebar clicked', () => {
      render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      // In collapsed state, title is not visible, only vertical letters
      expect(screen.queryByText('Walk-Ins')).not.toBeInTheDocument();
    });

    it('shows expand button in collapsed state', () => {
      render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      expect(screen.getByLabelText('Expand walk-in sidebar')).toBeInTheDocument();
    });

    it('shows count badge in collapsed state', () => {
      render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('shows correct count for multiple walk-ins when collapsed', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1' }),
        createMockWalkIn({ id: 'w2' }),
        createMockWalkIn({ id: 'w3' }),
        createMockWalkIn({ id: 'w4' }),
        createMockWalkIn({ id: 'w5' }),
      ];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows vertical WALK letters in collapsed state', () => {
      render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      expect(screen.getByText('W')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('K')).toBeInTheDocument();
    });

    it('expands sidebar when expand button clicked', () => {
      render(<WalkInSidebar {...defaultProps} />);

      // Collapse first
      fireEvent.click(screen.getByLabelText('Collapse sidebar'));
      expect(screen.queryByText('Walk-Ins')).not.toBeInTheDocument();

      // Now expand
      fireEvent.click(screen.getByLabelText('Expand walk-in sidebar'));
      expect(screen.getByText('Walk-Ins')).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('walk-in cards are draggable', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const draggableDiv = container.querySelector('[draggable="true"]');
      expect(draggableDiv).toBeInTheDocument();
    });

    it('calls onDragStart when drag starts', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const draggable = container.querySelector('[draggable="true"]');

      if (draggable) {
        const dataTransfer = { effectAllowed: '', setData: vi.fn() };
        fireEvent.dragStart(draggable, { dataTransfer });

        expect(mockOnDragStart).toHaveBeenCalledWith(defaultProps.walkIns[0]);
      }
    });

    it('sets dataTransfer data on drag start', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const draggable = container.querySelector('[draggable="true"]');

      if (draggable) {
        const setDataMock = vi.fn();
        const dataTransfer = { effectAllowed: '', setData: setDataMock };
        fireEvent.dragStart(draggable, { dataTransfer });

        expect(setDataMock).toHaveBeenCalledWith('walkInId', 'walkin-1');
      }
    });

    it('sets effectAllowed to move on drag start', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const draggable = container.querySelector('[draggable="true"]');

      if (draggable) {
        const dataTransfer = { effectAllowed: '', setData: vi.fn() };
        fireEvent.dragStart(draggable, { dataTransfer });

        expect(dataTransfer.effectAllowed).toBe('move');
      }
    });

    it('has cursor-move class', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const draggable = container.querySelector('[draggable="true"]');
      expect(draggable).toHaveClass('cursor-move');
    });

    it('has active opacity class', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const draggable = container.querySelector('[draggable="true"]');
      expect(draggable).toHaveClass('active:opacity-50');
    });
  });

  describe('Styling', () => {
    it('has border-left in expanded state', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('border-l');
    });

    it('has responsive width classes', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('w-64', 'md:w-72', 'lg:w-80');
    });

    it('has flex column layout', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('flex', 'flex-col');
    });

    it('has transition for animations', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('transition-all', 'duration-300');
    });

    it('collapsed state has minimal width', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('w-12');
    });

    it('header has backdrop blur', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const header = container.querySelector('.backdrop-blur-sm');
      expect(header).toBeInTheDocument();
    });

    it('list area has overflow-y-auto', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const listArea = container.querySelector('.overflow-y-auto');
      expect(listArea).toBeInTheDocument();
    });

    it('list items have spacing', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const listArea = container.querySelector('.space-y-3');
      expect(listArea).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('walk-in cards have animation class', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const draggable = container.querySelector('[draggable="true"]');
      expect(draggable).toHaveClass('animate-slide-up');
    });

    it('cards have staggered animation delays', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1', clientName: 'First' }),
        createMockWalkIn({ id: 'w2', clientName: 'Second' }),
        createMockWalkIn({ id: 'w3', clientName: 'Third' }),
      ];
      const { container } = render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);

      const draggables = container.querySelectorAll('[draggable="true"]');
      expect(draggables[0]).toHaveStyle({ animationDelay: '0ms' });
      expect(draggables[1]).toHaveStyle({ animationDelay: '50ms' });
      expect(draggables[2]).toHaveStyle({ animationDelay: '100ms' });
    });
  });

  describe('Collapsed State Styling', () => {
    it('has white background when collapsed', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('bg-white');
    });

    it('has shadow-sm when collapsed', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const sidebar = container.firstChild as HTMLElement;
      expect(sidebar).toHaveClass('shadow-sm');
    });

    it('count badge has red background', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const badge = container.querySelector('.bg-red-500');
      expect(badge).toBeInTheDocument();
    });

    it('expand button has hover state', () => {
      render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const expandButton = screen.getByLabelText('Expand walk-in sidebar');
      expect(expandButton).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('Icon Container Styling', () => {
    it('header icon has gradient background', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);
      const iconContainer = container.querySelector('.bg-gradient-to-br.from-brand-500');
      expect(iconContainer).toBeInTheDocument();
    });

    it('collapsed icon has gradient background', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const iconContainer = container.querySelector('.bg-gradient-to-br.from-brand-500');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Control Button Styling', () => {
    it('control buttons have rounded corners', () => {
      render(<WalkInSidebar {...defaultProps} />);
      const collapseButton = screen.getByLabelText('Collapse list');
      expect(collapseButton).toHaveClass('rounded-lg');
    });

    it('control buttons have hover state', () => {
      render(<WalkInSidebar {...defaultProps} />);
      const collapseButton = screen.getByLabelText('Collapse list');
      expect(collapseButton).toHaveClass('hover:bg-gray-100');
    });

    it('control buttons have transition', () => {
      render(<WalkInSidebar {...defaultProps} />);
      const collapseButton = screen.getByLabelText('Collapse list');
      expect(collapseButton).toHaveClass('transition-colors', 'duration-200');
    });
  });

  describe('Optional Handlers', () => {
    it('does not crash when onDragStart is undefined', () => {
      const { container } = render(
        <WalkInSidebar walkIns={defaultProps.walkIns} onAssignStaff={mockOnAssignStaff} />
      );
      const draggable = container.querySelector('[draggable="true"]');

      if (draggable) {
        const dataTransfer = { effectAllowed: '', setData: vi.fn() };
        fireEvent.dragStart(draggable, { dataTransfer });
        // Should not throw
      }
    });

    it('does not crash when onAssignStaff is undefined', () => {
      render(<WalkInSidebar walkIns={defaultProps.walkIns} onDragStart={mockOnDragStart} />);
      // WalkInCard's onAssignStaff will be called safely
    });
  });

  describe('Edge Cases', () => {
    it('handles empty walkIns array', () => {
      render(<WalkInSidebar {...defaultProps} walkIns={[]} />);
      expect(screen.getByText('0 waiting')).toBeInTheDocument();
    });

    it('handles walk-in without requestedService', () => {
      const walkIn = createMockWalkIn({ requestedService: undefined });
      render(<WalkInSidebar {...defaultProps} walkIns={[walkIn]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles very long client names', () => {
      const walkIn = createMockWalkIn({ clientName: 'Very Long Client Name That Might Overflow' });
      render(<WalkInSidebar {...defaultProps} walkIns={[walkIn]} />);
      expect(screen.getByText('Very Long Client Name That Might Overflow')).toBeInTheDocument();
    });

    it('handles special characters in names', () => {
      const walkIn = createMockWalkIn({ clientName: "O'Brien & Co." });
      render(<WalkInSidebar {...defaultProps} walkIns={[walkIn]} />);
      expect(screen.getByText("O'Brien & Co.")).toBeInTheDocument();
    });

    it('handles large party sizes', () => {
      const walkIn = createMockWalkIn({ partySize: 10 });
      render(<WalkInSidebar {...defaultProps} walkIns={[walkIn]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('handles many walk-ins', () => {
      const walkIns = Array.from({ length: 20 }, (_, i) =>
        createMockWalkIn({ id: `w${i}`, clientName: `Client ${i}` })
      );
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);
      expect(screen.getByText('20 waiting')).toBeInTheDocument();
    });
  });

  describe('Count Badge in Collapsed State', () => {
    it('shows count 0 when empty', () => {
      render(<WalkInSidebar {...defaultProps} walkIns={[]} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows correct count with mixed statuses', () => {
      const walkIns = [
        createMockWalkIn({ id: 'w1', status: 'waiting' }),
        createMockWalkIn({ id: 'w2', status: 'assigned' }),
        createMockWalkIn({ id: 'w3', status: 'waiting' }),
        createMockWalkIn({ id: 'w4', status: 'assigned' }),
        createMockWalkIn({ id: 'w5', status: 'waiting' }),
      ];
      render(<WalkInSidebar {...defaultProps} walkIns={walkIns} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('badge has rounded-full styling', () => {
      const { container } = render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const badge = container.querySelector('.rounded-full.bg-red-500');
      expect(badge).toBeInTheDocument();
    });

    it('badge text is white and bold', () => {
      render(<WalkInSidebar {...defaultProps} />);

      fireEvent.click(screen.getByLabelText('Collapse sidebar'));

      const countText = screen.getByText('1');
      expect(countText).toHaveClass('text-white', 'font-bold');
    });
  });
});
