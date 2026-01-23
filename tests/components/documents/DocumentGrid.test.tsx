import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentGrid } from '../../../src/components/documents/DocumentGrid';

// Mock ag-grid
vi.mock('ag-grid-react', () => ({
  AgGridReact: ({ rowData, columnDefs }: any) => (
    <div data-testid="ag-grid" data-row-count={rowData?.length ?? 0}>
      {rowData?.map((row: any) => (
        <div key={row.id} data-testid={`grid-row-${row.id}`}>
          <span>{row.id}</span>
          <span>{row.document}</span>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('ag-grid-community', () => ({
  ModuleRegistry: { registerModules: vi.fn() },
  AllCommunityModule: {},
}));

// Mock sub-components
vi.mock('../../../src/components/documents/document-grid', () => ({
  DocumentGridToolbar: ({ totalDocuments, onRefresh, onImport, onAdd }: any) => (
    <div data-testid="document-grid-toolbar">
      <span data-testid="total-documents">{totalDocuments}</span>
      <button data-testid="refresh-btn" onClick={onRefresh}>Refresh</button>
      <button data-testid="import-btn" onClick={onImport}>Import</button>
      <button data-testid="add-btn" onClick={onAdd}>Add Document</button>
    </div>
  ),
  BulkActionsToolbar: ({ selectedCount }: any) => (
    <div data-testid="bulk-actions-toolbar">
      <span data-testid="selected-count">{selectedCount}</span>
    </div>
  ),
  PaginationControls: ({ page, pageSize, totalPages, totalDocuments, onPageChange, onPageSizeChange }: any) => (
    <div data-testid="pagination-controls">
      <span data-testid="current-page">{page}</span>
      <span data-testid="page-size">{pageSize}</span>
      <span data-testid="total-pages">{totalPages}</span>
      <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>Next</button>
      <button data-testid="prev-page" onClick={() => onPageChange(page - 1)}>Prev</button>
      <button data-testid="change-page-size" onClick={() => onPageSizeChange(50)}>50</button>
    </div>
  ),
  LoadingState: () => <div data-testid="loading-state">Loading...</div>,
  ErrorState: ({ message, onRetry }: any) => (
    <div data-testid="error-state">
      <span>{message}</span>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
  EmptyState: ({ onAddDocument }: any) => (
    <div data-testid="empty-state">
      <button onClick={onAddDocument}>Add Document</button>
    </div>
  ),
  DocumentCellRenderer: () => null,
  MetadataCellRenderer: () => null,
  ActionsCellRenderer: () => null,
}));

vi.mock('../../../src/components/documents/DocumentDetail', () => ({
  DocumentDetail: () => <div data-testid="document-detail" />,
}));

vi.mock('../../../src/components/documents/AddEditDocumentDialog', () => ({
  AddEditDocumentDialog: ({ open }: any) => (open ? <div data-testid="add-edit-dialog" /> : null),
}));

vi.mock('../../../src/components/documents/DeleteDocumentDialog', () => ({
  DeleteDocumentDialog: ({ open }: any) => (open ? <div data-testid="delete-dialog" /> : null),
}));

vi.mock('../../../src/components/documents/BulkImportDialog', () => ({
  BulkImportDialog: ({ open }: any) => (open ? <div data-testid="import-dialog" /> : null),
}));

// Mock hooks
const mockRefetch = vi.fn();
let mockDocumentsData: any = null;
let mockIsLoading = false;
let mockError: any = null;

vi.mock('../../../src/hooks/use-chromadb', () => ({
  useDocuments: () => ({
    data: mockDocumentsData,
    isLoading: mockIsLoading,
    error: mockError,
    refetch: mockRefetch,
  }),
}));

vi.mock('../../../src/stores/ui-preferences-store', () => ({
  useUIPreferencesStore: () => ({
    searchQuery: '',
    searchField: 'all',
    documentGridLayout: 'comfortable',
  }),
}));

describe('DocumentGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocumentsData = null;
    mockIsLoading = false;
    mockError = null;
  });

  it('shows loading state when loading and no data', () => {
    mockIsLoading = true;
    mockDocumentsData = null;

    render(<DocumentGrid collectionName="test_collection" />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    mockError = new Error('Failed to fetch documents');

    render(<DocumentGrid collectionName="test_collection" />);
    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch documents')).toBeInTheDocument();
  });

  it('shows empty state when data has no documents', () => {
    mockDocumentsData = { ids: [], documents: [], metadatas: [], total: 0 };

    render(<DocumentGrid collectionName="test_collection" />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders document grid with data', () => {
    mockDocumentsData = {
      ids: ['doc-1', 'doc-2'],
      documents: ['Hello world', 'Another document'],
      metadatas: [{ key: 'value' }, null],
      total: 2,
    };

    render(<DocumentGrid collectionName="test_collection" />);

    expect(screen.getByTestId('ag-grid')).toBeInTheDocument();
    expect(screen.getByTestId('grid-row-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('grid-row-doc-2')).toBeInTheDocument();
  });

  it('renders toolbar with correct total documents', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 50,
    };

    render(<DocumentGrid collectionName="test_collection" />);
    expect(screen.getByTestId('total-documents')).toHaveTextContent('50');
  });

  it('renders pagination controls with correct props', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 100,
    };

    render(<DocumentGrid collectionName="test_collection" />);

    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
    expect(screen.getByTestId('page-size')).toHaveTextContent('20');
    expect(screen.getByTestId('total-pages')).toHaveTextContent('5'); // 100 / 20 = 5
  });

  it('opens add document dialog when Add Document button is clicked', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 1,
    };

    render(<DocumentGrid collectionName="test_collection" />);

    fireEvent.click(screen.getByTestId('add-btn'));
    expect(screen.getByTestId('add-edit-dialog')).toBeInTheDocument();
  });

  it('opens import dialog when Import button is clicked', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 1,
    };

    render(<DocumentGrid collectionName="test_collection" />);

    fireEvent.click(screen.getByTestId('import-btn'));
    expect(screen.getByTestId('import-dialog')).toBeInTheDocument();
  });

  it('calls refetch when Refresh button is clicked', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 1,
    };

    render(<DocumentGrid collectionName="test_collection" />);

    fireEvent.click(screen.getByTestId('refresh-btn'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('calls refetch on error retry', () => {
    mockError = new Error('Failed to fetch');

    render(<DocumentGrid collectionName="test_collection" />);

    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('computes totalPages correctly', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 45,
    };

    render(<DocumentGrid collectionName="test_collection" />);

    // 45 / 20 = 2.25, ceil = 3
    expect(screen.getByTestId('total-pages')).toHaveTextContent('3');
  });

  it('shows 0 selected in bulk actions toolbar initially', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 1,
    };

    render(<DocumentGrid collectionName="test_collection" />);
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('updates page when next page is clicked', () => {
    mockDocumentsData = {
      ids: ['doc-1'],
      documents: ['Hello'],
      metadatas: [null],
      total: 100,
    };

    render(<DocumentGrid collectionName="test_collection" />);

    fireEvent.click(screen.getByTestId('next-page'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('renders empty state with Add Document button when no data', () => {
    mockDocumentsData = { ids: [], documents: [], metadatas: [], total: 0 };

    render(<DocumentGrid collectionName="test_collection" />);

    // The EmptyState component is rendered with onAddDocument callback
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('Add Document')).toBeInTheDocument();
  });
});
