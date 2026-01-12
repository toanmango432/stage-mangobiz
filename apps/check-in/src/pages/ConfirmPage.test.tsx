import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ConfirmPage from './ConfirmPage';
import {
  checkinReducer,
  authReducer,
  uiReducer,
  syncReducer,
  servicesReducer,
  technicianReducer,
  clientReducer,
} from '../store/slices';
import { CheckInMqttProvider } from '../providers/MqttProvider';
import type { Client, CheckIn } from '../types';

vi.mock('../services/dataService', () => ({
  dataService: {
    checkins: {
      create: vi.fn(),
    },
  },
}));

import { dataService } from '../services/dataService';

const mockClient: Client = {
  id: 'client-123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '5551234567',
  email: 'john@example.com',
  smsOptIn: true,
  loyaltyPoints: 100,
  loyaltyPointsToNextReward: 50,
  createdAt: '2024-01-01T00:00:00Z',
  visitCount: 5,
};

const mockCheckIn: CheckIn = {
  id: 'checkin-123',
  checkInNumber: 'B007',
  storeId: 'store-123',
  clientId: 'client-123',
  clientName: 'John Doe',
  clientPhone: '5551234567',
  services: [
    { serviceId: 's1', serviceName: 'Classic Manicure', price: 25, durationMinutes: 30 },
    { serviceId: 's2', serviceName: 'Gel Pedicure', price: 55, durationMinutes: 60 },
  ],
  technicianPreference: 'anyone',
  guests: [],
  status: 'waiting',
  queuePosition: 2,
  estimatedWaitMinutes: 16,
  checkedInAt: '2024-01-15T10:30:00Z',
  source: 'kiosk',
  deviceId: 'device-123',
  syncStatus: 'synced',
};

interface TestState {
  checkin: ReturnType<typeof checkinReducer>;
  auth: ReturnType<typeof authReducer>;
  technicians: ReturnType<typeof technicianReducer>;
}

function createTestStore(preloadedState?: Partial<TestState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      checkin: checkinReducer,
      client: clientReducer,
      sync: syncReducer,
      services: servicesReducer,
      technicians: technicianReducer,
    },
    preloadedState: preloadedState as TestState,
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  preloadedState?: Partial<TestState>,
  initialRoute = '/confirm'
) {
  const store = createTestStore(preloadedState);
  const user = userEvent.setup();

  render(
    <Provider store={store}>
      <CheckInMqttProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/" element={<div>Welcome Page</div>} />
            <Route path="/confirm" element={ui} />
            <Route path="/success" element={<div>Success Page</div>} />
          </Routes>
        </MemoryRouter>
      </CheckInMqttProvider>
    </Provider>
  );

  return { store, user };
}

const defaultState: Partial<TestState> = {
  checkin: {
    currentClient: mockClient,
    isNewClient: false,
    services: [],
    serviceCategories: [],
    selectedServices: [
      { serviceId: 's1', serviceName: 'Classic Manicure', price: 25, durationMinutes: 30 },
      { serviceId: 's2', serviceName: 'Gel Pedicure', price: 55, durationMinutes: 60 },
    ],
    technicians: [],
    technicianPreference: 'anyone',
    guests: [],
    partyPreference: 'together',
    queueStatus: null,
    checkInNumber: null,
    queuePosition: null,
    estimatedWaitMinutes: null,
    phoneNumber: '',
    lookupStatus: 'idle',
    completedCheckInId: null,
    lastCheckIn: null,
    checkInStatus: 'idle',
    checkInError: null,
    isCalled: false,
    calledInfo: null,
  },
  auth: {
    storeId: 'store-123',
    deviceId: 'device-123',
    isAuthenticated: true,
    store: null,
  },
  technicians: {
    technicians: [],
    isLoading: false,
    error: null,
    lastFetched: null,
  },
};

describe('ConfirmPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Display', () => {
    it('should display client name', () => {
      renderWithProviders(<ConfirmPage />, defaultState);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should display selected services', () => {
      renderWithProviders(<ConfirmPage />, defaultState);
      expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      expect(screen.getByText('Gel Pedicure')).toBeInTheDocument();
    });

    it('should display service prices', () => {
      renderWithProviders(<ConfirmPage />, defaultState);
      expect(screen.getByText('$25.00')).toBeInTheDocument();
      expect(screen.getByText('$55.00')).toBeInTheDocument();
    });

    it('should display total price and duration', () => {
      renderWithProviders(<ConfirmPage />, defaultState);
      expect(screen.getByText('$80.00')).toBeInTheDocument();
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    it('should display technician preference', () => {
      renderWithProviders(<ConfirmPage />, defaultState);
      expect(screen.getByText('Next Available')).toBeInTheDocument();
    });

    it('should display specific technician when selected', () => {
      const stateWithTechnician = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          technicianPreference: 'tech-1',
        },
        technicians: {
          technicians: [
            {
              id: 'tech-1',
              firstName: 'Lisa',
              lastName: 'Smith',
              displayName: 'Lisa S.',
              status: 'available' as const,
              serviceIds: ['s1', 's2'],
            },
          ],
          isLoading: false,
          error: null,
          lastFetched: null,
        },
      };
      renderWithProviders(<ConfirmPage />, stateWithTechnician);
      expect(screen.getByText('Lisa S.')).toBeInTheDocument();
    });

    it('should display guest count when guests added', () => {
      const stateWithGuests = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          guests: [
            { id: 'g1', name: 'Guest 1', services: [], technicianPreference: 'anyone' as const },
            { id: 'g2', name: 'Guest 2', services: [], technicianPreference: 'anyone' as const },
          ],
        },
      };
      renderWithProviders(<ConfirmPage />, stateWithGuests);
      expect(screen.getByText('Additional people in your party')).toBeInTheDocument();
    });

    it('should show "New Client" label for new clients', () => {
      const stateNewClient = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          isNewClient: true,
        },
      };
      renderWithProviders(<ConfirmPage />, stateNewClient);
      expect(screen.getByText('New Client')).toBeInTheDocument();
    });

    it('should show "Returning Client" label for existing clients', () => {
      renderWithProviders(<ConfirmPage />, defaultState);
      expect(screen.getByText('Returning Client')).toBeInTheDocument();
    });
  });

  describe('Check-In Creation', () => {
    it('should create check-in on confirm click', async () => {
      vi.mocked(dataService.checkins.create).mockResolvedValue(mockCheckIn);

      const { user } = renderWithProviders(<ConfirmPage />, defaultState);

      await user.click(screen.getByRole('button', { name: /confirm and check in/i }));

      await waitFor(() => {
        expect(dataService.checkins.create).toHaveBeenCalledWith({
          storeId: 'store-123',
          clientId: 'client-123',
          clientName: 'John Doe',
          clientPhone: '5551234567',
          services: [
            { serviceId: 's1', serviceName: 'Classic Manicure', price: 25, durationMinutes: 30 },
            { serviceId: 's2', serviceName: 'Gel Pedicure', price: 55, durationMinutes: 60 },
          ],
          technicianPreference: 'anyone',
          guests: [],
          partyPreference: 'together',
          deviceId: 'device-123',
        });
      });
    });

    it('should navigate to success page after check-in', async () => {
      vi.mocked(dataService.checkins.create).mockResolvedValue(mockCheckIn);

      const { user } = renderWithProviders(<ConfirmPage />, defaultState);

      await user.click(screen.getByRole('button', { name: /confirm and check in/i }));

      await waitFor(() => {
        expect(screen.getByText('Success Page')).toBeInTheDocument();
      });
    });

    it('should show loading state while submitting', async () => {
      let resolvePromise: (value: CheckIn) => void;
      const promise = new Promise<CheckIn>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(dataService.checkins.create).mockReturnValue(promise);

      const { user } = renderWithProviders(<ConfirmPage />, defaultState);

      await user.click(screen.getByRole('button', { name: /confirm and check in/i }));

      expect(screen.getByText('Checking In...')).toBeInTheDocument();

      resolvePromise!(mockCheckIn);
    });

    it('should display error message on failure', async () => {
      vi.mocked(dataService.checkins.create).mockRejectedValue(new Error('Network error'));

      const { user } = renderWithProviders(<ConfirmPage />, defaultState);

      await user.click(screen.getByRole('button', { name: /confirm and check in/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should disable button while submitting', async () => {
      let resolvePromise: (value: CheckIn) => void;
      const promise = new Promise<CheckIn>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(dataService.checkins.create).mockReturnValue(promise);

      const { user } = renderWithProviders(<ConfirmPage />, defaultState);

      const button = screen.getByRole('button', { name: /confirm and check in/i });
      await user.click(button);

      expect(button).toBeDisabled();

      resolvePromise!(mockCheckIn);
    });
  });

  describe('Navigation', () => {
    it('should redirect to home if no client', () => {
      const stateNoClient = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          currentClient: null,
        },
      };
      renderWithProviders(<ConfirmPage />, stateNoClient);
      expect(screen.getByText('Welcome Page')).toBeInTheDocument();
    });

    it('should redirect to home if no services', () => {
      const stateNoServices = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          selectedServices: [],
        },
      };
      renderWithProviders(<ConfirmPage />, stateNoServices);
      expect(screen.getByText('Welcome Page')).toBeInTheDocument();
    });

    it('should have back button', () => {
      renderWithProviders(<ConfirmPage />, defaultState);
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });
  });
});
