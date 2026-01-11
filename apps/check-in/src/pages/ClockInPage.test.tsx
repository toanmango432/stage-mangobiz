import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ClockInPage } from './ClockInPage';

const renderClockInPage = () => {
  return render(
    <BrowserRouter>
      <ClockInPage />
    </BrowserRouter>
  );
};

describe('ClockInPage', () => {
  describe('Layout', () => {
    it('renders the page header with title', () => {
      renderClockInPage();
      expect(screen.getByRole('heading', { name: /Staff Clock-In/i })).toBeInTheDocument();
    });

    it('renders back button linking to home', () => {
      renderClockInPage();
      const backLink = screen.getByRole('link');
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('renders PIN instruction text', () => {
      renderClockInPage();
      expect(screen.getByText(/Enter your 4-digit PIN/i)).toBeInTheDocument();
    });

    it('renders Clock In button', () => {
      renderClockInPage();
      expect(screen.getByRole('button', { name: /Clock In/i })).toBeInTheDocument();
    });
  });

  describe('PIN Display', () => {
    it('renders 4 PIN digit boxes', () => {
      renderClockInPage();
      const pinBoxes = document.querySelectorAll('.w-14.h-14');
      expect(pinBoxes.length).toBe(4);
    });

    it('PIN boxes are initially empty', () => {
      renderClockInPage();
      const pinBoxes = document.querySelectorAll('.w-14.h-14');
      pinBoxes.forEach(box => {
        expect(box.textContent).toBe('');
      });
    });
  });

  describe('Number Pad', () => {
    it('renders all number buttons (0-9)', () => {
      renderClockInPage();
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
      }
    });

    it('renders Clear button', () => {
      renderClockInPage();
      expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
    });

    it('renders Delete button', () => {
      renderClockInPage();
      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Clear') && !btn.textContent?.match(/^\d$/)
      );
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PIN Entry Functionality', () => {
    it('entering a number shows asterisk in first box', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      
      const pinBoxes = document.querySelectorAll('.w-14.h-14');
      expect(pinBoxes[0].textContent).toBe('*');
      expect(pinBoxes[1].textContent).toBe('');
    });

    it('entering 4 numbers fills all PIN boxes', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));
      await user.click(screen.getByRole('button', { name: '4' }));
      
      const pinBoxes = document.querySelectorAll('.w-14.h-14');
      pinBoxes.forEach(box => {
        expect(box.textContent).toBe('*');
      });
    });

    it('cannot enter more than 4 digits', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByRole('button', { name: '5' }));
      }
      
      const pinBoxes = document.querySelectorAll('.w-14.h-14');
      const filledBoxes = Array.from(pinBoxes).filter(box => box.textContent === '*');
      expect(filledBoxes.length).toBe(4);
    });

    it('delete button removes last digit', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      
      const deleteButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Clear') && !btn.textContent?.match(/^\d$/)
      );
      await user.click(deleteButton!);
      
      const pinBoxes = document.querySelectorAll('.w-14.h-14');
      expect(pinBoxes[0].textContent).toBe('*');
      expect(pinBoxes[1].textContent).toBe('');
    });

    it('clear button removes all digits', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));
      
      await user.click(screen.getByRole('button', { name: /Clear/i }));
      
      const pinBoxes = document.querySelectorAll('.w-14.h-14');
      pinBoxes.forEach(box => {
        expect(box.textContent).toBe('');
      });
    });
  });

  describe('Submit Button State', () => {
    it('Clock In button is disabled when PIN is incomplete', () => {
      renderClockInPage();
      const submitButton = screen.getByRole('button', { name: /Clock In/i });
      expect(submitButton).toBeDisabled();
    });

    it('Clock In button is disabled with 1 digit', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      
      const submitButton = screen.getByRole('button', { name: /Clock In/i });
      expect(submitButton).toBeDisabled();
    });

    it('Clock In button is disabled with 3 digits', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));
      
      const submitButton = screen.getByRole('button', { name: /Clock In/i });
      expect(submitButton).toBeDisabled();
    });

    it('Clock In button is enabled with 4 digits', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));
      await user.click(screen.getByRole('button', { name: '4' }));
      
      const submitButton = screen.getByRole('button', { name: /Clock In/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('Clock In button becomes disabled after clearing PIN', async () => {
      const user = userEvent.setup();
      renderClockInPage();
      
      await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: '2' }));
      await user.click(screen.getByRole('button', { name: '3' }));
      await user.click(screen.getByRole('button', { name: '4' }));
      
      expect(screen.getByRole('button', { name: /Clock In/i })).not.toBeDisabled();
      
      await user.click(screen.getByRole('button', { name: /Clear/i }));
      
      expect(screen.getByRole('button', { name: /Clock In/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('all number buttons are accessible', () => {
      renderClockInPage();
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeVisible();
      }
    });

    it('page has proper heading structure', () => {
      renderClockInPage();
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });
});
