import { RefreshCw, Upload, Plus, Search, X, LayoutGrid, List } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import { useUIPreferencesStore, type SearchField } from '../../../stores/ui-preferences-store';

interface DocumentGridToolbarProps {
  totalDocuments: number;
  onRefresh: () => void;
  onImport: () => void;
  onAdd: () => void;
}

const SEARCH_FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: 'all', label: 'All Columns' },
  { value: 'id', label: 'ID' },
  { value: 'document', label: 'Document' },
  { value: 'metadata', label: 'Metadata' },
];

export const DocumentGridToolbar = ({
  totalDocuments,
  onRefresh,
  onImport,
  onAdd,
}: DocumentGridToolbarProps) => {
  const {
    searchQuery,
    searchField,
    documentGridLayout,
    setSearchQuery,
    setSearchField,
    setDocumentGridLayout,
    clearSearch,
  } = useUIPreferencesStore();

  return (
    <div className="flex flex-col gap-3 border-b p-4">
      {/* Top row: Title, count, and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <Badge variant="outline">
            {totalDocuments.toLocaleString()} total
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <TooltipProvider>
            <div className="flex items-center rounded-md border p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={documentGridLayout === 'comfortable' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDocumentGridLayout('comfortable')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Comfortable view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={documentGridLayout === 'compact' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setDocumentGridLayout('compact')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compact view</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="h-6 w-px bg-border" />

          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onImport}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* Bottom row: Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={searchField} onValueChange={(value: SearchField) => setSearchField(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_FIELD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
