/**
 * Schedule Module
 * Staff scheduling and time-off management
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleView } from '../schedule/ScheduleView';

// Create a query client for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export function Schedule() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-full overflow-auto">
        <ScheduleView />
      </div>
    </QueryClientProvider>
  );
}
