import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import DocumentsPage from './pages/DocumentsPage';
import QueryPage from './pages/QueryPage';

// Configure QueryClient with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="collections" element={<CollectionsPage />}>
                <Route path=":collectionId/documents" element={<DocumentsPage />} />
              </Route>
              <Route path="query" element={<QueryPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" theme="dark" />
        {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
