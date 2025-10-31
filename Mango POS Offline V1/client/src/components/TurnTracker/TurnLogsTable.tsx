import { X } from 'lucide-react';

interface TurnLogsTableProps {
  onClose: () => void;
}

export function TurnLogsTable({ onClose }: TurnLogsTableProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} />
      <div className="fixed inset-4 bg-white rounded-xl shadow-2xl z-[90] flex flex-col max-w-6xl mx-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold">Turn Logs</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-6">
          <p className="text-gray-500">Turn logs table will be implemented here</p>
        </div>
      </div>
    </>
  );
}
