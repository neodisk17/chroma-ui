import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExternalCollectionConfigDialog } from '../../../src/components/embeddings/ExternalCollectionConfigDialog';

const defaultProps = {
  open: true,
  collectionName: 'my-collection',
  detectedDimensions: 384,
  availableModels: [
    { id: 'Xenova/all-MiniLM-L6-v2', name: 'all-MiniLM-L6-v2', sizeLabel: '22MB', dimensions: 384, isDefault: true, isDownloaded: true },
    { id: 'Xenova/all-mpnet-base-v2', name: 'all-mpnet-base-v2', sizeLabel: '86MB', dimensions: 768, isDefault: false, isDownloaded: false },
  ],
  onSaved: vi.fn(),
  onCancel: vi.fn(),
};

describe('ExternalCollectionConfigDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows collection name in heading', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    expect(screen.getByText(/my-collection/)).toBeInTheDocument();
  });

  it('shows detected dimensions', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    expect(screen.getByText(/384/)).toBeInTheDocument();
  });

  it('only shows models matching detected dimensions', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    expect(screen.getByText('all-MiniLM-L6-v2')).toBeInTheDocument();
    expect(screen.queryByText('all-mpnet-base-v2')).not.toBeInTheDocument();
  });

  it('shows corruption warning', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    expect(screen.getByText(/wrong model/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancelled', () => {
    render(<ExternalCollectionConfigDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /provide vectors manually/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });
});
