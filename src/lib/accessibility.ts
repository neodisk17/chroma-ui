/**
 * Accessibility utilities for improved keyboard navigation and screen reader support
 */

/**
 * Get ARIA label for action buttons
 */
export function getAriaLabel(action: string, target?: string): string {
  const labels: Record<string, string> = {
    view: `View ${target || 'item'}`,
    edit: `Edit ${target || 'item'}`,
    delete: `Delete ${target || 'item'}`,
    add: `Add ${target || 'item'}`,
    create: `Create ${target || 'item'}`,
    save: `Save ${target || 'changes'}`,
    cancel: 'Cancel',
    close: 'Close',
    refresh: `Refresh ${target || 'data'}`,
    search: `Search ${target || ''}`.trim(),
    filter: `Filter ${target || ''}`.trim(),
    sort: `Sort ${target || ''}`.trim(),
    export: `Export ${target || 'data'}`,
    import: `Import ${target || 'data'}`,
    upload: `Upload ${target || 'file'}`,
    download: `Download ${target || 'file'}`,
    copy: `Copy ${target || 'to clipboard'}`,
    paste: 'Paste',
    undo: 'Undo',
    redo: 'Redo',
    previous: 'Go to previous page',
    next: 'Go to next page',
    first: 'Go to first page',
    last: 'Go to last page',
  };

  return labels[action.toLowerCase()] || action;
}

/**
 * Trap focus within a container (for modals/dialogs)
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift+Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  // Create or get existing live region
  let liveRegion = document.getElementById('sr-live-region');

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
  } else {
    // Update priority if needed
    liveRegion.setAttribute('aria-live', priority);
  }

  // Clear and set message
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion!.textContent = message;
  }, 100);
}

/**
 * Generate unique ID for form field associations
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  return (
    element.getAttribute('aria-hidden') !== 'true' &&
    !element.hasAttribute('hidden') &&
    element.style.display !== 'none' &&
    element.style.visibility !== 'hidden'
  );
}

/**
 * Get descriptive text for status/state
 */
export function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    loading: 'Loading, please wait',
    success: 'Operation completed successfully',
    error: 'An error occurred',
    warning: 'Warning',
    info: 'Information',
    pending: 'Operation pending',
    completed: 'Completed',
    failed: 'Failed',
  };

  return statusTexts[status.toLowerCase()] || status;
}

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'skip-link';
  link.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--primary);
    color: var(--primary-foreground);
    padding: 8px;
    z-index: 100;
    text-decoration: none;
  `;

  link.addEventListener('focus', () => {
    link.style.top = '0';
  });

  link.addEventListener('blur', () => {
    link.style.top = '-40px';
  });

  return link;
}

/**
 * Ensure minimum color contrast ratio
 * Note: This is a simplified check - use a proper tool for production
 * For WCAG AA compliance, need 4.5:1 for normal text, 3:1 for large text
 * You can use a library like 'color-contrast-checker' for this
 */
export function hasMinimumContrast(_foreground: string, _background: string): boolean {
  // This is a placeholder - implement actual contrast ratio calculation
  return true;
}

/**
 * Debounce function for search inputs (accessibility improvement)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
