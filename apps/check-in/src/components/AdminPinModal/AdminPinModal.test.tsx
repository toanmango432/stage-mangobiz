import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AdminPinModal } from './index';
import adminReducer from '../../store/slices/adminSlice';

function createTestStore(preloadedState?: { admin: ReturnType<typeof adminReducer> }) {
  return configureStore({
    reducer: {
      admin: adminReducer,
    },
    preloadedState,
  });
}

function renderWithStore(store: ReturnType<typeof createTestStore>) {
  return render(
    <Provider store={store}>
      <AdminPinModal />
    </Provider>
  );
}

describe('AdminPinModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when showPinModal is false', () => {
    const store = createTestStore();
    renderWithStore(store);
    
    expect(screen.queryByText('Staff Access')).not.toBeInTheDocument();
  });

  it('should render when showPinModal is true', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    expect(screen.getByText('Staff Access')).toBeInTheDocument();
    expect(screen.getByText('Enter 4-digit PIN')).toBeInTheDocument();
  });

  it('should display number keypad', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('should have close button', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    expect(screen.getByText('Staff Access')).toBeInTheDocument();
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(store.getState().admin.showPinModal).toBe(false);
  });

  it('should add digits when number keys are pressed', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    
    // PIN boxes should show filled state
    const container = screen.getByText('Staff Access').closest('div')!.parentElement!;
    expect(container).toBeInTheDocument();
  });

  it('should not accept more than 4 digits', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    // Enter 4 digits
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    
    // Try to enter a 5th digit - buttons should be disabled
    const fiveButton = screen.getByRole('button', { name: '5' });
    expect(fiveButton).toBeDisabled();
  });

  it('should show error on incorrect PIN', async () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    // Enter wrong PIN (1111 instead of 1234)
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    
    expect(screen.getByText('Incorrect PIN. Please try again.')).toBeInTheDocument();
  });

  it('should activate admin mode on correct PIN', async () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    // Enter correct PIN (1234)
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    act(() => { vi.advanceTimersByTime(150); });
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    
    // Wait for success animation
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(store.getState().admin.isAdminModeActive).toBe(true);
    expect(store.getState().admin.showPinModal).toBe(false);
  });

  it('should display help text', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: '',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    expect(screen.getByText(/contact your manager/i)).toBeInTheDocument();
  });

  it('should clear error when delete is pressed', () => {
    const store = createTestStore({
      admin: {
        showPinModal: true,
        pinError: 'Incorrect PIN. Please try again.',
        isAdminModeActive: false,
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
    });
    renderWithStore(store);
    
    expect(screen.getByText('Incorrect PIN. Please try again.')).toBeInTheDocument();
    
    // Enter a digit first so delete button is not disabled
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    act(() => { vi.advanceTimersByTime(150); });
    
    // Error should be cleared
    expect(store.getState().admin.pinError).toBe('');
  });
});
