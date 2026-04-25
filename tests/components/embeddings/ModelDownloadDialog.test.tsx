import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelDownloadDialog } from '../../../src/components/embeddings/ModelDownloadDialog';

// Mock electron API – use assignment (window.electronAPI is writable per tests/setup.ts)
// rather than vi.stubGlobal('window', ...) which would replace the entire window object
// and break DOM APIs that React's renderer relies on (getSelection, HTMLElement, etc.).
const mockInvoke = vi.fn();
const mockOnModelDownloadProgress = vi.fn(() => () => {});

// Assign our mocks onto the existing window object
(window as unknown as Record<string, unknown>).electronAPI = {
  invoke: mockInvoke,
  onModelDownloadProgress: mockOnModelDownloadProgress,
};

describe('ModelDownloadDialog', () => {
  const defaultProps = {
    open: true,
    modelId: 'Xenova/all-MiniLM-L6-v2',
    modelName: 'all-MiniLM-L6-v2',
    sizeLabel: '22MB',
    onDownloadComplete: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ success: true, data: {} });
    mockOnModelDownloadProgress.mockReturnValue(() => {});
    (window as unknown as Record<string, unknown>).electronAPI = {
      invoke: mockInvoke,
      onModelDownloadProgress: mockOnModelDownloadProgress,
    };
  });

  it('renders model name and size', () => {
    render(<ModelDownloadDialog {...defaultProps} />);
    expect(screen.getByText('all-MiniLM-L6-v2')).toBeInTheDocument();
    expect(screen.getByText(/22MB/)).toBeInTheDocument();
  });

  it('shows Download and Cancel buttons', () => {
    render(<ModelDownloadDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', () => {
    render(<ModelDownloadDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('invokes model:download when Download is clicked', async () => {
    render(<ModelDownloadDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /download/i }));
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('model:download', {
        modelId: 'Xenova/all-MiniLM-L6-v2',
      });
    });
  });
});
