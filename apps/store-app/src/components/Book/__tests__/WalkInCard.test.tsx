/**
 * WalkInCard Component Tests
 * Tests for walk-in client card display with paper-ticket aesthetic
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalkInCard, WalkIn } from '../WalkInCard';

// Mock walk-in data
const createMockWalkIn = (overrides?: Partial<WalkIn>): WalkIn => ({
  id: 'walkin-1',
  name: 'John Doe',
  phone: '555-0100',
  partySize: 1,
  services: ['Haircut', 'Shampoo'],
  notes: 'Prefers short style',
  checkInTime: new Date('2026-01-15T10:00:00'),
  estimatedWaitTime: 15,
  ...overrides,
});

describe('WalkInCard', () => {
  const mockOnAssignStaff = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now for consistent wait time calculations
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:15:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic rendering', () => {
    it('renders client name', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders client initial in avatar', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn({ name: 'Alice Smith' })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const avatar = container.querySelector('.w-10.h-10');
      expect(avatar).toHaveTextContent('A');
    });

    it('renders phone number when provided', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ phone: '555-1234' })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('555-1234')).toBeInTheDocument();
    });

    it('does not render phone when not provided', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ phone: undefined })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.queryByText('555-0100')).not.toBeInTheDocument();
    });
  });

  describe('walk-in badge', () => {
    it('displays WALK-IN badge', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('WALK-IN')).toBeInTheDocument();
    });

    it('walk-in badge has correct styling', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const badge = screen.getByText('WALK-IN');
      expect(badge).toHaveClass('bg-blue-500');
      expect(badge).toHaveClass('text-white');
    });
  });

  describe('party size', () => {
    it('does not show party size for single person', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ partySize: 1 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.queryByText(/Party of/)).not.toBeInTheDocument();
    });

    it('shows party size for groups', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ partySize: 3 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('Party of 3')).toBeInTheDocument();
    });

    it('renders Users icon for party size', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn({ partySize: 2 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const icon = container.querySelector('.lucide-users');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('waiting time display', () => {
    it('shows waiting time from estimatedWaitTime', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: 20 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('20min')).toBeInTheDocument();
    });

    it('formats hours and minutes for long waits', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: 75 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('1h 15m')).toBeInTheDocument();
    });

    it('calculates wait time from checkInTime when no estimatedWaitTime', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: undefined })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      // 10:00 to 10:15 = 15 minutes
      expect(screen.getByText('15min')).toBeInTheDocument();
    });

    it('renders Clock icon', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const icon = container.querySelector('.lucide-clock');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('waiting time colors', () => {
    it('shows green for short wait (< 15 min)', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: 10 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const badge = screen.getByText('10min').closest('div');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('shows amber for medium wait (15-29 min)', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: 25 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const badge = screen.getByText('25min').closest('div');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('shows red for long wait (>= 30 min)', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: 45 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const badge = screen.getByText('45min').closest('div');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-700');
    });
  });

  describe('services list', () => {
    it('renders all services', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ services: ['Haircut', 'Beard Trim', 'Shampoo'] })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Beard Trim')).toBeInTheDocument();
      expect(screen.getByText('Shampoo')).toBeInTheDocument();
    });

    it('renders bullet points for services', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ services: ['Haircut', 'Shampoo'] })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const bullets = screen.getAllByText('•');
      expect(bullets.length).toBe(2);
    });
  });

  describe('notes', () => {
    it('renders notes when provided', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ notes: 'Prefers short style' })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('"Prefers short style"')).toBeInTheDocument();
    });

    it('does not render notes section when no notes', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ notes: undefined })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.queryByText(/Prefers/)).not.toBeInTheDocument();
    });

    it('notes have italic styling', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ notes: 'Special request' })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const notesElement = screen.getByText('"Special request"');
      expect(notesElement).toHaveClass('italic');
    });
  });

  describe('action buttons', () => {
    it('renders Assign to Staff button', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.getByText('Assign to Staff')).toBeInTheDocument();
    });

    it('calls onAssignStaff when clicked', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ id: 'walkin-123' })}
          onAssignStaff={mockOnAssignStaff}
        />
      );

      fireEvent.click(screen.getByText('Assign to Staff'));
      expect(mockOnAssignStaff).toHaveBeenCalledWith('walkin-123');
    });

    it('renders Edit button when onEdit provided', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
          onEdit={mockOnEdit}
        />
      );
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('does not render Edit button when onEdit not provided', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });

    it('calls onEdit with walkIn when clicked', () => {
      const walkIn = createMockWalkIn();
      render(
        <WalkInCard
          walkIn={walkIn}
          onAssignStaff={mockOnAssignStaff}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByText('Edit'));
      expect(mockOnEdit).toHaveBeenCalledWith(walkIn);
    });

    it('renders Remove button when onRemove provided', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
          onRemove={mockOnRemove}
        />
      );
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });

    it('does not render Remove button when onRemove not provided', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    });

    it('calls onRemove with walkIn id when clicked', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ id: 'walkin-456' })}
          onAssignStaff={mockOnAssignStaff}
          onRemove={mockOnRemove}
        />
      );

      fireEvent.click(screen.getByText('Remove'));
      expect(mockOnRemove).toHaveBeenCalledWith('walkin-456');
    });
  });

  describe('card styling', () => {
    it('has white background', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has rounded corners', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('has left border accent', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(container.firstChild).toHaveClass('border-l-4');
      expect(container.firstChild).toHaveClass('border-blue-400');
    });

    it('has shadow', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(container.firstChild).toHaveClass('shadow-md');
    });

    it('has hover shadow effect', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(container.firstChild).toHaveClass('hover:shadow-lg');
    });

    it('has transition', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(container.firstChild).toHaveClass('transition-all');
    });

    it('has hover translate effect', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      expect(container.firstChild).toHaveClass('hover:-translate-y-0.5');
    });

    it('applies custom className', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('paper ticket aesthetic', () => {
    it('has perforation line (dashed border)', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const perforation = container.querySelector('.border-dashed');
      expect(perforation).toBeInTheDocument();
    });

    it('has semicircle cutouts', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const cutouts = container.querySelectorAll('.rounded-full.-left-1');
      expect(cutouts.length).toBe(2);
    });
  });

  describe('avatar styling', () => {
    it('avatar has gradient background', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const avatar = container.querySelector('.bg-gradient-to-br');
      expect(avatar).toBeInTheDocument();
    });

    it('avatar has circular shape', () => {
      const { container } = render(
        <WalkInCard
          walkIn={createMockWalkIn()}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const avatar = container.querySelector('.rounded-full.w-10.h-10');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('waiting time badge styling', () => {
    it('has rounded corners', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: 10 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const badge = screen.getByText('10min').closest('div');
      expect(badge).toHaveClass('rounded-md');
    });

    it('has shadow', () => {
      render(
        <WalkInCard
          walkIn={createMockWalkIn({ estimatedWaitTime: 10 })}
          onAssignStaff={mockOnAssignStaff}
        />
      );
      const badge = screen.getByText('10min').closest('div');
      expect(badge).toHaveClass('shadow-sm');
    });
  });
});
