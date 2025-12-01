import { useState, useRef, useEffect, useCallback, ReactNode, KeyboardEvent } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuProps {
  /** Trigger button element */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownMenuItem[];
  /** Optional header title */
  header?: string;
  /** Alignment of dropdown */
  align?: 'left' | 'right';
  /** Custom width */
  width?: string;
  /** Color theme for selected state */
  selectedColor?: string;
  /** Controlled open state */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Additional className for dropdown container */
  className?: string;
}

/**
 * Accessible Dropdown Menu Component
 *
 * Features:
 * - ARIA attributes for screen readers
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Focus trap within menu
 * - Auto-close on click outside
 *
 * @example
 * ```tsx
 * <DropdownMenu
 *   trigger={<Button icon={<MoreVertical />} />}
 *   items={[
 *     { id: 'list', label: 'List View', icon: <List />, selected: true },
 *     { id: 'grid', label: 'Grid View', icon: <Grid /> },
 *   ]}
 *   header="View Options"
 * />
 * ```
 */
export function DropdownMenu({
  trigger,
  items,
  header,
  align = 'right',
  width = 'w-48',
  selectedColor = 'text-cyan-600',
  isOpen: controlledOpen,
  onOpenChange,
  className,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const menuId = useRef(`dropdown-menu-${Math.random().toString(36).substr(2, 9)}`);

  // Filter out disabled items for keyboard navigation
  const navigableItems = items.filter(item => !item.disabled);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Close menu on Escape and handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) {
      // Open menu on Enter or Space when focused on trigger
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;

      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev < navigableItems.length - 1 ? prev + 1 : 0;
          return next;
        });
        break;

      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : navigableItems.length - 1;
          return next;
        });
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < navigableItems.length) {
          const item = navigableItems[focusedIndex];
          item.onClick?.();
          setIsOpen(false);
          setFocusedIndex(-1);
        }
        break;

      case 'Tab':
        // Close menu on Tab
        setIsOpen(false);
        setFocusedIndex(-1);
        break;

      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;

      case 'End':
        event.preventDefault();
        setFocusedIndex(navigableItems.length - 1);
        break;
    }
  }, [isOpen, focusedIndex, navigableItems, setIsOpen]);

  // Focus item when focusedIndex changes
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex, isOpen]);

  // Reset focus when menu closes
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFocusedIndex(0);
    }
  };

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger */}
      <div
        onClick={handleTriggerClick}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId.current}
        role="button"
        tabIndex={0}
      >
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId.current}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute mt-1 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg z-50 border border-gray-200 py-1',
            'animate-scale-in',
            width,
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {/* Header */}
          {header && (
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 rounded-t-xl">
              <h3 className="text-xs font-medium text-gray-700">{header}</h3>
            </div>
          )}

          {/* Menu Items */}
          {items.map((item) => {
            const navigableIndex = navigableItems.indexOf(item);

            return (
              <button
                key={item.id}
                ref={el => { itemRefs.current[navigableIndex] = el; }}
                role="menuitem"
                aria-disabled={item.disabled}
                tabIndex={focusedIndex === navigableIndex ? 0 : -1}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center transition-colors',
                  'focus:outline-none focus-visible:bg-gray-100',
                  item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 cursor-pointer',
                  focusedIndex === navigableIndex && 'bg-gray-100'
                )}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => !item.disabled && setFocusedIndex(navigableIndex)}
              >
                {item.icon && (
                  <span className={cn('mr-2', item.selected ? selectedColor : 'text-gray-500')}>
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
                {item.selected && (
                  <Check size={14} className={cn('ml-auto', selectedColor)} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;
