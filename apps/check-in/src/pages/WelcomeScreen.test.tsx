import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { WelcomeScreen } from './WelcomeScreen';
import authReducer from '../store/slices/authSlice';
import checkinReducer from '../store/slices/checkinSlice';
import uiReducer from '../store/slices/uiSlice';

const mockNavigate = vi.fn();
const mockTrackCheckinStarted = vi.fn();
const mockTrackCheckinAbandoned = vi.fn();
const mockGetFlowDuration = vi.fn().mockReturnValue(0);
const mockResetSession = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackCheckinStarted: mockTrackCheckinStarted,
    trackCheckinAbandoned: mockTrackCheckinAbandoned,
    getFlowDuration: mockGetFlowDuration,
    resetSession: mockResetSession,
  }),
}));

function createTestStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      checkin: checkinReducer,
      ui: uiReducer,
    },
  });
}

function renderWithProviders() {
  const store = createTestStore();
  return {
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <WelcomeScreen />
        </BrowserRouter>
      </Provider>
    ),
    store,
  };
}

describe('WelcomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the welcome screen with store name', () => {
    renderWithProviders();
    
    expect(screen.getByText('Luxe Nail Spa')).toBeInTheDocument();
  });

  it('should display phone keypad with numbers 0-9', () => {
    renderWithProviders();
    
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('should have continue button', () => {
    renderWithProviders();
    
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('should disable continue button initially', () => {
    renderWithProviders();
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('should have Scan QR button', () => {
    renderWithProviders();
    
    expect(screen.getByText('Scan QR')).toBeInTheDocument();
  });

  it('should navigate to QR scan when Scan QR is clicked', () => {
    renderWithProviders();
    
    const qrButton = screen.getByText('Scan QR').closest('button')!;
    fireEvent.click(qrButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/qr-scan');
  });

  it('should display promo banner when active', () => {
    renderWithProviders();
    
    expect(screen.getByText('Holiday Glow-Up')).toBeInTheDocument();
  });

  it('should display agreement checkbox', () => {
    renderWithProviders();
    
    expect(screen.getByText(/I agree to the salon policies/i)).toBeInTheDocument();
  });

  it('should reset session on mount', () => {
    renderWithProviders();
    
    expect(mockResetSession).toHaveBeenCalled();
  });

  it('should display placeholder phone format when empty', () => {
    renderWithProviders();
    
    expect(screen.getByText('___-___-____')).toBeInTheDocument();
  });

  it('should allow pressing number buttons', () => {
    renderWithProviders();
    
    const button5 = screen.getByRole('button', { name: '5' });
    expect(button5).toBeEnabled();
    
    fireEvent.click(button5);
    // Should not throw - button is functional
  });
});
