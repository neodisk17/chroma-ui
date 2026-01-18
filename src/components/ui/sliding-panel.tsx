import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface SlidingPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Callback when the panel should close */
  onClose: () => void;
  /** Panel title displayed in the header */
  title: string;
  /** Optional badge text displayed next to the title */
  badge?: string;
  /** Panel width - defaults to 600px */
  width?: number | string;
  /** Main content of the panel */
  children: React.ReactNode;
  /** Footer content (action buttons, etc.) */
  footer?: React.ReactNode;
  /** Whether the panel is in loading state */
  isLoading?: boolean;
  /** Custom loading skeleton */
  loadingSkeleton?: React.ReactNode;
  /** Additional class names for the panel container */
  className?: string;
}

/**
 * SlidingPanel - A reusable side panel that slides in from the right
 *
 * Features:
 * - Slides in from the right side of the screen
 * - Header with title, optional badge, and close button
 * - Scrollable content area
 * - Optional footer for action buttons
 * - Loading state with skeleton
 * - Customizable width
 */
export function SlidingPanel({
  open,
  onClose,
  title,
  badge,
  width = 600,
  children,
  footer,
  isLoading = false,
  loadingSkeleton,
  className,
}: SlidingPanelProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  // Default loading skeleton
  const defaultSkeleton = (
    <div className="space-y-4 p-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div
      className={cn(
        'fixed right-0 top-0 z-50 h-full border-l bg-background shadow-lg',
        className
      )}
      style={{ width: widthStyle }}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {badge && (
              <Badge variant="outline" className="font-mono text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {isLoading ? (loadingSkeleton || defaultSkeleton) : children}
        </ScrollArea>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SlidingPanelSection - A section within the sliding panel content
 */
interface SlidingPanelSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function SlidingPanelSection({ children, className }: SlidingPanelSectionProps) {
  return <div className={cn('space-y-4 p-4', className)}>{children}</div>;
}
