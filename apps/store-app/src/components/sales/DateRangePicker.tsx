import { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onClose: () => void;
}

const presets = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This Week', days: 'thisWeek' as const },
  { label: 'Last Week', days: 'lastWeek' as const },
  { label: 'This Month', days: 'thisMonth' as const },
  { label: 'Last Month', days: 'lastMonth' as const },
];

export function DateRangePicker({ value, onChange, onClose }: DateRangePickerProps) {
  const [fromDate, setFromDate] = useState(value.from ? formatDateForInput(value.from) : '');
  const [toDate, setToDate] = useState(value.to ? formatDateForInput(value.to) : '');

  const handlePreset = (preset: typeof presets[number]) => {
    const now = new Date();
    let from: Date;
    let to: Date = new Date(now.setHours(23, 59, 59, 999));

    if (typeof preset.days === 'number') {
      if (preset.days === 0) {
        // Today
        from = new Date(now.setHours(0, 0, 0, 0));
      } else if (preset.days === 1) {
        // Yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        from = new Date(yesterday.setHours(0, 0, 0, 0));
        to = new Date(yesterday.setHours(23, 59, 59, 999));
      } else {
        // Last N days
        from = new Date();
        from.setDate(from.getDate() - preset.days);
        from.setHours(0, 0, 0, 0);
      }
    } else if (preset.days === 'thisWeek') {
      // This Week (Monday to Sunday)
      from = new Date(now);
      const day = from.getDay();
      const diff = from.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      from.setDate(diff);
      from.setHours(0, 0, 0, 0);
    } else if (preset.days === 'lastWeek') {
      // Last Week
      from = new Date(now);
      const day = from.getDay();
      const diff = from.getDate() - day - 6;
      from.setDate(diff);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(to.getDate() + 6);
      to.setHours(23, 59, 59, 999);
    } else if (preset.days === 'thisMonth') {
      // This Month
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      from.setHours(0, 0, 0, 0);
    } else if (preset.days === 'lastMonth') {
      // Last Month
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      from.setHours(0, 0, 0, 0);
      to = new Date(now.getFullYear(), now.getMonth(), 0);
      to.setHours(23, 59, 59, 999);
    } else {
      from = new Date();
    }

    onChange({ from, to });
    setFromDate(formatDateForInput(from));
    setToDate(formatDateForInput(to));
  };

  const handleCustomRange = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      onChange({ from, to });
    }
  };

  const handleClear = () => {
    onChange({ from: null, to: null });
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Presets */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Select</h4>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset)}
                    className="px-3 py-2 text-sm text-left rounded-lg border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Range</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="from-date" className="block text-sm text-gray-600 mb-1">
                    From Date
                  </label>
                  <input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="to-date" className="block text-sm text-gray-600 mb-1">
                    To Date
                  </label>
                  <input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleCustomRange}
                  disabled={!fromDate || !toDate}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Custom Range
                </button>
              </div>
            </div>
          </div>

          {/* Current Selection */}
          {value.from && value.to && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Selected Range</p>
                  <p className="text-gray-900 font-medium">
                    {formatDateForDisplay(value.from)} - {formatDateForDisplay(value.to)}
                  </p>
                </div>
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
