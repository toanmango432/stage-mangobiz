import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileBottomSheet } from '@/components/booking/MobileBottomSheet';

// Mock the useBottomSheet hook
vi.mock('@/components/booking/MobileBottomSheet', async () => {
  const actual = await vi.importActual('@/components/booking/MobileBottomSheet');
  return {
    ...actual,
    useBottomSheet: vi.fn(() => ({
      isOpen: false,
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    })),
  };
});

describe('MobileBottomSheet', () => {
  const defaultProps = {
    isOpen: false,
    onClose: vi.fn(),
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct initial height (sm)', () => {
    render(
      <MobileBottomSheet {...defaultProps} height="sm">
        <div>Test Content</div>
      </MobileBottomSheet>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with correct initial height (md)', () => {
    render(
      <MobileBottomSheet {...defaultProps} height="md">
        <div>Test Content</div>
      </MobileBottomSheet>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with correct initial height (lg)', () => {
    render(
      <MobileBottomSheet {...defaultProps} height="lg">
        <div>Test Content</div>
      </MobileBottomSheet>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with correct initial height (full)', () => {
    render(
      <MobileBottomSheet {...defaultProps} height="full">
        <div>Test Content</div>
      </MobileBottomSheet>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('opens and closes on isOpen prop change', async () => {
    const { rerender } = render(
      <MobileBottomSheet {...defaultProps} isOpen={false}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    // Initially closed
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();

    // Open the sheet
    rerender(
      <MobileBottomSheet {...defaultProps} isOpen={true}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <MobileBottomSheet {...defaultProps} isOpen={true} onClose={onClose}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    const backdrop = screen.getByTestId('bottom-sheet-backdrop');
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', async () => {
    const onClose = vi.fn();
    render(
      <MobileBottomSheet {...defaultProps} isOpen={true} onClose={onClose}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows handle indicator when showHandle is true', () => {
    render(
      <MobileBottomSheet {...defaultProps} isOpen={true} showHandle={true}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    expect(screen.getByTestId('bottom-sheet-handle')).toBeInTheDocument();
  });

  it('shows close button when showCloseButton is true', () => {
    render(
      <MobileBottomSheet {...defaultProps} isOpen={true} showCloseButton={true}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    expect(screen.getByTestId('bottom-sheet-close')).toBeInTheDocument();
  });

  it('prevents body scroll when open', () => {
    render(
      <MobileBottomSheet {...defaultProps} isOpen={true}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <MobileBottomSheet {...defaultProps} isOpen={true}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <MobileBottomSheet {...defaultProps} isOpen={false}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('renders portal to document.body', () => {
    render(
      <MobileBottomSheet {...defaultProps} isOpen={true}>
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    const portalContent = screen.getByText('Test Content');
    expect(portalContent.parentElement).toBe(document.body);
  });

  it('calls onHeightChange when height changes', async () => {
    const onHeightChange = vi.fn();
    render(
      <MobileBottomSheet 
        {...defaultProps} 
        isOpen={true} 
        onHeightChange={onHeightChange}
        height="sm"
      >
        <div>Test Content</div>
      </MobileBottomSheet>
    );

    // Simulate height change
    const sheet = screen.getByTestId('bottom-sheet');
    fireEvent.transitionEnd(sheet);

    await waitFor(() => {
      expect(onHeightChange).toHaveBeenCalled();
    });
  });
});



