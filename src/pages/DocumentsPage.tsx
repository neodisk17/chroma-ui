import { useParams } from 'react-router-dom';
import { DocumentGrid } from '../components/documents/DocumentGrid';

function DocumentsPage() {
  const { collectionId } = useParams<{ collectionId: string }>();

  if (!collectionId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">
            No collection selected
          </h2>
        </div>
      </div>
    );
  }

  return <DocumentGrid collectionName={collectionId} />;
}

export default DocumentsPage;
