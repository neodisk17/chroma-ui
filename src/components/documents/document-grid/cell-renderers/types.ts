import type { ICellRendererParams } from 'ag-grid-community';
import type { Document } from '../../../../../shared/schemas';

export interface DocumentCellRendererParams extends ICellRendererParams<Document> {}

export interface MetadataCellRendererParams extends ICellRendererParams<Document> {}

export interface ActionsCellRendererParams extends ICellRendererParams<Document> {
  onView?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (ids: string[]) => void;
}
