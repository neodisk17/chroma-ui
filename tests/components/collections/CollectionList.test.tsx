import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionList } from '../../../src/components/collections/CollectionList';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock chromadb hooks
const mockRefetch = vi.fn();
const mockDeleteMutateAsync = vi.fn();

vi.mock('../../../src/hooks/use-chromadb', () => ({
  useCollections: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: mockRefetch,
  })),
  useDeleteCollection: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
  })),
}));

// Import the mocked module so we can change return values per test
import { useCollections } from '../../../src/hooks/use-chromadb';

// Mock UI components
vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, title, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} title={title} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
  ),
}));

vi.mock('../../../src/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
}));

vi.mock('../../../src/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div className={className} data-testid="skeleton" />,
}));

vi.mock('../../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="dropdown-item">
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children, onClick }: any) => (
    <div onClick={onClick} data-testid="dropdown-trigger">
      {children}
    </div>
  ),
}));

vi.mock('../../../src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }: any) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogAction: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-action">
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: any) => <button data-testid="alert-cancel">{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  FolderOpen: () => <span data-testid="folder-icon" />,
  MoreVertical: () => <span data-testid="more-icon" />,
  Edit: () => <span data-testid="edit-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Info: () => <span data-testid="info-icon" />,
  AlertCircle: () => <span data-testid="alert-circle-icon" />,
}));

describe('CollectionList', () => {
  const defaultProps = {
    onCreateCollection: vi.fn(),
    onEditCollection: vi.fn(),
    onViewMetadata: vi.fn(),
  };

  const mockCollections = [
    { name: 'collection_one', id: 'id-1', metadata: { type: 'test' }, count: 42 },
    { name: 'collection_two', id: 'id-2', metadata: {}, count: 100 },
    { name: 'another_collection', id: 'id-3', metadata: {}, count: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useCollections as any).mockReturnValue({
      data: mockCollections,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  it('renders loading skeletons when isLoading is true', () => {
    (useCollections as any).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
    });

    render(<CollectionList {...defaultProps} />);

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBe(5);
  });

  it('renders error state with retry button', () => {
    (useCollections as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    render(<CollectionList {...defaultProps} />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls refetch when Try Again is clicked', () => {
    (useCollections as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    render(<CollectionList {...defaultProps} />);

    fireEvent.click(screen.getByText('Try Again'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no collections exist', () => {
    (useCollections as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<CollectionList {...defaultProps} />);

    expect(screen.getByText('No collections yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first collection to get started')).toBeInTheDocument();
  });

  it('calls onCreateCollection when Create Collection button clicked in empty state', () => {
    (useCollections as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const onCreateCollection = vi.fn();
    render(<CollectionList {...defaultProps} onCreateCollection={onCreateCollection} />);

    // Find the button with "Create Collection" text
    const buttons = screen.getAllByRole('button');
    const createButton = buttons.find((b) => b.textContent?.includes('Create Collection'));
    fireEvent.click(createButton!);

    expect(onCreateCollection).toHaveBeenCalled();
  });

  it('renders collection names', () => {
    render(<CollectionList {...defaultProps} />);

    expect(screen.getByText('collection_one')).toBeInTheDocument();
    expect(screen.getByText('collection_two')).toBeInTheDocument();
    expect(screen.getByText('another_collection')).toBeInTheDocument();
  });

  it('renders document counts for each collection', () => {
    render(<CollectionList {...defaultProps} />);

    expect(screen.getByText('42 documents')).toBeInTheDocument();
    expect(screen.getByText('100 documents')).toBeInTheDocument();
    expect(screen.getByText('0 documents')).toBeInTheDocument();
  });

  it('filters collections by search query', async () => {
    const user = userEvent.setup();
    render(<CollectionList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search collections...');
    await user.type(searchInput, 'one');

    expect(screen.getByText('collection_one')).toBeInTheDocument();
    expect(screen.queryByText('collection_two')).not.toBeInTheDocument();
    expect(screen.queryByText('another_collection')).not.toBeInTheDocument();
  });

  it('shows no results message when search has no matches', async () => {
    const user = userEvent.setup();
    render(<CollectionList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search collections...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText(/No collections match/)).toBeInTheDocument();
  });

  it('navigates to collection documents on click', () => {
    render(<CollectionList {...defaultProps} />);

    fireEvent.click(screen.getByText('collection_one'));
    expect(mockNavigate).toHaveBeenCalledWith('/collections/collection_one/documents');
  });

  it('calls onCreateCollection when plus button is clicked', () => {
    const onCreateCollection = vi.fn();
    render(<CollectionList {...defaultProps} onCreateCollection={onCreateCollection} />);

    const createButton = screen.getByTitle('Create collection');
    fireEvent.click(createButton);

    expect(onCreateCollection).toHaveBeenCalled();
  });

  it('calls refetch when refresh button is clicked', () => {
    render(<CollectionList {...defaultProps} />);

    const refreshButton = screen.getByTitle('Refresh collections');
    fireEvent.click(refreshButton);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders Collections heading', () => {
    render(<CollectionList {...defaultProps} />);
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<CollectionList {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search collections...')).toBeInTheDocument();
  });

  it('shows fallback error message for non-Error objects', () => {
    (useCollections as any).mockReturnValue({
      data: [],
      isLoading: false,
      error: 'string error',
      refetch: mockRefetch,
    });

    render(<CollectionList {...defaultProps} />);
    expect(screen.getByText('Failed to load collections')).toBeInTheDocument();
  });

  it('handles collection with zero count', () => {
    (useCollections as any).mockReturnValue({
      data: [{ name: 'empty_col', id: 'x', metadata: {}, count: 0 }],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<CollectionList {...defaultProps} />);
    expect(screen.getByText('0 documents')).toBeInTheDocument();
  });

  it('handles collection with undefined count', () => {
    (useCollections as any).mockReturnValue({
      data: [{ name: 'no_count_col', id: 'x', metadata: {} }],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<CollectionList {...defaultProps} />);
    expect(screen.getByText('0 documents')).toBeInTheDocument();
  });

  it('search is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<CollectionList {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search collections...');
    await user.type(searchInput, 'ONE');

    expect(screen.getByText('collection_one')).toBeInTheDocument();
    expect(screen.queryByText('collection_two')).not.toBeInTheDocument();
  });
});
