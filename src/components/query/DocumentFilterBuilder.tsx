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
import { useQueryStore, type DocumentFilterOperator } from '@/stores/query-store';
import { Plus, X } from 'lucide-react';
import type { ChromaDBWhereDocument } from '@/types/chromadb.types';

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

export function DocumentFilterBuilder() {
  const { documentFilters, addDocumentFilter, updateDocumentFilter, removeDocumentFilter } =
    useQueryStore();

  // Generate ChromaDB whereDocument clause preview
  const generateWhereDocumentClause = (): ChromaDBWhereDocument | null => {
    if (documentFilters.length === 0) {
      return null;
    }

    const whereDocument: ChromaDBWhereDocument = {};
    documentFilters.forEach((filter, index) => {
      if (filter.value) {
        whereDocument[`condition_${index}`] = { [filter.operator]: filter.value };
      }
    });

    return Object.keys(whereDocument).length > 0 ? whereDocument : null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Filters</CardTitle>
          <CardDescription>
            Filter documents based on their text content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Conditions */}
          <div className="space-y-3">
            {documentFilters.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No document filters defined. Add a condition to get started.
                </p>
                <Button onClick={addDocumentFilter} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Condition
                </Button>
              </div>
            ) : (
              documentFilters.map((filter, index) => (
                <Card key={filter.id} className="relative">
                  <CardContent className="pt-6 pb-4">
                    <div className="absolute top-2 right-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocumentFilter(filter.id)}
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

                      {/* Operator */}
                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value: DocumentFilterOperator) =>
                            updateDocumentFilter(filter.id, { operator: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_FILTER_OPERATORS.map((op) => (
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

                      {/* Search Text */}
                      <div className="space-y-2">
                        <Label>Search Text</Label>
                        <Input
                          placeholder="e.g., machine learning, quantum physics"
                          value={filter.value}
                          onChange={(e) =>
                            updateDocumentFilter(filter.id, { value: e.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the text to search for in document content
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add Condition Button */}
          {documentFilters.length > 0 && (
            <Button onClick={addDocumentFilter} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Condition
            </Button>
          )}

          {/* Logic Operator Info */}
          {documentFilters.length > 1 && (
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <p>
                <span className="font-medium">Note:</span> All conditions are combined with AND logic.
                Documents must match all conditions to be returned.
              </p>
            </div>
          )}

          {/* ChromaDB WhereDocument Clause Preview */}
          {documentFilters.length > 0 && (
            <div className="space-y-2">
              <Label>ChromaDB WhereDocument Clause (JSON)</Label>
              <pre className="rounded-md bg-slate-950 p-4 text-xs text-slate-50 overflow-x-auto">
                {JSON.stringify(generateWhereDocumentClause(), null, 2)}
              </pre>
            </div>
          )}

          {/* Help Section */}
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              About Document Filters
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Document filters search within the actual text content of your documents. Use them to
              find documents that contain (or don't contain) specific keywords or phrases.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
