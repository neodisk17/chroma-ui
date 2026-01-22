import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalDocuments: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const PaginationControls = ({
  page,
  pageSize,
  totalPages,
  totalDocuments,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) => {
  return (
    <div className="flex items-center justify-between border-t p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            onPageSizeChange(Number(value));
            onPageChange(0);
          }}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
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
            onClick={() => onPageChange(Math.max(0, page - 1))}
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
                onPageChange(newPage);
              }
            }}
            className="w-16 text-center"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
