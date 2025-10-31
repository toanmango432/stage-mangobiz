import { useState } from 'react';
import { PendingTickets } from '../PendingTickets';
import { Search, Filter, SortAsc, Clock, DollarSign, User, Grid, List } from 'lucide-react';

type SortBy = 'waitTime' | 'amount' | 'staff' | 'client';
type ViewMode = 'grid' | 'list';

export function Pending() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('waitTime');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pending Checkout</h1>
            <p className="text-sm text-gray-600 mt-1">Services completed, awaiting payment</p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, staff, or ticket number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SortAsc className="w-4 h-4" />
              <span className="text-sm font-medium">Sort</span>
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    setSortBy('waitTime');
                    setShowFilters(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                    sortBy === 'waitTime' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Wait Time</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy('amount');
                    setShowFilters(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                    sortBy === 'amount' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Amount</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy('staff');
                    setShowFilters(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                    sortBy === 'staff' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Staff Name</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy('client');
                    setShowFilters(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                    sortBy === 'client' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Client Name</span>
                </button>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <PendingTickets isMinimized={false} />
        </div>
      </div>
    </div>
  );
}
