import type { Metadata } from '@/types/chromadb.types';
import { Point2D } from '@/lib/pca';

export const MAX_POINTS = 1000;

export interface EmbeddingData {
  id: string;
  vector: number[];
  document: string;
  metadata?: Metadata;
}

export interface EmbeddingPlotProps {
  embeddings: EmbeddingData[];
  selectedIds?: string[];
  colorByField?: string | null;
  onPointClick?: (id: string) => void;
  onPointContextMenu?: (id: string, event: React.MouseEvent) => void;
}

export interface PlotPoint extends Point2D {
  id: string;
  document: string;
  metadata?: Metadata;
  distance?: number;
  similarity?: number;
}

export interface ColorMapping {
  field: string;
  valueColors: Map<string, string>;
}
