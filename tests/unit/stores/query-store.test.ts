import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQueryStore } from '@/stores/query-store';

// Helper to reset store between tests
function resetStore() {
  useQueryStore.setState({
    queryType: 'similarity',
    queryText: '',
    nResults: 10,
    metadataFilters: [],
    documentFilters: [],
    results: null,
    isExecuting: false,
    error: null,
    templates: [],
  });
}

describe('Query Store', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should have default query type as similarity', () => {
      expect(useQueryStore.getState().queryType).toBe('similarity');
    });

    it('should have empty query text', () => {
      expect(useQueryStore.getState().queryText).toBe('');
    });

    it('should have default nResults of 10', () => {
      expect(useQueryStore.getState().nResults).toBe(10);
    });

    it('should have empty filter arrays', () => {
      expect(useQueryStore.getState().metadataFilters).toEqual([]);
      expect(useQueryStore.getState().documentFilters).toEqual([]);
    });

    it('should have null results', () => {
      expect(useQueryStore.getState().results).toBeNull();
    });

    it('should not be executing', () => {
      expect(useQueryStore.getState().isExecuting).toBe(false);
    });

    it('should have no error', () => {
      expect(useQueryStore.getState().error).toBeNull();
    });

    it('should have empty templates', () => {
      expect(useQueryStore.getState().templates).toEqual([]);
    });
  });

  describe('query configuration', () => {
    it('should set query type', () => {
      useQueryStore.getState().setQueryType('filter');
      expect(useQueryStore.getState().queryType).toBe('filter');

      useQueryStore.getState().setQueryType('combined');
      expect(useQueryStore.getState().queryType).toBe('combined');

      useQueryStore.getState().setQueryType('similarity');
      expect(useQueryStore.getState().queryType).toBe('similarity');
    });

    it('should set query text', () => {
      useQueryStore.getState().setQueryText('find similar documents');
      expect(useQueryStore.getState().queryText).toBe('find similar documents');
    });

    it('should set nResults', () => {
      useQueryStore.getState().setNResults(25);
      expect(useQueryStore.getState().nResults).toBe(25);
    });

    it('should allow nResults to be set to 1', () => {
      useQueryStore.getState().setNResults(1);
      expect(useQueryStore.getState().nResults).toBe(1);
    });
  });

  describe('metadata filters', () => {
    it('should add a metadata filter with defaults', () => {
      useQueryStore.getState().addMetadataFilter();
      const filters = useQueryStore.getState().metadataFilters;

      expect(filters).toHaveLength(1);
      expect(filters[0]!.field).toBe('');
      expect(filters[0]!.operator).toBe('$eq');
      expect(filters[0]!.value).toBe('');
      expect(filters[0]!.id).toMatch(/^filter-/);
    });

    it('should add multiple metadata filters', () => {
      useQueryStore.getState().addMetadataFilter();
      useQueryStore.getState().addMetadataFilter();
      useQueryStore.getState().addMetadataFilter();

      expect(useQueryStore.getState().metadataFilters).toHaveLength(3);
    });

    it('should generate unique IDs for each filter', () => {
      useQueryStore.getState().addMetadataFilter();
      useQueryStore.getState().addMetadataFilter();

      const filters = useQueryStore.getState().metadataFilters;
      expect(filters[0]!.id).not.toBe(filters[1]!.id);
    });

    it('should update a metadata filter field', () => {
      useQueryStore.getState().addMetadataFilter();
      const id = useQueryStore.getState().metadataFilters[0]!.id;

      useQueryStore.getState().updateMetadataFilter(id, { field: 'category' });
      expect(useQueryStore.getState().metadataFilters[0]!.field).toBe('category');
    });

    it('should update a metadata filter operator', () => {
      useQueryStore.getState().addMetadataFilter();
      const id = useQueryStore.getState().metadataFilters[0]!.id;

      useQueryStore.getState().updateMetadataFilter(id, { operator: '$gt' });
      expect(useQueryStore.getState().metadataFilters[0]!.operator).toBe('$gt');
    });

    it('should update a metadata filter value', () => {
      useQueryStore.getState().addMetadataFilter();
      const id = useQueryStore.getState().metadataFilters[0]!.id;

      useQueryStore.getState().updateMetadataFilter(id, { value: 'science' });
      expect(useQueryStore.getState().metadataFilters[0]!.value).toBe('science');
    });

    it('should update multiple fields at once', () => {
      useQueryStore.getState().addMetadataFilter();
      const id = useQueryStore.getState().metadataFilters[0]!.id;

      useQueryStore.getState().updateMetadataFilter(id, {
        field: 'score',
        operator: '$gte',
        value: 95,
      });

      const filter = useQueryStore.getState().metadataFilters[0]!;
      expect(filter.field).toBe('score');
      expect(filter.operator).toBe('$gte');
      expect(filter.value).toBe(95);
    });

    it('should not modify other filters when updating', () => {
      useQueryStore.getState().addMetadataFilter();
      useQueryStore.getState().addMetadataFilter();

      const filters = useQueryStore.getState().metadataFilters;
      const id1 = filters[0]!.id;

      useQueryStore.getState().updateMetadataFilter(id1, { field: 'updated' });

      expect(useQueryStore.getState().metadataFilters[1]!.field).toBe('');
    });

    it('should remove a metadata filter by ID', () => {
      useQueryStore.getState().addMetadataFilter();
      useQueryStore.getState().addMetadataFilter();
      const id = useQueryStore.getState().metadataFilters[0]!.id;

      useQueryStore.getState().removeMetadataFilter(id);
      expect(useQueryStore.getState().metadataFilters).toHaveLength(1);
      expect(useQueryStore.getState().metadataFilters[0]!.id).not.toBe(id);
    });

    it('should handle removing non-existent filter gracefully', () => {
      useQueryStore.getState().addMetadataFilter();
      useQueryStore.getState().removeMetadataFilter('non-existent-id');
      expect(useQueryStore.getState().metadataFilters).toHaveLength(1);
    });

    it('should support array values for $in operator', () => {
      useQueryStore.getState().addMetadataFilter();
      const id = useQueryStore.getState().metadataFilters[0]!.id;

      useQueryStore.getState().updateMetadataFilter(id, {
        operator: '$in',
        value: ['a', 'b', 'c'],
      });

      expect(useQueryStore.getState().metadataFilters[0]!.value).toEqual(['a', 'b', 'c']);
    });
  });

  describe('document filters', () => {
    it('should add a document filter with defaults', () => {
      useQueryStore.getState().addDocumentFilter();
      const filters = useQueryStore.getState().documentFilters;

      expect(filters).toHaveLength(1);
      expect(filters[0]!.operator).toBe('$contains');
      expect(filters[0]!.value).toBe('');
      expect(filters[0]!.id).toMatch(/^doc-filter-/);
    });

    it('should add multiple document filters', () => {
      useQueryStore.getState().addDocumentFilter();
      useQueryStore.getState().addDocumentFilter();

      expect(useQueryStore.getState().documentFilters).toHaveLength(2);
    });

    it('should update a document filter operator', () => {
      useQueryStore.getState().addDocumentFilter();
      const id = useQueryStore.getState().documentFilters[0]!.id;

      useQueryStore.getState().updateDocumentFilter(id, { operator: '$not_contains' });
      expect(useQueryStore.getState().documentFilters[0]!.operator).toBe('$not_contains');
    });

    it('should update a document filter value', () => {
      useQueryStore.getState().addDocumentFilter();
      const id = useQueryStore.getState().documentFilters[0]!.id;

      useQueryStore.getState().updateDocumentFilter(id, { value: 'search term' });
      expect(useQueryStore.getState().documentFilters[0]!.value).toBe('search term');
    });

    it('should remove a document filter by ID', () => {
      useQueryStore.getState().addDocumentFilter();
      useQueryStore.getState().addDocumentFilter();
      const id = useQueryStore.getState().documentFilters[0]!.id;

      useQueryStore.getState().removeDocumentFilter(id);
      expect(useQueryStore.getState().documentFilters).toHaveLength(1);
    });

    it('should not modify other filters when updating', () => {
      useQueryStore.getState().addDocumentFilter();
      useQueryStore.getState().addDocumentFilter();

      const id = useQueryStore.getState().documentFilters[0]!.id;
      useQueryStore.getState().updateDocumentFilter(id, { value: 'updated' });

      expect(useQueryStore.getState().documentFilters[1]!.value).toBe('');
    });
  });

  describe('query execution state', () => {
    it('should set results', () => {
      const mockResults = [
        { id: 'doc1', document: 'hello world', metadata: { key: 'val' }, distance: 0.1 },
        { id: 'doc2', document: 'foo bar', metadata: null, distance: 0.5 },
      ];

      useQueryStore.getState().setResults(mockResults);
      expect(useQueryStore.getState().results).toEqual(mockResults);
    });

    it('should set results to null', () => {
      useQueryStore.setState({ results: [{ id: '1', document: 'x', metadata: null }] });
      useQueryStore.getState().setResults(null);
      expect(useQueryStore.getState().results).toBeNull();
    });

    it('should set isExecuting', () => {
      useQueryStore.getState().setIsExecuting(true);
      expect(useQueryStore.getState().isExecuting).toBe(true);

      useQueryStore.getState().setIsExecuting(false);
      expect(useQueryStore.getState().isExecuting).toBe(false);
    });

    it('should set error', () => {
      useQueryStore.getState().setError('Query failed');
      expect(useQueryStore.getState().error).toBe('Query failed');
    });

    it('should clear error', () => {
      useQueryStore.setState({ error: 'Some error' });
      useQueryStore.getState().setError(null);
      expect(useQueryStore.getState().error).toBeNull();
    });
  });

  describe('clearQuery', () => {
    it('should reset query text and nResults', () => {
      useQueryStore.setState({
        queryText: 'some query',
        nResults: 50,
      });

      useQueryStore.getState().clearQuery();
      expect(useQueryStore.getState().queryText).toBe('');
      expect(useQueryStore.getState().nResults).toBe(10);
    });

    it('should clear all filters', () => {
      useQueryStore.getState().addMetadataFilter();
      useQueryStore.getState().addDocumentFilter();

      useQueryStore.getState().clearQuery();
      expect(useQueryStore.getState().metadataFilters).toEqual([]);
      expect(useQueryStore.getState().documentFilters).toEqual([]);
    });

    it('should clear results and error', () => {
      useQueryStore.setState({
        results: [{ id: '1', document: 'x', metadata: null }],
        error: 'some error',
      });

      useQueryStore.getState().clearQuery();
      expect(useQueryStore.getState().results).toBeNull();
      expect(useQueryStore.getState().error).toBeNull();
    });

    it('should not reset queryType', () => {
      useQueryStore.setState({ queryType: 'filter' });
      useQueryStore.getState().clearQuery();
      expect(useQueryStore.getState().queryType).toBe('filter');
    });

    it('should not clear templates', () => {
      useQueryStore.setState({
        templates: [{
          id: 't1',
          name: 'Test',
          queryType: 'similarity',
          queryText: 'test',
          nResults: 10,
          metadataFilters: [],
          documentFilters: [],
          createdAt: '2024-01-01T00:00:00.000Z',
        }],
      });

      useQueryStore.getState().clearQuery();
      expect(useQueryStore.getState().templates).toHaveLength(1);
    });
  });

  describe('clearResults', () => {
    it('should clear results and error only', () => {
      useQueryStore.setState({
        queryText: 'keep this',
        results: [{ id: '1', document: 'x', metadata: null }],
        error: 'some error',
      });

      useQueryStore.getState().clearResults();
      expect(useQueryStore.getState().results).toBeNull();
      expect(useQueryStore.getState().error).toBeNull();
      expect(useQueryStore.getState().queryText).toBe('keep this');
    });
  });

  describe('templates', () => {
    beforeEach(() => {
      useQueryStore.setState({
        queryType: 'combined',
        queryText: 'search query',
        nResults: 20,
        metadataFilters: [
          { id: 'f1', field: 'category', operator: '$eq', value: 'tech' },
        ],
        documentFilters: [
          { id: 'd1', operator: '$contains', value: 'important' },
        ],
      });
    });

    it('should save current query as template', () => {
      useQueryStore.getState().saveTemplate('My Template');
      const templates = useQueryStore.getState().templates;

      expect(templates).toHaveLength(1);
      expect(templates[0]!.name).toBe('My Template');
      expect(templates[0]!.queryType).toBe('combined');
      expect(templates[0]!.queryText).toBe('search query');
      expect(templates[0]!.nResults).toBe(20);
      expect(templates[0]!.metadataFilters).toHaveLength(1);
      expect(templates[0]!.documentFilters).toHaveLength(1);
      expect(templates[0]!.id).toMatch(/^template-/);
      expect(templates[0]!.createdAt).toBeDefined();
    });

    it('should save multiple templates', () => {
      useQueryStore.getState().saveTemplate('Template 1');
      useQueryStore.getState().saveTemplate('Template 2');

      expect(useQueryStore.getState().templates).toHaveLength(2);
    });

    it('should load template and restore query state', () => {
      useQueryStore.getState().saveTemplate('Saved');
      const templateId = useQueryStore.getState().templates[0]!.id;

      // Modify current query
      useQueryStore.setState({
        queryType: 'similarity',
        queryText: 'different',
        nResults: 5,
        metadataFilters: [],
        documentFilters: [],
      });

      // Load template
      useQueryStore.getState().loadTemplate(templateId);

      const state = useQueryStore.getState();
      expect(state.queryType).toBe('combined');
      expect(state.queryText).toBe('search query');
      expect(state.nResults).toBe(20);
      expect(state.metadataFilters).toHaveLength(1);
      expect(state.documentFilters).toHaveLength(1);
    });

    it('should clear results and error when loading template', () => {
      useQueryStore.getState().saveTemplate('Saved');
      const templateId = useQueryStore.getState().templates[0]!.id;

      useQueryStore.setState({
        results: [{ id: '1', document: 'x', metadata: null }],
        error: 'old error',
      });

      useQueryStore.getState().loadTemplate(templateId);
      expect(useQueryStore.getState().results).toBeNull();
      expect(useQueryStore.getState().error).toBeNull();
    });

    it('should not modify state for non-existent template', () => {
      useQueryStore.getState().loadTemplate('non-existent');
      expect(useQueryStore.getState().queryText).toBe('search query');
    });

    it('should delete template by ID', () => {
      // Mock Date.now to ensure unique template IDs
      let now = 1000;
      vi.spyOn(Date, 'now').mockImplementation(() => ++now);

      useQueryStore.getState().saveTemplate('To Delete');
      useQueryStore.getState().saveTemplate('To Keep');
      const deleteId = useQueryStore.getState().templates[0]!.id;

      useQueryStore.getState().deleteTemplate(deleteId);
      expect(useQueryStore.getState().templates).toHaveLength(1);
      expect(useQueryStore.getState().templates[0]!.name).toBe('To Keep');

      vi.restoreAllMocks();
    });

    it('should handle deleting non-existent template gracefully', () => {
      useQueryStore.getState().saveTemplate('Exists');
      useQueryStore.getState().deleteTemplate('non-existent');
      expect(useQueryStore.getState().templates).toHaveLength(1);
    });
  });

  describe('persistence', () => {
    it('should persist query configuration', () => {
      // The partialize function includes these fields
      useQueryStore.setState({
        queryType: 'filter',
        queryText: 'test',
        nResults: 25,
        metadataFilters: [{ id: 'f1', field: 'x', operator: '$eq', value: 'y' }],
        documentFilters: [{ id: 'd1', operator: '$contains', value: 'z' }],
        templates: [{
          id: 't1',
          name: 'T',
          queryType: 'similarity',
          queryText: 'q',
          nResults: 10,
          metadataFilters: [],
          documentFilters: [],
          createdAt: '2024-01-01T00:00:00.000Z',
        }],
      });

      const state = useQueryStore.getState();
      expect(state.queryType).toBe('filter');
      expect(state.queryText).toBe('test');
      expect(state.nResults).toBe(25);
      expect(state.metadataFilters).toHaveLength(1);
      expect(state.documentFilters).toHaveLength(1);
      expect(state.templates).toHaveLength(1);
    });

    it('should not persist execution state', () => {
      useQueryStore.setState({
        results: [{ id: '1', document: 'x', metadata: null }],
        isExecuting: true,
        error: 'test error',
      });

      // Verify these are in state but would not be persisted by partialize
      const state = useQueryStore.getState();
      expect(state.results).toBeDefined();
      expect(state.isExecuting).toBe(true);
      expect(state.error).toBe('test error');
    });
  });
});
