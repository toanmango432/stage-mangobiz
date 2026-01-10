import { Plus, Clock, DollarSign, Sparkles } from 'lucide-react';
import type { Service } from '../../types';

interface UpsellCardProps {
  service: Service;
  onAdd: (service: Service) => void;
}

export function UpsellCard({ service, onAdd }: UpsellCardProps) {
  return (
    <div
      className="
        relative bg-gradient-to-br from-[#fdf8eb] to-[#faf9f7]
        border border-[#d4a853]/30 rounded-xl p-4
        transition-all duration-200
        hover:border-[#d4a853]/60 hover:shadow-md
      "
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#d4a853]" />
        <span className="text-xs font-['Work_Sans'] text-[#d4a853] font-medium uppercase tracking-wide">
          Popular Add-On
        </span>
      </div>

      <h4 className="font-['Plus_Jakarta_Sans'] font-semibold text-[#1f2937] text-sm mb-2 line-clamp-1">
        {service.name}
      </h4>

      <div className="flex items-center gap-3 text-xs font-['Work_Sans'] text-[#6b7280] mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>{service.durationMinutes} min</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5" />
          <span>${service.price}</span>
        </div>
      </div>

      <button
        onClick={() => onAdd(service)}
        className="
          w-full py-2 rounded-lg
          bg-[#d4a853] text-white
          font-['Work_Sans'] text-sm font-medium
          flex items-center justify-center gap-1.5
          transition-all duration-150
          hover:bg-[#c49942]
          active:scale-[0.98]
          shadow-sm shadow-[#d4a853]/25
        "
      >
        <Plus className="w-4 h-4" />
        Quick Add
      </button>
    </div>
  );
}

export default UpsellCard;
