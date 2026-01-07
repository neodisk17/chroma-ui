import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// Filter Condition Types
// ============================================================================

export type FilterOperator = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin';
export type DocumentFilterOperator = '$contains' | '$not_contains';
export type QueryType = 'similarity' | 'filter' | 'combined';

export interface FilterCondition {
  id: string; // Unique ID for React key
  field: string;
  operator: FilterOperator;
  value: string | number | (string | number)[];
}

export interface DocumentFilterCondition {
  id: string;
  operator: DocumentFilterOperator;
  value: string;
}

export interface QueryResult {
  id: string;
  document: string | null;
  metadata: Record<string, any> | null;
  distance?: number;
}

export interface QueryTemplate {
  id: string;
  name: string;
  queryType: QueryType;
  queryText: string;
  nResults: number;
  metadataFilters: FilterCondition[];
  documentFilters: DocumentFilterCondition[];
  createdAt: string;
}

// ============================================================================
// Store State & Actions
// ============================================================================

interface QueryState {
  // Query configuration
  queryType: QueryType;
  queryText: string;
  nResults: number;
  metadataFilters: FilterCondition[];
  documentFilters: DocumentFilterCondition[];

  // Query execution
  results: QueryResult[] | null;
  isExecuting: boolean;
  error: string | null;

  // Templates
  templates: QueryTemplate[];

  // Actions - Query configuration
  setQueryType: (type: QueryType) => void;
  setQueryText: (text: string) => void;
  setNResults: (n: number) => void;

  // Actions - Metadata filters
  addMetadataFilter: () => void;
  updateMetadataFilter: (id: string, updates: Partial<FilterCondition>) => void;
  removeMetadataFilter: (id: string) => void;

  // Actions - Document filters
  addDocumentFilter: () => void;
  updateDocumentFilter: (id: string, updates: Partial<DocumentFilterCondition>) => void;
  removeDocumentFilter: (id: string) => void;

  // Actions - Query execution
  setResults: (results: QueryResult[] | null) => void;
  setIsExecuting: (isExecuting: boolean) => void;
  setError: (error: string | null) => void;
  clearQuery: () => void;
  clearResults: () => void;

  // Actions - Templates
  saveTemplate: (name: string) => void;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
}

/**
 * Query Store - Manages query builder state
 *
 * This store handles:
 * - Query configuration (similarity search, filters)
 * - Query execution state
 * - Query templates (save/load)
 * - Results storage
 */
export const useQueryStore = create<QueryState>()(
  persist(
    (set, get) => ({
      // Initial state
      queryType: 'similarity',
      queryText: '',
      nResults: 10,
      metadataFilters: [],
      documentFilters: [],
      results: null,
      isExecuting: false,
      error: null,
      templates: [],

      // Query configuration
      setQueryType: (type) => set({ queryType: type }),
      setQueryText: (text) => set({ queryText: text }),
      setNResults: (n) => set({ nResults: n }),

      // Metadata filters
      addMetadataFilter: () => {
        const newFilter: FilterCondition = {
          id: `filter-${Date.now()}-${Math.random()}`,
          field: '',
          operator: '$eq',
          value: '',
        };
        set((state) => ({
          metadataFilters: [...state.metadataFilters, newFilter],
        }));
      },

      updateMetadataFilter: (id, updates) => {
        set((state) => ({
          metadataFilters: state.metadataFilters.map((filter) =>
            filter.id === id ? { ...filter, ...updates } : filter
          ),
        }));
      },

      removeMetadataFilter: (id) => {
        set((state) => ({
          metadataFilters: state.metadataFilters.filter((filter) => filter.id !== id),
        }));
      },

      // Document filters
      addDocumentFilter: () => {
        const newFilter: DocumentFilterCondition = {
          id: `doc-filter-${Date.now()}-${Math.random()}`,
          operator: '$contains',
          value: '',
        };
        set((state) => ({
          documentFilters: [...state.documentFilters, newFilter],
        }));
      },

      updateDocumentFilter: (id, updates) => {
        set((state) => ({
          documentFilters: state.documentFilters.map((filter) =>
            filter.id === id ? { ...filter, ...updates } : filter
          ),
        }));
      },

      removeDocumentFilter: (id) => {
        set((state) => ({
          documentFilters: state.documentFilters.filter((filter) => filter.id !== id),
        }));
      },

      // Query execution
      setResults: (results) => set({ results }),
      setIsExecuting: (isExecuting) => set({ isExecuting }),
      setError: (error) => set({ error }),

      clearQuery: () => {
        set({
          queryText: '',
          nResults: 10,
          metadataFilters: [],
          documentFilters: [],
          results: null,
          error: null,
        });
      },

      clearResults: () => set({ results: null, error: null }),

      // Templates
      saveTemplate: (name) => {
        const state = get();
        const template: QueryTemplate = {
          id: `template-${Date.now()}`,
          name,
          queryType: state.queryType,
          queryText: state.queryText,
          nResults: state.nResults,
          metadataFilters: state.metadataFilters,
          documentFilters: state.documentFilters,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          templates: [...state.templates, template],
        }));
      },

      loadTemplate: (templateId) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (template) {
          set({
            queryType: template.queryType,
            queryText: template.queryText,
            nResults: template.nResults,
            metadataFilters: template.metadataFilters,
            documentFilters: template.documentFilters,
            results: null,
            error: null,
          });
        }
      },

      deleteTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== templateId),
        }));
      },
    }),
    {
      name: 'query-storage',
      // Persist query configuration and templates, but not results
      partialize: (state) => ({
        queryType: state.queryType,
        queryText: state.queryText,
        nResults: state.nResults,
        metadataFilters: state.metadataFilters,
        documentFilters: state.documentFilters,
        templates: state.templates,
      }),
    }
  )
);
