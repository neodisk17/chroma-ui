import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryBuilder } from '../../../src/components/query/QueryBuilder';

// Mock query store state
const mockQueryStore = {
  queryText: '',
  metadataFilters: [] as any[],
  documentFilters: [] as any[],
  nResults: 10,
  isExecuting: false,
  error: null as string | null,
  clearQuery: vi.fn(),
};

vi.mock('../../../src/stores/query-store', () => ({
  useQueryStore: () => mockQueryStore,
}));

// Mock chromadb hooks
const mockMutateAsync = vi.fn();

vi.mock('../../../src/hooks/use-chromadb', () => ({
  useExecuteQuery: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

// Mock sub-components
vi.mock('../../../src/components/query/SimilaritySearchSection', () => ({
  SimilaritySearchSection: () => <div data-testid="similarity-section">Similarity Search</div>,
}));

vi.mock('../../../src/components/query/MetadataFilterSection', () => ({
  MetadataFilterSection: ({ collectionName }: any) => (
    <div data-testid="metadata-filter-section">Metadata: {collectionName}</div>
  ),
}));

vi.mock('../../../src/components/query/DocumentFilterSection', () => ({
  DocumentFilterSection: () => <div data-testid="document-filter-section">Document Filters</div>,
}));

vi.mock('../../../src/components/query/QueryResults', () => ({
  QueryResults: ({ collectionName }: any) => (
    <div data-testid="query-results">Results: {collectionName}</div>
  ),
}));

vi.mock('../../../src/components/query/QueryTemplates', () => ({
  QueryTemplates: () => <div data-testid="query-templates">Templates</div>,
}));

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span className={className} data-testid="badge">{children}</span>,
}));

vi.mock('../../../src/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../../src/components/ui/collapsible', () => ({
  Collapsible: ({ children, open }: any) => <div data-open={open}>{children}</div>,
  CollapsibleContent: ({ children }: any) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children, asChild }: any) => <div data-testid="collapsible-trigger">{children}</div>,
}));

vi.mock('lucide-react', () => ({
  PlayCircle: () => <span data-testid="play-icon" />,
  XCircle: () => <span data-testid="x-icon" />,
  ChevronDown: () => <span />,
  ChevronUp: () => <span />,
  Search: () => <span />,
  Filter: () => <span />,
  FileText: () => <span />,
}));

describe('QueryBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryStore.queryText = '';
    mockQueryStore.metadataFilters = [];
    mockQueryStore.documentFilters = [];
    mockQueryStore.nResults = 10;
    mockQueryStore.isExecuting = false;
    mockQueryStore.error = null;
  });

  it('renders Query Builder heading', () => {
    render(<QueryBuilder collectionName="test_collection" />);
    expect(screen.getByText('Query Builder')).toBeInTheDocument();
  });

  it('shows collection name badge when provided', () => {
    render(<QueryBuilder collectionName="my_collection" />);
    expect(screen.getByText('my_collection')).toBeInTheDocument();
  });

  it('renders SimilaritySearchSection', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByTestId('similarity-section')).toBeInTheDocument();
  });

  it('renders MetadataFilterSection with collection name', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByTestId('metadata-filter-section')).toHaveTextContent('Metadata: test');
  });

  it('renders DocumentFilterSection', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByTestId('document-filter-section')).toBeInTheDocument();
  });

  it('renders QueryResults with collection name', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByTestId('query-results')).toHaveTextContent('Results: test');
  });

  it('renders QueryTemplates', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByTestId('query-templates')).toBeInTheDocument();
  });

  it('renders Execute Query button', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Execute Query')).toBeInTheDocument();
  });

  it('renders Clear All Filters button', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
  });

  it('disables Execute Query when query is empty', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Execute Query')).toBeDisabled();
  });

  it('disables Clear All Filters when query is empty', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Clear All Filters')).toBeDisabled();
  });

  it('disables Execute Query when no collection name', () => {
    mockQueryStore.queryText = 'some search';
    render(<QueryBuilder collectionName={undefined} />);
    expect(screen.getByText('Execute Query')).toBeDisabled();
  });

  it('disables Execute Query while executing', () => {
    mockQueryStore.queryText = 'some search';
    mockQueryStore.isExecuting = true;
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Executing...')).toBeDisabled();
  });

  it('shows Executing... text during execution', () => {
    mockQueryStore.isExecuting = true;
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });

  it('enables Execute Query when query has text and collection', () => {
    mockQueryStore.queryText = 'search term';
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Execute Query')).not.toBeDisabled();
  });

  it('enables Execute Query when metadata filters exist', () => {
    mockQueryStore.metadataFilters = [
      { id: '1', field: 'category', operator: '$eq', value: 'news' },
    ];
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Execute Query')).not.toBeDisabled();
  });

  it('enables Execute Query when document filters exist', () => {
    mockQueryStore.documentFilters = [
      { id: '1', operator: '$contains', value: 'hello' },
    ];
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Execute Query')).not.toBeDisabled();
  });

  it('calls clearQuery when Clear All Filters is clicked', () => {
    mockQueryStore.queryText = 'some text';
    render(<QueryBuilder collectionName="test" />);

    fireEvent.click(screen.getByText('Clear All Filters'));
    expect(mockQueryStore.clearQuery).toHaveBeenCalled();
  });

  it('calls executeQuery.mutateAsync when Execute Query is clicked', async () => {
    mockQueryStore.queryText = 'search term';
    render(<QueryBuilder collectionName="test" />);

    fireEvent.click(screen.getByText('Execute Query'));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        collectionName: 'test',
        queryText: 'search term',
        nResults: 10,
      })
    );
  });

  it('shows error message when error exists', () => {
    mockQueryStore.error = 'Query execution failed';
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText('Query execution failed')).toBeInTheDocument();
  });

  it('does not show error section when error is null', () => {
    mockQueryStore.error = null;
    const { container } = render(<QueryBuilder collectionName="test" />);
    expect(container.querySelector('.bg-destructive\\/10')).not.toBeInTheDocument();
  });

  it('shows active filter count badge', () => {
    mockQueryStore.queryText = 'search';
    mockQueryStore.metadataFilters = [
      { id: '1', field: 'type', operator: '$eq', value: 'doc' },
    ];
    render(<QueryBuilder collectionName="test" />);

    // 1 similarity + 1 metadata = 2 active filters
    expect(screen.getByText(/2 active filters/)).toBeInTheDocument();
  });

  it('shows singular "filter" for single active filter', () => {
    mockQueryStore.queryText = 'search';
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getByText(/1 active filter$/)).toBeInTheDocument();
  });

  it('does not show active filter badge when no filters', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.queryByText(/active filter/)).not.toBeInTheDocument();
  });

  it('determines query type as similarity when only queryText', async () => {
    mockQueryStore.queryText = 'hello world';
    render(<QueryBuilder collectionName="test" />);

    fireEvent.click(screen.getByText('Execute Query'));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        queryType: 'similarity',
      })
    );
  });

  it('determines query type as filter when only metadata filters', async () => {
    mockQueryStore.metadataFilters = [
      { id: '1', field: 'category', operator: '$eq', value: 'news' },
    ];
    render(<QueryBuilder collectionName="test" />);

    fireEvent.click(screen.getByText('Execute Query'));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        queryType: 'filter',
      })
    );
  });

  it('determines query type as combined when both queryText and filters', async () => {
    mockQueryStore.queryText = 'hello';
    mockQueryStore.metadataFilters = [
      { id: '1', field: 'category', operator: '$eq', value: 'news' },
    ];
    render(<QueryBuilder collectionName="test" />);

    fireEvent.click(screen.getByText('Execute Query'));

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        queryType: 'combined',
      })
    );
  });

  it('does not call mutateAsync when collectionName is undefined', () => {
    mockQueryStore.queryText = 'hello';
    render(<QueryBuilder collectionName={undefined} />);

    // Button should be disabled, but let's also verify the handler
    const button = screen.getByText('Execute Query');
    fireEvent.click(button);

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('renders Similarity Search section header', () => {
    render(<QueryBuilder collectionName="test" />);
    // Both the section header and mock component render "Similarity Search"
    expect(screen.getAllByText('Similarity Search').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Metadata Filters section header', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getAllByText('Metadata Filters').length).toBeGreaterThanOrEqual(1);
  });

  it('renders Document Filters section header', () => {
    render(<QueryBuilder collectionName="test" />);
    expect(screen.getAllByText('Document Filters').length).toBeGreaterThanOrEqual(1);
  });
});
