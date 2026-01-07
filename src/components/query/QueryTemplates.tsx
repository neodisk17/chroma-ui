import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQueryStore } from '@/stores/query-store';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export function QueryTemplates() {
  const { templates, saveTemplate, loadTemplate, deleteTemplate, queryText, metadataFilters, documentFilters } =
    useQueryStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    // Check if query has content
    const hasContent = queryText || metadataFilters.length > 0 || documentFilters.length > 0;
    if (!hasContent) {
      toast.error('Cannot save an empty query. Add some query parameters first.');
      return;
    }

    saveTemplate(templateName.trim());
    toast.success(`Template '${templateName.trim()}' saved successfully`);
    setTemplateName('');
    setSaveDialogOpen(false);
  };

  const handleLoadTemplate = () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template to load');
      return;
    }

    loadTemplate(selectedTemplateId);
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      toast.success(`Template '${template.name}' loaded successfully`);
    }
    setSelectedTemplateId('');
    setLoadDialogOpen(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setTemplateToDelete(templateId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;

    const template = templates.find((t) => t.id === templateToDelete);
    deleteTemplate(templateToDelete);
    if (template) {
      toast.success(`Template '${template.name}' deleted successfully`);
    }
    setTemplateToDelete(null);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Template Button */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save Query
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Query Template</DialogTitle>
            <DialogDescription>
              Save your current query configuration as a template for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Recent Articles Search"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTemplate();
                  }
                }}
              />
            </div>
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Current Query:</span></p>
              <p>• Query Text: {queryText ? `"${queryText.substring(0, 50)}..."` : 'None'}</p>
              <p>• Metadata Filters: {metadataFilters.length}</p>
              <p>• Document Filters: {documentFilters.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Button */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={templates.length === 0}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Load Query
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Query Template</DialogTitle>
            <DialogDescription>
              Select a saved template to load its query configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No templates saved yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Template Preview */}
                {selectedTemplateId && (
                  <Card className="mt-4">
                    <CardContent className="pt-6">
                      {(() => {
                        const template = templates.find((t) => t.id === selectedTemplateId);
                        if (!template) return null;

                        return (
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h4 className="font-medium">{template.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  Created: {new Date(template.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{template.queryType}</Badge>
                                <Badge variant="secondary">n={template.nResults}</Badge>
                              </div>
                              {template.queryText && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-muted-foreground">Query Text:</span>
                                  <p className="text-xs bg-muted p-2 rounded">
                                    {template.queryText.substring(0, 100)}
                                    {template.queryText.length > 100 && '...'}
                                  </p>
                                </div>
                              )}
                              {template.metadataFilters.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-muted-foreground">Metadata Filters:</span>
                                  <p className="text-xs">{template.metadataFilters.length} condition(s)</p>
                                </div>
                              )}
                              {template.documentFilters.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-muted-foreground">Document Filters:</span>
                                  <p className="text-xs">{template.documentFilters.length} condition(s)</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLoadTemplate} disabled={!selectedTemplateId}>
              Load Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTemplateToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTemplate} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
