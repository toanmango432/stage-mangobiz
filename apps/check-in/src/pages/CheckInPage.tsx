import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';

export function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Client Check-In</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search for existing client
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="client-search"
              type="text"
              placeholder="Search by name or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
            />
          </div>
        </div>

        {/* Quick Add */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">New Client?</h2>
          <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 px-6 rounded-lg hover:opacity-90 transition-opacity">
            <UserPlus className="w-5 h-5" />
            <span className="font-medium">Quick Add New Client</span>
          </button>
        </div>

        {/* Placeholder for search results */}
        {searchQuery && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-500 text-center">
              Search results for "{searchQuery}" will appear here
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
