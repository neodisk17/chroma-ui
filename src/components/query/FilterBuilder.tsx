import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useQueryStore, type FilterOperator } from '@/stores/query-store';
import { Plus, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import type { ChromaDBWhereClause } from '@/types/chromadb.types';

const FILTER_OPERATORS: { value: FilterOperator; label: string; description: string }[] = [
  { value: '$eq', label: 'Equals (=)', description: 'Field equals value' },
  { value: '$ne', label: 'Not Equals (≠)', description: 'Field does not equal value' },
  { value: '$gt', label: 'Greater Than (>)', description: 'Field is greater than value' },
  { value: '$gte', label: 'Greater or Equal (≥)', description: 'Field is greater than or equal to value' },
  { value: '$lt', label: 'Less Than (<)', description: 'Field is less than value' },
  { value: '$lte', label: 'Less or Equal (≤)', description: 'Field is less than or equal to value' },
  { value: '$in', label: 'In Array', description: 'Field is in array of values' },
  { value: '$nin', label: 'Not In Array', description: 'Field is not in array of values' },
];

export function FilterBuilder() {
  const { metadataFilters, addMetadataFilter, updateMetadataFilter, removeMetadataFilter } =
    useQueryStore();

  const getValueInput = (filterId: string, operator: FilterOperator, value: string | number | (string | number)[]) => {
    // For $in and $nin operators, use textarea for JSON array
    if (operator === '$in' || operator === '$nin') {
      const stringValue = Array.isArray(value)
        ? JSON.stringify(value)
        : typeof value === 'string'
        ? value
        : '';

      return (
        <Textarea
          placeholder='["value1", "value2"] or [1, 2, 3]'
          value={stringValue}
          onChange={(e) => {
            const val = e.target.value;
            // Try to parse as JSON array
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) {
                updateMetadataFilter(filterId, { value: parsed });
              } else {
                updateMetadataFilter(filterId, { value: val });
              }
            } catch {
              updateMetadataFilter(filterId, { value: val });
            }
          }}
          rows={2}
          className="font-mono text-xs resize-none"
        />
      );
    }

    // For other operators, use regular input
    return (
      <Input
        placeholder="Enter value"
        value={String(value || '')}
        onChange={(e) => {
          const val = e.target.value;
          // Try to parse as number
          const numVal = Number(val);
          if (!isNaN(numVal) && val !== '') {
            updateMetadataFilter(filterId, { value: numVal });
          } else {
            updateMetadataFilter(filterId, { value: val });
          }
        }}
      />
    );
  };

  // Generate ChromaDB where clause preview
  const generateWhereClause = (): ChromaDBWhereClause | null => {
    if (metadataFilters.length === 0) {
      return null;
    }

    const where: ChromaDBWhereClause = {};
    metadataFilters.forEach((filter) => {
      if (filter.field && (filter.value || filter.value === 0)) {
        where[filter.field] = { [filter.operator]: filter.value };
      }
    });

    return Object.keys(where).length > 0 ? where : null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Metadata Filters</CardTitle>
          <CardDescription>
            Filter documents based on their metadata fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Conditions */}
          <div className="space-y-3">
            {metadataFilters.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No metadata filters defined. Add a condition to get started.
                </p>
                <Button onClick={addMetadataFilter} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </div>
            ) : (
              metadataFilters.map((filter, index) => (
                <Card key={filter.id} className="relative">
                  <CardContent className="pt-6 pb-4">
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMetadataFilter(filter.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Condition Number */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Condition {index + 1}
                        </span>
                      </div>

                      {/* Field Name */}
                      <div className="space-y-2">
                        <Label>Field Name</Label>
                        <Input
                          placeholder="e.g., category, author, year"
                          value={filter.field}
                          onChange={(e) =>
                            updateMetadataFilter(filter.id, { field: e.target.value })
                          }
                        />
                      </div>

                      {/* Operator */}
                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value: FilterOperator) =>
                            updateMetadataFilter(filter.id, { operator: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FILTER_OPERATORS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{op.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {op.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value */}
                      <div className="space-y-2">
                        <Label>Value</Label>
                        {getValueInput(filter.id, filter.operator, filter.value)}
                        {(filter.operator === '$in' || filter.operator === '$nin') && (
                          <p className="text-xs text-muted-foreground">
                            Enter a JSON array, e.g., ["fiction", "sci-fi"] or [2020, 2021, 2022]
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add Condition Button */}
          {metadataFilters.length > 0 && (
            <Button onClick={addMetadataFilter} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Condition
            </Button>
          )}

          {/* Logic Operator Info */}
          {metadataFilters.length > 1 && (
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">Note:</span> All conditions are combined with AND logic.
                Documents must match all conditions to be returned.
              </p>
            </div>
          )}

          {/* ChromaDB Where Clause Preview */}
          {metadataFilters.length > 0 && (
            <div className="space-y-2">
              <Label>ChromaDB Where Clause (JSON)</Label>
              <pre className="rounded-md bg-slate-950 p-4 text-xs text-slate-50 overflow-x-auto">
                {JSON.stringify(generateWhereClause(), null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
