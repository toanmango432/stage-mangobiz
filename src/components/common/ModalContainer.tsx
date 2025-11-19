import React, { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'right' | 'left' | 'top' | 'bottom';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  containerClassName?: string;
  backdropClassName?: string;
  noPadding?: boolean;
  'aria-label'?: string;
}

/**
 * Reusable modal container component
 * Provides consistent modal behavior across the application
 */
export function ModalContainer({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  containerClassName,
  backdropClassName,
  noPadding = false,
  'aria-label': ariaLabel,
}: ModalContainerProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modalElement = modalRef.current;
    if (!modalElement) return;

    // Focus first focusable element or modal container
    const focusableElements = modalElement.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element or modal itself
    if (firstElement) {
      firstElement.focus();
    } else {
      modalElement.focus();
    }

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md w-full mx-4 sm:mx-0',
    md: 'max-w-2xl w-full mx-4 sm:mx-0',
    lg: 'max-w-4xl w-full mx-4 sm:mx-0',
    xl: 'max-w-6xl w-full mx-4 sm:mx-0',
    full: 'max-w-full w-full mx-4 sm:mx-0',
  };

  const positionClasses = {
    center: 'items-end sm:items-center justify-center',
    right: 'items-end sm:items-center justify-end',
    left: 'items-end sm:items-center justify-start',
    top: 'items-start justify-center pt-4 sm:pt-20',
    bottom: 'items-end justify-center pb-4 sm:pb-20',
  };

  const modalPositionClasses = {
    center: 'rounded-t-2xl sm:rounded-2xl max-h-[90vh] sm:max-h-[85vh]',
    right: 'h-full rounded-l-2xl rounded-r-none max-w-full sm:max-w-[90vw]',
    left: 'h-full rounded-r-2xl rounded-l-none max-w-full sm:max-w-[90vw]',
    top: 'w-full rounded-b-2xl sm:rounded-2xl',
    bottom: 'w-full rounded-t-2xl sm:rounded-2xl',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 transition-opacity duration-200',
          backdropClassName
        )}
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex overflow-y-auto',
          positionClasses[position],
          containerClassName
        )}
      >
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel || title || 'Modal'}
          tabIndex={-1}
          className={cn(
            'relative bg-white shadow-2xl',
            sizeClasses[size],
            modalPositionClasses[position],
            'animate-fade-in-up',
            'flex flex-col',
            className
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
              {title && (
                <div className="pr-2">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
                  {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{subtitle}</p>}
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className={cn(
            !noPadding && 'px-4 sm:px-6 py-3 sm:py-4',
            'overflow-y-auto flex-1',
            'max-h-[calc(90vh-8rem)] sm:max-h-[calc(85vh-8rem)]'
          )}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Modal header component for consistent styling
 */
export function ModalHeader({
  title,
  subtitle,
  onClose,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200', className)}>
      <div className="flex-1 pr-2">
        {title && <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>}
        {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{subtitle}</p>}
        {children}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2 sm:ml-4 flex-shrink-0"
          aria-label="Close"
        >
          <X className="w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />
        </button>
      )}
    </div>
  );
}

/**
 * Modal footer component for action buttons
 */
export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      'px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200',
      'flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3',
      className
    )}>
      {children}
    </div>
  );
}