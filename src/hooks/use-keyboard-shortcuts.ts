import { useHotkeys } from 'react-hotkeys-hook';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts hook
 *
 * Shortcuts:
 * - Cmd/Ctrl+K: Open quick search (future feature)
 * - Cmd/Ctrl+R: Refresh current view
 * - Cmd/Ctrl+/: Show keyboard shortcuts help
 * - Escape: Close dialog/modal (handled by individual components)
 */
export function useGlobalKeyboardShortcuts(options?: {
  onRefresh?: () => void;
  onShowHelp?: () => void;
}) {
  const navigate = useNavigate();

  // Refresh current view
  useHotkeys('mod+r', (e) => {
    e.preventDefault();
    options?.onRefresh?.();
    window.location.reload();
  }, [options?.onRefresh]);

  // Show keyboard shortcuts help
  useHotkeys('mod+/', (e) => {
    e.preventDefault();
    options?.onShowHelp?.();
  }, [options?.onShowHelp]);

  // Navigate to home
  useHotkeys('mod+h', (e) => {
    e.preventDefault();
    navigate('/');
  }, [navigate]);

  // Navigate to collections
  useHotkeys('mod+shift+c', (e) => {
    e.preventDefault();
    navigate('/collections');
  }, [navigate]);

  // Navigate to query builder
  useHotkeys('mod+shift+q', (e) => {
    e.preventDefault();
    navigate('/query');
  }, [navigate]);
}

/**
 * Page-specific keyboard shortcuts
 */
export function usePageKeyboardShortcuts(options: {
  onNew?: () => void;
  onSearch?: () => void;
  onExecute?: () => void;
}) {
  // New item (Cmd/Ctrl+N)
  useHotkeys('mod+n', (e) => {
    e.preventDefault();
    options.onNew?.();
  }, { enabled: !!options.onNew }, [options.onNew]);

  // Search (Cmd/Ctrl+F)
  useHotkeys('mod+f', (e) => {
    e.preventDefault();
    options.onSearch?.();
  }, { enabled: !!options.onSearch }, [options.onSearch]);

  // Execute query (Cmd/Ctrl+Enter)
  useHotkeys('mod+enter', (e) => {
    e.preventDefault();
    options.onExecute?.();
  }, { enabled: !!options.onExecute }, [options.onExecute]);
}

/**
 * Keyboard shortcuts reference
 */
export const KEYBOARD_SHORTCUTS = {
  global: [
    { keys: ['Cmd', 'R'], description: 'Refresh current view', mac: 'Cmd+R', windows: 'Ctrl+R' },
    { keys: ['Cmd', '/'], description: 'Show keyboard shortcuts', mac: 'Cmd+/', windows: 'Ctrl+/' },
    { keys: ['Cmd', 'H'], description: 'Go to home', mac: 'Cmd+H', windows: 'Ctrl+H' },
    { keys: ['Cmd', 'Shift', 'C'], description: 'Go to collections', mac: 'Cmd+Shift+C', windows: 'Ctrl+Shift+C' },
    { keys: ['Cmd', 'Shift', 'Q'], description: 'Go to query builder', mac: 'Cmd+Shift+Q', windows: 'Ctrl+Shift+Q' },
  ],
  page: [
    { keys: ['Cmd', 'N'], description: 'Create new (collection/document)', mac: 'Cmd+N', windows: 'Ctrl+N' },
    { keys: ['Cmd', 'F'], description: 'Search/Filter', mac: 'Cmd+F', windows: 'Ctrl+F' },
    { keys: ['Cmd', 'Enter'], description: 'Execute query', mac: 'Cmd+Enter', windows: 'Ctrl+Enter' },
    { keys: ['Escape'], description: 'Close dialog', mac: 'Esc', windows: 'Esc' },
  ],
};
