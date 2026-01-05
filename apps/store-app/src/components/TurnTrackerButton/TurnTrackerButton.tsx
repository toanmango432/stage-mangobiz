import React from 'react';
import { RotateCcw } from 'lucide-react';
interface TurnTrackerButtonProps {
  text?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
  'data-id'?: string;
}
export function TurnTrackerButton({
  text = 'Turn Tracker',
  onClick,
  icon,
  className = '',
  'data-id': dataId
}: TurnTrackerButtonProps) {
  return <button data-id={dataId} onClick={onClick} className={`
        w-[140px] h-[50px] min-h-[50px] min-w-[50px]
        bg-[rgb(244,76,127)] hover:bg-[rgb(224,56,107)]
        rounded-r-[5px]
        flex items-center justify-start
        font-medium text-sm leading-[15px] text-white
        cursor-pointer
        transition-all duration-200 ease-in-out
        border-0 my-[5px]
        font-sans
        ${className}
      `} style={{
    fontFamily: 'Montserrat, sans-serif'
  }}>
      <div className="pl-[13px] w-9 h-9 flex items-center justify-center">
        {icon || <RotateCcw size={24} className="text-white" />}
      </div>
      <span className="block ml-[10px]">{text}</span>
    </button>;
}