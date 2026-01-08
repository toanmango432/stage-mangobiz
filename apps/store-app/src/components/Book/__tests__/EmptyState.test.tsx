/**
 * EmptyState Component Tests
 * Tests for Book module empty state display variants
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';
import { Plus, Search } from 'lucide-react';

describe('EmptyState', () => {
  describe('basic rendering', () => {
    it('renders container element', () => {
      const { container } = render(<EmptyState />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has centered layout', () => {
      const { container } = render(<EmptyState />);
      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('items-center');
      expect(container.firstChild).toHaveClass('justify-center');
    });

    it('has vertical padding', () => {
      const { container } = render(<EmptyState />);
      expect(container.firstChild).toHaveClass('py-12');
    });

    it('has horizontal padding', () => {
      const { container } = render(<EmptyState />);
      expect(container.firstChild).toHaveClass('px-4');
    });
  });

  describe('calendar type (default)', () => {
    it('displays calendar title by default', () => {
      render(<EmptyState />);
      expect(screen.getByText('No appointments scheduled')).toBeInTheDocument();
    });

    it('displays calendar description by default', () => {
      render(<EmptyState />);
      expect(screen.getByText('Click any time slot to add an appointment or use the button below')).toBeInTheDocument();
    });

    it('renders Calendar icon by default', () => {
      const { container } = render(<EmptyState />);
      const icon = container.querySelector('.lucide-calendar');
      expect(icon).toBeInTheDocument();
    });

    it('explicitly uses calendar type', () => {
      render(<EmptyState type="calendar" />);
      expect(screen.getByText('No appointments scheduled')).toBeInTheDocument();
    });
  });

  describe('walkins type', () => {
    it('displays walkins title', () => {
      render(<EmptyState type="walkins" />);
      expect(screen.getByText('No walk-ins at the moment')).toBeInTheDocument();
    });

    it('displays walkins description', () => {
      render(<EmptyState type="walkins" />);
      expect(screen.getByText('Walk-in clients will appear here when they arrive')).toBeInTheDocument();
    });

    it('renders Users icon for walkins', () => {
      const { container } = render(<EmptyState type="walkins" />);
      const icon = container.querySelector('.lucide-users');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('search type', () => {
    it('displays search title', () => {
      render(<EmptyState type="search" />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('displays search description', () => {
      render(<EmptyState type="search" />);
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });

    it('renders Clock icon for search', () => {
      const { container } = render(<EmptyState type="search" />);
      const icon = container.querySelector('.lucide-clock');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('custom title', () => {
    it('overrides default title', () => {
      render(<EmptyState title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('No appointments scheduled')).not.toBeInTheDocument();
    });

    it('uses custom title with any type', () => {
      render(<EmptyState type="search" title="Nothing here" />);
      expect(screen.getByText('Nothing here')).toBeInTheDocument();
      expect(screen.queryByText('No results found')).not.toBeInTheDocument();
    });
  });

  describe('custom description', () => {
    it('overrides default description', () => {
      render(<EmptyState description="Custom description text" />);
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('uses custom description with any type', () => {
      render(<EmptyState type="walkins" description="No visitors yet" />);
      expect(screen.getByText('No visitors yet')).toBeInTheDocument();
      expect(screen.queryByText('Walk-in clients will appear here when they arrive')).not.toBeInTheDocument();
    });
  });

  describe('custom icon', () => {
    it('overrides default icon', () => {
      const { container } = render(<EmptyState icon={Search} />);
      const searchIcon = container.querySelector('.lucide-search');
      expect(searchIcon).toBeInTheDocument();
    });

    it('does not render default icon when custom icon provided', () => {
      const { container } = render(<EmptyState icon={Search} />);
      const calendarIcon = container.querySelector('.lucide-calendar');
      expect(calendarIcon).not.toBeInTheDocument();
    });

    it('uses custom icon with specific type', () => {
      const { container } = render(<EmptyState type="walkins" icon={Search} />);
      const searchIcon = container.querySelector('.lucide-search');
      const usersIcon = container.querySelector('.lucide-users');
      expect(searchIcon).toBeInTheDocument();
      expect(usersIcon).not.toBeInTheDocument();
    });
  });

  describe('action button', () => {
    it('renders action button when provided', () => {
      const handleClick = vi.fn();
      render(
        <EmptyState
          action={{
            label: 'Add Appointment',
            onClick: handleClick,
          }}
        />
      );
      expect(screen.getByText('Add Appointment')).toBeInTheDocument();
    });

    it('calls onClick when action button clicked', () => {
      const handleClick = vi.fn();
      render(
        <EmptyState
          action={{
            label: 'Add Appointment',
            onClick: handleClick,
          }}
        />
      );

      fireEvent.click(screen.getByText('Add Appointment'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders action button with icon', () => {
      const { container } = render(
        <EmptyState
          action={{
            label: 'Add New',
            onClick: vi.fn(),
            icon: Plus,
          }}
        />
      );
      const plusIcon = container.querySelector('.lucide-plus');
      expect(plusIcon).toBeInTheDocument();
    });

    it('does not render action button when not provided', () => {
      render(<EmptyState />);
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    });

    it('renders action button after text content', () => {
      const { container } = render(
        <EmptyState
          action={{
            label: 'Click Me',
            onClick: vi.fn(),
          }}
        />
      );
      const button = screen.getByText('Click Me');
      const buttonContainer = button.closest('.pt-2');
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('icon container styling', () => {
    it('has circular icon container', () => {
      const { container } = render(<EmptyState />);
      const iconContainer = container.querySelector('.rounded-full.bg-gray-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('icon container has fixed dimensions', () => {
      const { container } = render(<EmptyState />);
      const iconContainer = container.querySelector('.w-16.h-16');
      expect(iconContainer).toBeInTheDocument();
    });

    it('icon container centers icon', () => {
      const { container } = render(<EmptyState />);
      const iconContainer = container.querySelector('.flex.items-center.justify-center');
      expect(iconContainer).toBeInTheDocument();
    });

    it('icon has correct size', () => {
      const { container } = render(<EmptyState />);
      const icon = container.querySelector('.w-8.h-8');
      expect(icon).toBeInTheDocument();
    });

    it('icon has gray color', () => {
      const { container } = render(<EmptyState />);
      const icon = container.querySelector('.text-gray-400');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('text styling', () => {
    it('title has large font size', () => {
      render(<EmptyState />);
      const title = screen.getByText('No appointments scheduled');
      expect(title).toHaveClass('text-lg');
    });

    it('title has semibold font', () => {
      render(<EmptyState />);
      const title = screen.getByText('No appointments scheduled');
      expect(title).toHaveClass('font-semibold');
    });

    it('title has dark text color', () => {
      render(<EmptyState />);
      const title = screen.getByText('No appointments scheduled');
      expect(title).toHaveClass('text-gray-900');
    });

    it('description has small font size', () => {
      render(<EmptyState />);
      const description = screen.getByText(/Click any time slot/);
      expect(description).toHaveClass('text-sm');
    });

    it('description has gray text color', () => {
      render(<EmptyState />);
      const description = screen.getByText(/Click any time slot/);
      expect(description).toHaveClass('text-gray-500');
    });

    it('description has relaxed line height', () => {
      render(<EmptyState />);
      const description = screen.getByText(/Click any time slot/);
      expect(description).toHaveClass('leading-relaxed');
    });
  });

  describe('container max width', () => {
    it('has max-w-md for text container', () => {
      const { container } = render(<EmptyState />);
      const textContainer = container.querySelector('.max-w-md');
      expect(textContainer).toBeInTheDocument();
    });

    it('text is centered', () => {
      const { container } = render(<EmptyState />);
      const textContainer = container.querySelector('.text-center');
      expect(textContainer).toBeInTheDocument();
    });
  });

  describe('spacing', () => {
    it('has space-y-4 between elements', () => {
      const { container } = render(<EmptyState />);
      const spacedContainer = container.querySelector('.space-y-4');
      expect(spacedContainer).toBeInTheDocument();
    });

    it('has space-y-2 between title and description', () => {
      const { container } = render(<EmptyState />);
      const textSpacing = container.querySelector('.space-y-2');
      expect(textSpacing).toBeInTheDocument();
    });
  });

  describe('all types combined', () => {
    it('all three types have unique content', () => {
      const { rerender } = render(<EmptyState type="calendar" />);
      const calendarTitle = screen.getByRole('heading', { level: 3 });
      expect(calendarTitle).toHaveTextContent('No appointments scheduled');

      rerender(<EmptyState type="walkins" />);
      const walkinsTitle = screen.getByRole('heading', { level: 3 });
      expect(walkinsTitle).toHaveTextContent('No walk-ins at the moment');

      rerender(<EmptyState type="search" />);
      const searchTitle = screen.getByRole('heading', { level: 3 });
      expect(searchTitle).toHaveTextContent('No results found');
    });
  });

  describe('complete customization', () => {
    it('accepts all custom props together', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <EmptyState
          type="search"
          title="Custom Title"
          description="Custom Description"
          icon={Plus}
          action={{
            label: 'Custom Action',
            onClick: handleClick,
            icon: Search,
          }}
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
      expect(container.querySelector('.lucide-plus')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
  });
});
