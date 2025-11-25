/**
 * Error Boundary for Book Module
 * Catches errors in calendar components and displays user-friendly fallback
 */

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class BookErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to console for debugging
    console.error('Book Module Error:', error);
    console.error('Error Info:', errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error tracking service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Reload the page to reset app state
    window.location.reload();
  };

  handleResetWithoutReload = (): void => {
    // Just reset error boundary state without reload
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* Error Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Error Message */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-600 mb-6">
                The calendar encountered an error and couldn't display properly.
              </p>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                  <p className="text-xs font-mono text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <details className="text-xs font-mono text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-900">
                        Component Stack
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap overflow-x-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleResetWithoutReload}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-xs text-gray-500">
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}
