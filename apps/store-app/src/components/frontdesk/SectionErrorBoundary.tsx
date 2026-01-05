import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

interface SectionErrorFallbackProps {
  error: Error;
  retry: () => void;
  sectionName?: string;
}

/**
 * Fallback component for section-level errors
 * Shows a compact error message that doesn't break the entire layout
 */
const SectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({
  error,
  retry,
  sectionName = 'This section'
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-sm font-medium text-red-900">
              {sectionName} encountered an error
            </h3>
            <p className="text-xs text-red-700 mt-1">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={retry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

/**
 * Section-specific error boundary that shows inline error messages
 * Prevents errors in one section from breaking the entire FrontDesk
 */
export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({
  children,
  sectionName,
  onError,
  fallback
}) => {
  const FallbackComponent = fallback || ((props: any) => (
    <SectionErrorFallback {...props} sectionName={sectionName} />
  ));

  return (
    <ErrorBoundary
      fallbackComponent={FallbackComponent}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * Pre-configured error boundaries for specific sections
 */
export const TeamSectionErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SectionErrorBoundary sectionName="Team Section">
    {children}
  </SectionErrorBoundary>
);

export const WaitListErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SectionErrorBoundary sectionName="Wait List">
    {children}
  </SectionErrorBoundary>
);

export const ServiceSectionErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SectionErrorBoundary sectionName="Service Section">
    {children}
  </SectionErrorBoundary>
);

export const ComingAppointmentsErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SectionErrorBoundary sectionName="Coming Appointments">
    {children}
  </SectionErrorBoundary>
);

export const SettingsErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SectionErrorBoundary sectionName="Settings">
    {children}
  </SectionErrorBoundary>
);