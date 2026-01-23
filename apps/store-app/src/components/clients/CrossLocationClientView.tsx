/**
 * CrossLocationClientView - Display client information from other org locations
 *
 * Shows visit history, combined loyalty points, and wallet balances
 * for clients in multi-location organizations with data sharing enabled.
 *
 * Part of: Client Module Phase 5 - Multi-Store Client Sharing
 * Reference: docs/architecture/MULTI_STORE_CLIENT_SPEC.md
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { supabase } from '@/services/supabase/client';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/spinner';

// ==================== ICONS ====================

const BuildingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const WalletIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// ==================== TYPES ====================

interface CrossLocationVisit {
  id: string;
  visitDate: string;
  visitingStoreId: string;
  visitingStoreName: string;
  homeStoreId: string;
  homeStoreName: string;
  servicesPerformed: string[];
  totalAmount: number;
}

interface LocationSummary {
  storeId: string;
  storeName: string;
  isHome: boolean;
  visitCount: number;
  totalSpent: number;
  lastVisit: string | null;
}

interface OrgClientData {
  organizationId: string | null;
  organizationName: string | null;
  sharingMode: 'full' | 'selective' | 'isolated' | null;
  homeLocationId: string | null;
  homeLocationName: string | null;
  loyaltyScope: 'location' | 'organization';
  walletScope: 'location' | 'organization';
  visits: CrossLocationVisit[];
  locationSummaries: LocationSummary[];
  combinedLoyaltyPoints: number | null;
  combinedWalletBalance: number | null;
}

interface CrossLocationClientViewProps {
  /** Client ID to fetch cross-location data for */
  clientId: string;
  /** Additional CSS classes */
  className?: string;
}

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ==================== MAIN COMPONENT ====================

export const CrossLocationClientView: React.FC<CrossLocationClientViewProps> = ({
  clientId,
  className = '',
}) => {
  const currentStoreId = useAppSelector((state) => state.auth.store?.storeId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrgClientData | null>(null);

  // Load cross-location data
  const loadData = useCallback(async () => {
    if (!clientId || !currentStoreId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get client's organization info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('organization_id, home_location_id')
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;

      if (!clientData?.organization_id) {
        // Client is not part of an organization
        setData(null);
        setLoading(false);
        return;
      }

      // Get organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, client_sharing_settings')
        .eq('id', clientData.organization_id)
        .single();

      if (orgError) throw orgError;

      const sharingSettings = orgData.client_sharing_settings as Record<string, unknown> || {};
      const sharingMode = (sharingSettings.sharingMode as string) || 'isolated';

      // If isolated mode, show minimal info
      if (sharingMode === 'isolated') {
        setData({
          organizationId: orgData.id,
          organizationName: orgData.name,
          sharingMode: 'isolated',
          homeLocationId: clientData.home_location_id,
          homeLocationName: null,
          loyaltyScope: 'location',
          walletScope: 'location',
          visits: [],
          locationSummaries: [],
          combinedLoyaltyPoints: null,
          combinedWalletBalance: null,
        });
        setLoading(false);
        return;
      }

      // Get home location name
      let homeLocationName: string | null = null;
      if (clientData.home_location_id) {
        const { data: homeStore } = await supabase
          .from('stores')
          .select('name')
          .eq('id', clientData.home_location_id)
          .single();
        homeLocationName = homeStore?.name || null;
      }

      // Get all stores in organization
      const { data: orgStores, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('organization_id', clientData.organization_id);

      if (storesError) throw storesError;

      // Create store name lookup
      const storeNames: Record<string, string> = {};
      (orgStores || []).forEach((store) => {
        storeNames[store.id] = store.name;
      });

      // Get cross-location visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('cross_location_visits')
        .select('*')
        .eq('client_id', clientId)
        .eq('organization_id', clientData.organization_id)
        .order('visit_date', { ascending: false })
        .limit(50);

      if (visitsError) throw visitsError;

      const visits: CrossLocationVisit[] = (visitsData || []).map((v) => ({
        id: v.id,
        visitDate: v.visit_date,
        visitingStoreId: v.visiting_store_id,
        visitingStoreName: storeNames[v.visiting_store_id] || 'Unknown Location',
        homeStoreId: v.home_store_id,
        homeStoreName: storeNames[v.home_store_id] || 'Unknown Location',
        servicesPerformed: v.services_performed || [],
        totalAmount: v.total_amount || 0,
      }));

      // Build location summaries
      const summaryMap = new Map<string, LocationSummary>();
      visits.forEach((visit) => {
        const existing = summaryMap.get(visit.visitingStoreId);
        if (existing) {
          existing.visitCount++;
          existing.totalSpent += visit.totalAmount;
          if (!existing.lastVisit || visit.visitDate > existing.lastVisit) {
            existing.lastVisit = visit.visitDate;
          }
        } else {
          summaryMap.set(visit.visitingStoreId, {
            storeId: visit.visitingStoreId,
            storeName: visit.visitingStoreName,
            isHome: visit.visitingStoreId === clientData.home_location_id,
            visitCount: 1,
            totalSpent: visit.totalAmount,
            lastVisit: visit.visitDate,
          });
        }
      });

      const locationSummaries = Array.from(summaryMap.values()).sort((a, b) => {
        // Home location first, then by visit count
        if (a.isHome) return -1;
        if (b.isHome) return 1;
        return b.visitCount - a.visitCount;
      });

      // Get combined loyalty/wallet if org-wide scope
      const loyaltyScope = (sharingSettings.loyaltyScope as string) || 'location';
      const walletScope = (sharingSettings.giftCardScope as string) || 'location';

      let combinedLoyaltyPoints: number | null = null;
      let combinedWalletBalance: number | null = null;

      if (loyaltyScope === 'organization') {
        // Sum loyalty points across all org locations for this client's identity
        const { data: loyaltyData } = await supabase
          .from('loyalty_balances')
          .select('points')
          .eq('client_id', clientId);

        if (loyaltyData && loyaltyData.length > 0) {
          combinedLoyaltyPoints = loyaltyData.reduce(
            (sum, r) => sum + (r.points || 0),
            0
          );
        }
      }

      if (walletScope === 'organization') {
        // Sum wallet balances across all org locations
        const { data: walletData } = await supabase
          .from('client_wallet')
          .select('balance')
          .eq('client_id', clientId);

        if (walletData && walletData.length > 0) {
          combinedWalletBalance = walletData.reduce(
            (sum, r) => sum + (r.balance || 0),
            0
          );
        }
      }

      setData({
        organizationId: orgData.id,
        organizationName: orgData.name,
        sharingMode: sharingMode as 'full' | 'selective' | 'isolated',
        homeLocationId: clientData.home_location_id,
        homeLocationName,
        loyaltyScope: loyaltyScope as 'location' | 'organization',
        walletScope: walletScope as 'location' | 'organization',
        visits,
        locationSummaries,
        combinedLoyaltyPoints,
        combinedWalletBalance,
      });
    } catch (err) {
      console.error('[CrossLocationClientView] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cross-location data');
    } finally {
      setLoading(false);
    }
  }, [clientId, currentStoreId]);

  // Load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==================== RENDER STATES ====================

  // Loading state
  if (loading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <Spinner />
        <p className="text-sm text-gray-500 mt-2">Loading cross-location data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center flex-col gap-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <InfoIcon className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshIcon className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Not in organization
  if (!data) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
          <InfoIcon className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">No Multi-Location Data</p>
            <p className="text-sm text-gray-500 mt-1">
              This client is not part of a multi-location organization.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Isolated mode - minimal info
  if (data.sharingMode === 'isolated') {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50">
          <InfoIcon className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Limited Sharing Enabled</p>
            <p className="text-sm text-amber-700 mt-1">
              {data.organizationName} has isolated sharing mode.
              Only critical safety data is shared between locations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <BuildingIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{data.organizationName}</h3>
            <p className="text-sm text-gray-500">
              {data.locationSummaries.length} location{data.locationSummaries.length !== 1 ? 's' : ''} visited
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={loadData}>
          <RefreshIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Home Location */}
      {data.homeLocationName && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50">
          <HomeIcon className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-blue-800">
            Home Location: <span className="font-medium">{data.homeLocationName}</span>
          </span>
        </div>
      )}

      {/* Combined Balances (if org-wide scope) */}
      {(data.combinedLoyaltyPoints !== null || data.combinedWalletBalance !== null) && (
        <div className="grid grid-cols-2 gap-4">
          {data.combinedLoyaltyPoints !== null && (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2 mb-1">
                <StarIcon className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-600 font-medium uppercase">
                  Organization-Wide Loyalty
                </span>
              </div>
              <p className="text-2xl font-bold text-amber-800">
                {data.combinedLoyaltyPoints.toLocaleString()} pts
              </p>
              <p className="text-xs text-amber-600 mt-1">Combined across all locations</p>
            </div>
          )}

          {data.combinedWalletBalance !== null && (
            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-1">
                <WalletIcon className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium uppercase">
                  Organization-Wide Wallet
                </span>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {formatCurrency(data.combinedWalletBalance)}
              </p>
              <p className="text-xs text-green-600 mt-1">Combined across all locations</p>
            </div>
          )}
        </div>
      )}

      {/* Location Summaries */}
      {data.locationSummaries.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            Visit Summary by Location
          </h4>
          <div className="space-y-2">
            {data.locationSummaries.map((location) => (
              <div
                key={location.storeId}
                className={`p-3 rounded-lg border ${
                  location.storeId === currentStoreId
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{location.storeName}</span>
                    {location.isHome && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        Home
                      </span>
                    )}
                    {location.storeId === currentStoreId && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                        This Location
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Visits:</span>
                    <span className="ml-1 font-medium text-gray-900">{location.visitCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Spent:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {formatCurrency(location.totalSpent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {formatDate(location.lastVisit)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Visits */}
      {data.visits.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            Recent Cross-Location Visits
          </h4>
          <div className="space-y-2">
            {data.visits.slice(0, 10).map((visit) => (
              <div
                key={visit.id}
                className={`p-3 rounded-lg border ${
                  visit.visitingStoreId === currentStoreId
                    ? 'border-purple-200 bg-purple-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BuildingIcon className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{visit.visitingStoreName}</span>
                    {visit.visitingStoreId === currentStoreId && (
                      <span className="text-xs text-purple-600">(This Location)</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(visit.visitDate)}</span>
                </div>
                {visit.servicesPerformed.length > 0 && (
                  <p className="text-sm text-gray-600">
                    Services: {visit.servicesPerformed.join(', ')}
                  </p>
                )}
                {visit.totalAmount > 0 && (
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatCurrency(visit.totalAmount)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {data.visits.length > 10 && (
            <p className="text-sm text-gray-500 text-center mt-3">
              Showing 10 of {data.visits.length} visits
            </p>
          )}
        </div>
      )}

      {/* Empty state for visits */}
      {data.visits.length === 0 && (
        <div className="p-6 text-center rounded-lg border border-dashed border-gray-200">
          <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No cross-location visits recorded</p>
        </div>
      )}

      {/* Data source indicator */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 text-xs text-gray-500">
        <InfoIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          Data shown is from other {data.organizationName} locations.
          Sharing mode: <span className="font-medium capitalize">{data.sharingMode}</span>
        </p>
      </div>
    </div>
  );
};
