import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import checkinReducer, { setCurrentClient, addSelectedService } from '../store/slices/checkinSlice';
import servicesReducer from '../store/slices/servicesSlice';
import authReducer from '../store/slices/authSlice';
import clientReducer from '../store/slices/clientSlice';
import technicianReducer from '../store/slices/technicianSlice';
import uiReducer from '../store/slices/uiSlice';
import syncReducer from '../store/slices/syncSlice';
import { GuestsPage } from './GuestsPage';
import type { Client, CheckInService, ServiceCategory } from '../types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockClient: Client = {
  id: 'client-1',
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

const mockService: CheckInService = {
  serviceId: 'svc-1',
  serviceName: 'Classic Manicure',
  price: 35,
  durationMinutes: 30,
};

const mockCategories: ServiceCategory[] = [
  {
    id: 'cat-1',
    name: 'Nails',
    displayOrder: 1,
    services: [
      {
        id: 'svc-1',
        name: 'Classic Manicure',
        categoryId: 'cat-1',
        categoryName: 'Nails',
        price: 35,
        durationMinutes: 30,
        isActive: true,
      },
      {
        id: 'svc-2',
        name: 'Gel Manicure',
        categoryId: 'cat-1',
        categoryName: 'Nails',
        price: 50,
        durationMinutes: 45,
        isActive: true,
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Pedicure',
    displayOrder: 2,
    services: [
      {
        id: 'svc-3',
        name: 'Classic Pedicure',
        categoryId: 'cat-2',
        categoryName: 'Pedicure',
        price: 45,
        durationMinutes: 45,
        isActive: true,
      },
    ],
  },
];

function createTestStore(options?: { withClient?: boolean; withService?: boolean; withCategories?: boolean }) {
  const store = configureStore({
    reducer: {
      checkin: checkinReducer,
      services: servicesReducer,
      auth: authReducer,
      clients: clientReducer,
      technicians: technicianReducer,
      ui: uiReducer,
      sync: syncReducer,
    },
    preloadedState: {
      services: {
        services: options?.withCategories ? mockCategories.flatMap(c => c.services) : [],
        categories: options?.withCategories ? mockCategories : [],
        isLoading: false,
        error: null,
        lastFetched: null,
      },
    },
  });

  if (options?.withClient) {
    store.dispatch(setCurrentClient(mockClient));
  }

  if (options?.withService) {
    store.dispatch(addSelectedService(mockService));
  }

  return store;
}

function renderGuestsPage(store: ReturnType<typeof createTestStore>) {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <GuestsPage />
      </BrowserRouter>
    </Provider>
  );
}

describe('GuestsPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('redirects to home if no client is selected', async () => {
    const store = createTestStore();
    renderGuestsPage(store);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('renders guest page with main client info', () => {
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    expect(screen.getByText('Bringing Anyone?')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('1 service')).toBeInTheDocument();
  });

  it('shows add guest button when no guests', () => {
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    expect(screen.getByText('Add Guest')).toBeInTheDocument();
  });

  it('opens add guest form when clicking add button', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));

    expect(screen.getByText('New Guest')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Guest's name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(555) 555-5555')).toBeInTheDocument();
  });

  it('adds guest when form is submitted', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));
    await user.type(screen.getByPlaceholderText("Guest's name"), 'Jane Smith');
    
    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('disables add button when name is empty', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));

    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    const submitButton = addButtons[addButtons.length - 1];
    expect(submitButton).toBeDisabled();
  });

  it('shows party preference options when guests exist', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));
    await user.type(screen.getByPlaceholderText("Guest's name"), 'Jane Smith');
    
    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Service Order Preference')).toBeInTheDocument();
    });
    expect(screen.getByText('Serve Together')).toBeInTheDocument();
    expect(screen.getByText('In Order')).toBeInTheDocument();
  });

  it.skip('can remove a guest', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));
    await user.type(screen.getByPlaceholderText("Guest's name"), 'Jane Smith');
    
    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove jane smith/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it.skip('limits to maximum 6 guests', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    for (let i = 1; i <= 6; i++) {
      await user.click(screen.getByText('Add Guest'));
      await user.type(screen.getByPlaceholderText("Guest's name"), `Guest ${i}`);
      const addButtons = screen.getAllByRole('button', { name: /add guest/i });
      await user.click(addButtons[addButtons.length - 1]);
      
      if (i < 6) {
        await waitFor(() => {
          expect(screen.getByText(`Guest ${i}`)).toBeInTheDocument();
        });
      }
    }

    await waitFor(() => {
      expect(screen.getByText('Maximum 6 guests per check-in')).toBeInTheDocument();
    });
  });

  it('navigates to confirm when clicking continue', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Continue to Review'));

    expect(mockNavigate).toHaveBeenCalledWith('/confirm');
  });

  it('navigates to confirm when clicking skip', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Skip'));

    expect(mockNavigate).toHaveBeenCalledWith('/confirm');
  });

  it('navigates back when clicking back button', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    await user.click(screen.getByRole('button', { name: /go back/i }));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('opens service modal when clicking edit services', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));
    await user.type(screen.getByPlaceholderText("Guest's name"), 'Jane Smith');
    
    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Services for Jane Smith')).toBeInTheDocument();
    });
  });

  it('can select services for guest in modal', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));
    await user.type(screen.getByPlaceholderText("Guest's name"), 'Jane Smith');
    
    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Services for Jane Smith')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Classic Manicure'));
    await user.click(screen.getByText('Save Services'));

    await waitFor(() => {
      expect(screen.queryByText('Services for Jane Smith')).not.toBeInTheDocument();
    });

    expect(screen.getByText('1 service • $35.00')).toBeInTheDocument();
  });

  it('shows party summary with correct totals', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    expect(screen.getByText('Party Summary')).toBeInTheDocument();
    expect(screen.getByText('1 person')).toBeInTheDocument();
    expect(screen.getAllByText('$35.00').length).toBeGreaterThan(0);

    await user.click(screen.getByText('Add Guest'));
    await user.type(screen.getByPlaceholderText("Guest's name"), 'Jane Smith');
    
    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Services for Jane Smith')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Classic Manicure'));
    await user.click(screen.getByText('Save Services'));

    await waitFor(() => {
      expect(screen.getByText('2 people')).toBeInTheDocument();
    });
    
    expect(screen.getAllByText('$70.00').length).toBeGreaterThan(0);
  });

  it('can toggle party preference', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true, withCategories: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));
    await user.type(screen.getByPlaceholderText("Guest's name"), 'Jane Smith');
    
    const addButtons = screen.getAllByRole('button', { name: /add guest/i });
    await user.click(addButtons[addButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText('Services for Jane Smith')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /close modal/i }));

    await waitFor(() => {
      expect(screen.getByText('In Order')).toBeInTheDocument();
    });

    await user.click(screen.getByText('In Order'));

    const state = store.getState();
    expect(state.checkin.partyPreference).toBe('sequence');
  });

  it('cancels add guest form when clicking cancel', async () => {
    const user = userEvent.setup();
    const store = createTestStore({ withClient: true, withService: true });
    renderGuestsPage(store);

    await user.click(screen.getByText('Add Guest'));
    expect(screen.getByText('New Guest')).toBeInTheDocument();

    await user.click(screen.getByText('Cancel'));
    
    expect(screen.queryByText('New Guest')).not.toBeInTheDocument();
  });
});
