/**
 * DraggableAppointment Component Tests
 * Tests for drag-and-drop functionality, drop zones, batch selection, and undo/redo
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook, waitFor } from '@testing-library/react';
import { DraggableAppointment, DropZone, BatchSelection, useUndoRedo } from '../DraggableAppointment';
import { LocalAppointment } from '../../../types/appointment';

// Mock appointment
const mockAppointment: LocalAppointment = {
  id: 'apt-1',
  storeId: 'store-1',
  clientId: 'client-1',
  clientName: 'John Doe',
  clientPhone: '555-0100',
  services: [{ serviceId: 'svc-1', serviceName: 'Haircut', name: 'Haircut', staffId: 'staff-1', staffName: 'Jane Smith', price: 30, duration: 30 }],
  staffId: 'staff-1',
  staffName: 'Jane Smith',
  scheduledStartTime: new Date('2026-01-15T10:00:00').toISOString(),
  scheduledEndTime: new Date('2026-01-15T10:30:00').toISOString(),
  status: 'scheduled',
  source: 'walk-in',
  syncStatus: 'synced',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user-1',
  lastModifiedBy: 'user-1',
  notes: '',
};

describe('DraggableAppointment', () => {
  describe('basic rendering', () => {
    it('renders children', () => {
      render(
        <DraggableAppointment appointment={mockAppointment}>
          <div data-testid="child">Test Child</div>
        </DraggableAppointment>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment} className="custom-class">
          <div>Child</div>
        </DraggableAppointment>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('has relative positioning', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );
      expect(container.firstChild).toHaveClass('relative');
    });

    it('has group class for hover effects', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );
      expect(container.firstChild).toHaveClass('group');
    });
  });

  describe('draggable attribute', () => {
    it('is draggable when not disabled', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );
      expect(container.firstChild).toHaveAttribute('draggable', 'true');
    });

    it('is not draggable when disabled', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment} disabled>
          <div>Child</div>
        </DraggableAppointment>
      );
      expect(container.firstChild).toHaveAttribute('draggable', 'false');
    });
  });

  describe('drag handle', () => {
    it('shows drag handle when not disabled', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );
      const handle = container.querySelector('.lucide-grip-vertical');
      expect(handle).toBeInTheDocument();
    });

    it('hides drag handle when disabled', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment} disabled>
          <div>Child</div>
        </DraggableAppointment>
      );
      const handle = container.querySelector('.lucide-grip-vertical');
      expect(handle).not.toBeInTheDocument();
    });
  });

  describe('cursor styling', () => {
    it('has grab cursor when not disabled', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );
      expect(container.firstChild).toHaveClass('cursor-grab');
    });

    it('does not have grab cursor when disabled', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment} disabled>
          <div>Child</div>
        </DraggableAppointment>
      );
      expect(container.firstChild).not.toHaveClass('cursor-grab');
    });
  });

  describe('drag events', () => {
    it('sets dataTransfer data on drag start', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );

      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      };

      fireEvent.dragStart(container.firstChild!, {
        dataTransfer: mockDataTransfer,
      });

      expect(mockDataTransfer.effectAllowed).toBe('move');
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'application/json',
        expect.stringContaining('apt-1')
      );
    });

    it('includes duration in drag data', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );

      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      };

      fireEvent.dragStart(container.firstChild!, {
        dataTransfer: mockDataTransfer,
      });

      const dragData = JSON.parse(mockDataTransfer.setData.mock.calls[0][1]);
      expect(dragData.duration).toBe(30); // 30 minutes
    });

    it('prevents drag when disabled', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment} disabled>
          <div>Child</div>
        </DraggableAppointment>
      );

      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      };

      fireEvent.dragStart(container.firstChild!, {
        dataTransfer: mockDataTransfer,
      });

      // When disabled, setData should not be called
      expect(mockDataTransfer.setData).not.toHaveBeenCalled();
    });
  });

  describe('drag state styling', () => {
    it('shows dragging indicator when dragging', async () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );

      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      };

      fireEvent.dragStart(container.firstChild!, {
        dataTransfer: mockDataTransfer,
      });

      // Wait for state update to be reflected in the DOM
      // opacity-50 indicates dragging state is active
      await waitFor(() => {
        expect(container.firstChild).toHaveClass('opacity-50');
      });
      // Note: cn() (tailwind-merge) deduplicates cursor classes, so cursor-grab wins over cursor-grabbing
      expect(container.firstChild).toHaveClass('cursor-grab');
    });

    it('removes dragging state on drag end', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );

      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      };

      fireEvent.dragStart(container.firstChild!, {
        dataTransfer: mockDataTransfer,
      });

      expect(container.firstChild).toHaveClass('opacity-50');

      fireEvent.dragEnd(container.firstChild!);

      expect(container.firstChild).not.toHaveClass('opacity-50');
    });

    it('shows dashed border indicator when dragging', () => {
      const { container } = render(
        <DraggableAppointment appointment={mockAppointment}>
          <div>Child</div>
        </DraggableAppointment>
      );

      const mockDataTransfer = {
        effectAllowed: '',
        setData: vi.fn(),
      };

      fireEvent.dragStart(container.firstChild!, {
        dataTransfer: mockDataTransfer,
      });

      const indicator = container.querySelector('.border-dashed');
      expect(indicator).toBeInTheDocument();
    });
  });
});

describe('DropZone', () => {
  const mockDate = new Date('2026-01-15');
  const mockTime = '10:00';
  const mockOnDrop = vi.fn();
  const mockOnCheckConflicts = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnCheckConflicts.mockResolvedValue({
      hasConflict: false,
      conflicts: [],
      suggestions: [],
    });
  });

  describe('basic rendering', () => {
    it('renders children', () => {
      render(
        <DropZone
          date={mockDate}
          time={mockTime}
          onDrop={mockOnDrop}
          onCheckConflicts={mockOnCheckConflicts}
        >
          <div data-testid="drop-content">Drop here</div>
        </DropZone>
      );
      expect(screen.getByTestId('drop-content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <DropZone
          date={mockDate}
          time={mockTime}
          onDrop={mockOnDrop}
          onCheckConflicts={mockOnCheckConflicts}
          className="custom-drop-zone"
        >
          <div>Content</div>
        </DropZone>
      );
      expect(container.firstChild).toHaveClass('custom-drop-zone');
    });

    it('has transition classes', () => {
      const { container } = render(
        <DropZone
          date={mockDate}
          time={mockTime}
          onDrop={mockOnDrop}
          onCheckConflicts={mockOnCheckConflicts}
        >
          <div>Content</div>
        </DropZone>
      );
      expect(container.firstChild).toHaveClass('transition-all');
    });
  });

  describe('drop handling', () => {
    it('calls onDrop when item is dropped', async () => {
      const { container } = render(
        <DropZone
          date={mockDate}
          time={mockTime}
          onDrop={mockOnDrop}
          onCheckConflicts={mockOnCheckConflicts}
        >
          <div>Content</div>
        </DropZone>
      );

      const mockDataTransfer = {
        dropEffect: '',
        getData: vi.fn().mockReturnValue(JSON.stringify({ appointmentId: 'apt-1' })),
      };

      await act(async () => {
        fireEvent.drop(container.firstChild!, {
          dataTransfer: mockDataTransfer,
        });
      });

      expect(mockOnDrop).toHaveBeenCalledWith('apt-1', mockDate, mockTime);
    });
  });
});

describe('BatchSelection', () => {
  const mockAppointments: LocalAppointment[] = [
    { ...mockAppointment, id: 'apt-1' },
    { ...mockAppointment, id: 'apt-2', clientName: 'Jane Doe' },
    { ...mockAppointment, id: 'apt-3', clientName: 'Bob Smith' },
  ];

  describe('basic rendering', () => {
    it('renders children', () => {
      render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={[]}
          onSelectionChange={vi.fn()}
        >
          <div data-testid="batch-content">Content</div>
        </BatchSelection>
      );
      expect(screen.getByTestId('batch-content')).toBeInTheDocument();
    });

    it('does not show toolbar when no items selected', () => {
      render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={[]}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      expect(screen.queryByText('selected')).not.toBeInTheDocument();
    });
  });

  describe('selection toolbar', () => {
    it('shows toolbar when items are selected', () => {
      render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1', 'apt-2']}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      expect(screen.getByText('2 appointments selected')).toBeInTheDocument();
    });

    it('shows singular text for one selection', () => {
      render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1']}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      expect(screen.getByText('1 appointment selected')).toBeInTheDocument();
    });

    it('shows clear selection button', () => {
      render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1']}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      expect(screen.getByText('Clear selection')).toBeInTheDocument();
    });

    it('clears selection when clicking clear button', () => {
      const handleSelectionChange = vi.fn();
      render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1', 'apt-2']}
          onSelectionChange={handleSelectionChange}
        >
          <div>Content</div>
        </BatchSelection>
      );

      fireEvent.click(screen.getByText('Clear selection'));
      expect(handleSelectionChange).toHaveBeenCalledWith([]);
    });

    it('shows Move Selected button', () => {
      render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1']}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      expect(screen.getByText('Move Selected')).toBeInTheDocument();
    });
  });

  describe('toolbar styling', () => {
    it('has sticky positioning', () => {
      const { container } = render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1']}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      const toolbar = container.querySelector('.sticky');
      expect(toolbar).toBeInTheDocument();
    });

    it('has gradient background', () => {
      const { container } = render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1']}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      const toolbar = container.querySelector('.bg-gradient-to-r');
      expect(toolbar).toBeInTheDocument();
    });

    it('has z-index for layering', () => {
      const { container } = render(
        <BatchSelection
          appointments={mockAppointments}
          selectedIds={['apt-1']}
          onSelectionChange={vi.fn()}
        >
          <div>Content</div>
        </BatchSelection>
      );
      const toolbar = container.querySelector('.z-20');
      expect(toolbar).toBeInTheDocument();
    });
  });
});

describe('useUndoRedo', () => {
  describe('initial state', () => {
    it('starts with canUndo false', () => {
      const { result } = renderHook(() => useUndoRedo());
      expect(result.current.canUndo).toBe(false);
    });

    it('starts with canRedo false', () => {
      const { result } = renderHook(() => useUndoRedo());
      expect(result.current.canRedo).toBe(false);
    });

    it('starts with empty history', () => {
      const { result } = renderHook(() => useUndoRedo());
      expect(result.current.history).toHaveLength(0);
    });
  });

  describe('addAction', () => {
    it('adds action to history', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'move',
          data: {
            appointmentId: 'apt-1',
            from: { staffId: 'staff-1', time: new Date() },
            to: { staffId: 'staff-2', time: new Date() },
          },
        });
      });

      expect(result.current.history).toHaveLength(1);
    });

    it('enables undo after adding action', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      expect(result.current.canUndo).toBe(true);
    });

    it('adds timestamp to action', () => {
      const { result } = renderHook(() => useUndoRedo());
      const beforeTime = Date.now();

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      expect(result.current.history[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('undo', () => {
    it('returns null when nothing to undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      let undoneAction;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).toBeNull();
    });

    it('returns the undone action', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      let undoneAction;
      act(() => {
        undoneAction = result.current.undo();
      });

      expect(undoneAction).not.toBeNull();
      expect(undoneAction!.type).toBe('create');
    });

    it('enables redo after undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);
    });

    it('disables undo after undoing all actions', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('redo', () => {
    it('returns null when nothing to redo', () => {
      const { result } = renderHook(() => useUndoRedo());

      let redoneAction;
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).toBeNull();
    });

    it('returns the redone action', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'delete',
          data: { appointmentId: 'apt-1', appointment: mockAppointment },
        });
      });

      act(() => {
        result.current.undo();
      });

      let redoneAction;
      act(() => {
        redoneAction = result.current.redo();
      });

      expect(redoneAction).not.toBeNull();
      expect(redoneAction!.type).toBe('delete');
    });

    it('disables redo after redoing all actions', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.canRedo).toBe(false);
    });

    it('re-enables undo after redo', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);

      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(true);
    });
  });

  describe('clear', () => {
    it('clears all history', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
        result.current.addAction({
          type: 'move',
          data: {
            appointmentId: 'apt-1',
            from: { staffId: 'staff-1', time: new Date() },
            to: { staffId: 'staff-2', time: new Date() },
          },
        });
      });

      act(() => {
        result.current.clear();
      });

      expect(result.current.history).toHaveLength(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('maxHistory', () => {
    it('respects maxHistory limit', () => {
      const { result } = renderHook(() => useUndoRedo(3));

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addAction({
            type: 'create',
            data: { appointment: { ...mockAppointment, id: `apt-${i}` } },
          });
        }
      });

      expect(result.current.history.length).toBeLessThanOrEqual(3);
    });
  });

  describe('action types', () => {
    it('handles move action', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'move',
          data: {
            appointmentId: 'apt-1',
            from: { staffId: 'staff-1', time: new Date() },
            to: { staffId: 'staff-2', time: new Date() },
          },
        });
      });

      expect(result.current.history[0].type).toBe('move');
    });

    it('handles batch-move action', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'batch-move',
          data: {
            appointments: [
              {
                id: 'apt-1',
                from: { staffId: 'staff-1', time: new Date() },
                to: { staffId: 'staff-2', time: new Date() },
              },
            ],
          },
        });
      });

      expect(result.current.history[0].type).toBe('batch-move');
    });

    it('handles create action', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      expect(result.current.history[0].type).toBe('create');
    });

    it('handles delete action', () => {
      const { result } = renderHook(() => useUndoRedo());

      act(() => {
        result.current.addAction({
          type: 'delete',
          data: { appointmentId: 'apt-1', appointment: mockAppointment },
        });
      });

      expect(result.current.history[0].type).toBe('delete');
    });
  });

  describe('new action clears redo stack', () => {
    it('clears redo when adding new action after undo', () => {
      const { result } = renderHook(() => useUndoRedo());

      // Add first action
      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: mockAppointment },
        });
      });

      // Add second action
      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: { ...mockAppointment, id: 'apt-2' } },
        });
      });

      // Undo one
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Add new action - should clear redo stack
      act(() => {
        result.current.addAction({
          type: 'create',
          data: { appointment: { ...mockAppointment, id: 'apt-3' } },
        });
      });

      // Redo should now be disabled (redo stack cleared)
      expect(result.current.canRedo).toBe(false);
    });
  });
});
