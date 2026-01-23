import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryStore, type DocumentFilterOperator } from '@/stores/query-store';
import { Plus, X } from 'lucide-react';

const DOCUMENT_FILTER_OPERATORS: {
  value: DocumentFilterOperator;
  label: string;
  description: string;
}[] = [
  {
    value: '$contains',
    label: 'Contains',
    description: 'Document text contains the specified string',
  },
  {
    value: '$not_contains',
    label: 'Does Not Contain',
    description: 'Document text does not contain the specified string',
  },
];

export function DocumentFilterSection() {
  const { documentFilters, addDocumentFilter, updateDocumentFilter, removeDocumentFilter } =
    useQueryStore();

  return (
    <div className="space-y-3 px-4">
      {documentFilters.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No document filters defined
          </p>
          <Button onClick={addDocumentFilter} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
        </div>
      ) : (
        <>
          {documentFilters.map((filter, index) => (
            <div key={filter.id} className="rounded-md border p-3 space-y-3 relative">
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocumentFilter(filter.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                Condition {index + 1}
              </span>

              {/* Operator */}
              <div className="space-y-1.5">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={filter.operator}
                  onValueChange={(value: DocumentFilterOperator) =>
                    updateDocumentFilter(filter.id, { operator: value })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_FILTER_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Text */}
              <div className="space-y-1.5">
                <Label className="text-xs">Search Text</Label>
                <Input
                  placeholder="e.g., machine learning"
                  value={filter.value}
                  onChange={(e) =>
                    updateDocumentFilter(filter.id, { value: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ))}

          <Button onClick={addDocumentFilter} variant="outline" size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Filter
          </Button>

          {documentFilters.length > 1 && (
            <p className="text-xs text-muted-foreground text-center">
              All conditions are combined with AND logic
            </p>
          )}
        </>
      )}
    </div>
  );
}
