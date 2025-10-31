import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { ListChecks } from 'lucide-react';

interface TurnTrackerFabProps {
  onClick: () => void;
}

export function TurnTrackerFab({ onClick }: TurnTrackerFabProps) {
  return (
    <div className="fixed bottom-[86px] left-0 z-[70] pointer-events-none select-none">
      <Tippy content="Turn Tracker" placement="right" delay={[150, 0]}>
        <button
          onClick={onClick}
          className="group pointer-events-auto m-0 flex items-center justify-center rounded-full h-12 w-12 bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-[0_8px_20px_rgba(255,86,86,0.35)] hover:shadow-[0_12px_28px_rgba(255,86,86,0.5)] active:scale-95 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white/70 ring-1 ring-white/30"
          aria-label="Open Turn Tracker"
          style={{ transform: 'translateX(-1px)' }}
        >
          <div className="relative">
            <ListChecks className="w-6 h-6 stroke-[2.5] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" />
            {/* subtle glow */}
            <span className="absolute inset-0 rounded-full bg-white/25 blur-[8px] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </Tippy>
    </div>
  );
}
