import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdditiveGroupBooking } from '@/components/booking/AdditiveGroupBooking';

// Mock child components
vi.mock('@/components/booking/BookingCard', () => ({
  BookingCard: ({ memberName, memberIndex, onRemove, onServiceChange, onStaffChange, onDateTimeChange }: any) => (
    <div data-testid={`booking-card-${memberIndex}`}>
      <span>{memberName}</span>
      <button onClick={() => onRemove()}>Remove</button>
      <button onClick={() => onServiceChange({ id: '1', name: 'Service' })}>Change Service</button>
      <button onClick={() => onStaffChange({ id: '1', name: 'Staff' })}>Change Staff</button>
      <button onClick={() => onDateTimeChange({ date: '2024-01-15', time: '14:00' })}>Change DateTime</button>
    </div>
  ),
}));

vi.mock('@/components/booking/MobileBottomSheet', () => ({
  MobileBottomSheet: ({ children, isOpen }: any) => 
    isOpen ? <div data-testid="mobile-bottom-sheet">{children}</div> : null,
}));

describe('AdditiveGroupBooking', () => {
  const defaultProps = {
    members: [],
    onMembersChange: vi.fn(),
    onAddMember: vi.fn(),
    onRemoveMember: vi.fn(),
    onMemberServiceChange: vi.fn(),
    onMemberStaffChange: vi.fn(),
    onMemberDateTimeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows "+ Add another person" when no members', () => {
    render(<AdditiveGroupBooking {...defaultProps} />);

    expect(screen.getByText('+ Add another person')).toBeInTheDocument();
  });

  it('displays member cards when members exist', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByTestId('booking-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('booking-card-2')).toBeInTheDocument();
  });

  it('shows group summary with correct totals', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1', price: 45 } },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2', price: 60 } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('2 people')).toBeInTheDocument();
    expect(screen.getByText('$105')).toBeInTheDocument();
  });

  it('removes member correctly', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    const removeButton = screen.getAllByText('Remove')[0];
    fireEvent.click(removeButton);

    expect(defaultProps.onRemoveMember).toHaveBeenCalledWith('member-1');
  });

  it('opens service selection bottom sheet', async () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    const changeServiceButton = screen.getByText('Change Service');
    fireEvent.click(changeServiceButton);

    await waitFor(() => {
      expect(screen.getByTestId('mobile-bottom-sheet')).toBeInTheDocument();
    });
  });

  it('updates member when staff changes', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    const changeStaffButton = screen.getByText('Change Staff');
    fireEvent.click(changeStaffButton);

    expect(defaultProps.onMemberStaffChange).toHaveBeenCalledWith('member-1', { id: '1', name: 'Staff' });
  });

  it('updates member when date/time changes', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    const changeDateTimeButton = screen.getByText('Change DateTime');
    fireEvent.click(changeDateTimeButton);

    expect(defaultProps.onMemberDateTimeChange).toHaveBeenCalledWith('member-1', { date: '2024-01-15', time: '14:00' });
  });

  it('tracks completion status correctly', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' }, staff: { id: '1', name: 'Staff 1' }, date: '2024-01-15', time: '14:00' },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2' }, staff: null, date: null, time: null },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    // First member should be complete
    expect(screen.getByTestId('booking-card-1')).toHaveClass('complete');
    
    // Second member should be incomplete
    expect(screen.getByTestId('booking-card-2')).toHaveClass('incomplete');
  });

  it('expands/collapses correctly', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    const expandButton = screen.getByText('Group Details');
    fireEvent.click(expandButton);

    expect(screen.getByText('Collapse')).toBeInTheDocument();
  });

  it('adds new member when "+ Add another person" is clicked', () => {
    render(<AdditiveGroupBooking {...defaultProps} />);

    const addButton = screen.getByText('+ Add another person');
    fireEvent.click(addButton);

    expect(defaultProps.onAddMember).toHaveBeenCalledTimes(1);
  });

  it('auto-generates member names correctly', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('Guest 1')).toBeInTheDocument();
    expect(screen.getByText('Guest 2')).toBeInTheDocument();
  });

  it('calculates price accurately', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1', price: 45 } },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2', price: 60 } },
      { id: 'member-3', name: 'Guest 3', service: { id: '3', name: 'Service 3', price: 80 } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('$185')).toBeInTheDocument(); // 45 + 60 + 80
  });

  it('calculates duration accurately', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1', duration: 60 } },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2', duration: 45 } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('105 min')).toBeInTheDocument(); // 60 + 45
  });

  it('shows completion checkmark when all members complete', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' }, staff: { id: '1', name: 'Staff 1' }, date: '2024-01-15', time: '14:00' },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2' }, staff: { id: '2', name: 'Staff 2' }, date: '2024-01-15', time: '14:00' },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByTestId('completion-checkmark')).toBeInTheDocument();
  });

  it('handles empty members array', () => {
    render(<AdditiveGroupBooking {...defaultProps} members={[]} />);

    expect(screen.getByText('+ Add another person')).toBeInTheDocument();
    expect(screen.queryByText('people')).not.toBeInTheDocument();
  });

  it('handles single member', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1', price: 45 } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('1 person')).toBeInTheDocument();
    expect(screen.getByText('$45')).toBeInTheDocument();
  });

  it('handles members without services', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: null },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('0 min')).toBeInTheDocument();
  });

  it('updates member service correctly', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' } },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    const changeServiceButton = screen.getByText('Change Service');
    fireEvent.click(changeServiceButton);

    expect(defaultProps.onMemberServiceChange).toHaveBeenCalledWith('member-1', { id: '1', name: 'Service' });
  });

  it('shows progress indicator', () => {
    const members = [
      { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Service 1' }, staff: { id: '1', name: 'Staff 1' }, date: '2024-01-15', time: '14:00' },
      { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Service 2' }, staff: null, date: null, time: null },
    ];

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('1 of 2 complete')).toBeInTheDocument();
  });

  it('handles large group sizes', () => {
    const members = Array.from({ length: 10 }, (_, i) => ({
      id: `member-${i + 1}`,
      name: `Guest ${i + 1}`,
      service: { id: `${i + 1}`, name: `Service ${i + 1}`, price: 45 },
    }));

    render(<AdditiveGroupBooking {...defaultProps} members={members} />);

    expect(screen.getByText('10 people')).toBeInTheDocument();
    expect(screen.getByText('$450')).toBeInTheDocument();
  });
});



