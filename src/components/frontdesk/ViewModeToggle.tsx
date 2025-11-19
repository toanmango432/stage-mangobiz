import { Grid, List } from 'lucide-react';
import clsx from 'clsx';
import Tippy from '@tippyjs/react';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  size?: 'sm' | 'md';
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  size = 'md'
}: ViewModeToggleProps) {
  const iconSize = size === 'sm' ? 16 : 18;
  const buttonClasses = size === 'sm'
    ? 'min-w-[48px] min-h-[48px] p-3'
    : 'min-w-[48px] min-h-[48px] p-3';

  return (
    <div className="inline-flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
      <Tippy content="List View">
        <button
          onClick={() => onViewModeChange('list')}
          className={clsx(
            buttonClasses,
            'rounded-md transition-all duration-200',
            viewMode === 'list'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          )}
          aria-label="List View"
          aria-pressed={viewMode === 'list'}
        >
          <List size={iconSize} strokeWidth={2} />
        </button>
      </Tippy>

      <Tippy content="Grid View">
        <button
          onClick={() => onViewModeChange('grid')}
          className={clsx(
            buttonClasses,
            'rounded-md transition-all duration-200',
            viewMode === 'grid'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          )}
          aria-label="Grid View"
          aria-pressed={viewMode === 'grid'}
        >
          <Grid size={iconSize} strokeWidth={2} />
        </button>
      </Tippy>
    </div>
  );
}
