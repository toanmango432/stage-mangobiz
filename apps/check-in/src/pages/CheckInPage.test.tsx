import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import { CheckInPage } from './CheckInPage';

describe('CheckInPage', () => {
  it('renders the header with back button and title', () => {
    render(<CheckInPage />);
    
    expect(screen.getByRole('heading', { name: /client check-in/i })).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('renders the search input', () => {
    render(<CheckInPage />);
    
    const searchInput = screen.getByPlaceholderText(/search by name or phone/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('renders the Quick Add New Client button', () => {
    render(<CheckInPage />);
    
    expect(screen.getByRole('button', { name: /quick add new client/i })).toBeInTheDocument();
  });

  it('shows search results placeholder when query is entered', async () => {
    const user = userEvent.setup();
    render(<CheckInPage />);
    
    const searchInput = screen.getByPlaceholderText(/search by name or phone/i);
    await user.type(searchInput, 'John');
    
    expect(screen.getByText(/search results for "john" will appear here/i)).toBeInTheDocument();
  });

  it('does not show search results when query is empty', () => {
    render(<CheckInPage />);
    
    expect(screen.queryByText(/search results for/i)).not.toBeInTheDocument();
  });

  it('updates search input as user types', async () => {
    const user = userEvent.setup();
    render(<CheckInPage />);
    
    const searchInput = screen.getByPlaceholderText(/search by name or phone/i);
    await user.type(searchInput, 'test query');
    
    expect(searchInput).toHaveValue('test query');
  });

  it('clears search results when query is cleared', async () => {
    const user = userEvent.setup();
    render(<CheckInPage />);
    
    const searchInput = screen.getByPlaceholderText(/search by name or phone/i);
    await user.type(searchInput, 'John');
    
    expect(screen.getByText(/search results for "john"/i)).toBeInTheDocument();
    
    await user.clear(searchInput);
    
    expect(screen.queryByText(/search results for/i)).not.toBeInTheDocument();
  });

  it('has the correct section labels', () => {
    render(<CheckInPage />);
    
    expect(screen.getByText('Search for existing client')).toBeInTheDocument();
    expect(screen.getByText('New Client?')).toBeInTheDocument();
  });
});
