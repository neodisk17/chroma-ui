import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette } from 'lucide-react';

interface ColorByDropdownProps {
  metadataKeys: string[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function ColorByDropdown({ metadataKeys, value, onChange }: ColorByDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <Palette className="h-4 w-4 text-muted-foreground" />
      <Select
        value={value || '__default__'}
        onValueChange={(val) => onChange(val === '__default__' ? null : val)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Color by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__default__">
            <span className="text-xs">Default (by distance)</span>
          </SelectItem>
          {metadataKeys.map((key) => (
            <SelectItem key={key} value={key}>
              <span className="text-xs font-mono">{key}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
