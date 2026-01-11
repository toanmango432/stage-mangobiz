/**
 * Unit Tests for UpsellCard Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpsellCard } from './index';
import type { Service } from '../../types';

const mockService: Service = {
  id: 'svc-123',
  name: 'Hot Stone Massage Add-On',
  categoryId: 'cat-1',
  categoryName: 'Massage',
  price: 25,
  durationMinutes: 15,
  isActive: true,
  description: 'Relaxing hot stone enhancement',
};

describe('UpsellCard', () => {
  it('renders service name', () => {
    const onAdd = vi.fn();
    render(<UpsellCard service={mockService} onAdd={onAdd} />);

    expect(screen.getByText('Hot Stone Massage Add-On')).toBeInTheDocument();
  });

  it('renders "Popular Add-On" label', () => {
    const onAdd = vi.fn();
    render(<UpsellCard service={mockService} onAdd={onAdd} />);

    expect(screen.getByText('Popular Add-On')).toBeInTheDocument();
  });

  it('renders formatted duration', () => {
    const onAdd = vi.fn();
    render(<UpsellCard service={mockService} onAdd={onAdd} />);

    // 15 minutes should format as "15m"
    expect(screen.getByText('15m')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    const onAdd = vi.fn();
    render(<UpsellCard service={mockService} onAdd={onAdd} />);

    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('renders Quick Add button', () => {
    const onAdd = vi.fn();
    render(<UpsellCard service={mockService} onAdd={onAdd} />);

    expect(screen.getByRole('button', { name: /quick add/i })).toBeInTheDocument();
  });

  it('calls onAdd with service when Quick Add clicked', () => {
    const onAdd = vi.fn();
    render(<UpsellCard service={mockService} onAdd={onAdd} />);

    const addButton = screen.getByRole('button', { name: /quick add/i });
    fireEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith(mockService);
  });

  it('renders correctly for longer duration', () => {
    const longService = { ...mockService, durationMinutes: 90 };
    const onAdd = vi.fn();
    render(<UpsellCard service={longService} onAdd={onAdd} />);

    // 90 minutes should format as "1h 30m"
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('renders correctly for higher price', () => {
    const expensiveService = { ...mockService, price: 150.5 };
    const onAdd = vi.fn();
    render(<UpsellCard service={expensiveService} onAdd={onAdd} />);

    expect(screen.getByText('$150.50')).toBeInTheDocument();
  });
});

describe('UpsellCard styling', () => {
  it('has gradient background class', () => {
    const onAdd = vi.fn();
    const { container } = render(<UpsellCard service={mockService} onAdd={onAdd} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-gradient-to-br');
  });

  it('has gold border color', () => {
    const onAdd = vi.fn();
    const { container } = render(<UpsellCard service={mockService} onAdd={onAdd} />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('border-[#d4a853]/30');
  });

  it('Quick Add button has gold background', () => {
    const onAdd = vi.fn();
    render(<UpsellCard service={mockService} onAdd={onAdd} />);

    const addButton = screen.getByRole('button', { name: /quick add/i });
    expect(addButton).toHaveClass('bg-[#d4a853]');
  });
});
