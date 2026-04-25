import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type { ColDef, GridReadyEvent, SelectionChangedEvent, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

import { useDocuments } from '../../hooks/use-chromadb';
import { DocumentDetail } from './DocumentDetail';
import { AddEditDocumentDialog } from './AddEditDocumentDialog';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { BulkImportDialog } from './BulkImportDialog';
import {
  DocumentGridToolbar,
  BulkActionsToolbar,
  PaginationControls,
  LoadingState,
  ErrorState,
  EmptyState,
  DocumentCellRenderer,
  MetadataCellRenderer,
  ActionsCellRenderer,
} from './document-grid';
import { useUIPreferencesStore } from '../../stores/ui-preferences-store';
import type { Document } from '../../../shared/schemas';

interface DocumentGridProps {
  collectionName: string | undefined;
}

/**
 * DocumentGrid component - high-performance document grid with AG Grid
 */
export const DocumentGrid = React.memo(function DocumentGrid({
  collectionName,
}: DocumentGridProps) {
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Document[]>([]);

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
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // Get UI preferences
  const { searchQuery, searchField, documentGridLayout } = useUIPreferencesStore();

  // Fetch documents with pagination
  const { data, isLoading, error, refetch } = useDocuments(collectionName, {
    limit: pageSize,
    offset: page * pageSize,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  const totalDocuments = data?.total || 0;

  // Row height based on layout mode
  const rowHeight = documentGridLayout === 'compact' ? 36 : 48;

  // Reset to page 0 when collection changes
  useEffect(() => {
    setPage(0);
    setSelectedRows([]);
  }, [collectionName]);

  // View document handler
  const handleView = useCallback((document: Document) => {
    setSelectedDocument(document);
    setShowDetail(true);
  }, []);

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
        width: 800,
        cellRenderer: DocumentCellRenderer,
        resizable: true,
      },
      {
        headerName: 'Metadata',
        field: 'metadata',
        width: 400,
        cellRenderer: MetadataCellRenderer,
        resizable: false,
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
  }, [handleView, handleEdit, handleDelete]);

  // Convert data to row format with search filtering
  const rowData = useMemo(() => {
    if (!data) return [];

    const allRows = data.ids.map((id, index) => ({
      id,
      document: data.documents[index],
      metadata: data.metadatas[index],
    }));

    // Apply search filter if query exists
    if (!searchQuery.trim()) {
      return allRows;
    }

    const query = searchQuery.toLowerCase().trim();
    return allRows.filter((row) => {
      switch (searchField) {
        case 'id':
          return row.id.toLowerCase().includes(query);
        case 'document':
          return (row.document || '').toLowerCase().includes(query);
        case 'metadata':
          return JSON.stringify(row.metadata || {}).toLowerCase().includes(query);
        case 'all':
        default:
          return (
            row.id.toLowerCase().includes(query) ||
            (row.document || '').toLowerCase().includes(query) ||
            JSON.stringify(row.metadata || {}).toLowerCase().includes(query)
          );
      }
    });
  }, [data, searchQuery, searchField]);
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

    const headers = ['ID', 'Document', 'Metadata'];
    const rows = dataToExport.map((row) => [
      row.id,
      `"${(row.document || '').replace(/"/g, '""')}"`,
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
      const ids = selectedRows.map((row: Document) => row.id);
      handleDelete(ids);
      handleClearSelection();
    }
  }, [selectedRows, handleDelete, handleClearSelection]);

  // Loading skeleton
  if (isLoading && !data) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  // Empty state
  if (!data || data.ids.length === 0) {
    return (
      <>
        <EmptyState
          onAddDocument={() => setShowAddDialog(true)}
          onBulkImport={() => setShowImportDialog(true)}
        />

        {/* Add Document Dialog */}
        {showAddDialog && (
          <AddEditDocumentDialog
            open={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            collectionName={collectionName!}
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
      </>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <DocumentGridToolbar
        totalDocuments={totalDocuments}
        onRefresh={() => refetch()}
        onImport={() => setShowImportDialog(true)}
        onAdd={() => setShowAddDialog(true)}
      />

      <BulkActionsToolbar
        selectedCount={selectedRows.length}
        onClearSelection={handleClearSelection}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onDeleteSelected={handleDeleteSelected}
      />

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
          rowHeight={rowHeight}
          headerHeight={documentGridLayout === 'compact' ? 36 : 40}
          domLayout="normal"
          className="h-full w-full"
        />
      </div>

      <PaginationControls
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalDocuments={totalDocuments}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Document detail panel */}
      {showDetail && selectedDocument && (
        <DocumentDetail
          document={selectedDocument}
          collectionName={collectionName}
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
