/**
 * ClientPreviewPopover Component Tests
 * Tests for client preview card with quick actions
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClientPreviewPopover } from '../ClientPreviewPopover';

// Mock Tippy to render content directly
vi.mock('@tippyjs/react', () => ({
  default: ({ children, content }: { children: React.ReactElement; content: React.ReactNode }) => (
    <div data-testid="tippy-wrapper">
      {children}
      <div data-testid="tippy-content">{content}</div>
    </div>
  ),
}));

describe('ClientPreviewPopover', () => {
  const mockClient = {
    id: 'client-1',
    name: 'John Doe',
    phone: '555-123-4567',
    email: 'john@example.com',
    totalVisits: 15,
    lastVisit: new Date(2026, 0, 10, 10, 0, 0), // 5 days before system time
    upcomingAppointments: 2,
    favoriteServices: ['Haircut', 'Beard Trim'],
    notes: 'Prefers short styles. Allergic to certain products.',
  };

  const defaultProps = {
    client: mockClient,
    children: <button data-testid="trigger">Click me</button>,
    onCall: vi.fn(),
    onSms: vi.fn(),
    onViewProfile: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0)); // Wed Jan 15, 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic rendering', () => {
    it('renders trigger element', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByTestId('trigger')).toBeInTheDocument();
    });

    it('renders popover content', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByTestId('tippy-content')).toBeInTheDocument();
    });

    it('renders client name', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders client email', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  describe('avatar/initials', () => {
    it('shows initials when no photo', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('shows correct initials for single name', () => {
      const client = { ...mockClient, name: 'Prince' };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('PR')).toBeInTheDocument();
    });

    it('shows correct initials for multi-part name', () => {
      const client = { ...mockClient, name: 'Mary Jane Watson' };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('MW')).toBeInTheDocument();
    });

    it('shows ? for empty name', () => {
      const client = { ...mockClient, name: '' };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('renders photo when provided', () => {
      const client = { ...mockClient, photo: 'https://example.com/photo.jpg' };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      const img = screen.getByAltText('John Doe');
      expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });
  });

  describe('stats section', () => {
    it('shows total visits', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Total Visits')).toBeInTheDocument();
    });

    it('shows 0 visits when undefined', () => {
      const client = { ...mockClient, totalVisits: undefined };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('shows Last Visit label', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('Last Visit')).toBeInTheDocument();
    });

    it('shows "Today" for today visit', () => {
      const client = { ...mockClient, lastVisit: new Date(2026, 0, 15, 10, 0, 0) };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('shows "Yesterday" for yesterday visit', () => {
      const client = { ...mockClient, lastVisit: new Date(2026, 0, 14, 10, 0, 0) };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('shows days ago for recent visits', () => {
      const client = { ...mockClient, lastVisit: new Date(2026, 0, 10, 10, 0, 0) }; // 5 days ago
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('5 days ago')).toBeInTheDocument();
    });

    it('shows weeks ago for older visits', () => {
      const client = { ...mockClient, lastVisit: new Date(2025, 11, 25, 10, 0, 0) }; // ~3 weeks ago
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('3 weeks ago')).toBeInTheDocument();
    });

    it('shows months ago for older visits', () => {
      const client = { ...mockClient, lastVisit: new Date(2025, 10, 15, 10, 0, 0) }; // ~2 months ago
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('2 months ago')).toBeInTheDocument();
    });

    it('shows "Never" when no last visit', () => {
      const client = { ...mockClient, lastVisit: undefined };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('Never')).toBeInTheDocument();
    });
  });

  describe('upcoming appointments', () => {
    it('shows upcoming appointments count', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('2 upcoming appointments')).toBeInTheDocument();
    });

    it('shows singular "appointment" for 1', () => {
      const client = { ...mockClient, upcomingAppointments: 1 };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('1 upcoming appointment')).toBeInTheDocument();
    });

    it('does not show upcoming when 0', () => {
      const client = { ...mockClient, upcomingAppointments: 0 };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.queryByText(/upcoming/)).not.toBeInTheDocument();
    });

    it('does not show upcoming when undefined', () => {
      const client = { ...mockClient, upcomingAppointments: undefined };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.queryByText(/upcoming/)).not.toBeInTheDocument();
    });
  });

  describe('favorite services', () => {
    it('shows favorite services section', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('Favorite Services')).toBeInTheDocument();
    });

    it('shows service names', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('Haircut')).toBeInTheDocument();
      expect(screen.getByText('Beard Trim')).toBeInTheDocument();
    });

    it('shows max 3 services', () => {
      const client = {
        ...mockClient,
        favoriteServices: ['Service A', 'Service B', 'Service C', 'Service D'],
      };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);

      expect(screen.getByText('Service A')).toBeInTheDocument();
      expect(screen.getByText('Service B')).toBeInTheDocument();
      expect(screen.getByText('Service C')).toBeInTheDocument();
      expect(screen.queryByText('Service D')).not.toBeInTheDocument();
      expect(screen.getByText('+1 more')).toBeInTheDocument();
    });

    it('shows correct "+X more" count', () => {
      const client = {
        ...mockClient,
        favoriteServices: ['A', 'B', 'C', 'D', 'E'],
      };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('does not show favorites when empty', () => {
      const client = { ...mockClient, favoriteServices: [] };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.queryByText('Favorite Services')).not.toBeInTheDocument();
    });

    it('does not show favorites when undefined', () => {
      const client = { ...mockClient, favoriteServices: undefined };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.queryByText('Favorite Services')).not.toBeInTheDocument();
    });
  });

  describe('notes section', () => {
    it('shows notes', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('Prefers short styles. Allergic to certain products.')).toBeInTheDocument();
    });

    it('does not show notes section when no notes', () => {
      const client = { ...mockClient, notes: undefined };
      const { container } = render(<ClientPreviewPopover {...defaultProps} client={client} />);
      const notesBox = container.querySelector('.bg-amber-50');
      expect(notesBox).not.toBeInTheDocument();
    });

    it('notes have amber styling', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const notesBox = container.querySelector('.bg-amber-50.border-amber-200');
      expect(notesBox).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('shows Call button when phone and onCall provided', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('Call')).toBeInTheDocument();
    });

    it('shows SMS button when phone and onSms provided', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('SMS')).toBeInTheDocument();
    });

    it('shows Profile button when onViewProfile provided', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('hides Call button when no phone', () => {
      const client = { ...mockClient, phone: undefined };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.queryByText('Call')).not.toBeInTheDocument();
    });

    it('hides SMS button when no phone', () => {
      const client = { ...mockClient, phone: undefined };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.queryByText('SMS')).not.toBeInTheDocument();
    });

    it('hides Call button when no onCall handler', () => {
      render(<ClientPreviewPopover {...defaultProps} onCall={undefined} />);
      expect(screen.queryByText('Call')).not.toBeInTheDocument();
    });

    it('hides SMS button when no onSms handler', () => {
      render(<ClientPreviewPopover {...defaultProps} onSms={undefined} />);
      expect(screen.queryByText('SMS')).not.toBeInTheDocument();
    });

    it('hides Profile button when no onViewProfile handler', () => {
      render(<ClientPreviewPopover {...defaultProps} onViewProfile={undefined} />);
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    });
  });

  describe('click handlers', () => {
    it('calls onCall with phone when Call clicked', () => {
      const onCall = vi.fn();
      render(<ClientPreviewPopover {...defaultProps} onCall={onCall} />);

      fireEvent.click(screen.getByText('Call'));

      expect(onCall).toHaveBeenCalledWith('555-123-4567');
    });

    it('calls onSms with phone when SMS clicked', () => {
      const onSms = vi.fn();
      render(<ClientPreviewPopover {...defaultProps} onSms={onSms} />);

      fireEvent.click(screen.getByText('SMS'));

      expect(onSms).toHaveBeenCalledWith('555-123-4567');
    });

    it('calls onViewProfile with client id when Profile clicked', () => {
      const onViewProfile = vi.fn();
      render(<ClientPreviewPopover {...defaultProps} onViewProfile={onViewProfile} />);

      fireEvent.click(screen.getByText('Profile'));

      expect(onViewProfile).toHaveBeenCalledWith('client-1');
    });
  });

  describe('styling', () => {
    it('popover has fixed width', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const popover = container.querySelector('.w-80');
      expect(popover).toBeInTheDocument();
    });

    it('header has brand gradient', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const header = container.querySelector('.bg-gradient-to-r.from-brand-500.to-brand-600');
      expect(header).toBeInTheDocument();
    });

    it('stats have gray background', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const statBox = container.querySelector('.bg-gray-50.rounded-lg');
      expect(statBox).toBeInTheDocument();
    });

    it('upcoming appointments have blue styling', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const upcomingBox = container.querySelector('.bg-blue-50.border-blue-200');
      expect(upcomingBox).toBeInTheDocument();
    });

    it('favorite services have pink styling', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const serviceBadge = container.querySelector('.bg-pink-50.text-pink-700');
      expect(serviceBadge).toBeInTheDocument();
    });

    it('action buttons have active scale', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const button = container.querySelector('.active\\:scale-95');
      expect(button).toBeInTheDocument();
    });

    it('Profile button has brand styling', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const profileButton = container.querySelector('.bg-brand-500');
      expect(profileButton).toBeInTheDocument();
    });

    it('action footer has gray background', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const footer = container.querySelector('.border-t.border-gray-200.bg-gray-50');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('shows calendar icon in stats', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const calendarIcon = container.querySelector('svg.lucide-calendar');
      expect(calendarIcon).toBeInTheDocument();
    });

    it('shows clock icon in stats', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const clockIcon = container.querySelector('svg.lucide-clock');
      expect(clockIcon).toBeInTheDocument();
    });

    it('shows heart icon for favorites', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const heartIcon = container.querySelector('svg.lucide-heart');
      expect(heartIcon).toBeInTheDocument();
    });

    it('shows phone icon in Call button', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const phoneIcon = container.querySelector('svg.lucide-phone');
      expect(phoneIcon).toBeInTheDocument();
    });

    it('shows message icon in SMS button', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const messageIcon = container.querySelector('svg.lucide-message-square');
      expect(messageIcon).toBeInTheDocument();
    });

    it('shows user icon in Profile button', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const userIcon = container.querySelector('svg.lucide-user');
      expect(userIcon).toBeInTheDocument();
    });
  });

  describe('no email', () => {
    it('does not show email when undefined', () => {
      const client = { ...mockClient, email: undefined };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.queryByText('john@example.com')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('action buttons are focusable', () => {
      render(<ClientPreviewPopover {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      // Should have trigger + Call + SMS + Profile = 4 buttons
      expect(buttons.length).toBe(4);
    });

    it('buttons have focus ring styling', () => {
      const { container } = render(<ClientPreviewPopover {...defaultProps} />);
      const focusButton = container.querySelector('.focus\\:ring-2.focus\\:ring-brand-500');
      expect(focusButton).toBeInTheDocument();
    });

    it('photo has alt text', () => {
      const client = { ...mockClient, photo: 'https://example.com/photo.jpg' };
      render(<ClientPreviewPopover {...defaultProps} client={client} />);
      expect(screen.getByAltText('John Doe')).toBeInTheDocument();
    });
  });
});
