import type { Metadata } from '@/types/chromadb.types';
import type { NeighborResult } from '@/lib/pca';

export interface EmbeddingData {
  id: string;
  vector: number[];
  document: string;
  metadata?: Metadata;
}

export interface NeighborhoodExplorerProps {
  embeddings: EmbeddingData[];
  document1: EmbeddingData;
  document2: EmbeddingData;
  onSelectForCompare?: (id: string, slot: 1 | 2) => void;
}

export interface PlotPoint {
  x: number;
  y: number;
  id: string;
  category: 'doc1' | 'doc2' | 'neighbor1' | 'neighbor2' | 'shared' | 'bridge';
  similarity?: number;
  document?: string;
}

export interface NeighborWithSimilarity extends NeighborResult {
  similarity1?: number;
  similarity2?: number;
}

export const CATEGORY_COLORS = {
  doc1: '#3b82f6',       // Blue - Document 1
  doc2: '#22c55e',       // Green - Document 2
  neighbor1: '#93c5fd',  // Light blue - Doc 1 neighbors
  neighbor2: '#86efac',  // Light green - Doc 2 neighbors
  shared: '#f59e0b',     // Amber/Gold - Shared neighbors
  bridge: '#a855f7',     // Purple - Bridging documents
} as const;

export const CATEGORY_LABELS = {
  doc1: 'Document 1',
  doc2: 'Document 2',
  neighbor1: 'Similar to Doc 1',
  neighbor2: 'Similar to Doc 2',
  shared: 'Related to Both',
  bridge: 'Bridging Documents',
} as const;
