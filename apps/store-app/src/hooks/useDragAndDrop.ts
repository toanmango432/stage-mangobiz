/**
 * Drag and Drop Hook for Appointment Rescheduling
 * Handles dragging appointments to new time slots
 */

import { useState, useCallback } from 'react';
import { LocalAppointment } from '../types/appointment';

interface DragState {
  isDragging: boolean;
  draggedAppointment: LocalAppointment | null;
  dragStartPos: { x: number; y: number } | null;
  currentPos: { x: number; y: number } | null;
  targetStaffId: string | null;
  targetTime: Date | null;
}

export function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedAppointment: null,
    dragStartPos: null,
    currentPos: null,
    targetStaffId: null,
    targetTime: null,
  });

  const handleDragStart = useCallback((appointment: LocalAppointment, event: React.MouseEvent) => {
    setDragState({
      isDragging: true,
      draggedAppointment: appointment,
      dragStartPos: { x: event.clientX, y: event.clientY },
      currentPos: { x: event.clientX, y: event.clientY },
      targetStaffId: null,
      targetTime: null,
    });
  }, []);

  const handleDragMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    setDragState(prev => ({
      ...prev,
      currentPos: { x: event.clientX, y: event.clientY },
    }));
  }, [dragState.isDragging]);

  const handleDragEnd = useCallback(() => {
    const result = {
      appointment: dragState.draggedAppointment,
      targetStaffId: dragState.targetStaffId,
      targetTime: dragState.targetTime,
    };

    setDragState({
      isDragging: false,
      draggedAppointment: null,
      dragStartPos: null,
      currentPos: null,
      targetStaffId: null,
      targetTime: null,
    });

    return result;
  }, [dragState]);

  const setDropTarget = useCallback((staffId: string | null, time: Date | null) => {
    setDragState(prev => ({
      ...prev,
      targetStaffId: staffId,
      targetTime: time,
    }));
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    setDropTarget,
  };
}
