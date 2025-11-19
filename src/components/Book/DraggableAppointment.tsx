/**
 * Draggable Appointment Component
 * Makes appointments draggable with conflict detection and smart suggestions
 * Library-agnostic wrapper ready for @dnd-kit integration
 */

import { useState, useRef, useCallback } from 'react';
import { GripVertical, AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LocalAppointment } from '../../types/appointment';

interface ConflictInfo {
  hasConflict: boolean;
  conflicts: string[];
  suggestions: {
    time: string;
    reason: string;
    isOptimal: boolean;
  }[];
}

interface DragState {
  isDragging: boolean;
  targetDate?: Date;
  targetTime?: string;
  conflictInfo?: ConflictInfo;
}

interface DraggableAppointmentProps {
  appointment: LocalAppointment;
  onDrop: (appointmentId: string, newDate: Date, newTime: string) => Promise<void>;
  onCheckConflicts: (appointmentId: string, date: Date, time: string) => Promise<ConflictInfo>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function DraggableAppointment({
  appointment,
  onDrop,
  onCheckConflicts,
  children,
  className,
  disabled = false,
}: DraggableAppointmentProps) {
  const [dragState, setDragState] = useState<DragState>({ isDragging: false });
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    dragStartPos.current = { x: e.clientX, y: e.clientY };

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      appointmentId: appointment.id,
      clientName: appointment.clientName,
      duration: Math.round(
        (new Date(appointment.scheduledEndTime).getTime() -
         new Date(appointment.scheduledStartTime).getTime()) / 60000
      ),
    }));

    setDragState({ isDragging: true });
  }, [appointment, disabled]);

  const handleDragEnd = useCallback(() => {
    setDragState({ isDragging: false });
  }, []);

  return (
    <div
      ref={dragRef}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'relative group',
        dragState.isDragging && 'opacity-50 cursor-grabbing',
        !disabled && 'cursor-grab hover:shadow-lg transition-shadow',
        className
      )}
    >
      {/* Drag Handle */}
      {!disabled && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="px-1 py-2 bg-gray-100 rounded-l-lg border border-r-0 border-gray-300">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      )}

      {children}

      {/* Dragging Indicator */}
      {dragState.isDragging && (
        <div className="absolute inset-0 border-2 border-dashed border-teal-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

/**
 * Drop Zone Component
 * Displays valid/invalid drop zones with conflict detection
 */
interface DropZoneProps {
  date: Date;
  time: string; // "14:00"
  onDrop: (appointmentId: string, date: Date, time: string) => Promise<void>;
  onCheckConflicts: (appointmentId: string, date: Date, time: string) => Promise<ConflictInfo>;
  className?: string;
  children?: React.ReactNode;
}

export function DropZone({
  date,
  time,
  onDrop,
  onCheckConflicts,
  className,
  children,
}: DropZoneProps) {
  const [dropState, setDropState] = useState<{
    isOver: boolean;
    conflictInfo?: ConflictInfo;
    draggedAppointmentId?: string;
  }>({ isOver: false });

  const handleDragOver = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Extract appointment info
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.appointmentId !== dropState.draggedAppointmentId) {
        // Check conflicts for this time slot
        const conflictInfo = await onCheckConflicts(data.appointmentId, date, time);
        setDropState({
          isOver: true,
          conflictInfo,
          draggedAppointmentId: data.appointmentId,
        });
      } else {
        setDropState(prev => ({ ...prev, isOver: true }));
      }
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  }, [date, time, onCheckConflicts, dropState.draggedAppointmentId]);

  const handleDragLeave = useCallback(() => {
    setDropState(prev => ({ ...prev, isOver: false }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      await onDrop(data.appointmentId, date, time);
      setDropState({ isOver: false });
    } catch (error) {
      console.error('Error dropping appointment:', error);
    }
  }, [date, time, onDrop]);

  const hasConflict = dropState.conflictInfo?.hasConflict;
  const isValid = dropState.isOver && !hasConflict;
  const isInvalid = dropState.isOver && hasConflict;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative transition-all duration-200',
        dropState.isOver && 'ring-2 ring-offset-2',
        isValid && 'ring-green-500 bg-green-50',
        isInvalid && 'ring-red-500 bg-red-50',
        className
      )}
    >
      {children}

      {/* Drop Indicator */}
      {dropState.isOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
            'absolute top-0 left-0 right-0 flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg',
            isValid && 'bg-green-100 text-green-900',
            isInvalid && 'bg-red-100 text-red-900'
          )}>
            {isValid ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Drop here to reschedule</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Conflict detected</span>
              </>
            )}
          </div>

          {/* Conflict Details */}
          {isInvalid && dropState.conflictInfo && (
            <div className="absolute top-10 left-0 right-0 bg-white border-2 border-red-300 rounded-lg p-3 shadow-lg z-50 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-red-900 mb-2">Conflicts:</p>
              <ul className="space-y-1">
                {dropState.conflictInfo.conflicts.map((conflict, idx) => (
                  <li key={idx} className="text-xs text-red-700 flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{conflict}</span>
                  </li>
                ))}
              </ul>

              {/* Suggestions */}
              {dropState.conflictInfo.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Suggested times:
                  </p>
                  <div className="space-y-1">
                    {dropState.conflictInfo.suggestions.slice(0, 3).map((suggestion, idx) => (
                      <div key={idx} className="text-xs text-gray-700 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">{suggestion.time}</span>
                        <span className="text-gray-500">- {suggestion.reason}</span>
                        {suggestion.isOptimal && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                            Best
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Batch Selection Component
 * Select multiple appointments to move together
 */
interface BatchSelectionProps {
  appointments: LocalAppointment[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBatchMove: (appointmentIds: string[], date: Date, time: string) => Promise<void>;
  children: React.ReactNode;
}

export function BatchSelection({
  appointments,
  selectedIds,
  onSelectionChange,
  onBatchMove,
  children,
}: BatchSelectionProps) {
  const isSelected = (id: string) => selectedIds.includes(id);

  const toggleSelection = useCallback((id: string) => {
    if (isSelected(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }, [selectedIds, onSelectionChange]);

  const selectAll = useCallback(() => {
    onSelectionChange(appointments.map(a => a.id));
  }, [appointments, onSelectionChange]);

  const clearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  return (
    <div>
      {/* Batch Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="font-semibold">
                {selectedIds.length} appointment{selectedIds.length !== 1 ? 's' : ''} selected
              </p>
              <button
                onClick={clearSelection}
                className="text-sm underline hover:no-underline"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors"
                onClick={() => {
                  // Show batch move dialog
                  console.log('Batch move:', selectedIds);
                }}
              >
                Move Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Undo/Redo Manager Hook
 */
interface Action {
  type: 'move' | 'batch-move' | 'create' | 'delete';
  data: any;
  timestamp: number;
}

export function useUndoRedo(maxHistory: number = 50) {
  const [history, setHistory] = useState<Action[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const addAction = useCallback((action: Omit<Action, 'timestamp'>) => {
    const newAction: Action = {
      ...action,
      timestamp: Date.now(),
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newAction);
      return newHistory.slice(-maxHistory);
    });

    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (!canUndo) return null;
    const action = history[currentIndex];
    setCurrentIndex(prev => prev - 1);
    return action;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (!canRedo) return null;
    const action = history[currentIndex + 1];
    setCurrentIndex(prev => prev + 1);
    return action;
  }, [canRedo, currentIndex, history]);

  const clear = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    canUndo,
    canRedo,
    addAction,
    undo,
    redo,
    clear,
    history,
  };
}
