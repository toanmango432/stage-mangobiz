import React from 'react';
import type { EnhancedClient } from '../types';
import { Card, Badge, EmptyState, CalendarIcon } from '../components/SharedComponents';

interface HistorySectionProps {
  client: EnhancedClient;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ client }) => {
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

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default HistorySection;
