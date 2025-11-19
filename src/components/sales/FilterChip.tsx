import { X } from 'lucide-react';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
}

export function FilterChip({ label, value, onRemove }: FilterChipProps) {
  // Determine color scheme based on filter type
  const getColorClasses = () => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel === 'search') {
      return {
        container: 'bg-gradient-to-r from-purple-50 to-purple-50/50 border-purple-200 border-l-4 border-l-purple-500',
        text: 'text-purple-900',
        button: 'hover:bg-purple-200',
        icon: 'text-purple-700'
      };
    } else if (lowerLabel === 'status') {
      return {
        container: 'bg-gradient-to-r from-blue-50 to-blue-50/50 border-blue-200 border-l-4 border-l-blue-500',
        text: 'text-blue-900',
        button: 'hover:bg-blue-200',
        icon: 'text-blue-700'
      };
    } else if (lowerLabel === 'date' || lowerLabel === 'date range') {
      return {
        container: 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-emerald-200 border-l-4 border-l-emerald-500',
        text: 'text-emerald-900',
        button: 'hover:bg-emerald-200',
        icon: 'text-emerald-700'
      };
    }
    return {
      container: 'bg-gradient-to-r from-gray-50 to-gray-50/50 border-gray-200 border-l-4 border-l-gray-500',
      text: 'text-gray-900',
      button: 'hover:bg-gray-200',
      icon: 'text-gray-700'
    };
  };

  const colors = getColorClasses();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:scale-105 transition-all duration-200 shadow-sm ${colors.container}`}>
      <span className="text-gray-600 font-medium">{label}:</span>
      <span className={`font-semibold ${colors.text} max-w-[200px] truncate`}>{value}</span>
      <button
        onClick={onRemove}
        className={`p-0.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${colors.button}`}
        aria-label={`Remove ${label} filter`}
      >
        <X className={`w-3.5 h-3.5 ${colors.icon}`} />
      </button>
    </div>
  );
}
