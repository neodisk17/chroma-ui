import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KEYBOARD_SHORTCUTS } from '@/hooks/use-keyboard-shortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * KeyboardShortcutsDialog - Shows available keyboard shortcuts
 */
export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Global Shortcuts</h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.global.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {(isMac ? shortcut.mac : shortcut.windows).split('+').map((key, i) => (
                      <Badge key={i} variant="secondary" className="font-mono">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page-specific shortcuts */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Page-Specific Shortcuts</h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.page.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{shortcut.description}</span>
                  <div className="flex gap-1">
                    {(isMac ? shortcut.mac : shortcut.windows).split('+').map((key, i) => (
                      <Badge key={i} variant="secondary" className="font-mono">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            <p>Press {isMac ? 'Cmd' : 'Ctrl'}+/ to show this help anytime</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
