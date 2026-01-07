import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartBookingFlow } from '@/components/booking/SmartBookingFlow';

// Mock the useSmartBookingFlow hook
vi.mock('@/hooks/useSmartBookingFlow', () => ({
  useSmartBookingFlow: vi.fn(() => ({
    formData: {
      service: null,
      staff: null,
      date: null,
      time: null,
      members: [],
    },
    sections: {
      service: { state: 'collapsed', isExpanded: false },
      staff: { state: 'collapsed', isExpanded: false },
      datetime: { state: 'collapsed', isExpanded: false },
    },
    expandSection: vi.fn(),
    completeSection: vi.fn(),
    updateFormData: vi.fn(),
    isSectionExpanded: vi.fn(() => false),
    isSectionCompleted: vi.fn(() => false),
    getProgressPercentage: vi.fn(() => 0),
  })),
}));

// Mock child components
vi.mock('@/components/booking/BookingCard', () => ({
  BookingCard: ({ service, onServiceChange, onStaffChange, onDateTimeChange }: any) => (
    <div data-testid="booking-card">
      <button onClick={() => onServiceChange({ id: '1', name: 'Test Service' })}>
        Change Service
      </button>
      <button onClick={() => onStaffChange({ id: '1', name: 'Test Staff' })}>
        Change Staff
      </button>
      <button onClick={() => onDateTimeChange({ date: '2024-01-15', time: '14:00' })}>
        Change DateTime
      </button>
    </div>
  ),
}));

vi.mock('@/components/booking/SmartTimeSuggestions', () => ({
  SmartTimeSuggestions: ({ onTimeSelect }: any) => (
    <div data-testid="smart-time-suggestions">
      <button onClick={() => onTimeSelect({ date: '2024-01-15', time: '14:00' })}>
        Select Time
      </button>
    </div>
  ),
}));

vi.mock('@/components/booking/MobileBottomSheet', () => ({
  MobileBottomSheet: ({ children, isOpen }: any) => 
    isOpen ? <div data-testid="mobile-bottom-sheet">{children}</div> : null,
}));

describe('SmartBookingFlow', () => {
  const defaultProps = {
    initialService: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with provided service', () => {
    const initialService = {
      id: '1',
      name: 'Gel Manicure',
      duration: 60,
      price: 45,
    };

    render(<SmartBookingFlow {...defaultProps} initialService={initialService} />);

    expect(screen.getByTestId('booking-card')).toBeInTheDocument();
  });

  it('updates progress bar correctly', () => {
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: vi.fn(),
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('completes service section when service is selected', async () => {
    const mockCompleteSection = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: null, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'collapsed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: mockCompleteSection,
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => false),
      getProgressPercentage: vi.fn(() => 0),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const changeServiceButton = screen.getByText('Change Service');
    fireEvent.click(changeServiceButton);

    expect(mockCompleteSection).toHaveBeenCalledWith('service');
  });

  it('auto-expands next section after service selection', async () => {
    const mockExpandSection = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: null, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'collapsed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: mockExpandSection,
      completeSection: vi.fn(),
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => false),
      getProgressPercentage: vi.fn(() => 0),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const changeServiceButton = screen.getByText('Change Service');
    fireEvent.click(changeServiceButton);

    expect(mockExpandSection).toHaveBeenCalledWith('staff');
  });

  it('completes staff section when staff is selected', async () => {
    const mockCompleteSection = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: mockCompleteSection,
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const changeStaffButton = screen.getByText('Change Staff');
    fireEvent.click(changeStaffButton);

    expect(mockCompleteSection).toHaveBeenCalledWith('staff');
  });

  it('completes datetime section when time is selected', async () => {
    const mockCompleteSection = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: { id: '1' }, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'completed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: mockCompleteSection,
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 50),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const changeDateTimeButton = screen.getByText('Change DateTime');
    fireEvent.click(changeDateTimeButton);

    expect(mockCompleteSection).toHaveBeenCalledWith('datetime');
  });

  it('creates new member when "+ Add person" is clicked', async () => {
    const mockUpdateFormData = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: vi.fn(),
      updateFormData: mockUpdateFormData,
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const addPersonButton = screen.getByText('+ Add person');
    fireEvent.click(addPersonButton);

    expect(mockUpdateFormData).toHaveBeenCalledWith({
      isGroup: true,
      members: expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/member-/),
          name: 'Guest 1',
          service: { id: '1' },
        }),
      ]),
    });
  });

  it('removes member when remove is called', async () => {
    const mockUpdateFormData = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { 
        service: { id: '1' }, 
        staff: null, 
        date: null, 
        time: null, 
        members: [
          { id: 'member-1', name: 'Guest 1', service: { id: '1' } },
          { id: 'member-2', name: 'Guest 2', service: { id: '1' } },
        ]
      },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: vi.fn(),
      updateFormData: mockUpdateFormData,
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockUpdateFormData).toHaveBeenCalledWith({
      members: [{ id: 'member-2', name: 'Guest 2', service: { id: '1' } }],
    });
  });

  it('shows group summary with correct totals', () => {
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { 
        service: { id: '1', price: 45 }, 
        staff: null, 
        date: null, 
        time: null, 
        members: [
          { id: 'member-1', name: 'Guest 1', service: { id: '1', price: 45 } },
          { id: 'member-2', name: 'Guest 2', service: { id: '1', price: 45 } },
        ]
      },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: vi.fn(),
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    expect(screen.getByText('2 people')).toBeInTheDocument();
    expect(screen.getByText('$90')).toBeInTheDocument();
  });

  it('triggers auto-save every 2 seconds', async () => {
    const mockUpdateFormData = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: vi.fn(),
      updateFormData: mockUpdateFormData,
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    // Wait for auto-save to trigger
    await waitFor(() => {
      expect(mockUpdateFormData).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('collapses completed sections after delay', async () => {
    const mockExpandSection = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: true },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: mockExpandSection,
      completeSection: vi.fn(),
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => true),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    // Wait for section to collapse
    await waitFor(() => {
      expect(mockExpandSection).toHaveBeenCalledWith('service', false);
    }, { timeout: 3000 });
  });

  it('expands sections on tap', async () => {
    const mockExpandSection = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: null, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'collapsed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: mockExpandSection,
      completeSection: vi.fn(),
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => false),
      getProgressPercentage: vi.fn(() => 0),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const sectionHeader = screen.getByText('Service Selection');
    fireEvent.click(sectionHeader);

    expect(mockExpandSection).toHaveBeenCalledWith('service');
  });

  it('calculates progress percentage correctly', () => {
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: { id: '1' }, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'completed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: vi.fn(),
      updateFormData: vi.fn(),
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 50),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('updates members array correctly', async () => {
    const mockUpdateFormData = vi.fn();
    const mockUseSmartBookingFlow = vi.mocked(require('@/hooks/useSmartBookingFlow').useSmartBookingFlow);
    mockUseSmartBookingFlow.mockReturnValue({
      formData: { service: { id: '1' }, staff: null, date: null, time: null, members: [] },
      sections: {
        service: { state: 'completed', isExpanded: false },
        staff: { state: 'collapsed', isExpanded: false },
        datetime: { state: 'collapsed', isExpanded: false },
      },
      expandSection: vi.fn(),
      completeSection: vi.fn(),
      updateFormData: mockUpdateFormData,
      isSectionExpanded: vi.fn(() => false),
      isSectionCompleted: vi.fn(() => true),
      getProgressPercentage: vi.fn(() => 25),
    });

    render(<SmartBookingFlow {...defaultProps} />);

    const addPersonButton = screen.getByText('+ Add person');
    fireEvent.click(addPersonButton);

    expect(mockUpdateFormData).toHaveBeenCalledWith({
      isGroup: true,
      members: expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/member-/),
          name: 'Guest 1',
          service: { id: '1' },
          staff: undefined,
          date: null,
          time: null,
        }),
      ]),
    });
  });
});



