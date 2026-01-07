import { useState } from 'react';
import { IPC_CHANNELS } from '../../shared/constants';

function HomePage() {
  const [pingResult, setPingResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePing = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.invoke<{ reply: string; timestamp: number }>(
        IPC_CHANNELS.PING,
        { message: 'Hello from renderer!', timestamp: Date.now() }
      );
      if (result.success && result.data) {
        setPingResult(result.data.reply);
      } else {
        setPingResult(`Error: ${result.error}`);
      }
    } catch (error) {
      setPingResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold mb-8">Welcome to ChromaDB UI</h1>
      <p className="text-muted-foreground mb-8">
        A desktop application for managing ChromaDB collections and documents
      </p>

      <div className="border rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Test IPC Communication</h2>
        <button
          onClick={handlePing}
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Ping'}
        </button>
        {pingResult && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm">{pingResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
