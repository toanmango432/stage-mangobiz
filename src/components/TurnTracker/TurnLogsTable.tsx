import { Calendar, User, DollarSign, FileText } from 'lucide-react';
import { ModalBackdrop } from '../shared/ModalBackdrop';
import { ModalContainer } from '../shared/ModalContainer';
import { ModalHeader } from '../shared/ModalHeader';

interface TurnLogsTableProps {
  onClose: () => void;
}

interface TurnLog {
  id: string;
  date: string;
  staff: string;
  turnAmount: number;
  reason: string;
}

// Sample data for demonstration
const sampleLogs: TurnLog[] = [
  {
    id: '1',
    date: '2025-11-05 10:30 AM',
    staff: 'Sarah Johnson',
    turnAmount: 45.50,
    reason: 'End of shift cash deposit'
  },
  {
    id: '2',
    date: '2025-11-05 09:15 AM',
    staff: 'Mike Chen',
    turnAmount: 120.00,
    reason: 'Morning register count'
  },
  {
    id: '3',
    date: '2025-11-04 6:45 PM',
    staff: 'Emily Davis',
    turnAmount: 85.75,
    reason: 'Evening shift close'
  }
];

export function TurnLogsTable({ onClose }: TurnLogsTableProps) {
  return (
    <>
      <ModalBackdrop onClick={onClose} />
      <ModalContainer>
        <ModalHeader title="Turn Logs" onClose={onClose} />
        <div className="flex-1 p-6 overflow-auto">
          {sampleLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Staff
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Turn Amount
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Reason
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sampleLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{log.date}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{log.staff}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">
                        ${log.turnAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <FileText className="w-16 h-16 mb-4" />
              <p>No turn logs available</p>
            </div>
          )}
        </div>
      </ModalContainer>
    </>
  );
}
