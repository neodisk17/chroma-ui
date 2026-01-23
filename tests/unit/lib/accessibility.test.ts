import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAriaLabel,
  trapFocus,
  announceToScreenReader,
  generateId,
  isVisibleToScreenReader,
  getStatusText,
  createSkipLink,
  hasMinimumContrast,
  debounce,
} from '@/lib/accessibility';

describe('getAriaLabel', () => {
  it('should return correct label for known actions', () => {
    expect(getAriaLabel('view', 'document')).toBe('View document');
    expect(getAriaLabel('edit', 'collection')).toBe('Edit collection');
    expect(getAriaLabel('delete', 'item')).toBe('Delete item');
    expect(getAriaLabel('add', 'connection')).toBe('Add connection');
  });

  it('should use default target when none provided', () => {
    expect(getAriaLabel('view')).toBe('View item');
    expect(getAriaLabel('save')).toBe('Save changes');
    expect(getAriaLabel('refresh')).toBe('Refresh data');
  });

  it('should handle actions without target gracefully', () => {
    expect(getAriaLabel('cancel')).toBe('Cancel');
    expect(getAriaLabel('close')).toBe('Close');
    expect(getAriaLabel('paste')).toBe('Paste');
    expect(getAriaLabel('undo')).toBe('Undo');
    expect(getAriaLabel('redo')).toBe('Redo');
  });

  it('should handle navigation actions', () => {
    expect(getAriaLabel('previous')).toBe('Go to previous page');
    expect(getAriaLabel('next')).toBe('Go to next page');
    expect(getAriaLabel('first')).toBe('Go to first page');
    expect(getAriaLabel('last')).toBe('Go to last page');
  });

  it('should be case-insensitive', () => {
    expect(getAriaLabel('VIEW', 'doc')).toBe('View doc');
    expect(getAriaLabel('DELETE', 'item')).toBe('Delete item');
  });

  it('should return action string for unknown actions', () => {
    expect(getAriaLabel('customAction')).toBe('customAction');
  });

  it('should trim target for search/filter/sort without target', () => {
    expect(getAriaLabel('search')).toBe('Search');
    expect(getAriaLabel('filter')).toBe('Filter');
    expect(getAriaLabel('sort')).toBe('Sort');
  });

  it('should include target for search/filter/sort with target', () => {
    expect(getAriaLabel('search', 'collections')).toBe('Search collections');
    expect(getAriaLabel('filter', 'documents')).toBe('Filter documents');
  });
});

describe('trapFocus', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <button id="first">First</button>
      <input id="middle" />
      <button id="last">Last</button>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should focus first element on initialization', () => {
    trapFocus(container);
    expect(document.activeElement?.id).toBe('first');
  });

  it('should return a cleanup function', () => {
    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe('function');
  });

  it('should trap forward tab at last element', () => {
    trapFocus(container);
    const lastButton = container.querySelector('#last') as HTMLElement;
    lastButton.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should trap backward tab at first element', () => {
    trapFocus(container);
    const firstButton = container.querySelector('#first') as HTMLElement;
    firstButton.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(preventDefault).toHaveBeenCalled();
  });

  it('should not prevent non-Tab keys', () => {
    trapFocus(container);
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('should cleanup event listener on cleanup call', () => {
    const cleanup = trapFocus(container);
    const spy = vi.spyOn(container, 'removeEventListener');
    cleanup();
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('announceToScreenReader', () => {
  afterEach(() => {
    const existing = document.getElementById('sr-live-region');
    if (existing) existing.remove();
  });

  it('should create a live region element', () => {
    announceToScreenReader('Test message');
    const region = document.getElementById('sr-live-region');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('role')).toBe('status');
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should set assertive priority when specified', () => {
    announceToScreenReader('Urgent message', 'assertive');
    const region = document.getElementById('sr-live-region');
    expect(region?.getAttribute('aria-live')).toBe('assertive');
  });

  it('should reuse existing live region', () => {
    announceToScreenReader('First');
    announceToScreenReader('Second');
    const regions = document.querySelectorAll('#sr-live-region');
    expect(regions).toHaveLength(1);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should use default prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^a11y-\d+$/);
  });

  it('should use custom prefix', () => {
    const id = generateId('field');
    expect(id).toMatch(/^field-\d+$/);
  });
});

describe('isVisibleToScreenReader', () => {
  it('should return true for visible elements', () => {
    const el = document.createElement('div');
    expect(isVisibleToScreenReader(el)).toBe(true);
  });

  it('should return false for aria-hidden elements', () => {
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    expect(isVisibleToScreenReader(el)).toBe(false);
  });

  it('should return false for hidden elements', () => {
    const el = document.createElement('div');
    el.setAttribute('hidden', '');
    expect(isVisibleToScreenReader(el)).toBe(false);
  });

  it('should return false for display:none elements', () => {
    const el = document.createElement('div');
    el.style.display = 'none';
    expect(isVisibleToScreenReader(el)).toBe(false);
  });

  it('should return false for visibility:hidden elements', () => {
    const el = document.createElement('div');
    el.style.visibility = 'hidden';
    expect(isVisibleToScreenReader(el)).toBe(false);
  });
});

describe('getStatusText', () => {
  it('should return correct status texts', () => {
    expect(getStatusText('loading')).toBe('Loading, please wait');
    expect(getStatusText('success')).toBe('Operation completed successfully');
    expect(getStatusText('error')).toBe('An error occurred');
    expect(getStatusText('warning')).toBe('Warning');
    expect(getStatusText('pending')).toBe('Operation pending');
    expect(getStatusText('completed')).toBe('Completed');
    expect(getStatusText('failed')).toBe('Failed');
  });

  it('should be case-insensitive', () => {
    expect(getStatusText('Loading')).toBe('Loading, please wait');
    expect(getStatusText('ERROR')).toBe('An error occurred');
  });

  it('should return original string for unknown status', () => {
    expect(getStatusText('custom-status')).toBe('custom-status');
  });
});

describe('createSkipLink', () => {
  it('should create an anchor element', () => {
    const link = createSkipLink('main-content');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('should use default text', () => {
    const link = createSkipLink('main');
    expect(link.textContent).toBe('Skip to main content');
  });

  it('should use custom text', () => {
    const link = createSkipLink('nav', 'Skip navigation');
    expect(link.textContent).toBe('Skip navigation');
  });

  it('should have skip-link class', () => {
    const link = createSkipLink('main');
    expect(link.className).toBe('skip-link');
  });

  it('should be positioned off-screen initially', () => {
    const link = createSkipLink('main');
    expect(link.style.top).toBe('-40px');
  });
});

describe('hasMinimumContrast', () => {
  it('should return true (placeholder implementation)', () => {
    expect(hasMinimumContrast('#000', '#fff')).toBe(true);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should reset timer on subsequent calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('should pass arguments to the original function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should only call with last arguments when called multiple times', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    debounced('third');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('third');
  });
});
