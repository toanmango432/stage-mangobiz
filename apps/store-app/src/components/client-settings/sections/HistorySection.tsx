import React, { useState, useEffect } from 'react';
import type { EnhancedClient } from '../types';
import { Card, Badge, EmptyState, CalendarIcon } from '../components/SharedComponents';
import { CrossLocationClientView } from '../../clients/CrossLocationClientView';
import { useAppSelector } from '@/store/hooks';
import { supabase } from '@/services/supabase/client';

interface HistorySectionProps {
  client: EnhancedClient;
}

// Tab types for history section
type HistoryTab = 'this-location' | 'other-locations';

// Building icon for tab
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

export const HistorySection: React.FC<HistorySectionProps> = ({ client }) => {
  const storeId = useAppSelector((state) => state.auth.store?.storeId);
  const [activeTab, setActiveTab] = useState<HistoryTab>('this-location');
  const [hasOrgLocations, setHasOrgLocations] = useState(false);
  const [orgSharingEnabled, setOrgSharingEnabled] = useState(false);

  // Check if client is in a multi-location org with sharing enabled
  useEffect(() => {
    async function checkOrgStatus() {
      if (!storeId) return;

      try {
        // Get store's org
        const { data: storeData } = await supabase
          .from('stores')
          .select('organization_id')
          .eq('id', storeId)
          .single();

        if (!storeData?.organization_id) {
          setHasOrgLocations(false);
          return;
        }

        // Check if org has multiple locations
        const { count } = await supabase
          .from('stores')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', storeData.organization_id);

        if (!count || count <= 1) {
          setHasOrgLocations(false);
          return;
        }

        setHasOrgLocations(true);

        // Check if sharing is enabled (not isolated)
        const { data: orgData } = await supabase
          .from('organizations')
          .select('client_sharing_settings')
          .eq('id', storeData.organization_id)
          .single();

        const settings = orgData?.client_sharing_settings as Record<string, unknown> || {};
        const sharingMode = (settings.sharingMode as string) || 'isolated';

        setOrgSharingEnabled(sharingMode !== 'isolated');
      } catch (err) {
        console.error('[HistorySection] Failed to check org status:', err);
      }
    }

    checkOrgStatus();
  }, [storeId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysSinceLastVisit = () => {
    if (!client.visitSummary.lastVisitDate) return null;
    const lastVisit = new Date(client.visitSummary.lastVisitDate);
    const now = new Date();
    return Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysSinceVisit = getDaysSinceLastVisit();
  const isOverdue = daysSinceVisit && client.visitSummary.visitFrequency
    ? daysSinceVisit > client.visitSummary.visitFrequency * 1.5
    : false;

  // Show tabs only if org has multiple locations
  const showLocationTabs = hasOrgLocations && orgSharingEnabled;

  return (
    <div className="space-y-6">
      {/* Location Tabs - Only show if org has multiple locations with sharing */}
      {showLocationTabs && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6">
            <button
              onClick={() => setActiveTab('this-location')}
              className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'this-location'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              This Location
            </button>
            <button
              onClick={() => setActiveTab('other-locations')}
              className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'other-locations'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BuildingIcon className="w-4 h-4" />
              Other Locations
            </button>
          </nav>
        </div>
      )}

      {/* Other Locations Tab Content */}
      {showLocationTabs && activeTab === 'other-locations' && (
        <CrossLocationClientView clientId={client.id} className="mt-4" />
      )}

      {/* This Location Tab Content (default) */}
      {(!showLocationTabs || activeTab === 'this-location') && (
        <>
      {/* Visit Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">{client.visitSummary.totalVisits}</p>
          <p className="text-sm text-gray-500 mt-1">Total Visits</p>
        </Card>

        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(client.visitSummary.totalSpent)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total Spent</p>
        </Card>

        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(client.visitSummary.averageTicket)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Average Ticket</p>
        </Card>

        <Card className="text-center">
          <p className="text-3xl font-bold text-gray-900">
            {client.visitSummary.rebookRate ? `${client.visitSummary.rebookRate}%` : 'N/A'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Rebook Rate</p>
        </Card>
      </div>

      {/* Visit Summary */}
      <Card title="Visit Summary">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Visit Information</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Last Visit</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(client.visitSummary.lastVisitDate)}
                  </span>
                  {daysSinceVisit !== null && (
                    <p className={`text-xs ${isOverdue ? 'text-orange-600' : 'text-gray-500'}`}>
                      {daysSinceVisit} days ago
                      {isOverdue && ' (overdue)'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Visit Frequency</span>
                <span className="text-sm font-medium text-gray-900">
                  {client.visitSummary.visitFrequency
                    ? `Every ${client.visitSummary.visitFrequency} days`
                    : 'Not enough data'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Favorite Service</span>
                <span className="text-sm font-medium text-gray-900">
                  {client.visitSummary.favoriteService || 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Client Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(client.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Reliability</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">No-Shows</span>
                <span className={`text-sm font-medium ${
                  client.visitSummary.noShowCount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {client.visitSummary.noShowCount}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Late Cancellations</span>
                <span className={`text-sm font-medium ${
                  client.visitSummary.lateCancelCount > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {client.visitSummary.lateCancelCount}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Reliability Score</span>
                <Badge
                  variant={
                    client.visitSummary.noShowCount === 0 && client.visitSummary.lateCancelCount === 0
                      ? 'success'
                      : client.visitSummary.noShowCount > 2
                        ? 'error'
                        : 'warning'
                  }
                >
                  {client.visitSummary.noShowCount === 0 && client.visitSummary.lateCancelCount === 0
                    ? 'Excellent'
                    : client.visitSummary.noShowCount > 2
                      ? 'Poor'
                      : 'Good'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Summary */}
      <Card title="Financial Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
            <p className={`text-2xl font-bold ${
              (client.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatCurrency(client.outstandingBalance || 0)}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Store Credit</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(client.storeCredit || 0)}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Gift Card Balance</p>
            <p className="text-2xl font-bold text-cyan-600">
              {formatCurrency(
                client.giftCards?.reduce((sum, gc) => sum + (gc.isActive ? gc.balance : 0), 0) || 0
              )}
            </p>
          </div>
        </div>

        {/* Gift Cards */}
        {client.giftCards && client.giftCards.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Gift Cards</h4>
            <div className="space-y-2">
              {client.giftCards.map((gc) => (
                <div
                  key={gc.cardNumber}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    gc.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Card: ****{gc.cardNumber.slice(-4)}
                    </p>
                    {gc.expirationDate && (
                      <p className="text-xs text-gray-500">
                        Expires: {formatDate(gc.expirationDate)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(gc.balance)}
                    </p>
                    <Badge variant={gc.isActive ? 'success' : 'error'} size="sm">
                      {gc.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Recent Appointments Placeholder */}
      <Card title="Recent Appointments">
        <EmptyState
          icon={<CalendarIcon className="w-8 h-8 text-gray-400" />}
          title="No appointment history"
          description="Appointment history will appear here as the client visits"
        />
      </Card>
        </>
      )}
    </div>
  );
};

export default HistorySection;
