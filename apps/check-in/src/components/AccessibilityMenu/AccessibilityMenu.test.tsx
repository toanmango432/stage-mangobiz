import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AccessibilityMenu } from './index';
import accessibilityReducer from '../../store/slices/accessibilitySlice';

function createTestStore() {
  return configureStore({
    reducer: {
      accessibility: accessibilityReducer,
    },
  });
}

function renderWithProvider(ui: React.ReactElement) {
  const store = createTestStore();
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
}

describe('AccessibilityMenu', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.className = '';
  });

  it('should not render when isOpen is false', () => {
    renderWithProvider(<AccessibilityMenu isOpen={false} onClose={mockOnClose} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Options')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'accessibility-title');
  });

  it('should call onClose when close button is clicked', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close accessibility menu/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking backdrop', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    // The backdrop is the outer div with role="dialog"
    const dialog = screen.getByRole('dialog');
    // Click on the dialog wrapper (the backdrop area)
    fireEvent.click(dialog);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking inside menu', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    const menuContent = screen.getByText('Accessibility Options');
    fireEvent.click(menuContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display Large Text toggle option', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Large Text')).toBeInTheDocument();
    expect(screen.getByText('Increase text size for better readability')).toBeInTheDocument();
  });

  it('should display Reduce Motion toggle option', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Reduce Motion')).toBeInTheDocument();
    expect(screen.getByText('Minimize animations and transitions')).toBeInTheDocument();
  });

  it('should display High Contrast toggle option', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('High Contrast')).toBeInTheDocument();
    expect(screen.getByText('Increase color contrast for visibility')).toBeInTheDocument();
  });

  it('should toggle Large Text when clicked', () => {
    const { store } = renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    const toggle = screen.getByRole('switch', { name: /large text/i });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    fireEvent.click(toggle);
    
    expect(store.getState().accessibility.largeTextMode).toBe(true);
  });

  it('should toggle Reduce Motion when clicked', () => {
    const { store } = renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    const toggle = screen.getByRole('switch', { name: /reduce motion/i });
    fireEvent.click(toggle);
    
    expect(store.getState().accessibility.reducedMotionMode).toBe(true);
  });

  it('should toggle High Contrast when clicked', () => {
    const { store } = renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    const toggle = screen.getByRole('switch', { name: /high contrast/i });
    fireEvent.click(toggle);
    
    expect(store.getState().accessibility.highContrastMode).toBe(true);
  });

  it('should display Reset to Defaults button', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByRole('button', { name: /reset all accessibility settings to defaults/i })).toBeInTheDocument();
  });

  it('should reset all settings when Reset button is clicked', () => {
    const { store } = renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    // Enable some settings
    const largeTextToggle = screen.getByRole('switch', { name: /large text/i });
    const highContrastToggle = screen.getByRole('switch', { name: /high contrast/i });
    fireEvent.click(largeTextToggle);
    fireEvent.click(highContrastToggle);
    
    expect(store.getState().accessibility.largeTextMode).toBe(true);
    expect(store.getState().accessibility.highContrastMode).toBe(true);
    
    // Reset
    const resetButton = screen.getByRole('button', { name: /reset all accessibility settings to defaults/i });
    fireEvent.click(resetButton);
    
    expect(store.getState().accessibility.largeTextMode).toBe(false);
    expect(store.getState().accessibility.reducedMotionMode).toBe(false);
    expect(store.getState().accessibility.highContrastMode).toBe(false);
  });

  it('should show toggle state correctly', () => {
    renderWithProvider(<AccessibilityMenu isOpen={true} onClose={mockOnClose} />);
    
    const toggle = screen.getByRole('switch', { name: /large text/i });
    
    // Initially off
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    
    // Toggle on
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    
    // Toggle off
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
