/**
 * QuickBookBar Component Tests
 * Tests for floating client search with quick booking
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QuickBookBar } from '../QuickBookBar';

// Mock useDebounce hook
vi.mock('../../../hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

describe('QuickBookBar', () => {
  const mockClient = {
    id: 'client-1',
    firstName: 'John',
    lastName: 'Doe',
    phone: '5551234567',
    email: 'john@example.com',
    lastVisit: new Date(2026, 0, 10),
    totalVisits: 5,
    preferredServices: ['Haircut'],
    averageSpend: 45,
  };

  const mockVipClient = {
    ...mockClient,
    id: 'client-2',
    firstName: 'Jane',
    lastName: 'Smith',
    totalVisits: 15,
    averageSpend: 85,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onClientSelect: vi.fn(),
    onWalkIn: vi.fn(),
    recentClients: [],
    onSearch: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('visibility', () => {
    it('renders when isOpen is true', () => {
      render(<QuickBookBar {...defaultProps} isOpen={true} />);
      expect(screen.getByPlaceholderText('Search client by name or phone...')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<QuickBookBar {...defaultProps} isOpen={false} />);
      expect(screen.queryByPlaceholderText('Search client by name or phone...')).not.toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('renders search input', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search client by name or phone...')).toBeInTheDocument();
    });

    it('shows search icon', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const searchIcon = container.querySelector('svg.lucide-search');
      expect(searchIcon).toBeInTheDocument();
    });

    it('updates query on input', () => {
      render(<QuickBookBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search client by name or phone...');

      fireEvent.change(input, { target: { value: 'John' } });

      expect(input).toHaveValue('John');
    });

    it('shows clear button when query has value', () => {
      render(<QuickBookBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search client by name or phone...');

      fireEvent.change(input, { target: { value: 'John' } });

      const clearButton = screen.getByRole('button', { name: '' });
      expect(clearButton).toBeInTheDocument();
    });

    it('clears query when clear button clicked', () => {
      render(<QuickBookBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search client by name or phone...');

      fireEvent.change(input, { target: { value: 'John' } });

      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find(btn => btn.querySelector('svg.lucide-x'));
      if (clearButton) {
        fireEvent.click(clearButton);
      }

      expect(input).toHaveValue('');
    });

    it('shows ESC hint', () => {
      render(<QuickBookBar {...defaultProps} />);
      // ESC appears in both header and footer
      const escHints = screen.getAllByText('ESC');
      expect(escHints.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('backdrop', () => {
    it('renders backdrop', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/20');
      expect(backdrop).toBeInTheDocument();
    });

    it('calls onClose when backdrop clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<QuickBookBar {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/20');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('walk-in option', () => {
    it('shows walk-in option when no query', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByText('Walk-in Customer')).toBeInTheDocument();
    });

    it('shows walk-in description', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByText('Quick booking without client search')).toBeInTheDocument();
    });

    it('shows Quick Actions header', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('calls onWalkIn when walk-in clicked', () => {
      const onWalkIn = vi.fn();
      render(<QuickBookBar {...defaultProps} onWalkIn={onWalkIn} />);

      fireEvent.click(screen.getByText('Walk-in Customer'));

      expect(onWalkIn).toHaveBeenCalled();
    });

    it('shows sparkles icon', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const sparklesIcon = container.querySelector('svg.lucide-sparkles');
      expect(sparklesIcon).toBeInTheDocument();
    });
  });

  describe('recent clients', () => {
    it('shows recent clients section', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      expect(screen.getByText('Recent Clients')).toBeInTheDocument();
    });

    it('shows recent client name', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('shows recent client phone formatted', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });

    it('shows client initials', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('shows trending up icon', () => {
      const { container } = render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      const trendingIcon = container.querySelector('svg.lucide-trending-up');
      expect(trendingIcon).toBeInTheDocument();
    });

    it('shows preferred services', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      expect(screen.getByText('Haircut')).toBeInTheDocument();
    });

    it('calls onClientSelect when recent client clicked', () => {
      const onClientSelect = vi.fn();
      render(
        <QuickBookBar {...defaultProps} recentClients={[mockClient]} onClientSelect={onClientSelect} />
      );

      fireEvent.click(screen.getByText('John Doe'));

      expect(onClientSelect).toHaveBeenCalledWith(mockClient);
    });

    it('does not show recent clients when empty', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[]} />);
      expect(screen.queryByText('Recent Clients')).not.toBeInTheDocument();
    });

    it('hides recent clients when searching', async () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      const input = screen.getByPlaceholderText('Search client by name or phone...');

      fireEvent.change(input, { target: { value: 'test' } });

      expect(screen.queryByText('Recent Clients')).not.toBeInTheDocument();
    });
  });

  describe('search results', () => {
    it('shows search results header', async () => {
      const onSearch = vi.fn().mockResolvedValue([mockClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });
    });

    it('shows search result client name', async () => {
      const onSearch = vi.fn().mockResolvedValue([mockClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('shows VIP badge for high-visit clients', async () => {
      const onSearch = vi.fn().mockResolvedValue([mockVipClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'Jane' },
      });

      await waitFor(() => {
        expect(screen.getByText('VIP')).toBeInTheDocument();
      });
    });

    it('does not show VIP badge for regular clients', async () => {
      const onSearch = vi.fn().mockResolvedValue([mockClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.queryByText('VIP')).not.toBeInTheDocument();
    });

    it('shows client phone in results', async () => {
      const onSearch = vi.fn().mockResolvedValue([mockClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      });
    });

    it('shows average spend', async () => {
      const onSearch = vi.fn().mockResolvedValue([mockClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('$45 avg')).toBeInTheDocument();
      });
    });

    it('shows visit count', async () => {
      const onSearch = vi.fn().mockResolvedValue([mockClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('5 visits')).toBeInTheDocument();
      });
    });

    it('calls onClientSelect when result clicked', async () => {
      const onClientSelect = vi.fn();
      const onSearch = vi.fn().mockResolvedValue([mockClient]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} onClientSelect={onClientSelect} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('John Doe'));

      expect(onClientSelect).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('no results', () => {
    it('shows no results message', async () => {
      const onSearch = vi.fn().mockResolvedValue([]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'nonexistent' },
      });

      await waitFor(() => {
        expect(screen.getByText('No clients found')).toBeInTheDocument();
      });
    });

    it('shows suggestion message', async () => {
      const onSearch = vi.fn().mockResolvedValue([]);
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'nonexistent' },
      });

      await waitFor(() => {
        expect(screen.getByText('Try a different search or create a new client')).toBeInTheDocument();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading spinner while searching', async () => {
      const onSearch = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 500))
      );
      const { container } = render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      // Wait for loading to appear
      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });

    it('shows "Searching..." text while loading', async () => {
      const onSearch = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 500))
      );
      render(<QuickBookBar {...defaultProps} onSearch={onSearch} />);

      fireEvent.change(screen.getByPlaceholderText('Search client by name or phone...'), {
        target: { value: 'John' },
      });

      await waitFor(() => {
        expect(screen.getByText('Searching...')).toBeInTheDocument();
      });
    });
  });

  describe('keyboard navigation', () => {
    it('closes on Escape key', () => {
      const onClose = vi.fn();
      render(<QuickBookBar {...defaultProps} onClose={onClose} />);

      const input = screen.getByPlaceholderText('Search client by name or phone...');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onWalkIn on Enter when no query and walk-in selected', () => {
      const onWalkIn = vi.fn();
      render(<QuickBookBar {...defaultProps} onWalkIn={onWalkIn} />);

      const input = screen.getByPlaceholderText('Search client by name or phone...');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onWalkIn).toHaveBeenCalled();
    });

    it('ArrowDown changes selection', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);

      const input = screen.getByPlaceholderText('Search client by name or phone...');
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // Selection moved to recent client
      const recentClientButton = screen.getByText('John Doe').closest('button');
      expect(recentClientButton).toHaveClass('bg-brand-50');
    });

    it('ArrowUp changes selection', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);

      const input = screen.getByPlaceholderText('Search client by name or phone...');
      // Move to last item (wrap around)
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      // Should wrap to recent client
      const recentClientButton = screen.getByText('John Doe').closest('button');
      expect(recentClientButton).toHaveClass('bg-brand-50');
    });
  });

  describe('footer hints', () => {
    it('shows navigate hint', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByText('Navigate')).toBeInTheDocument();
    });

    it('shows select hint', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('shows close hint', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('shows CMD+K to open hint', () => {
      render(<QuickBookBar {...defaultProps} />);
      expect(screen.getByText('to open')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has fixed positioning', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const searchBar = container.querySelector('.fixed.top-0.left-0.right-0');
      expect(searchBar).toBeInTheDocument();
    });

    it('has high z-index', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const searchBar = container.querySelector('.z-50');
      expect(searchBar).toBeInTheDocument();
    });

    it('has rounded container', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const card = container.querySelector('.rounded-2xl');
      expect(card).toBeInTheDocument();
    });

    it('has shadow styling', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const card = container.querySelector('.shadow-2xl');
      expect(card).toBeInTheDocument();
    });

    it('has max-width constraint', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const maxWidthContainer = container.querySelector('.max-w-3xl');
      expect(maxWidthContainer).toBeInTheDocument();
    });

    it('result row has hover state', () => {
      const { container } = render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      const hoverButton = container.querySelector('.hover\\:bg-brand-50');
      expect(hoverButton).toBeInTheDocument();
    });

    it('walk-in has orange hover', () => {
      const { container } = render(<QuickBookBar {...defaultProps} />);
      const walkInButton = container.querySelector('.hover\\:bg-orange-50');
      expect(walkInButton).toBeInTheDocument();
    });
  });

  describe('phone formatting', () => {
    it('formats 10-digit phone correctly', () => {
      render(<QuickBookBar {...defaultProps} recentClients={[mockClient]} />);
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });

    it('displays unformatted phone if not 10 digits', () => {
      const clientWithShortPhone = { ...mockClient, phone: '12345' };
      render(<QuickBookBar {...defaultProps} recentClients={[clientWithShortPhone]} />);
      expect(screen.getByText('12345')).toBeInTheDocument();
    });
  });

  describe('keyboard shortcuts', () => {
    it('focuses input on CMD+K when open', () => {
      render(<QuickBookBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search client by name or phone...');

      act(() => {
        fireEvent.keyDown(document, { key: 'k', metaKey: true });
      });

      expect(document.activeElement).toBe(input);
    });

    it('focuses input on CTRL+K when open', () => {
      render(<QuickBookBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search client by name or phone...');

      act(() => {
        fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      });

      expect(document.activeElement).toBe(input);
    });
  });
});
