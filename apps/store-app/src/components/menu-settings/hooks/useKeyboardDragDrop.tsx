/**
 * useKeyboardDragDrop Hook
 *
 * A keyboard-accessible drag and drop wrapper around @dnd-kit.
 * Provides Arrow Up/Down for reordering, Enter to confirm, Escape to cancel,
 * and aria-live announcements for screen readers.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  UniqueIdentifier,
  Announcements,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

export type { DragEndEvent, DragStartEvent, DragOverEvent, UniqueIdentifier };

export { DndContext, SortableContext, closestCenter };

export interface UseKeyboardDragDropOptions<T> {
  /** Array of items to make sortable */
  items: T[];
  /** Key extractor to get unique ID from each item */
  getItemId: (item: T) => string;
  /** Callback when items are reordered */
  onReorder: (newItems: T[], oldIndex: number, newIndex: number) => void;
  /** Optional callback to get item label for announcements */
  getItemLabel?: (item: T) => string;
  /** Layout direction (default: vertical) */
  direction?: 'vertical' | 'horizontal';
  /** Whether drag and drop is disabled */
  disabled?: boolean;
}

export interface UseKeyboardDragDropReturn<T> {
  /** The DndContext component configured for keyboard accessibility */
  sensors: ReturnType<typeof useSensors>;
  /** Handler for drag end events */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Handler for drag start events */
  handleDragStart: (event: DragStartEvent) => void;
  /** Array of item IDs for SortableContext */
  itemIds: string[];
  /** Currently dragging item ID */
  activeId: UniqueIdentifier | null;
  /** Sorting strategy based on direction */
  sortingStrategy: typeof verticalListSortingStrategy | typeof horizontalListSortingStrategy;
  /** Announcements configuration for screen readers */
  announcements: Announcements;
  /** Ref for the live region element */
  liveRegionRef: React.RefObject<HTMLDivElement | null>;
  /** Current announcement message */
  announcement: string;
  /** Move item up by one position (keyboard shortcut) */
  moveItemUp: (itemId: string) => void;
  /** Move item down by one position (keyboard shortcut) */
  moveItemDown: (itemId: string) => void;
  /** Get keyboard props for a drag handle */
  getKeyboardHandleProps: (itemId: string) => {
    role: string;
    tabIndex: number;
    'aria-label': string;
    'aria-describedby': string;
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  };
  /** ID for the keyboard instructions element */
  instructionsId: string;
}

/**
 * Custom hook for keyboard-accessible drag and drop functionality.
 *
 * Features:
 * - Arrow Up/Down keys move items when focused on drag handle
 * - Enter key confirms the move
 * - Escape key cancels drag operation
 * - Screen reader announcements for all actions
 *
 * @example
 * ```tsx
 * const {
 *   sensors,
 *   handleDragEnd,
 *   itemIds,
 *   sortingStrategy,
 *   announcements,
 *   getKeyboardHandleProps,
 * } = useKeyboardDragDrop({
 *   items: categories,
 *   getItemId: (cat) => cat.id,
 *   onReorder: (newItems) => updateCategories(newItems),
 *   getItemLabel: (cat) => cat.name,
 * });
 *
 * return (
 *   <DndContext
 *     sensors={sensors}
 *     collisionDetection={closestCenter}
 *     onDragEnd={handleDragEnd}
 *     accessibility={{ announcements }}
 *   >
 *     <SortableContext items={itemIds} strategy={sortingStrategy}>
 *       {items.map((item) => (
 *         <SortableItem key={item.id} id={item.id}>
 *           <button {...getKeyboardHandleProps(item.id)}>
 *             <GripVertical />
 *           </button>
 *           {item.name}
 *         </SortableItem>
 *       ))}
 *     </SortableContext>
 *   </DndContext>
 * );
 * ```
 */
export function useKeyboardDragDrop<T>({
  items,
  getItemId,
  onReorder,
  getItemLabel = () => 'Item',
  direction = 'vertical',
  disabled = false,
}: UseKeyboardDragDropOptions<T>): UseKeyboardDragDropReturn<T> {
  // Track active drag state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Generate unique IDs for accessibility
  const instructionsId = useMemo(
    () => `keyboard-drag-instructions-${Math.random().toString(36).substring(2, 9)}`,
    []
  );

  // Extract item IDs
  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId]);

  // Configure sensors for both mouse/touch and keyboard interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Choose sorting strategy based on direction
  const sortingStrategy = direction === 'vertical'
    ? verticalListSortingStrategy
    : horizontalListSortingStrategy;

  // Get item by ID
  const getItemById = useCallback(
    (id: UniqueIdentifier): T | undefined => {
      return items.find((item) => getItemId(item) === id);
    },
    [items, getItemId]
  );

  // Announce to screen readers
  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    // Clear after announcement is read
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (disabled) return;

      const item = getItemById(event.active.id);
      if (item) {
        setActiveId(event.active.id);
        const label = getItemLabel(item);
        const position = itemIds.indexOf(String(event.active.id)) + 1;
        announce(`Picked up ${label}. Current position: ${position} of ${items.length}.`);
      }
    },
    [disabled, getItemById, getItemLabel, itemIds, items.length, announce]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (disabled) return;

      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = itemIds.indexOf(String(active.id));
        const newIndex = itemIds.indexOf(String(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          onReorder(newItems, oldIndex, newIndex);

          const item = getItemById(active.id);
          if (item) {
            const label = getItemLabel(item);
            announce(`${label} moved to position ${newIndex + 1} of ${items.length}.`);
          }
        }
      } else {
        // Drag cancelled or no change
        const item = getItemById(active.id);
        if (item) {
          const label = getItemLabel(item);
          announce(`${label} dropped. Position unchanged.`);
        }
      }
    },
    [disabled, itemIds, items, onReorder, getItemById, getItemLabel, announce]
  );

  // Move item up by one position
  const moveItemUp = useCallback(
    (itemId: string) => {
      if (disabled) return;

      const currentIndex = itemIds.indexOf(itemId);
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        const newItems = arrayMove(items, currentIndex, newIndex);
        onReorder(newItems, currentIndex, newIndex);

        const item = getItemById(itemId);
        if (item) {
          const label = getItemLabel(item);
          announce(`${label} moved up to position ${newIndex + 1} of ${items.length}.`);
        }
      } else {
        announce('Already at the first position.');
      }
    },
    [disabled, itemIds, items, onReorder, getItemById, getItemLabel, announce]
  );

  // Move item down by one position
  const moveItemDown = useCallback(
    (itemId: string) => {
      if (disabled) return;

      const currentIndex = itemIds.indexOf(itemId);
      if (currentIndex < itemIds.length - 1) {
        const newIndex = currentIndex + 1;
        const newItems = arrayMove(items, currentIndex, newIndex);
        onReorder(newItems, currentIndex, newIndex);

        const item = getItemById(itemId);
        if (item) {
          const label = getItemLabel(item);
          announce(`${label} moved down to position ${newIndex + 1} of ${items.length}.`);
        }
      } else {
        announce('Already at the last position.');
      }
    },
    [disabled, itemIds, items, onReorder, getItemById, getItemLabel, announce]
  );

  // Get keyboard props for drag handle
  const getKeyboardHandleProps = useCallback(
    (itemId: string) => {
      const item = getItemById(itemId);
      const label = item ? getItemLabel(item) : 'Item';
      const position = itemIds.indexOf(itemId) + 1;

      return {
        role: 'button' as const,
        tabIndex: disabled ? -1 : 0,
        'aria-label': `Reorder ${label}. Current position: ${position} of ${items.length}. Use arrow keys to reorder.`,
        'aria-describedby': instructionsId,
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          if (disabled) return;

          switch (event.key) {
            case 'ArrowUp':
              event.preventDefault();
              moveItemUp(itemId);
              break;
            case 'ArrowDown':
              event.preventDefault();
              moveItemDown(itemId);
              break;
            case 'Escape':
              event.preventDefault();
              (event.currentTarget as HTMLElement).blur();
              announce('Reorder cancelled.');
              break;
            case 'Enter':
            case ' ':
              event.preventDefault();
              announce(`Ready to reorder ${label}. Use arrow keys to move.`);
              break;
          }
        },
      };
    },
    [disabled, getItemById, getItemLabel, itemIds, items.length, instructionsId, moveItemUp, moveItemDown, announce]
  );

  // Announcements configuration for DndContext
  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const item = getItemById(active.id);
        if (item) {
          const label = getItemLabel(item);
          const position = itemIds.indexOf(String(active.id)) + 1;
          return `Picked up ${label}. Current position: ${position} of ${items.length}. Use arrow keys to move, Enter to confirm, Escape to cancel.`;
        }
        return 'Item picked up.';
      },
      onDragOver({ active, over }) {
        if (over) {
          const activeItem = getItemById(active.id);
          const overItem = getItemById(over.id);
          if (activeItem && overItem) {
            const activeLabel = getItemLabel(activeItem);
            const overLabel = getItemLabel(overItem);
            return `${activeLabel} is over ${overLabel}.`;
          }
        }
        return undefined;
      },
      onDragEnd({ active, over }) {
        const item = getItemById(active.id);
        if (item) {
          const label = getItemLabel(item);
          if (over && active.id !== over.id) {
            const newPosition = itemIds.indexOf(String(over.id)) + 1;
            return `${label} dropped. Final position: ${newPosition} of ${items.length}.`;
          }
          return `${label} dropped. Position unchanged.`;
        }
        return 'Item dropped.';
      },
      onDragCancel({ active }) {
        const item = getItemById(active.id);
        if (item) {
          const label = getItemLabel(item);
          return `Reordering ${label} cancelled.`;
        }
        return 'Reordering cancelled.';
      },
    }),
    [getItemById, getItemLabel, itemIds, items.length]
  );

  return {
    sensors,
    handleDragEnd,
    handleDragStart,
    itemIds,
    activeId,
    sortingStrategy,
    announcements,
    liveRegionRef,
    announcement,
    moveItemUp,
    moveItemDown,
    getKeyboardHandleProps,
    instructionsId,
  };
}

/**
 * Keyboard instructions component for screen readers.
 * Should be rendered alongside the sortable list.
 */
export interface KeyboardInstructionsProps {
  id: string;
}

export function KeyboardInstructions({ id }: KeyboardInstructionsProps): React.ReactElement {
  return (
    <div id={id} className="sr-only">
      To reorder, focus on the drag handle and use Arrow Up or Arrow Down keys.
      Press Escape to cancel.
    </div>
  );
}

/**
 * Live region component for screen reader announcements.
 * Should be rendered at the top level of the sortable list container.
 */
export interface LiveAnnouncerProps {
  announcement: string;
}

export function LiveAnnouncer({ announcement }: LiveAnnouncerProps): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

export default useKeyboardDragDrop;
