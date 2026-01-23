import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Layout Types
// ============================================================================

export type LayoutMode = 'compact' | 'comfortable';
export type SearchField = 'all' | 'id' | 'document' | 'metadata';

// ============================================================================
// Store State & Actions
// ============================================================================

interface UIPreferencesState {
  // Document Grid Preferences
  documentGridLayout: LayoutMode;
  searchQuery: string;
  searchField: SearchField;

  // Actions
  setDocumentGridLayout: (layout: LayoutMode) => void;
  setSearchQuery: (query: string) => void;
  setSearchField: (field: SearchField) => void;
  clearSearch: () => void;
}

/**
 * UI Preferences Store - Manages user interface preferences
 *
 * This store handles:
 * - Document grid layout mode (compact/comfortable)
 * - Search state and field selection
 * - Persisted to localStorage
 */
export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      // Initial state
      documentGridLayout: 'comfortable',
      searchQuery: '',
      searchField: 'all',

      // Actions
      setDocumentGridLayout: (layout) => set({ documentGridLayout: layout }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchField: (field) => set({ searchField: field }),
      clearSearch: () => set({ searchQuery: '', searchField: 'all' }),
    }),
    {
      name: 'ui-preferences-storage',
      // Only persist layout preference, not search state
      partialize: (state) => ({
        documentGridLayout: state.documentGridLayout,
      }),
    }
  )
);
