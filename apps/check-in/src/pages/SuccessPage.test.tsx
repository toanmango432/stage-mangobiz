import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { SuccessPage } from './SuccessPage';
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
import type { CheckIn } from '../types';

vi.mock('../hooks/useQueueMqtt', () => ({
  useQueueMqtt: () => ({ isConnected: true }),
}));

const mockCheckIn: CheckIn = {
  id: 'checkin-1',
  checkInNumber: 'A042',
  storeId: 'store-1',
  clientId: 'client-1',
  clientName: 'John Doe',
  clientPhone: '5551234567',
  services: [
    { serviceId: 's1', serviceName: 'Manicure', price: 30, durationMinutes: 30 },
  ],
  technicianPreference: 'anyone',
  guests: [],
  status: 'waiting',
  queuePosition: 3,
  estimatedWaitMinutes: 15,
  checkedInAt: new Date().toISOString(),
  source: 'kiosk',
  deviceId: 'device-1',
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
  initialRoute = '/success'
) {
  const store = createTestStore(preloadedState);
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  render(
    <Provider store={store}>
      <CheckInMqttProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/" element={<div>Welcome Page</div>} />
            <Route path="/success" element={ui} />
          </Routes>
        </MemoryRouter>
      </CheckInMqttProvider>
    </Provider>
  );

  return { store, user };
}

const defaultState: Partial<TestState> = {
  checkin: {
    currentClient: {
      id: 'client-1',
      firstName: 'John',
      lastName: 'Doe',
      phone: '5551234567',
      smsOptIn: true,
      loyaltyPoints: 150,
      loyaltyPointsToNextReward: 350,
      visitCount: 5,
      createdAt: '',
    },
    isNewClient: false,
    services: [],
    serviceCategories: [],
    selectedServices: [],
    technicians: [],
    technicianPreference: 'anyone',
    guests: [],
    partyPreference: 'together',
    queueStatus: null,
    checkInNumber: 'A042',
    queuePosition: 3,
    estimatedWaitMinutes: 15,
    phoneNumber: '',
    lookupStatus: 'idle',
    completedCheckInId: 'checkin-1',
    lastCheckIn: mockCheckIn,
    checkInStatus: 'success',
    checkInError: null,
  },
  auth: {
    storeId: 'store-1',
    deviceId: 'device-1',
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

describe('SuccessPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Display', () => {
    it('displays check-in number from Redux state', () => {
      renderWithProviders(<SuccessPage />, defaultState);
      expect(screen.getByText('A042')).toBeInTheDocument();
    });

    it('displays queue position from Redux state', () => {
      renderWithProviders(<SuccessPage />, defaultState);
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('displays estimated wait time with +/- 5 min indicator', () => {
      renderWithProviders(<SuccessPage />, defaultState);
      expect(screen.getByText(/~15/)).toBeInTheDocument();
      expect(screen.getByText('±5 min')).toBeInTheDocument();
    });

    it('displays "Next Available Technician" when technicianPreference is anyone', () => {
      renderWithProviders(<SuccessPage />, defaultState);
      expect(screen.getByText('Next Available Technician')).toBeInTheDocument();
    });

    it('displays loyalty points for returning clients', () => {
      renderWithProviders(<SuccessPage />, defaultState);
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('350')).toBeInTheDocument();
    });
  });

  describe('Queue Visual Indicator', () => {
    it('displays visual queue indicator when queueStatus is available', () => {
      const stateWithQueue: Partial<TestState> = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          queueStatus: {
            totalInQueue: 5,
            averageWaitMinutes: 10,
            positions: [],
            lastUpdated: new Date().toISOString(),
          },
        },
      };

      renderWithProviders(<SuccessPage />, stateWithQueue);
      expect(screen.getByText('Queue Status')).toBeInTheDocument();
      expect(screen.getByText('5 waiting')).toBeInTheDocument();
    });

    it('shows queue indicator based on queue position when no queueStatus', () => {
      renderWithProviders(<SuccessPage />, defaultState);
      expect(screen.getByText('Queue Status')).toBeInTheDocument();
      expect(screen.getByText('3 waiting')).toBeInTheDocument();
    });
  });

  describe('Guest Information', () => {
    it('shows guest count when guests are present', () => {
      const stateWithGuests: Partial<TestState> = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          guests: [{ id: 'g1', name: 'Jane', services: [], technicianPreference: 'anyone' }],
        },
      };

      renderWithProviders(<SuccessPage />, stateWithGuests);
      expect(screen.getByText(/You and your 1 guest are all set/)).toBeInTheDocument();
    });

    it('shows plural guests message for multiple guests', () => {
      const stateWithGuests: Partial<TestState> = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          guests: [
            { id: 'g1', name: 'Jane', services: [], technicianPreference: 'anyone' },
            { id: 'g2', name: 'Bob', services: [], technicianPreference: 'anyone' },
          ],
        },
      };

      renderWithProviders(<SuccessPage />, stateWithGuests);
      expect(screen.getByText(/You and your 2 guests are all set/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates home when Done button is clicked', async () => {
      const { user } = renderWithProviders(<SuccessPage />, defaultState);

      const doneButton = screen.getByRole('button', { name: /done/i });
      await user.click(doneButton);

      await waitFor(() => {
        expect(screen.getByText('Welcome Page')).toBeInTheDocument();
      });
    });

    it('redirects to home when no check-in data is present', async () => {
      const emptyState: Partial<TestState> = {
        checkin: {
          currentClient: null,
          isNewClient: false,
          services: [],
          serviceCategories: [],
          selectedServices: [],
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
        },
        auth: {
          storeId: 'store-1',
          deviceId: 'device-1',
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

      renderWithProviders(<SuccessPage />, emptyState);

      await waitFor(() => {
        expect(screen.getByText('Welcome Page')).toBeInTheDocument();
      });
    });
  });

  describe('New Client Flow', () => {
    it('shows welcome message for new clients', () => {
      const newClientState: Partial<TestState> = {
        ...defaultState,
        checkin: {
          ...defaultState.checkin!,
          isNewClient: true,
        },
      };

      renderWithProviders(<SuccessPage />, newClientState);
      expect(screen.getByText('Welcome!')).toBeInTheDocument();
      expect(screen.getByText(/We're excited to have you/)).toBeInTheDocument();
    });

    it('shows thank you message for returning clients', () => {
      renderWithProviders(<SuccessPage />, defaultState);
      expect(screen.getByText('Thank You!')).toBeInTheDocument();
    });
  });
});
