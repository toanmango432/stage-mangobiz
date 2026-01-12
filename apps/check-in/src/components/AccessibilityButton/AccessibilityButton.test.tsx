import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AccessibilityButton } from './index';
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

describe('AccessibilityButton', () => {
  it('should render the accessibility button', () => {
    renderWithProvider(<AccessibilityButton />);
    
    const button = screen.getByRole('button', { name: /open accessibility options/i });
    expect(button).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    renderWithProvider(<AccessibilityButton />);
    
    const button = screen.getByRole('button', { name: /open accessibility options/i });
    expect(button).toHaveAttribute('aria-label', 'Open accessibility options');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('should open accessibility menu when clicked', () => {
    renderWithProvider(<AccessibilityButton />);
    
    const button = screen.getByRole('button', { name: /open accessibility options/i });
    fireEvent.click(button);
    
    // AccessibilityMenu should be rendered with dialog role
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Accessibility Options')).toBeInTheDocument();
  });

  it('should close menu when close button is clicked', () => {
    renderWithProvider(<AccessibilityButton />);
    
    // Open the menu
    const button = screen.getByRole('button', { name: /open accessibility options/i });
    fireEvent.click(button);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Close the menu
    const closeButton = screen.getByRole('button', { name: /close accessibility menu/i });
    fireEvent.click(closeButton);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should have accessibility icon visible', () => {
    renderWithProvider(<AccessibilityButton />);
    
    const button = screen.getByRole('button', { name: /open accessibility options/i });
    expect(button).toBeVisible();
  });
});
