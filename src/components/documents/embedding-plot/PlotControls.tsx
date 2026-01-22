import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, ZoomIn, ZoomOut, RotateCcw, Download, Image, FileText, FileJson } from 'lucide-react';

interface PlotControlsProps {
  needsReduction: boolean;
  hasReducedData: boolean;
  isReducing: boolean;
  isExporting: boolean;
  onReduce: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onExportPng: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export function PlotControls({
  needsReduction,
  hasReducedData,
  isReducing,
  isExporting,
  onReduce,
  onZoomIn,
  onZoomOut,
  onResetView,
  onExportPng,
  onExportCsv,
  onExportJson,
}: PlotControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {needsReduction && !hasReducedData && (
        <Button onClick={onReduce} disabled={isReducing}>
          {isReducing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reduce to 2D
        </Button>
      )}
      {hasReducedData && (
        <>
          <Button variant="outline" size="icon" onClick={onZoomIn} title="Zoom in">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onZoomOut} title="Zoom out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onResetView} title="Reset view">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onExportPng}>
                <Image className="mr-2 h-4 w-4" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCsv}>
                <FileText className="mr-2 h-4 w-4" />
                Export 2D Coordinates (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportJson}>
                <FileJson className="mr-2 h-4 w-4" />
                Export Full Data (JSON)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
