/**
 * Accessibility utilities for improved keyboard navigation and screen reader support
 */

/**
 * Trap focus within a container element
 */
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  
  return () => element.removeEventListener('keydown', handleKeyDown);
};

/**
 * Announce message to screen readers
 */
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Generate ARIA label for form inputs
 */
export const generateAriaLabel = (label: string, required?: boolean, error?: string): string => {
  let ariaLabel = label;
  if (required) ariaLabel += ', required';
  if (error) ariaLabel += `, error: ${error}`;
  return ariaLabel;
};

/**
 * Check if element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  
  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];
  
  return focusableTags.includes(tagName) || element.hasAttribute('tabindex');
};

/**
 * Get next focusable element
 */
export const getNextFocusable = (current: HTMLElement, reverse = false): HTMLElement | null => {
  const focusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
  
  const currentIndex = focusable.indexOf(current);
  const nextIndex = reverse ? currentIndex - 1 : currentIndex + 1;
  
  return focusable[nextIndex] || null;
};

/**
 * Focus first error in form
 */
export const focusFirstError = (formElement: HTMLElement) => {
  const firstError = formElement.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (firstError) {
    firstError.focus();
    announce('Please correct the errors in the form', 'assertive');
  }
};
