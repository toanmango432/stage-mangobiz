import { X } from 'lucide-react';

interface TurnSettingsPanelProps {
  onClose: () => void;
}

export function TurnSettingsPanel({ onClose }: TurnSettingsPanelProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-[90] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Turn Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-gray-500">Turn settings will be implemented here</p>
        </div>
      </div>
    </>
  );
}
