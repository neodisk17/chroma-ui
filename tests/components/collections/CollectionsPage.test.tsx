import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock state
let mockActiveConnectionId: string | null = 'conn-1';
let mockCollectionId: string | undefined = undefined;

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ collectionId: mockCollectionId }),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

vi.mock('../../../src/stores/connection-store', () => ({
  useConnectionStore: () => ({
    activeConnectionId: mockActiveConnectionId,
  }),
}));

// Mock child components
vi.mock('../../../src/components/collections/CollectionList', () => ({
  CollectionList: ({ onCreateCollection, onEditCollection, onViewMetadata }: any) => (
    <div data-testid="collection-list">
      <button data-testid="create-collection-btn" onClick={onCreateCollection}>
        Create
      </button>
      <button
        data-testid="edit-collection-btn"
        onClick={() => onEditCollection({ name: 'test_col', metadata: {} })}
      >
        Edit
      </button>
      <button
        data-testid="view-metadata-btn"
        onClick={() => onViewMetadata({ name: 'meta_col', metadata: { key: 'val' } })}
      >
        View Metadata
      </button>
    </div>
  ),
}));

vi.mock('../../../src/components/collections/CollectionDetailPanel', () => ({
  CollectionDetailPanel: ({ collectionName, open, onClose }: any) => (
    open ? (
      <div data-testid="collection-detail-panel">
        <span data-testid="panel-collection">{collectionName}</span>
        <button data-testid="close-panel" onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../../src/components/collections/CollectionDialog', () => ({
  CollectionDialog: ({ open, collection }: any) => (
    open ? (
      <div data-testid="collection-dialog">
        <span data-testid="dialog-mode">{collection ? 'edit' : 'create'}</span>
      </div>
    ) : null
  ),
}));

vi.mock('../../../src/components/documents/AddEditDocumentDialog', () => ({
  AddEditDocumentDialog: ({ open }: any) => (
    open ? <div data-testid="add-document-dialog" /> : null
  ),
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('lucide-react', () => ({
  Database: () => <span data-testid="database-icon" />,
}));

import CollectionsPage from '../../../src/pages/CollectionsPage';

describe('CollectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveConnectionId = 'conn-1';
    mockCollectionId = undefined;
  });

  it('shows no connection state when activeConnectionId is null', () => {
    mockActiveConnectionId = null;
    render(<CollectionsPage />);

    expect(screen.getByText('No Connection Selected')).toBeInTheDocument();
    expect(
      screen.getByText('Please select or create a connection to access Collections')
    ).toBeInTheDocument();
  });

  it('shows Go to Home button in no connection state', () => {
    mockActiveConnectionId = null;
    render(<CollectionsPage />);

    expect(screen.getByText('Go to Home')).toBeInTheDocument();
  });

  it('navigates to home when Go to Home is clicked', () => {
    mockActiveConnectionId = null;
    render(<CollectionsPage />);

    fireEvent.click(screen.getByText('Go to Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders CollectionList when connection is active and no collection selected', () => {
    render(<CollectionsPage />);
    expect(screen.getByTestId('collection-list')).toBeInTheDocument();
  });

  it('hides CollectionList when a collection is selected (collectionId in URL)', () => {
    mockCollectionId = 'selected_collection';
    render(<CollectionsPage />);
    expect(screen.queryByTestId('collection-list')).not.toBeInTheDocument();
  });

  it('shows Outlet when collectionId is present', () => {
    mockCollectionId = 'selected_collection';
    render(<CollectionsPage />);
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('shows empty state message when no collection is selected', () => {
    render(<CollectionsPage />);
    expect(screen.getByText('Select a collection to view details')).toBeInTheDocument();
    expect(screen.getByText('Or create a new collection to get started')).toBeInTheDocument();
  });

  it('opens create collection dialog on create action', () => {
    render(<CollectionsPage />);

    fireEvent.click(screen.getByTestId('create-collection-btn'));
    expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-mode')).toHaveTextContent('create');
  });

  it('opens edit collection dialog on edit action', () => {
    render(<CollectionsPage />);

    fireEvent.click(screen.getByTestId('edit-collection-btn'));
    expect(screen.getByTestId('collection-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-mode')).toHaveTextContent('edit');
  });

  it('opens metadata panel on view metadata action', () => {
    render(<CollectionsPage />);

    fireEvent.click(screen.getByTestId('view-metadata-btn'));
    expect(screen.getByTestId('collection-detail-panel')).toBeInTheDocument();
    expect(screen.getByTestId('panel-collection')).toHaveTextContent('meta_col');
  });

  it('closes metadata panel on close action', () => {
    render(<CollectionsPage />);

    // Open panel
    fireEvent.click(screen.getByTestId('view-metadata-btn'));
    expect(screen.getByTestId('collection-detail-panel')).toBeInTheDocument();

    // Close panel
    fireEvent.click(screen.getByTestId('close-panel'));
    expect(screen.queryByTestId('collection-detail-panel')).not.toBeInTheDocument();
  });

  it('shows database icon in no connection state', () => {
    mockActiveConnectionId = null;
    render(<CollectionsPage />);
    expect(screen.getByTestId('database-icon')).toBeInTheDocument();
  });
});
