/**
 * FrontDeskEmptyState and FrontDeskSkeleton Component Tests
 * Tests for empty state display and skeleton loading components
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FrontDeskEmptyState } from '../FrontDeskEmptyState';
import {
  TicketCardSkeleton,
  TicketCardSkeletonGrid,
  SectionSkeleton,
} from '../FrontDeskSkeleton';
import { Users } from 'lucide-react';

describe('FrontDeskEmptyState', () => {
  describe('section types', () => {
    it('renders waitList section defaults', () => {
      render(<FrontDeskEmptyState section="waitList" />);
      expect(screen.getByText('No one waiting')).toBeInTheDocument();
      expect(screen.getByText('New walk-ins will appear here')).toBeInTheDocument();
    });

    it('renders service section defaults', () => {
      render(<FrontDeskEmptyState section="service" />);
      expect(screen.getByText('No active services')).toBeInTheDocument();
      expect(screen.getByText('Assign a technician to get started')).toBeInTheDocument();
    });

    it('renders pending section defaults', () => {
      render(<FrontDeskEmptyState section="pending" />);
      expect(screen.getByText('No pending payments')).toBeInTheDocument();
      expect(screen.getByText('Completed services will appear here for checkout')).toBeInTheDocument();
    });

    it('renders closed section defaults', () => {
      render(<FrontDeskEmptyState section="closed" />);
      expect(screen.getByText('No closed tickets today')).toBeInTheDocument();
      expect(screen.getByText('Completed transactions will appear here')).toBeInTheDocument();
    });

    it('renders comingAppointments section defaults', () => {
      render(<FrontDeskEmptyState section="comingAppointments" />);
      expect(screen.getByText('No appointments coming up')).toBeInTheDocument();
      expect(screen.getByText('Scheduled appointments will appear here')).toBeInTheDocument();
    });
  });

  describe('filter mode', () => {
    it('shows filter message when hasFilters is true', () => {
      render(<FrontDeskEmptyState section="waitList" hasFilters={true} />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText("Try adjusting your search or filters to find what you're looking for.")).toBeInTheDocument();
    });

    it('shows section defaults when hasFilters is false', () => {
      render(<FrontDeskEmptyState section="waitList" hasFilters={false} />);
      expect(screen.getByText('No one waiting')).toBeInTheDocument();
    });

    it('uses hasFilters=false by default', () => {
      render(<FrontDeskEmptyState section="waitList" />);
      expect(screen.getByText('No one waiting')).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });
  });

  describe('custom content', () => {
    it('uses custom title when provided', () => {
      render(<FrontDeskEmptyState section="waitList" title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('No one waiting')).not.toBeInTheDocument();
    });

    it('uses custom description when provided', () => {
      render(<FrontDeskEmptyState section="waitList" description="Custom description" />);
      expect(screen.getByText('Custom description')).toBeInTheDocument();
      expect(screen.queryByText('New walk-ins will appear here')).not.toBeInTheDocument();
    });

    it('uses custom icon when provided', () => {
      const { container } = render(
        <FrontDeskEmptyState section="waitList" icon={Users} />
      );
      const usersIcon = container.querySelector('.lucide-users');
      expect(usersIcon).toBeInTheDocument();
    });

    it('custom title overrides filter title', () => {
      render(<FrontDeskEmptyState section="waitList" hasFilters={true} title="Override" />);
      expect(screen.getByText('Override')).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('centers content', () => {
      const { container } = render(<FrontDeskEmptyState section="waitList" />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).toHaveClass('items-center');
      expect(wrapper).toHaveClass('justify-center');
    });

    it('title is styled as heading', () => {
      render(<FrontDeskEmptyState section="waitList" />);
      const title = screen.getByText('No one waiting');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg');
      expect(title).toHaveClass('font-medium');
    });

    it('description is styled as paragraph', () => {
      render(<FrontDeskEmptyState section="waitList" />);
      const description = screen.getByText('New walk-ins will appear here');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('text-sm');
      expect(description).toHaveClass('text-gray-500');
    });

    it('icon container has rounded background', () => {
      const { container } = render(<FrontDeskEmptyState section="waitList" />);
      const iconContainer = container.querySelector('.rounded-full');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('p-3');
    });
  });

  describe('section-specific styling', () => {
    it('waitList has correct icon colors', () => {
      const { container } = render(<FrontDeskEmptyState section="waitList" />);
      const iconContainer = container.querySelector('.bg-waitList-50');
      expect(iconContainer).toBeInTheDocument();
    });

    it('service has correct icon colors', () => {
      const { container } = render(<FrontDeskEmptyState section="service" />);
      const iconContainer = container.querySelector('.bg-service-50');
      expect(iconContainer).toBeInTheDocument();
    });

    it('pending has correct icon colors', () => {
      const { container } = render(<FrontDeskEmptyState section="pending" />);
      const iconContainer = container.querySelector('.bg-pendingTickets-50');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('waitList uses Hourglass icon', () => {
      const { container } = render(<FrontDeskEmptyState section="waitList" />);
      const icon = container.querySelector('.lucide-hourglass');
      expect(icon).toBeInTheDocument();
    });

    it('service uses Activity icon', () => {
      const { container } = render(<FrontDeskEmptyState section="service" />);
      const icon = container.querySelector('.lucide-activity');
      expect(icon).toBeInTheDocument();
    });

    it('pending uses CreditCard icon', () => {
      const { container } = render(<FrontDeskEmptyState section="pending" />);
      const icon = container.querySelector('.lucide-credit-card');
      expect(icon).toBeInTheDocument();
    });

    it('closed uses Receipt icon', () => {
      const { container } = render(<FrontDeskEmptyState section="closed" />);
      const icon = container.querySelector('.lucide-receipt');
      expect(icon).toBeInTheDocument();
    });

    it('comingAppointments uses Clock icon', () => {
      const { container } = render(<FrontDeskEmptyState section="comingAppointments" />);
      const icon = container.querySelector('.lucide-clock');
      expect(icon).toBeInTheDocument();
    });
  });
});

describe('TicketCardSkeleton', () => {
  describe('viewMode variants', () => {
    it('renders normal view by default', () => {
      const { container } = render(<TicketCardSkeleton />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('flex');
      expect(skeleton).toHaveClass('items-center');
    });

    it('renders compact view', () => {
      const { container } = render(<TicketCardSkeleton viewMode="compact" />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('flex');
      // Compact has smaller height (h-8 vs h-12 for status strip)
      const statusStrip = container.querySelector('.h-8');
      expect(statusStrip).toBeInTheDocument();
    });

    it('renders grid-normal view', () => {
      const { container } = render(<TicketCardSkeleton viewMode="grid-normal" />);
      const skeleton = container.firstChild;
      expect(skeleton).toHaveClass('flex-col');
      expect(skeleton).toHaveClass('h-\\[160px\\]');
    });

    it('renders grid-compact view', () => {
      const { container } = render(<TicketCardSkeleton viewMode="grid-compact" />);
      const skeleton = container.firstChild;
      // Grid compact is same as compact layout
      expect(skeleton).toHaveClass('flex');
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<TicketCardSkeleton />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label', () => {
      render(<TicketCardSkeleton />);
      expect(screen.getByLabelText('Loading ticket')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has white background', () => {
      const { container } = render(<TicketCardSkeleton />);
      expect(container.firstChild).toHaveClass('bg-white');
    });

    it('has rounded corners', () => {
      const { container } = render(<TicketCardSkeleton />);
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('has border', () => {
      const { container } = render(<TicketCardSkeleton />);
      expect(container.firstChild).toHaveClass('border');
    });

    it('skeleton elements have pulse animation', () => {
      const { container } = render(<TicketCardSkeleton />);
      const animatedElements = container.querySelectorAll('.animate-pulse');
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});

describe('TicketCardSkeletonGrid', () => {
  describe('count prop', () => {
    it('renders 4 skeletons by default', () => {
      render(<TicketCardSkeletonGrid />);
      const skeletons = screen.getAllByRole('status');
      // 1 for the grid container + 4 for the skeleton cards
      expect(skeletons.length).toBe(5);
    });

    it('renders specified count of skeletons', () => {
      render(<TicketCardSkeletonGrid count={6} />);
      const skeletons = screen.getAllByRole('status');
      // 1 for grid + 6 for cards
      expect(skeletons.length).toBe(7);
    });

    it('renders 1 skeleton when count is 1', () => {
      render(<TicketCardSkeletonGrid count={1} />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBe(2);
    });
  });

  describe('viewMode', () => {
    it('uses normal viewMode by default', () => {
      const { container } = render(<TicketCardSkeletonGrid />);
      expect(container.firstChild).toHaveClass('space-y-2');
    });

    it('applies grid layout for grid-normal viewMode', () => {
      const { container } = render(<TicketCardSkeletonGrid viewMode="grid-normal" />);
      expect(container.firstChild).toHaveClass('grid');
      expect(container.firstChild).toHaveClass('gap-3');
    });

    it('applies grid columns for grid-compact viewMode', () => {
      const { container } = render(<TicketCardSkeletonGrid viewMode="grid-compact" />);
      expect(container.firstChild).toHaveClass('grid-cols-2');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(
        <TicketCardSkeletonGrid className="custom-grid-class" />
      );
      expect(container.firstChild).toHaveClass('custom-grid-class');
    });
  });

  describe('accessibility', () => {
    it('grid container has role="status"', () => {
      const { container } = render(<TicketCardSkeletonGrid />);
      const grid = container.firstChild;
      expect(grid).toHaveAttribute('role', 'status');
    });

    it('grid container has aria-label', () => {
      const { container } = render(<TicketCardSkeletonGrid />);
      const grid = container.firstChild;
      expect(grid).toHaveAttribute('aria-label', 'Loading tickets');
    });
  });
});

describe('SectionSkeleton', () => {
  describe('header', () => {
    it('renders header section', () => {
      const { container } = render(<SectionSkeleton />);
      const header = container.querySelector('.bg-gray-50');
      expect(header).toBeInTheDocument();
    });

    it('uses default header height of 64px', () => {
      const { container } = render(<SectionSkeleton />);
      const header = container.querySelector('.bg-gray-50') as HTMLElement;
      expect(header.style.height).toBe('64px');
    });

    it('uses custom header height', () => {
      const { container } = render(<SectionSkeleton headerHeight={80} />);
      const header = container.querySelector('.bg-gray-50') as HTMLElement;
      expect(header.style.height).toBe('80px');
    });
  });

  describe('content', () => {
    it('renders ticket skeletons', () => {
      render(<SectionSkeleton />);
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(1);
    });

    it('uses default ticket count of 4', () => {
      render(<SectionSkeleton />);
      // 1 section + 1 grid + 4 cards = 6
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBe(6);
    });

    it('uses custom ticket count', () => {
      render(<SectionSkeleton ticketCount={2} />);
      // 1 section + 1 grid + 2 cards = 4
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBe(4);
    });
  });

  describe('viewMode', () => {
    it('uses normal viewMode by default', () => {
      const { container } = render(<SectionSkeleton />);
      const grid = container.querySelector('.space-y-2');
      expect(grid).toBeInTheDocument();
    });

    it('passes viewMode to TicketCardSkeletonGrid', () => {
      const { container } = render(<SectionSkeleton viewMode="grid-normal" />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="status"', () => {
      const { container } = render(<SectionSkeleton />);
      const section = container.firstChild;
      expect(section).toHaveAttribute('role', 'status');
    });

    it('has aria-label', () => {
      const { container } = render(<SectionSkeleton />);
      const section = container.firstChild;
      expect(section).toHaveAttribute('aria-label', 'Loading section');
    });
  });

  describe('styling', () => {
    it('fills height', () => {
      const { container } = render(<SectionSkeleton />);
      expect(container.firstChild).toHaveClass('h-full');
    });

    it('uses flex column layout', () => {
      const { container } = render(<SectionSkeleton />);
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('flex-col');
    });

    it('content area has padding', () => {
      const { container } = render(<SectionSkeleton />);
      const content = container.querySelector('.p-4');
      expect(content).toBeInTheDocument();
    });

    it('content area can overflow', () => {
      const { container } = render(<SectionSkeleton />);
      const content = container.querySelector('.overflow-hidden');
      expect(content).toBeInTheDocument();
    });
  });
});
