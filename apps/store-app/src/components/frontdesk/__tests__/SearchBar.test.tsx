/**
 * SearchBar Component Tests
 * Tests for FrontDesk search input functionality
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic rendering', () => {
    it('renders input element', () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with default placeholder', () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<SearchBar {...defaultProps} placeholder="Find tickets..." />);
      expect(screen.getByPlaceholderText('Find tickets...')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const searchIcon = container.querySelector('.lucide-search');
      expect(searchIcon).toBeInTheDocument();
    });

    it('has correct aria-label for accessibility', () => {
      render(<SearchBar {...defaultProps} />);
      expect(screen.getByLabelText('Search tickets')).toBeInTheDocument();
    });
  });

  describe('controlled value', () => {
    it('displays the provided value', () => {
      render(<SearchBar {...defaultProps} value="test query" />);
      expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    });

    it('calls onChange when typing', () => {
      const handleChange = vi.fn();
      render(<SearchBar {...defaultProps} onChange={handleChange} />);

      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'new search' },
      });

      expect(handleChange).toHaveBeenCalledWith('new search');
    });
  });

  describe('clear button', () => {
    it('does not show clear button when value is empty', () => {
      render(<SearchBar {...defaultProps} value="" />);
      expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    });

    it('shows clear button when value is present', () => {
      render(<SearchBar {...defaultProps} value="some text" />);
      expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
    });

    it('clears value when clear button is clicked', () => {
      const handleChange = vi.fn();
      render(<SearchBar {...defaultProps} value="test" onChange={handleChange} />);

      fireEvent.click(screen.getByLabelText('Clear search'));
      expect(handleChange).toHaveBeenCalledWith('');
    });

    it('calls onClear callback when clear button is clicked', () => {
      const handleClear = vi.fn();
      render(
        <SearchBar {...defaultProps} value="test" onClear={handleClear} />
      );

      fireEvent.click(screen.getByLabelText('Clear search'));
      expect(handleClear).toHaveBeenCalledTimes(1);
    });

    it('has clear button title for tooltip', () => {
      render(<SearchBar {...defaultProps} value="test" />);
      expect(screen.getByTitle('Clear search')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('applies medium size by default', () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10');
    });

    it('applies small size when size="sm"', () => {
      render(<SearchBar {...defaultProps} size="sm" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-8');
    });

    it('applies medium size when size="md"', () => {
      render(<SearchBar {...defaultProps} size="md" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('h-10');
    });
  });

  describe('loading state', () => {
    it('shows search icon when not loading', () => {
      const { container } = render(<SearchBar {...defaultProps} isLoading={false} />);
      const searchIcon = container.querySelector('.lucide-search');
      const loadingIcon = container.querySelector('.lucide-loader-2');
      expect(searchIcon).toBeInTheDocument();
      expect(loadingIcon).not.toBeInTheDocument();
    });

    it('shows loading spinner when isLoading is true', () => {
      const { container } = render(<SearchBar {...defaultProps} isLoading={true} />);
      // Lucide icon class names use kebab-case format
      const loadingIcon = container.querySelector('.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });

    it('hides search icon when loading', () => {
      const { container } = render(<SearchBar {...defaultProps} isLoading={true} />);
      const searchIcon = container.querySelector('.lucide-search');
      expect(searchIcon).not.toBeInTheDocument();
    });

    it('loading icon has spin animation', () => {
      const { container } = render(<SearchBar {...defaultProps} isLoading={true} />);
      // Find svg with animate-spin class
      const loadingIcon = container.querySelector('svg.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });
  });

  describe('focus state', () => {
    it('changes styling on focus', () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByRole('textbox');

      // Before focus - should have default styling
      expect(input).toHaveClass('bg-slate-50');

      // After focus - should have focused styling
      fireEvent.focus(input);
      expect(input).toHaveClass('bg-white');
    });

    it('changes search icon color on focus', () => {
      const { container } = render(<SearchBar {...defaultProps} />);
      const input = screen.getByRole('textbox');
      const searchIcon = container.querySelector('.lucide-search');

      // Before focus
      expect(searchIcon).toHaveClass('text-slate-400');

      // After focus
      fireEvent.focus(input);
      expect(searchIcon).toHaveClass('text-slate-600');
    });

    it('reverts styling on blur', () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(input).toHaveClass('bg-white');

      fireEvent.blur(input);
      expect(input).toHaveClass('bg-slate-50');
    });
  });

  describe('custom className', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <SearchBar {...defaultProps} className="custom-search-class" />
      );
      expect(container.firstChild).toHaveClass('custom-search-class');
    });
  });

  describe('accessibility', () => {
    it('input is focusable via keyboard', () => {
      render(<SearchBar {...defaultProps} />);
      const input = screen.getByRole('textbox');

      input.focus();
      expect(document.activeElement).toBe(input);
    });

    it('clear button is a proper button element', () => {
      render(<SearchBar {...defaultProps} value="test" />);
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton.tagName).toBe('BUTTON');
      expect(clearButton).toHaveAttribute('type', 'button');
    });
  });
});
