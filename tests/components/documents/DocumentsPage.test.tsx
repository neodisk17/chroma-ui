import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the route params
let mockCollectionId: string | undefined = 'test_collection';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ collectionId: mockCollectionId }),
}));

// Mock sub-components
vi.mock('../../../src/components/documents/DocumentGrid', () => ({
  DocumentGrid: ({ collectionName }: any) => (
    <div data-testid="document-grid">Collection: {collectionName}</div>
  ),
}));

vi.mock('../../../src/components/query/QueryBuilder', () => ({
  QueryBuilder: ({ collectionName }: any) => (
    <div data-testid="query-builder">Query: {collectionName}</div>
  ),
}));

vi.mock('../../../src/components/documents/EmbeddingsVisualization', () => ({
  EmbeddingsVisualization: ({ collectionName }: any) => (
    <div data-testid="embeddings-viz">Embeddings: {collectionName}</div>
  ),
}));

// Mock UI components
vi.mock('../../../src/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {typeof children === 'function' ? children({ value, onValueChange }) : children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`} role="tabpanel">
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list" role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-trigger-${value}`} role="tab">
      {children}
    </button>
  ),
}));

vi.mock('lucide-react', () => ({
  FileText: () => <span data-testid="file-text-icon" />,
  Search: () => <span data-testid="search-icon" />,
  ScatterChart: () => <span data-testid="scatter-chart-icon" />,
}));

// Import the component after mocks are set up
import DocumentsPage from '../../../src/pages/DocumentsPage';

describe('DocumentsPage', () => {
  beforeEach(() => {
    mockCollectionId = 'test_collection';
  });

  it('shows "No collection selected" when collectionId is undefined', () => {
    mockCollectionId = undefined;
    render(<DocumentsPage />);
    expect(screen.getByText('No collection selected')).toBeInTheDocument();
  });

  it('renders tabs when collectionId is provided', () => {
    render(<DocumentsPage />);
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  it('renders Documents tab trigger', () => {
    render(<DocumentsPage />);
    const docTab = screen.getByTestId('tab-trigger-documents');
    expect(docTab).toBeInTheDocument();
    expect(docTab).toHaveTextContent('Documents');
  });

  it('renders Query Builder tab trigger', () => {
    render(<DocumentsPage />);
    const queryTab = screen.getByTestId('tab-trigger-query');
    expect(queryTab).toBeInTheDocument();
    expect(queryTab).toHaveTextContent('Query Builder');
  });

  it('renders Embeddings tab trigger', () => {
    render(<DocumentsPage />);
    const embeddingsTab = screen.getByTestId('tab-trigger-embeddings');
    expect(embeddingsTab).toBeInTheDocument();
    expect(embeddingsTab).toHaveTextContent('Embeddings');
  });

  it('renders DocumentGrid with collection name', () => {
    render(<DocumentsPage />);
    expect(screen.getByTestId('document-grid')).toHaveTextContent('Collection: test_collection');
  });

  it('renders QueryBuilder with collection name', () => {
    render(<DocumentsPage />);
    expect(screen.getByTestId('query-builder')).toHaveTextContent('Query: test_collection');
  });

  it('renders EmbeddingsVisualization with collection name', () => {
    render(<DocumentsPage />);
    expect(screen.getByTestId('embeddings-viz')).toHaveTextContent('Embeddings: test_collection');
  });

  it('defaults to documents tab', () => {
    render(<DocumentsPage />);
    expect(screen.getByTestId('tabs')).toHaveAttribute('data-value', 'documents');
  });

  it('has file-text icon for Documents tab', () => {
    render(<DocumentsPage />);
    const docTab = screen.getByTestId('tab-trigger-documents');
    expect(docTab.querySelector('[data-testid="file-text-icon"]')).toBeInTheDocument();
  });

  it('has search icon for Query Builder tab', () => {
    render(<DocumentsPage />);
    const queryTab = screen.getByTestId('tab-trigger-query');
    expect(queryTab.querySelector('[data-testid="search-icon"]')).toBeInTheDocument();
  });

  it('has scatter-chart icon for Embeddings tab', () => {
    render(<DocumentsPage />);
    const embeddingsTab = screen.getByTestId('tab-trigger-embeddings');
    expect(embeddingsTab.querySelector('[data-testid="scatter-chart-icon"]')).toBeInTheDocument();
  });

  it('passes different collection name correctly', () => {
    mockCollectionId = 'another_collection';
    render(<DocumentsPage />);
    expect(screen.getByTestId('document-grid')).toHaveTextContent('Collection: another_collection');
  });
});
