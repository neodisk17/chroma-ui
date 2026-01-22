import type { DocumentCellRendererParams } from './types';

export const DocumentCellRenderer = (params: DocumentCellRendererParams) => {
  const text = params.value || '';
  const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;

  return (
    <div className="flex h-full items-center" title={text}>
      <span className="truncate">{preview}</span>
    </div>
  );
};
