import { useMemo, useState, useRef, useEffect } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQueryStore, type FilterOperator, type LogicalOperator } from '@/stores/query-store';
import { useDocuments } from '@/hooks/use-chromadb';
import { Plus, X, ChevronsUpDown, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MetadataFilterSectionProps {
  collectionName?: string;
}

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

export function MetadataFilterSection({ collectionName }: MetadataFilterSectionProps) {
  const {
    metadataFilters,
    metadataLogicalOperator,
    addMetadataFilter,
    updateMetadataFilter,
    removeMetadataFilter,
    setMetadataLogicalOperator,
  } = useQueryStore();

  // Fetch documents to extract metadata keys
  const { data: documentsData } = useDocuments(collectionName, { limit: 100 });

  // Extract unique metadata keys from documents
  const metadataKeys = useMemo(() => {
    if (!documentsData?.metadatas) return [];

    const keysSet = new Set<string>();
    documentsData.metadatas.forEach((metadata) => {
      if (metadata) {
        Object.keys(metadata).forEach((key) => keysSet.add(key));
      }
    });
    return Array.from(keysSet).sort();
  }, [documentsData]);

  const getValueInput = (filterId: string, operator: FilterOperator, value: string | number | (string | number)[]) => {
    if (operator === '$in' || operator === '$nin') {
      const stringValue = Array.isArray(value)
        ? JSON.stringify(value)
        : typeof value === 'string'
        ? value
        : '';

      return (
        <Textarea
          placeholder='["value1", "value2"]'
          value={stringValue}
          onChange={(e) => {
            const val = e.target.value;
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

    return (
      <Input
        placeholder="Enter value"
        value={String(value || '')}
        onChange={(e) => {
          const val = e.target.value;
          const numVal = Number(val);
          if (!isNaN(numVal) && val !== '') {
            updateMetadataFilter(filterId, { value: numVal });
          } else {
            updateMetadataFilter(filterId, { value: val });
          }
        }}
        className="h-8 text-sm"
      />
    );
  };

  return (
    <div className="space-y-3 px-4">
      {metadataFilters.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No metadata filters defined
          </p>
          <Button onClick={addMetadataFilter} size="sm" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
        </div>
      ) : (
        <>
          {metadataFilters.map((filter, index) => (
            <div key={filter.id}>
              {index > 0 && (
                <div className="flex items-center justify-center gap-1 py-1">
                  {(['$and', '$or'] as LogicalOperator[]).map((op) => (
                    <Button
                      key={op}
                      size="sm"
                      variant={metadataLogicalOperator === op ? 'default' : 'outline'}
                      className="h-6 px-2 text-xs"
                      onClick={() => setMetadataLogicalOperator(op)}
                    >
                      {op === '$and' ? 'AND' : 'OR'}
                    </Button>
                  ))}
                </div>
              )}
            <div className="rounded-md border p-3 space-y-3 relative">
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMetadataFilter(filter.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <span className="text-xs font-medium text-muted-foreground">
                Condition {index + 1}
              </span>

              {/* Field Name with Auto-suggest */}
              <div className="space-y-1.5">
                <Label className="text-xs">Field Name</Label>
                <FieldNameCombobox
                  value={filter.field}
                  options={metadataKeys}
                  onValueChange={(value) => updateMetadataFilter(filter.id, { field: value })}
                />
              </div>

              {/* Operator */}
              <div className="space-y-1.5">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={filter.operator}
                  onValueChange={(value: FilterOperator) =>
                    updateMetadataFilter(filter.id, { operator: value })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="space-y-1.5">
                <Label className="text-xs">Value</Label>
                {getValueInput(filter.id, filter.operator, filter.value)}
              </div>
            </div>
            </div>
          ))}

          <Button onClick={addMetadataFilter} variant="outline" size="sm" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Another Filter
          </Button>
        </>
      )}
    </div>
  );
}

// Field Name Combobox with auto-suggest
function FieldNameCombobox({
  value,
  options,
  onValueChange,
}: {
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const search = inputValue.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(search));
  }, [options, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onValueChange(newValue);
    if (!open && newValue) {
      setOpen(true);
    }
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
    onValueChange(option);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => options.length > 0 && setOpen(true)}
            placeholder="Select or type field name..."
            className="h-8 text-sm pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-8 w-8 p-0"
            onClick={() => setOpen(!open)}
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <ScrollArea className="max-h-[200px]">
          {filteredOptions.length > 0 ? (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    value === option && "bg-accent"
                  )}
                  onClick={() => handleSelectOption(option)}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 px-3 text-center">
              <p className="text-sm text-muted-foreground">
                {options.length === 0 ? "No metadata fields found" : "No matching field"}
              </p>
              {inputValue && (
                <p className="text-xs text-muted-foreground mt-1">
                  Using "{inputValue}" as field name
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
