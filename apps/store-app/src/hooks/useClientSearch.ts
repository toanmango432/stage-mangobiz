import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { clientsDB } from '../db/database';
import { Client } from '../types/client';

interface UseClientSearchProps {
  storeId: string;
  isOpen: boolean;
  maxRecentClients?: number;
}

/**
 * Custom hook for client search functionality
 * Handles recent clients, search, and debouncing
 */
export function useClientSearch({
  storeId,
  isOpen,
  maxRecentClients = 5
}: UseClientSearchProps) {
  const [clientSearch, setClientSearch] = useState('');
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);

  const debouncedSearch = useDebounce(clientSearch, 300);

  // Load recent clients when modal opens
  useEffect(() => {
    if (!isOpen || !storeId) return;

    clientsDB.getAll(storeId)
      .then(allClients => {
        const sorted = allClients
          .sort((a, b) => {
            const aDate = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
            const bDate = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
            return bDate - aDate;
          })
          .slice(0, maxRecentClients);

        setRecentClients(sorted);
      })
      .catch(error => {
        console.error('Error loading recent clients:', error);
        setRecentClients([]);
      });
  }, [isOpen, storeId, maxRecentClients]);

  // Search clients with debouncing
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    clientsDB.search(storeId, debouncedSearch)
      .then(results => {
        setSearchResults(results);
      })
      .catch(error => {
        console.error('Error searching clients:', error);
        setSearchResults([]);
      })
      .finally(() => {
        setSearching(false);
      });
  }, [debouncedSearch, storeId]);

  // Combine recent and search results
  const displayClients = useMemo(() => {
    if (debouncedSearch.length >= 2) {
      return searchResults;
    }
    return recentClients;
  }, [debouncedSearch, searchResults, recentClients]);

  const clearSearch = () => {
    setClientSearch('');
    setSearchResults([]);
  };

  return {
    clientSearch,
    setClientSearch,
    displayClients,
    searching,
    clearSearch,
    recentClients,
    searchResults,
    hasSearchQuery: debouncedSearch.length >= 2,
  };
}