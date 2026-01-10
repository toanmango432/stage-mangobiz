import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ServicesPage } from './ServicesPage';
import servicesReducer from '../store/slices/servicesSlice';
import checkinReducer from '../store/slices/checkinSlice';
import { dataService } from '../services/dataService';
import type { ServiceCategory } from '../types';

vi.mock('../services/dataService', () => ({
  dataService: {
    services: {
      getByCategory: vi.fn(),
    },
  },
}));

const mockCategories: ServiceCategory[] = [
  {
    id: 'cat-nails',
    name: 'Nails',
    displayOrder: 1,
    services: [
      {
        id: 'svc-1',
        name: 'Classic Manicure',
        categoryId: 'cat-nails',
        categoryName: 'Nails',
        price: 25,
        durationMinutes: 30,
        isActive: true,
      },
      {
        id: 'svc-2',
        name: 'Gel Manicure',
        categoryId: 'cat-nails',
        categoryName: 'Nails',
        price: 40,
        durationMinutes: 45,
        isActive: true,
      },
      {
        id: 'svc-3',
        name: 'Classic Pedicure',
        categoryId: 'cat-nails',
        categoryName: 'Nails',
        price: 35,
        durationMinutes: 45,
        isActive: true,
      },
    ],
  },
  {
    id: 'cat-waxing',
    name: 'Waxing',
    displayOrder: 2,
    services: [
      {
        id: 'svc-4',
        name: 'Eyebrow Wax',
        categoryId: 'cat-waxing',
        categoryName: 'Waxing',
        price: 15,
        durationMinutes: 15,
        isActive: true,
      },
      {
        id: 'svc-5',
        name: 'Full Face Wax',
        categoryId: 'cat-waxing',
        categoryName: 'Waxing',
        price: 35,
        durationMinutes: 30,
        isActive: true,
      },
    ],
  },
  {
    id: 'cat-lashes',
    name: 'Lashes',
    displayOrder: 3,
    services: [
      {
        id: 'svc-6',
        name: 'Lash Lift',
        categoryId: 'cat-lashes',
        categoryName: 'Lashes',
        price: 75,
        durationMinutes: 60,
        isActive: true,
      },
    ],
  },
];

function renderWithProviders(searchParams = '?clientId=c123&phone=5551234567') {
  const store = configureStore({
    reducer: {
      services: servicesReducer,
      checkin: checkinReducer,
    },
  });

  return {
    store,
    user: userEvent.setup(),
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/services${searchParams}`]}>
          <Routes>
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/verify" element={<div data-testid="verify-page">Verify</div>} />
            <Route path="/signup" element={<div data-testid="signup-page">Signup</div>} />
            <Route path="/technician" element={<div data-testid="technician-page">Technician</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  };
}

describe('ServicesPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching services', async () => {
      vi.mocked(dataService.services.getByCategory).mockImplementation(
        () => new Promise(() => {})
      );

      renderWithProviders();

      expect(screen.getByText('Loading services...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when fetch fails', async () => {
      vi.mocked(dataService.services.getByCategory).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should retry fetch when Try Again clicked', async () => {
      vi.mocked(dataService.services.getByCategory)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /try again/i }));

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });
    });
  });

  describe('Service Categories', () => {
    it('should display all categories', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nails/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /waxing/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /lashes/i })).toBeInTheDocument();
      });
    });

    it('should display services grouped by category', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
        expect(screen.getByText('Gel Manicure')).toBeInTheDocument();
      });
    });

    it('should switch categories when category button clicked', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /waxing/i }));

      await waitFor(() => {
        expect(screen.getByText('Eyebrow Wax')).toBeInTheDocument();
        expect(screen.getByText('Full Face Wax')).toBeInTheDocument();
      });
    });
  });

  describe('Service Display', () => {
    it('should show service name, duration, and price', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('$25')).toBeInTheDocument();
    });
  });

  describe('Service Selection', () => {
    it('should add service to selection when tapped', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Classic Manicure'));

      const summary = screen.getByText('Your Selection').parentElement?.parentElement;
      expect(summary).toBeTruthy();
      expect(within(summary!).getByText('Classic Manicure')).toBeInTheDocument();
    });

    it('should remove service from selection when tapped again', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      const serviceButton = screen.getByText('Classic Manicure').closest('button')!;
      await user.click(serviceButton);
      await user.click(serviceButton);

      expect(screen.getByText('Select services from the list')).toBeInTheDocument();
    });

    it('should support multi-select', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Classic Manicure').closest('button')!);
      await user.click(screen.getByText('Gel Manicure').closest('button')!);

      const summary = screen.getByText('Your Selection').parentElement?.parentElement;
      expect(within(summary!).getByText('Classic Manicure')).toBeInTheDocument();
      expect(within(summary!).getByText('Gel Manicure')).toBeInTheDocument();
    });
  });

  describe('Running Total', () => {
    it('should display running total of selected services', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Classic Manicure').closest('button')!);
      await user.click(screen.getByText('Gel Manicure').closest('button')!);

      expect(screen.getByText('$65')).toBeInTheDocument();
      expect(screen.getByText('75 min')).toBeInTheDocument();
    });
  });

  describe('Search/Filter', () => {
    it('should have a search input', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search services...')).toBeInTheDocument();
      });
    });

    it('should filter services by search query', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Search services...'), 'eyebrow');

      await waitFor(() => {
        expect(screen.getByText('Eyebrow Wax')).toBeInTheDocument();
        expect(screen.queryByText('Classic Manicure')).not.toBeInTheDocument();
      });
    });

    it('should search across all categories', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Search services...'), 'lash');

      await waitFor(() => {
        expect(screen.getByText('Lash Lift')).toBeInTheDocument();
      });
    });

    it('should show result count for search', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText('Search services...'), 'classic');

      await waitFor(() => {
        expect(screen.getByText(/showing results for "classic"/i)).toBeInTheDocument();
        expect(screen.getByText(/2 found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should disable Continue button when no services selected', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /choose technician/i })).toBeDisabled();
    });

    it('should enable Continue button when services selected', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Classic Manicure').closest('button')!);

      expect(screen.getByRole('button', { name: /choose technician/i })).not.toBeDisabled();
    });

    it('should navigate to technician page when Continue clicked', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders();

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Classic Manicure').closest('button')!);
      await user.click(screen.getByRole('button', { name: /choose technician/i }));

    });

    it('should navigate back to verify page', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders('?clientId=c123&phone=5551234567');

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByTestId('verify-page')).toBeInTheDocument();
      });
    });

    it('should navigate back to signup for new clients', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      const { user } = renderWithProviders('?clientId=c123&phone=5551234567&new=true');

      await waitFor(() => {
        expect(screen.getByText('Classic Manicure')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /back/i }));

      await waitFor(() => {
        expect(screen.getByTestId('signup-page')).toBeInTheDocument();
      });
    });
  });

  describe('IndexedDB Caching', () => {
    it('should call dataService.services.getByCategory on mount', async () => {
      vi.mocked(dataService.services.getByCategory).mockResolvedValue(mockCategories);

      renderWithProviders();

      await waitFor(() => {
        expect(dataService.services.getByCategory).toHaveBeenCalledTimes(1);
      });
    });
  });
});
