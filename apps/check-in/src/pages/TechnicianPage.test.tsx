import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { TechnicianPage } from './TechnicianPage';
import technicianReducer from '../store/slices/technicianSlice';
import checkinReducer from '../store/slices/checkinSlice';
import authReducer from '../store/slices/authSlice';
import { dataService } from '../services/dataService';
import type { Technician } from '../types';

vi.mock('../services/dataService', () => ({
  dataService: {
    technicians: {
      getAll: vi.fn(),
    },
  },
}));

vi.mock('../providers/MqttProvider', () => ({
  useMqtt: () => ({
    subscribe: vi.fn(() => vi.fn()),
    publish: vi.fn(),
    isConnected: true,
    connection: { state: 'connected', error: null },
  }),
}));

const mockTechnicians: Technician[] = [
  {
    id: 'tech-1',
    firstName: 'Lisa',
    lastName: 'Smith',
    displayName: 'Lisa S.',
    status: 'available',
    serviceIds: ['svc-1', 'svc-2'],
    estimatedWaitMinutes: 0,
  },
  {
    id: 'tech-2',
    firstName: 'Mike',
    lastName: 'Johnson',
    displayName: 'Mike J.',
    status: 'with_client',
    serviceIds: ['svc-1', 'svc-3'],
    estimatedWaitMinutes: 15,
  },
  {
    id: 'tech-3',
    firstName: 'Sarah',
    lastName: 'Davis',
    displayName: 'Sarah D.',
    status: 'on_break',
    serviceIds: ['svc-2', 'svc-4'],
  },
  {
    id: 'tech-4',
    firstName: 'Kevin',
    lastName: 'Brown',
    displayName: 'Kevin B.',
    status: 'unavailable',
    serviceIds: ['svc-5'],
  },
];

const createTestStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      technicians: technicianReducer,
      checkin: checkinReducer,
      auth: authReducer,
    },
    preloadedState,
  });

const renderWithProviders = (
  ui: React.ReactElement,
  {
    route = '/technician?clientId=c1&phone=5551234567&services=svc-1',
    store = createTestStore(),
  } = {}
) => {
  return {
    store,
    user: userEvent.setup(),
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/technician" element={ui} />
            <Route path="/services" element={<div>Services Page</div>} />
            <Route path="/guests" element={<div>Guests Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  };
};

describe('TechnicianPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching technicians', async () => {
      vi.mocked(dataService.technicians.getAll).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTechnicians), 100))
      );

      renderWithProviders(<TechnicianPage />);

      expect(screen.getByText('Loading technicians...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Loading technicians...')).not.toBeInTheDocument();
      });
    });

    it('should show error state and retry button on fetch failure', async () => {
      vi.mocked(dataService.technicians.getAll).mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should retry fetch when Try Again is clicked', async () => {
      vi.mocked(dataService.technicians.getAll)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockTechnicians);

      const { user } = renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });
    });
  });

  describe('Technician Display', () => {
    beforeEach(() => {
      vi.mocked(dataService.technicians.getAll).mockResolvedValue(mockTechnicians);
    });

    it('should display all technicians qualified for selected services', async () => {
      renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });

      expect(screen.getByText('Mike J.')).toBeInTheDocument();
    });

    it('should display technician status badges', async () => {
      renderWithProviders(<TechnicianPage />, {
        route: '/technician?clientId=c1&phone=5551234567&services=',
      });

      await waitFor(() => {
        expect(screen.getByText('Available')).toBeInTheDocument();
      });

      expect(screen.getByText('With Client')).toBeInTheDocument();
      expect(screen.getByText('On Break')).toBeInTheDocument();
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    it('should display estimated wait time for technicians with clients', async () => {
      renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('~15 min wait')).toBeInTheDocument();
      });
    });

    it('should show Anyone Available option with Recommended badge', async () => {
      renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Anyone Available')).toBeInTheDocument();
      });

      expect(screen.getByText('Recommended')).toBeInTheDocument();
    });
  });

  describe('Selection Behavior', () => {
    beforeEach(() => {
      vi.mocked(dataService.technicians.getAll).mockResolvedValue(mockTechnicians);
    });

    it('should select Anyone Available by default (technicianPreference: anyone)', async () => {
      const store = createTestStore({
        checkin: {
          technicianPreference: 'anyone',
          selectedServices: [],
          technicians: [],
          currentClient: null,
          isNewClient: false,
          services: [],
          serviceCategories: [],
          guests: [],
          partyPreference: 'together',
          queueStatus: null,
          checkInNumber: null,
          queuePosition: null,
          estimatedWaitMinutes: null,
          phoneNumber: '',
          lookupStatus: 'idle',
          completedCheckInId: null,
        },
      });

      renderWithProviders(<TechnicianPage />, { store });

      await waitFor(() => {
        expect(screen.getByText('Anyone Available')).toBeInTheDocument();
      });

      const anyoneButton = screen.getByRole('button', { name: /let us assign the next available technician/i });
      expect(anyoneButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should allow selecting a specific technician', async () => {
      const { user, store } = renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });

      const lisaButton = screen.getByRole('button', { name: /select lisa s/i });
      await user.click(lisaButton);

      expect(store.getState().checkin.technicianPreference).toBe('tech-1');
    });

    it('should allow switching back to Anyone Available', async () => {
      const { user, store } = renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /select lisa s/i }));
      expect(store.getState().checkin.technicianPreference).toBe('tech-1');

      await user.click(screen.getByRole('button', { name: /let us assign the next available technician/i }));
      expect(store.getState().checkin.technicianPreference).toBe('anyone');
    });

    it('should show selected technician name in footer', async () => {
      const { user } = renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /select lisa s/i }));

      const footer = screen.getByRole('contentinfo');
      expect(within(footer).getByText('Lisa S.')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(dataService.technicians.getAll).mockResolvedValue(mockTechnicians);
    });

    it('should navigate back to services page', async () => {
      const { user } = renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /go back to services/i }));

      expect(screen.getByText('Services Page')).toBeInTheDocument();
    });

    it('should navigate to guests page on continue with Anyone Available', async () => {
      const { user } = renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Anyone Available')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /continue to next step/i }));

      expect(screen.getByText('Guests Page')).toBeInTheDocument();
    });

    it('should navigate to guests page on continue with selected technician', async () => {
      const { user } = renderWithProviders(<TechnicianPage />);

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /select lisa s/i }));
      await user.click(screen.getByRole('button', { name: /continue to next step/i }));

      expect(screen.getByText('Guests Page')).toBeInTheDocument();
    });

    it('should disable continue button when no selection', async () => {
      const store = createTestStore({
        checkin: {
          technicianPreference: '',
          selectedServices: [],
          technicians: [],
          currentClient: null,
          isNewClient: false,
          services: [],
          serviceCategories: [],
          guests: [],
          partyPreference: 'together',
          queueStatus: null,
          checkInNumber: null,
          queuePosition: null,
          estimatedWaitMinutes: null,
          phoneNumber: '',
          lookupStatus: 'idle',
          completedCheckInId: null,
        },
      });

      renderWithProviders(<TechnicianPage />, { store });

      await waitFor(() => {
        expect(screen.getByText('Anyone Available')).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /continue to next step/i });
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Service Filtering', () => {
    beforeEach(() => {
      vi.mocked(dataService.technicians.getAll).mockResolvedValue(mockTechnicians);
    });

    it('should filter technicians by selected services from URL', async () => {
      renderWithProviders(<TechnicianPage />, {
        route: '/technician?clientId=c1&phone=5551234567&services=svc-5',
      });

      await waitFor(() => {
        expect(screen.getByText('Kevin B.')).toBeInTheDocument();
      });

      expect(screen.queryByText('Lisa S.')).not.toBeInTheDocument();
      expect(screen.queryByText('Mike J.')).not.toBeInTheDocument();
    });

    it('should show all technicians when no services filter', async () => {
      renderWithProviders(<TechnicianPage />, {
        route: '/technician?clientId=c1&phone=5551234567&services=',
      });

      await waitFor(() => {
        expect(screen.getByText('Lisa S.')).toBeInTheDocument();
      });

      expect(screen.getByText('Mike J.')).toBeInTheDocument();
      expect(screen.getByText('Sarah D.')).toBeInTheDocument();
      expect(screen.getByText('Kevin B.')).toBeInTheDocument();
    });

    it('should show message when no technicians match services', async () => {
      renderWithProviders(<TechnicianPage />, {
        route: '/technician?clientId=c1&phone=5551234567&services=non-existent-service',
      });

      await waitFor(() => {
        expect(screen.getByText(/no technicians available for the selected services/i)).toBeInTheDocument();
      });
    });
  });
});
