import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { useDocuments } from '../../hooks/use-chromadb';
import { DocumentDetail } from './DocumentDetail';
import { AddEditDocumentDialog } from './AddEditDocumentDialog';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { BulkImportDialog } from './BulkImportDialog';
import type { Document } from '../../../shared/schemas';

interface DocumentGridProps {
  collectionName: string | undefined;
}

// Cell renderer for document text (show preview)
const DocumentCellRenderer = (params: any) => {
  const text = params.value || '';
  const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;

  return (
    <div className="flex h-full items-center" title={text}>
      <span className="truncate">{preview}</span>
    </div>
  );
};

// Cell renderer for metadata (show JSON preview)
const MetadataCellRenderer = (params: any) => {
  const metadata = params.value;

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-muted-foreground">No metadata</span>;
  }

  const preview = JSON.stringify(metadata);
  const shortPreview = preview.length > 50 ? preview.substring(0, 50) + '...' : preview;

  return (
    <div className="flex h-full items-center font-mono text-xs" title={preview}>
      <span className="truncate">{shortPreview}</span>
    </div>
  );
};

// Cell renderer for actions
const ActionsCellRenderer = (params: any) => {
  const { onView, onEdit, onDelete } = params;

  return (
    <div className="flex h-full items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onView?.(params.data)}
        title="View"
      >
        <Eye className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onEdit?.(params.data)}
        title="Edit"
      >
        <Edit className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        onClick={() => onDelete?.([params.data.id])}
        title="Delete"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};

/**
 * DocumentGrid component - high-performance document grid with AG Grid
 *
 * Features:
 * - Virtual scrolling for large datasets
 * - Pagination controls
 * - Row selection (checkbox column)
 * - Column resize, sort, filter
 * - Custom cell renderers
 * - Bulk actions toolbar
 * - Export to JSON/CSV
 * - Column configuration persistence
 * - Loading states and error handling
 */
export const DocumentGrid = React.memo(function DocumentGrid({
  collectionName,
}: DocumentGridProps) {
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

  // Detail panel state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteDocumentIds, setDeleteDocumentIds] = useState<string[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Grid state
  const [gridApi, setGridApi] = useState<any>(null);

  // Fetch documents with pagination
  const { data, isLoading, error, refetch } = useDocuments(collectionName, {
    limit: pageSize,
    offset: page * pageSize,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const totalDocuments = data?.total || 0;

  // Reset to page 0 when collection changes
  useEffect(() => {
    setPage(0);
    setSelectedRows([]);
  }, [collectionName]);

  // Handler for edit document
  const handleEdit = useCallback((document: Document) => {
    setEditingDocument(document);
    setShowEditDialog(true);
  }, []);

  // Handler for delete document
  const handleDelete = useCallback((documentIds: string[]) => {
    setDeleteDocumentIds(documentIds);
    setShowDeleteDialog(true);
  }, []);

  // Column definitions with memoization
  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      {
        headerName: 'ID',
        field: 'id',
        width: 120,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        pinned: 'left',
      },
      {
        headerName: 'Document',
        field: 'document',
        width: 400,
        cellRenderer: DocumentCellRenderer,
        resizable: true,
        sortable: true,
        filter: true,
      },
      {
        headerName: 'Metadata',
        field: 'metadata',
        width: 300,
        cellRenderer: MetadataCellRenderer,
        resizable: true,
      },
      {
        headerName: 'Actions',
        field: 'actions',
        width: 120,
        cellRenderer: ActionsCellRenderer,
        cellRendererParams: {
          onView: handleView,
          onEdit: handleEdit,
          onDelete: handleDelete,
        },
        pinned: 'right',
        sortable: false,
        filter: false,
      },
    ];
  }, [handleEdit, handleDelete]);

  // Convert data to row format
  const rowData = useMemo(() => {
    if (!data) return [];

    return data.ids.map((id, index) => ({
      id,
      document: data.documents[index],
      metadata: data.metadatas[index],
      embedding: data.embeddings?.[index],
    }));
  }, [data]);

  // Grid ready callback
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);

    // Load column state from localStorage
    const savedState = localStorage.getItem(`documentGrid_${collectionName}`);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        params.api.applyColumnState({ state, applyOrder: true });
      } catch (error) {
        console.error('Failed to load column state:', error);
      }
    }
  }, [collectionName]);

  // Save column state to localStorage
  const saveColumnState = useCallback(() => {
    if (gridApi && collectionName) {
      const state = gridApi.getColumnState();
      localStorage.setItem(`documentGrid_${collectionName}`, JSON.stringify(state));
    }
  }, [gridApi, collectionName]);

  // Selection changed callback
  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selected = event.api.getSelectedRows();
    setSelectedRows(selected);
  }, []);

  // View document handler
  function handleView(document: Document) {
    setSelectedDocument(document);
    setShowDetail(true);
  }

  // Export to JSON
  const handleExportJSON = useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : rowData;
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collectionName}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedRows, rowData, collectionName]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : rowData;

    // CSV headers
    const headers = ['ID', 'Document', 'Metadata'];

    // CSV rows
    const rows = dataToExport.map((row: any) => [
      row.id,
      `"${(row.document || '').replace(/"/g, '""')}"`, // Escape quotes
      `"${JSON.stringify(row.metadata || {}).replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collectionName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedRows, rowData, collectionName]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    gridApi?.deselectAll();
    setSelectedRows([]);
  }, [gridApi]);

  // Delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length > 0) {
      const ids = selectedRows.map((row: any) => row.id);
      handleDelete(ids);
      handleClearSelection();
    }
  }, [selectedRows, handleDelete, handleClearSelection]);

  // Loading skeleton
  if (isLoading && !data) {
    return (
      <div className="flex h-full flex-col">
        <div className="space-y-4 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-lg font-semibold text-destructive">Failed to load documents</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.ids.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-lg font-semibold">No documents in this collection</p>
          <p className="text-sm text-muted-foreground">
            Add your first document to get started
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <Badge variant="outline">
            {totalDocuments.toLocaleString()} total
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedRows.length} document{selectedRows.length !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={handleClearSelection}>
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* AG Grid */}
      <div className="ag-theme-alpine flex-1">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          onColumnResized={saveColumnState}
          onColumnMoved={saveColumnState}
          onSortChanged={saveColumnState}
          rowSelection="multiple"
          suppressRowClickSelection
          animateRows
          rowHeight={48}
          headerHeight={40}
          domLayout="normal"
          className="h-full w-full"
        />
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between border-t p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(0);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="500">500</SelectItem>
              <SelectItem value="1000">1000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
            {' · '}
            Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalDocuments)} of{' '}
            {totalDocuments}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Input
              type="number"
              min="1"
              max={totalPages}
              value={page + 1}
              onChange={(e) => {
                const newPage = Number(e.target.value) - 1;
                if (newPage >= 0 && newPage < totalPages) {
                  setPage(newPage);
                }
              }}
              className="w-16 text-center"
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Document detail panel */}
      {showDetail && selectedDocument && (
        <DocumentDetail
          document={selectedDocument}
          onClose={() => {
            setShowDetail(false);
            setSelectedDocument(null);
          }}
          onEdit={(doc) => handleEdit(doc)}
          onDelete={(id) => handleDelete([id])}
        />
      )}

      {/* Add/Edit Document Dialog */}
      {showAddDialog && (
        <AddEditDocumentDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          collectionName={collectionName!}
        />
      )}

      {showEditDialog && editingDocument && (
        <AddEditDocumentDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setEditingDocument(null);
          }}
          collectionName={collectionName!}
          document={editingDocument}
        />
      )}

      {/* Delete Document Dialog */}
      {showDeleteDialog && (
        <DeleteDocumentDialog
          open={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setDeleteDocumentIds([]);
          }}
          collectionName={collectionName!}
          documentIds={deleteDocumentIds}
        />
      )}

      {/* Bulk Import Dialog */}
      {showImportDialog && (
        <BulkImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          collectionName={collectionName!}
        />
      )}
    </div>
  );
});
