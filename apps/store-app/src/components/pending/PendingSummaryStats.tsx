import { CreditCard, DollarSign, Share2, Receipt } from 'lucide-react';

interface PendingSummaryStatsProps {
  totalPending: number;
  cardTotal: number;
  cardCount: number;
  cashTotal: number;
  cashCount: number;
  venmoTotal: number;
  venmoCount: number;
}

export function PendingSummaryStats({
  totalPending,
  cardTotal,
  cardCount,
  cashTotal,
  cashCount,
  venmoTotal,
  venmoCount,
}: PendingSummaryStatsProps) {
  const stats = [
    {
      label: 'Total Pending',
      value: totalPending,
      count: cardCount + cashCount + venmoCount,
      icon: Receipt,
      color: 'text-gray-700',
      bg: 'bg-gray-50',
    },
    {
      label: 'Card Payments',
      value: cardTotal,
      count: cardCount,
      icon: CreditCard,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Cash Payments',
      value: cashTotal,
      count: cashCount,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Venmo Payments',
      value: venmoTotal,
      count: venmoCount,
      icon: Share2,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`${stat.bg} p-2 rounded-lg`}>
                <Icon size={18} className={stat.color} />
              </div>
              <span className="text-xs text-gray-500">
                {stat.count} {stat.count === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              ${stat.value.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
