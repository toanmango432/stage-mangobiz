import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartBookingFlow } from '@/hooks/useSmartBookingFlow';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useSmartBookingFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    expect(result.current.formData).toEqual({
      addOns: [],
      agreedToPolicies: false,
      isGroup: false,
      groupChoiceMade: false,
      groupSetupComplete: false,
      members: [],
    });

    expect(result.current.sections.groupSelection.state).toBe('expanded');
    expect(result.current.sections.serviceSelection.state).toBe('collapsed');
  });

  it('loads draft from localStorage on initialization', () => {
    const draftData = {
      service: { id: '1', name: 'Gel Manicure' },
      staff: { id: '1', name: 'Sarah Chen' },
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(draftData));

    const { result } = renderHook(() => useSmartBookingFlow());

    expect(result.current.formData.service).toEqual(draftData.service);
    expect(result.current.formData.staff).toEqual(draftData.staff);
  });

  it('expands section correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.expandSection('serviceSelection');
    });

    expect(result.current.sections.serviceSelection.isExpanded).toBe(true);
  });

  it('collapses section correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.expandSection('serviceSelection');
      result.current.collapseSection('serviceSelection');
    });

    expect(result.current.sections.serviceSelection.isExpanded).toBe(false);
  });

  it('completes section correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.completeSection('serviceSelection', { id: '1', name: 'Gel Manicure' });
    });

    expect(result.current.sections.serviceSelection.state).toBe('completed');
    expect(result.current.formData.service).toEqual({ id: '1', name: 'Gel Manicure' });
  });

  it('edits section correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    // First complete a section
    act(() => {
      result.current.completeSection('serviceSelection', { id: '1', name: 'Gel Manicure' });
    });

    // Then edit it
    act(() => {
      result.current.editSection('serviceSelection');
    });

    expect(result.current.sections.serviceSelection.state).toBe('expanded');
  });

  it('updates form data correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({ service: { id: '1', name: 'Gel Manicure' } });
    });

    expect(result.current.formData.service).toEqual({ id: '1', name: 'Gel Manicure' });
  });

  it('auto-saves to localStorage', async () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({ service: { id: '1', name: 'Gel Manicure' } });
    });

    // Wait for auto-save to trigger
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 2100));
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'smart-booking-draft',
      expect.stringContaining('"service":{"id":"1","name":"Gel Manicure"}')
    );
  });

  it('detects conflicts correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({
        service: { id: '1', name: 'Gel Manicure' },
        staff: { id: '1', name: 'Sarah Chen' },
        date: '2024-01-15',
        time: '14:00',
        conflicts: ['Time slot no longer available'],
      });
    });

    const conflicts = result.current.detectConflicts();
    expect(conflicts).toEqual([
      {
        type: 'time',
        message: 'Time slot no longer available',
      },
    ]);
  });

  it('suggests alternatives correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({
        service: { id: '1', name: 'Gel Manicure' },
        staff: { id: '1', name: 'Sarah Chen' },
        alternatives: [
          {
            type: 'time',
            option: { date: '2024-01-15', time: '15:00' },
            reason: 'Similar time available',
          },
        ],
      });
    });

    const alternatives = result.current.suggestAlternatives();
    expect(alternatives).toEqual([
      {
        type: 'time',
        option: { date: '2024-01-15', time: '15:00' },
        reason: 'Similar time available',
      },
    ]);
  });

  it('calculates progress correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    // Initially 0% progress
    expect(result.current.progress).toBe(0);

    // Complete service selection (20%)
    act(() => {
      result.current.completeSection('serviceSelection', { id: '1', name: 'Gel Manicure' });
    });

    expect(result.current.progress).toBe(20);

    // Complete staff selection (40%)
    act(() => {
      result.current.completeSection('staffSelection', { id: '1', name: 'Sarah Chen' });
    });

    expect(result.current.progress).toBe(40);

    // Complete date/time selection (60%)
    act(() => {
      result.current.completeSection('dateTime', { date: '2024-01-15', time: '14:00' });
    });

    expect(result.current.progress).toBe(60);
  });

  it('determines if can proceed correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    // Initially cannot proceed
    expect(result.current.canProceed).toBe(false);

    // Complete required sections
    act(() => {
      result.current.completeSection('serviceSelection', { id: '1', name: 'Gel Manicure' });
      result.current.completeSection('staffSelection', { id: '1', name: 'Sarah Chen' });
      result.current.completeSection('dateTime', { date: '2024-01-15', time: '14:00' });
      result.current.completeSection('clientInfo', { name: 'John Doe', email: 'john@example.com' });
    });

    expect(result.current.canProceed).toBe(true);
  });

  it('handles group booking correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({
        isGroup: true,
        members: [
          { id: 'member-1', name: 'Guest 1', service: { id: '1', name: 'Gel Manicure' } },
          { id: 'member-2', name: 'Guest 2', service: { id: '2', name: 'Pedicure' } },
        ],
      });
    });

    expect(result.current.formData.isGroup).toBe(true);
    expect(result.current.formData.members).toHaveLength(2);
  });

  it('handles add-ons correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({
        addOns: [
          { id: 'addon-1', name: 'Nail Art', price: 10 },
          { id: 'addon-2', name: 'Hand Massage', price: 15 },
        ],
      });
    });

    expect(result.current.formData.addOns).toHaveLength(2);
    expect(result.current.formData.addOns[0].name).toBe('Nail Art');
  });

  it('handles policy agreement correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({ agreedToPolicies: true });
    });

    expect(result.current.formData.agreedToPolicies).toBe(true);
  });

  it('handles client info correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    const clientInfo = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
    };

    act(() => {
      result.current.updateFormData({ clientInfo });
    });

    expect(result.current.formData.clientInfo).toEqual(clientInfo);
  });

  it('handles payment info correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    const paymentInfo = {
      depositAmount: 22.50,
      depositPaid: true,
      paymentMethod: 'credit_card',
    };

    act(() => {
      result.current.updateFormData({ paymentInfo });
    });

    expect(result.current.formData.paymentInfo).toEqual(paymentInfo);
  });

  it('handles service questions correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    const questions = {
      'question-1': 'What color would you like?',
      'question-2': 'Any allergies?',
    };

    act(() => {
      result.current.updateFormData({ questions });
    });

    expect(result.current.formData.questions).toEqual(questions);
  });

  it('clears draft when booking is completed', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({ service: { id: '1', name: 'Gel Manicure' } });
    });

    // Simulate booking completion
    act(() => {
      result.current.clearDraft();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('smart-booking-draft');
  });

  it('handles errors correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.completeSection('serviceSelection', { id: '1', name: 'Gel Manicure' });
      result.current.setSectionError('serviceSelection', 'Service not available');
    });

    expect(result.current.sections.serviceSelection.state).toBe('error');
  });

  it('handles section transitions correctly', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    // Complete service selection should auto-expand staff selection
    act(() => {
      result.current.completeSection('serviceSelection', { id: '1', name: 'Gel Manicure' });
    });

    expect(result.current.sections.staffSelection.isExpanded).toBe(true);

    // Complete staff selection should auto-expand date/time selection
    act(() => {
      result.current.completeSection('staffSelection', { id: '1', name: 'Sarah Chen' });
    });

    expect(result.current.sections.dateTime.isExpanded).toBe(true);
  });

  it('handles complex form data updates', () => {
    const { result } = renderHook(() => useSmartBookingFlow());

    const complexData = {
      service: { id: '1', name: 'Gel Manicure', price: 45 },
      staff: { id: '1', name: 'Sarah Chen' },
      date: '2024-01-15',
      time: '14:00',
      isGroup: true,
      members: [
        { id: 'member-1', name: 'Guest 1', service: { id: '1', price: 45 } },
      ],
      addOns: [
        { id: 'addon-1', name: 'Nail Art', price: 10 },
      ],
      clientInfo: { name: 'John Doe', email: 'john@example.com' },
    };

    act(() => {
      result.current.updateFormData(complexData);
    });

    expect(result.current.formData).toMatchObject(complexData);
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() => useSmartBookingFlow());

    act(() => {
      result.current.updateFormData({ service: { id: '1', name: 'Gel Manicure' } });
    });

    // Should not throw error
    expect(result.current.formData.service).toEqual({ id: '1', name: 'Gel Manicure' });
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    const { result } = renderHook(() => useSmartBookingFlow());

    // Should fall back to default state
    expect(result.current.formData).toEqual({
      addOns: [],
      agreedToPolicies: false,
      isGroup: false,
      groupChoiceMade: false,
      groupSetupComplete: false,
      members: [],
    });
  });
});



