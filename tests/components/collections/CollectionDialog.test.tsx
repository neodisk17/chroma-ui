import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionDialog } from '../../../src/components/collections/CollectionDialog';

// Mock chromadb hooks
const mockCreateMutateAsync = vi.fn();
const mockUpdateMutateAsync = vi.fn();

vi.mock('../../../src/hooks/use-chromadb', () => ({
  useCreateCollection: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
  useUpdateCollection: () => ({
    mutateAsync: mockUpdateMutateAsync,
    isPending: false,
  }),
}));

// Mock UI components
vi.mock('../../../src/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));

vi.mock('../../../src/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, type, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type || 'button'} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../src/components/ui/input', () => ({
  Input: ({ id, disabled, placeholder, className, ...props }: any) => (
    <input id={id} disabled={disabled} placeholder={placeholder} {...props} />
  ),
}));

vi.mock('../../../src/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('../../../src/components/ui/textarea', () => ({
  Textarea: ({ id, placeholder, rows, className, ...props }: any) => (
    <textarea id={id} placeholder={placeholder} rows={rows} {...props} />
  ),
}));

vi.mock('../../../src/components/ui/select', () => ({
  Select: ({ defaultValue, onValueChange, children }: any) => (
    <div data-testid="select">
      <select
        defaultValue={defaultValue}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="select-input"
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
}));

vi.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  Download: () => <span data-testid="download-icon" />,
}));

vi.mock('../../../src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ open, children }: any) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick} data-testid="alert-action">{children}</button>,
  AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick} data-testid="alert-cancel">{children}</button>,
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('../../../src/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />,
}));

vi.mock('../../../src/components/embeddings/CollectionApiKeyPanel', () => ({
  CollectionApiKeyPanel: () => <div data-testid="collection-api-key-panel" />,
}));

vi.mock('../../../src/hooks/use-embedding', () => ({
  useWarmupModel: () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false }),
  useModelDownloadProgress: () => ({}),
  useCollectionOpenAIKeyStatus: () => ({ data: null }),
}));

vi.mock('../../../src/components/ui/collapsible', () => ({
  Collapsible: ({ children, open }: any) => <div data-testid="collapsible" data-open={open}>{children}</div>,
  CollapsibleContent: ({ children }: any) => <div data-testid="collapsible-content">{children}</div>,
  CollapsibleTrigger: ({ children }: any) => <div data-testid="collapsible-trigger">{children}</div>,
}));

vi.mock('../../../src/components/embeddings/EmbeddingConfigPanel', () => ({
  EmbeddingConfigPanel: () => <div data-testid="embedding-config-panel">EmbeddingConfigPanel</div>,
}));

vi.mock('../../../src/stores/embedding-store', () => {
  const state = {
    buildEmbeddingConfig: () => ({ provider: 'local', model: 'Xenova/all-MiniLM-L6-v2', dtype: 'fp32' }),
    resetToDefaults: () => {},
    selectedProvider: 'local',
    hasOpenAIKey: false,
    localConfig: { model: 'Xenova/all-MiniLM-L6-v2', dtype: 'fp32' },
    setProvider: () => {},
  };
  const useEmbeddingStore = Object.assign(() => state, { getState: () => state });
  return { useEmbeddingStore };
});

describe('CollectionDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({});
    mockUpdateMutateAsync.mockResolvedValue({});
  });

  it('renders nothing when open is false', () => {
    const { container } = render(<CollectionDialog open={false} onOpenChange={vi.fn()} />);
    expect(container.querySelector('[data-testid="dialog"]')).not.toBeInTheDocument();
  });

  it('renders dialog when open is true', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('shows create mode title when no collection is provided', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByText('Create New Collection')).toBeInTheDocument();
  });

  it('shows edit mode title when collection is provided', () => {
    const collection = { name: 'test_col', metadata: { key: 'value' } };
    render(<CollectionDialog {...defaultProps} collection={collection} />);
    expect(screen.getByText('Edit Collection: test_col')).toBeInTheDocument();
  });

  it('shows create mode description', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(
      screen.getByText('Create a new collection for storing documents and embeddings.')
    ).toBeInTheDocument();
  });

  it('shows edit mode description', () => {
    const collection = { name: 'test_col', metadata: {} };
    render(<CollectionDialog {...defaultProps} collection={collection} />);
    expect(
      screen.getByText('Update the collection metadata. Note: Collection name cannot be changed.')
    ).toBeInTheDocument();
  });

  it('disables name input in edit mode', () => {
    const collection = { name: 'test_col', metadata: {} };
    render(<CollectionDialog {...defaultProps} collection={collection} />);

    const nameInput = screen.getByPlaceholderText('my_collection');
    expect(nameInput).toBeDisabled();
  });

  it('enables name input in create mode', () => {
    render(<CollectionDialog {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('my_collection');
    expect(nameInput).not.toBeDisabled();
  });

  it('shows embedding configuration in create mode', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByText(/Embedding Configuration/)).toBeInTheDocument();
  });

  it('hides embedding configuration in edit mode', () => {
    const collection = { name: 'test_col', metadata: {} };
    render(<CollectionDialog {...defaultProps} collection={collection} />);
    expect(screen.queryByText(/Embedding Configuration/)).not.toBeInTheDocument();
  });

  it('shows distance function select in create mode', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByText('Distance Function')).toBeInTheDocument();
  });

  it('hides distance function select in edit mode', () => {
    const collection = { name: 'test_col', metadata: {} };
    render(<CollectionDialog {...defaultProps} collection={collection} />);
    expect(screen.queryByText('Distance Function')).not.toBeInTheDocument();
  });

  it('shows metadata textarea', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByText('Metadata (JSON)')).toBeInTheDocument();
  });

  it('shows Create Collection button in create mode', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByText('Create Collection')).toBeInTheDocument();
  });

  it('shows Save Changes button in edit mode', () => {
    const collection = { name: 'test_col', metadata: {} };
    render(<CollectionDialog {...defaultProps} collection={collection} />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  it('shows Cancel button', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onOpenChange(false) when Cancel is clicked', () => {
    const onOpenChange = vi.fn();
    render(<CollectionDialog open={true} onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('validates invalid JSON metadata', () => {
    render(<CollectionDialog {...defaultProps} />);

    const metadataTextarea = screen.getByPlaceholderText('{}');
    fireEvent.change(metadataTextarea, { target: { value: '{invalid json' } });

    expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
  });

  it('does not show JSON error for valid metadata', () => {
    render(<CollectionDialog {...defaultProps} />);

    const metadataTextarea = screen.getByPlaceholderText('{}');
    fireEvent.change(metadataTextarea, { target: { value: '{"key": "value"}' } });

    expect(screen.queryByText(/Invalid JSON/)).not.toBeInTheDocument();
  });

  it('shows helper text for collection name', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(
      screen.getByText('Alphanumeric characters and underscores only (max 63 characters)')
    ).toBeInTheDocument();
  });

  it('shows helper text for metadata', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(
      screen.getByText('Optional metadata to store with the collection (must be valid JSON)')
    ).toBeInTheDocument();
  });

  it('pre-fills metadata in edit mode with collection metadata', () => {
    const collection = { name: 'test_col', metadata: { key: 'value', num: 42 } };
    render(<CollectionDialog {...defaultProps} collection={collection} />);

    // The form should have been reset with the collection metadata
    const metadataTextarea = screen.getByPlaceholderText('{}');
    expect(metadataTextarea).toBeInTheDocument();
  });

  it('shows required asterisk for collection name', () => {
    render(<CollectionDialog {...defaultProps} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
