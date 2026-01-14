/**
 * Sortable Item Components for WaitListSection
 *
 * Provides drag-and-drop wrappers for waitlist ticket cards
 * using @dnd-kit for drag-and-drop functionality.
 */

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { WaitListTicketCard, WaitListTicketCardRefactored } from '@/components/tickets';
import type { SortableListItemProps, SortableGridItemProps } from '../types';

/**
 * Sortable wrapper for list view ticket cards
 */
export const SortableListItem = memo(function SortableListItem({
  ticket,
  viewMode,
  onAssign,
  onEdit,
  onDelete,
  onClick,
  isDragDisabled = false,
}: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style as React.CSSProperties} className="relative group">
      {/* Drag handle */}
      {!isDragDisabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 shadow-sm border border-gray-200 hover:bg-purple-50"
          title="Drag to reorder"
        >
          <GripVertical size={14} className="text-gray-400" />
        </div>
      )}
      <WaitListTicketCard
        ticket={{
          id: ticket.id,
          number: ticket.number,
          clientName: ticket.clientName,
          clientType: ticket.clientType || 'Regular',
          service: ticket.service,
          duration: ticket.duration || '30min',
          time: ticket.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          status: 'waiting',
          notes: ticket.notes,
          checkoutServices: ticket.checkoutServices,
        }}
        viewMode={viewMode}
        onAssign={onAssign}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
      />
    </div>
  );
});

/**
 * Sortable wrapper for grid view ticket cards
 */
export const SortableGridItem = memo(function SortableGridItem({
  ticket,
  viewMode,
  onAssign,
  onEdit,
  onDelete,
  onClick,
  isDragDisabled = false,
}: SortableGridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id, disabled: isDragDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style as React.CSSProperties} className="relative group">
      {/* Drag handle - top right for grid */}
      {!isDragDisabled && (
        <div
          {...attributes}
          {...listeners}
          className="absolute right-1 top-1 z-20 cursor-grab active:cursor-grabbing p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 shadow-sm border border-gray-200 hover:bg-purple-50"
          title="Drag to reorder"
        >
          <GripVertical size={14} className="text-gray-400" />
        </div>
      )}
      <WaitListTicketCardRefactored
        ticket={{
          id: ticket.id,
          number: ticket.number,
          clientName: ticket.clientName,
          clientType: ticket.clientType || 'Regular',
          service: ticket.service,
          duration: ticket.duration || '30min',
          time: ticket.time || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          status: 'waiting' as const,
          notes: ticket.notes,
          createdAt: ticket.createdAt,
          lastVisitDate: ticket.lastVisitDate ?? undefined,
          checkoutServices: ticket.checkoutServices,
        }}
        viewMode={viewMode}
        onAssign={onAssign}
        onEdit={onEdit}
        onDelete={onDelete}
        onClick={onClick}
      />
    </div>
  );
});
