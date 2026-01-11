import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { AdminModeBar } from './index';
import adminReducer from '../../store/slices/adminSlice';
import checkinReducer from '../../store/slices/checkinSlice';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function createTestStore(preloadedState?: { admin: ReturnType<typeof adminReducer>; checkin: ReturnType<typeof checkinReducer> }) {
  return configureStore({
    reducer: {
      admin: adminReducer,
      checkin: checkinReducer,
    },
    preloadedState,
  });
}

function renderWithProviders(store: ReturnType<typeof createTestStore>) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <AdminModeBar />
      </BrowserRouter>
    </Provider>
  );
}

describe('AdminModeBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when admin mode is inactive', () => {
    const store = createTestStore({
      admin: {
        isAdminModeActive: false,
        showPinModal: false,
        pinError: '',
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
      checkin: {} as ReturnType<typeof checkinReducer>,
    });
    renderWithProviders(store);

    expect(screen.queryByText('Staff Mode Active')).not.toBeInTheDocument();
  });

  it('should render when admin mode is active', () => {
    const store = createTestStore({
      admin: {
        isAdminModeActive: true,
        showPinModal: false,
        pinError: '',
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
      checkin: {} as ReturnType<typeof checkinReducer>,
    });
    renderWithProviders(store);

    expect(screen.getByText('Staff Mode Active')).toBeInTheDocument();
    expect(screen.getByText('Assist client or manage kiosk')).toBeInTheDocument();
  });

  it('should display Reset button', () => {
    const store = createTestStore({
      admin: {
        isAdminModeActive: true,
        showPinModal: false,
        pinError: '',
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
      checkin: {} as ReturnType<typeof checkinReducer>,
    });
    renderWithProviders(store);

    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should display Settings button', () => {
    const store = createTestStore({
      admin: {
        isAdminModeActive: true,
        showPinModal: false,
        pinError: '',
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
      checkin: {} as ReturnType<typeof checkinReducer>,
    });
    renderWithProviders(store);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should display Exit Staff Mode button', () => {
    const store = createTestStore({
      admin: {
        isAdminModeActive: true,
        showPinModal: false,
        pinError: '',
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
      checkin: {} as ReturnType<typeof checkinReducer>,
    });
    renderWithProviders(store);

    expect(screen.getByText('Exit Staff Mode')).toBeInTheDocument();
  });

  it('should deactivate admin mode when Exit button is clicked', () => {
    const store = createTestStore({
      admin: {
        isAdminModeActive: true,
        showPinModal: false,
        pinError: '',
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
      checkin: {} as ReturnType<typeof checkinReducer>,
    });
    renderWithProviders(store);

    const exitButton = screen.getByText('Exit Staff Mode');
    fireEvent.click(exitButton);

    expect(store.getState().admin.isAdminModeActive).toBe(false);
  });

  it('should reset checkin and navigate to home when Reset button is clicked', () => {
    const store = createTestStore({
      admin: {
        isAdminModeActive: true,
        showPinModal: false,
        pinError: '',
        isHelpRequested: false,
        helpRequestId: null,
        helpRequestedAt: null,
      },
      checkin: {} as ReturnType<typeof checkinReducer>,
    });
    renderWithProviders(store);

    const resetButton = screen.getByText('Reset');
    fireEvent.click(resetButton);

    // Check that navigate was called with '/'
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
