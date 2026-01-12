import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AccessibilityProvider } from './AccessibilityProvider';
import accessibilityReducer from '../store/slices/accessibilitySlice';

function createTestStore(preloadedState?: { accessibility: ReturnType<typeof accessibilityReducer> }) {
  return configureStore({
    reducer: {
      accessibility: accessibilityReducer,
    },
    preloadedState,
  });
}

describe('AccessibilityProvider', () => {
  afterEach(() => {
    document.documentElement.className = '';
  });

  it('should render children', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <AccessibilityProvider>
          <div data-testid="child">Test Child</div>
        </AccessibilityProvider>
      </Provider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should add large-text-mode class when largeTextMode is true', () => {
    const store = createTestStore({
      accessibility: {
        largeTextMode: true,
        reducedMotionMode: false,
        highContrastMode: false,
        isAccessibilityMenuOpen: false,
      },
    });
    render(
      <Provider store={store}>
        <AccessibilityProvider>
          <div>Content</div>
        </AccessibilityProvider>
      </Provider>
    );

    expect(document.documentElement.classList.contains('large-text-mode')).toBe(true);
  });

  it('should add reduced-motion-mode class when reducedMotionMode is true', () => {
    const store = createTestStore({
      accessibility: {
        largeTextMode: false,
        reducedMotionMode: true,
        highContrastMode: false,
        isAccessibilityMenuOpen: false,
      },
    });
    render(
      <Provider store={store}>
        <AccessibilityProvider>
          <div>Content</div>
        </AccessibilityProvider>
      </Provider>
    );

    expect(document.documentElement.classList.contains('reduced-motion-mode')).toBe(true);
  });

  it('should add high-contrast-mode class when highContrastMode is true', () => {
    const store = createTestStore({
      accessibility: {
        largeTextMode: false,
        reducedMotionMode: false,
        highContrastMode: true,
        isAccessibilityMenuOpen: false,
      },
    });
    render(
      <Provider store={store}>
        <AccessibilityProvider>
          <div>Content</div>
        </AccessibilityProvider>
      </Provider>
    );

    expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);
  });

  it('should add multiple classes when multiple modes are enabled', () => {
    const store = createTestStore({
      accessibility: {
        largeTextMode: true,
        reducedMotionMode: true,
        highContrastMode: true,
        isAccessibilityMenuOpen: false,
      },
    });
    render(
      <Provider store={store}>
        <AccessibilityProvider>
          <div>Content</div>
        </AccessibilityProvider>
      </Provider>
    );

    expect(document.documentElement.classList.contains('large-text-mode')).toBe(true);
    expect(document.documentElement.classList.contains('reduced-motion-mode')).toBe(true);
    expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);
  });

  it('should not add any classes when all modes are disabled', () => {
    const store = createTestStore({
      accessibility: {
        largeTextMode: false,
        reducedMotionMode: false,
        highContrastMode: false,
        isAccessibilityMenuOpen: false,
      },
    });
    render(
      <Provider store={store}>
        <AccessibilityProvider>
          <div>Content</div>
        </AccessibilityProvider>
      </Provider>
    );

    expect(document.documentElement.classList.contains('large-text-mode')).toBe(false);
    expect(document.documentElement.classList.contains('reduced-motion-mode')).toBe(false);
    expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(false);
  });
});
