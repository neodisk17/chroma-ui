import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary component - Catches React component errors and displays fallback UI
 *
 * Features:
 * - Catches errors in child component tree
 * - Displays user-friendly error page
 * - Shows error details in development mode
 * - Provides reset/reload functionality
 * - Logs errors to console for debugging
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // In production, you could send error to error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional reset callback
    this.props.onReset?.();
  };

  handleReload = () => {
    // Reload the entire application
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
          <Card className="max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-xl">Something went wrong</CardTitle>
                  <CardDescription>
                    {this.props.fallbackMessage || 'An unexpected error occurred in the application'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {isDevelopment && this.state.error && (
                <div className="space-y-2">
                  <div className="rounded-md bg-destructive/10 p-4">
                    <p className="text-sm font-semibold text-destructive">Error Details:</p>
                    <p className="mt-2 font-mono text-xs text-destructive">
                      {this.state.error.toString()}
                    </p>
                  </div>

                  {this.state.errorInfo && (
                    <details className="rounded-md bg-muted p-4">
                      <summary className="cursor-pointer text-sm font-semibold">
                        Stack Trace (Click to expand)
                      </summary>
                      <pre className="mt-2 overflow-auto text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {!isDevelopment && (
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    We apologize for the inconvenience. The error has been logged and we'll look into it.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try reloading the application or go back to the home page.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * SectionErrorBoundary - Smaller error boundary for specific sections
 * Shows inline error UI instead of full-page
 */
export function SectionErrorBoundary({
  children,
  sectionName,
}: {
  children: ReactNode;
  sectionName?: string;
}) {
  return (
    <ErrorBoundary
      fallbackMessage={`An error occurred${sectionName ? ` in ${sectionName}` : ''}`}
      onReset={() => {
        // Section-specific reset logic if needed
        console.log(`Reset section: ${sectionName}`);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
