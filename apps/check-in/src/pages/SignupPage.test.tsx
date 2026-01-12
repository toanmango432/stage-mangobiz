import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { SignupPage } from './SignupPage';
import clientReducer from '../store/slices/clientSlice';
import { dataService } from '../services/dataService';
import type { Client } from '../types';

vi.mock('../services/dataService', () => ({
  dataService: {
    clients: {
      getByPhone: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const mockCreatedClient: Client = {
  id: 'new-client-123',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '5559876543',
  email: 'jane@example.com',
  smsOptIn: true,
  loyaltyPoints: 0,
  loyaltyPointsToNextReward: 100,
  createdAt: new Date().toISOString(),
  visitCount: 0,
};

function renderWithProviders(phone: string) {
  const store = configureStore({
    reducer: {
      client: clientReducer,
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/signup?phone=${phone}`]}>
          <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<div data-testid="welcome-page">Welcome</div>} />
            <Route path="/services" element={<div data-testid="services-page">Services</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  };
}

describe('SignupPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render registration form with all required fields', () => {
      renderWithProviders('5559876543');

      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Zip Code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Text me when it's my turn/i)).toBeInTheDocument();
    });

    it('should display formatted phone number from URL params', () => {
      renderWithProviders('5559876543');

      expect(screen.getByText('(555) 987-6543')).toBeInTheDocument();
    });

    it('should have SMS opt-in checkbox pre-checked by default', () => {
      renderWithProviders('5559876543');

      const smsCheckbox = screen.getByLabelText(/Text me when it's my turn/i);
      expect(smsCheckbox).toBeChecked();
    });

    it('should have submit button disabled initially', () => {
      renderWithProviders('5559876543');

      const submitButton = screen.getByRole('button', { name: /Create Account & Continue/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should keep submit button disabled when required fields are empty', async () => {
      renderWithProviders('5559876543');

      const submitButton = screen.getByRole('button', { name: /Create Account & Continue/i });
      expect(submitButton).toBeDisabled();
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('should show error for invalid zip code', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      const zipInput = screen.getByLabelText(/Zip Code/i);
      await user.type(zipInput, '123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Zip code must be 5 digits')).toBeInTheDocument();
      });
    });

    it('should enable submit button when required fields are valid', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.type(screen.getByLabelText(/First Name/i), 'Jane');
      await user.type(screen.getByLabelText(/Last Name/i), 'Smith');

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Create Account & Continue/i });
        expect(submitButton).toBeEnabled();
      });
    });
  });

  describe('Phone Duplicate Check', () => {
    it('should show error when phone already exists', async () => {
      const existingClient: Client = {
        ...mockCreatedClient,
        phone: '5559876543',
      };
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(existingClient);

      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.type(screen.getByLabelText(/First Name/i), 'Jane');
      await user.type(screen.getByLabelText(/Last Name/i), 'Smith');

      await user.click(screen.getByRole('button', { name: /Create Account & Continue/i }));

      await waitFor(() => {
        expect(screen.getByText('A client with this phone number already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Registration', () => {
    it('should create client and navigate to services on success', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(null);
      vi.mocked(dataService.clients.create).mockResolvedValue(mockCreatedClient);

      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.type(screen.getByLabelText(/First Name/i), 'Jane');
      await user.type(screen.getByLabelText(/Last Name/i), 'Smith');
      await user.type(screen.getByLabelText(/Email/i), 'jane@example.com');

      await user.click(screen.getByRole('button', { name: /Create Account & Continue/i }));

      await waitFor(() => {
        expect(screen.getByTestId('services-page')).toBeInTheDocument();
      });

      expect(dataService.clients.create).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '5559876543',
        email: 'jane@example.com',
        zipCode: undefined,
        smsOptIn: true,
      });
    });

    it('should pass smsOptIn as false when unchecked', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(null);
      vi.mocked(dataService.clients.create).mockResolvedValue({
        ...mockCreatedClient,
        smsOptIn: false,
      });

      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.type(screen.getByLabelText(/First Name/i), 'Jane');
      await user.type(screen.getByLabelText(/Last Name/i), 'Smith');

      await user.click(screen.getByLabelText(/Text me when it's my turn/i));

      await user.click(screen.getByRole('button', { name: /Create Account & Continue/i }));

      await waitFor(() => {
        expect(dataService.clients.create).toHaveBeenCalledWith(
          expect.objectContaining({ smsOptIn: false })
        );
      });
    });
  });

  describe('Privacy Policy Modal', () => {
    it('should open privacy policy modal when link is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.click(screen.getByText('Privacy Policy'));

      expect(screen.getByRole('dialog', { name: /Privacy Policy/i })).toBeInTheDocument();
      expect(screen.getByText('Information We Collect')).toBeInTheDocument();
      expect(screen.getByText('Data Protection')).toBeInTheDocument();
    });

    it('should close privacy policy modal when I Understand is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.click(screen.getByText('Privacy Policy'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      const modal = screen.getByRole('dialog');
      await user.click(within(modal).getByRole('button', { name: /I Understand/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close privacy policy modal when X button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.click(screen.getByText('Privacy Policy'));

      await user.click(screen.getByRole('button', { name: /Close privacy policy/i }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back to welcome when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.click(screen.getByRole('button', { name: /Go back to welcome screen/i }));

      await waitFor(() => {
        expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when client creation fails', async () => {
      vi.mocked(dataService.clients.getByPhone).mockResolvedValue(null);
      vi.mocked(dataService.clients.create).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      renderWithProviders('5559876543');

      await user.type(screen.getByLabelText(/First Name/i), 'Jane');
      await user.type(screen.getByLabelText(/Last Name/i), 'Smith');

      await user.click(screen.getByRole('button', { name: /Create Account & Continue/i }));

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels on form fields', () => {
      renderWithProviders('5559876543');

      expect(screen.getByLabelText(/First Name/i)).toHaveAttribute('id', 'firstName');
      expect(screen.getByLabelText(/Last Name/i)).toHaveAttribute('id', 'lastName');
      expect(screen.getByLabelText(/Email/i)).toHaveAttribute('id', 'email');
      expect(screen.getByLabelText(/Zip Code/i)).toHaveAttribute('id', 'zipCode');
    });

    it('should have aria-invalid on email field when email is invalid', async () => {
      const user = userEvent.setup();
      renderWithProviders('5559876543');

      const emailInput = screen.getByLabelText(/Email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have minimum touch target size on buttons', () => {
      renderWithProviders('5559876543');

      const backButton = screen.getByRole('button', { name: /Go back to welcome screen/i });
      expect(backButton).toHaveClass('min-h-[44px]');
      expect(backButton).toHaveClass('min-w-[44px]');
    });
  });
});
