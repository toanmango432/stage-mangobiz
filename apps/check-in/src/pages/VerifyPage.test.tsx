import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { VerifyPage } from './VerifyPage';
import clientReducer from '../store/slices/clientSlice';
import { dataService } from '../services/dataService';
import type { Client } from '../types';

vi.mock('../services/dataService', () => ({
  dataService: {
    clients: {
      getByPhone: vi.fn(),
    },
  },
}));

const mockClient: Client = {
  id: 'test-client-1',
  firstName: 'Sarah',
  lastName: 'Johnson',
  phone: '5551234567',
  email: 'sarah@example.com',
  smsOptIn: true,
  loyaltyPoints: 450,
  loyaltyPointsToNextReward: 50,
  createdAt: '2024-01-01T00:00:00Z',
  lastVisitAt: '2024-12-20T00:00:00Z',
  visitCount: 10,
};

function renderWithProviders(
  phone: string,
  initialState?: Partial<ReturnType<typeof clientReducer>>
) {
  const store = configureStore({
    reducer: {
      client: clientReducer,
    },
    preloadedState: initialState ? { client: { ...clientReducer(undefined, { type: '' }), ...initialState } } : undefined,
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/verify?phone=${phone}`]}>
          <Routes>
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/" element={<div data-testid="welcome-page">Welcome</div>} />
            <Route path="/signup" element={<div data-testid="signup-page">Signup</div>} />
            <Route path="/services" element={<div data-testid="services-page">Services</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  };
}

describe('VerifyPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Phone Lookup Flow', () => {
    it('should show loading state while looking up client', async () => {
      vi.mocked(dataService.clients.getByPhone).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders('5551234567');

      expect(screen.getByText('Looking you up...')).toBeInTheDocument();
      expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    });

    it('should display client info when found', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);

      renderWithProviders('5551234567');

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Sarah!/)).toBeInTheDocument();
      });

      expect(screen.getByText('450 pts')).toBeInTheDocument();
      expect(screen.getByText('Select Services')).toBeInTheDocument();
    });

    it('should show create account option when not found', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(null);

      renderWithProviders('5559999999');

      await waitFor(() => {
        expect(screen.getByText('Welcome! 👋')).toBeInTheDocument();
      });

      expect(screen.getByText("We don't have this number on file yet")).toBeInTheDocument();
      expect(screen.getByText('Create Account & Continue')).toBeInTheDocument();
      expect(screen.getByText('(555) 999-9999')).toBeInTheDocument();
    });

    it('should redirect to home if phone is invalid', async () => {
      renderWithProviders('123');

      await waitFor(() => {
        expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
      });
    });

    it('should redirect to home if phone is empty', async () => {
      renderWithProviders('');

      await waitFor(() => {
        expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
      });
    });

    it('should show error state on lookup failure', async () => {
      vi.mocked(dataService.clients.getByPhone).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders('5551234567');

      await waitFor(() => {
        expect(screen.getByText('Oops!')).toBeInTheDocument();
      });

      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to signup when Create Account is clicked', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(null);
      const user = userEvent.setup();

      renderWithProviders('5559999999');

      await waitFor(() => {
        expect(screen.getByText('Create Account & Continue')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Create Account & Continue'));

      await waitFor(() => {
        expect(screen.getByTestId('signup-page')).toBeInTheDocument();
      });
    });

    it('should navigate to services when Select Services is clicked', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);
      const user = userEvent.setup();

      renderWithProviders('5551234567');

      await waitFor(() => {
        expect(screen.getByText('Select Services')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Select Services'));

      await waitFor(() => {
        expect(screen.getByTestId('services-page')).toBeInTheDocument();
      });
    });

    it('should navigate back to welcome when Not me is clicked', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);
      const user = userEvent.setup();

      renderWithProviders('5551234567');

      await waitFor(() => {
        expect(screen.getByText(/Not me/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/Not me/));

      await waitFor(() => {
        expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
      });
    });
  });

  describe('Loyalty Points Display', () => {
    it('should display loyalty points for existing client', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);

      renderWithProviders('5551234567');

      await waitFor(() => {
        expect(screen.getByText('450 pts')).toBeInTheDocument();
      });

      expect(screen.getByText('Loyalty Points')).toBeInTheDocument();
    });

    it('should show progress bar when points to next reward exists', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(mockClient);

      renderWithProviders('5551234567');

      await waitFor(() => {
        expect(screen.getByText('50 pts to go')).toBeInTheDocument();
      });
    });
  });

  describe('Phone Formatting', () => {
    it('should format phone as (XXX) XXX-XXXX', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(null);

      renderWithProviders('5551234567');

      await waitFor(() => {
        expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
      });
    });
  });
});
