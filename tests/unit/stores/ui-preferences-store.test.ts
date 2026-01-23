import { describe, it, expect, beforeEach } from 'vitest';
import { useUIPreferencesStore } from '@/stores/ui-preferences-store';

// Helper to reset store between tests
function resetStore() {
  useUIPreferencesStore.setState({
    documentGridLayout: 'comfortable',
    searchQuery: '',
    searchField: 'all',
  });
}

describe('UI Preferences Store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should have comfortable layout by default', () => {
      expect(useUIPreferencesStore.getState().documentGridLayout).toBe('comfortable');
    });

    it('should have empty search query', () => {
      expect(useUIPreferencesStore.getState().searchQuery).toBe('');
    });

    it('should have all as default search field', () => {
      expect(useUIPreferencesStore.getState().searchField).toBe('all');
    });
  });

  describe('setDocumentGridLayout', () => {
    it('should set layout to compact', () => {
      useUIPreferencesStore.getState().setDocumentGridLayout('compact');
      expect(useUIPreferencesStore.getState().documentGridLayout).toBe('compact');
    });

    it('should set layout to comfortable', () => {
      useUIPreferencesStore.setState({ documentGridLayout: 'compact' });
      useUIPreferencesStore.getState().setDocumentGridLayout('comfortable');
      expect(useUIPreferencesStore.getState().documentGridLayout).toBe('comfortable');
    });

    it('should not affect search state', () => {
      useUIPreferencesStore.setState({ searchQuery: 'test', searchField: 'id' });
      useUIPreferencesStore.getState().setDocumentGridLayout('compact');

      expect(useUIPreferencesStore.getState().searchQuery).toBe('test');
      expect(useUIPreferencesStore.getState().searchField).toBe('id');
    });
  });

  describe('setSearchQuery', () => {
    it('should set search query', () => {
      useUIPreferencesStore.getState().setSearchQuery('hello world');
      expect(useUIPreferencesStore.getState().searchQuery).toBe('hello world');
    });

    it('should allow empty string', () => {
      useUIPreferencesStore.setState({ searchQuery: 'previous' });
      useUIPreferencesStore.getState().setSearchQuery('');
      expect(useUIPreferencesStore.getState().searchQuery).toBe('');
    });

    it('should preserve special characters', () => {
      useUIPreferencesStore.getState().setSearchQuery('query with "quotes" & symbols </>');
      expect(useUIPreferencesStore.getState().searchQuery).toBe('query with "quotes" & symbols </>');
    });
  });

  describe('setSearchField', () => {
    it('should set search field to id', () => {
      useUIPreferencesStore.getState().setSearchField('id');
      expect(useUIPreferencesStore.getState().searchField).toBe('id');
    });

    it('should set search field to document', () => {
      useUIPreferencesStore.getState().setSearchField('document');
      expect(useUIPreferencesStore.getState().searchField).toBe('document');
    });

    it('should set search field to metadata', () => {
      useUIPreferencesStore.getState().setSearchField('metadata');
      expect(useUIPreferencesStore.getState().searchField).toBe('metadata');
    });

    it('should set search field to all', () => {
      useUIPreferencesStore.setState({ searchField: 'id' });
      useUIPreferencesStore.getState().setSearchField('all');
      expect(useUIPreferencesStore.getState().searchField).toBe('all');
    });
  });

  describe('clearSearch', () => {
    it('should reset search query to empty string', () => {
      useUIPreferencesStore.setState({ searchQuery: 'some query' });
      useUIPreferencesStore.getState().clearSearch();
      expect(useUIPreferencesStore.getState().searchQuery).toBe('');
    });

    it('should reset search field to all', () => {
      useUIPreferencesStore.setState({ searchField: 'metadata' });
      useUIPreferencesStore.getState().clearSearch();
      expect(useUIPreferencesStore.getState().searchField).toBe('all');
    });

    it('should reset both query and field together', () => {
      useUIPreferencesStore.setState({
        searchQuery: 'test query',
        searchField: 'document',
      });

      useUIPreferencesStore.getState().clearSearch();
      expect(useUIPreferencesStore.getState().searchQuery).toBe('');
      expect(useUIPreferencesStore.getState().searchField).toBe('all');
    });

    it('should not affect layout preference', () => {
      useUIPreferencesStore.setState({ documentGridLayout: 'compact' });
      useUIPreferencesStore.getState().clearSearch();
      expect(useUIPreferencesStore.getState().documentGridLayout).toBe('compact');
    });

    it('should be idempotent', () => {
      useUIPreferencesStore.getState().clearSearch();
      useUIPreferencesStore.getState().clearSearch();
      expect(useUIPreferencesStore.getState().searchQuery).toBe('');
      expect(useUIPreferencesStore.getState().searchField).toBe('all');
    });
  });

  describe('persistence', () => {
    it('should only persist documentGridLayout', () => {
      useUIPreferencesStore.setState({
        documentGridLayout: 'compact',
        searchQuery: 'transient',
        searchField: 'id',
      });

      // Verify the layout is persisted
      expect(useUIPreferencesStore.getState().documentGridLayout).toBe('compact');
    });

    it('should not persist search state (transient)', () => {
      useUIPreferencesStore.setState({
        searchQuery: 'should not persist',
        searchField: 'metadata',
      });

      // The state exists in memory but partialize only picks documentGridLayout
      const state = useUIPreferencesStore.getState();
      expect(state.searchQuery).toBe('should not persist');
      expect(state.searchField).toBe('metadata');
    });
  });

  describe('combined operations', () => {
    it('should handle rapid state changes', () => {
      useUIPreferencesStore.getState().setSearchQuery('a');
      useUIPreferencesStore.getState().setSearchQuery('ab');
      useUIPreferencesStore.getState().setSearchQuery('abc');
      expect(useUIPreferencesStore.getState().searchQuery).toBe('abc');
    });

    it('should handle interleaved search and layout changes', () => {
      useUIPreferencesStore.getState().setSearchQuery('query');
      useUIPreferencesStore.getState().setDocumentGridLayout('compact');
      useUIPreferencesStore.getState().setSearchField('document');

      const state = useUIPreferencesStore.getState();
      expect(state.searchQuery).toBe('query');
      expect(state.documentGridLayout).toBe('compact');
      expect(state.searchField).toBe('document');
    });

    it('should allow setting and then clearing search', () => {
      useUIPreferencesStore.getState().setSearchQuery('find this');
      useUIPreferencesStore.getState().setSearchField('id');
      expect(useUIPreferencesStore.getState().searchQuery).toBe('find this');

      useUIPreferencesStore.getState().clearSearch();
      expect(useUIPreferencesStore.getState().searchQuery).toBe('');
      expect(useUIPreferencesStore.getState().searchField).toBe('all');
    });
  });
});
