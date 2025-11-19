import { Receipt, Search, Filter } from 'lucide-react';

interface SalesEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  activeTab: 'tickets' | 'appointments';
}

export function SalesEmptyState({ hasFilters, onClearFilters, activeTab }: SalesEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        {/* Add animations */}
        <style>{`
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.8);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes floatIcon {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          .animate-scale-in {
            animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
          }
          .animate-float {
            animation: floatIcon 3s ease-in-out infinite;
          }
        `}</style>

        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-md animate-scale-in">
          <Search className="w-10 h-10 text-gray-400 animate-float" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 animate-scale-in" style={{ animationDelay: '100ms' }}>
          No {activeTab} found
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto animate-scale-in" style={{ animationDelay: '200ms' }}>
          No results match your current filters. Try adjusting your search criteria or clear all filters to see all {activeTab}.
        </p>
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 font-medium shadow-md animate-scale-in"
          style={{ animationDelay: '300ms' }}
        >
          <Filter className="w-4 h-4" />
          <span>Clear all filters</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
      {/* Add animations */}
      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes floatIcon {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) both;
        }
        .animate-float {
          animation: floatIcon 3s ease-in-out infinite;
        }
      `}</style>

      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-md animate-scale-in">
        <Receipt className="w-10 h-10 text-blue-600 animate-float" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 animate-scale-in" style={{ animationDelay: '100ms' }}>
        No {activeTab} yet
      </h3>
      <p className="text-gray-600 max-w-md mx-auto animate-scale-in" style={{ animationDelay: '200ms' }}>
        {activeTab === 'tickets'
          ? 'No service tickets have been created yet. Start serving customers and their tickets will appear here automatically.'
          : 'No appointments have been scheduled yet. Book your first appointment and it will appear here.'}
      </p>
    </div>
  );
}
