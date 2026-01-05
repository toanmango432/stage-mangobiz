import { Plus } from 'lucide-react';
interface CreateTicketButtonProps {
  onClick: () => void;
  'data-id'?: string;
}
export function CreateTicketButton({
  onClick,
  'data-id': dataId
}: CreateTicketButtonProps) {
  return (
    <button
      data-id={dataId}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 bg-[#27AE60] hover:bg-[#219653] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
      aria-label="Create new ticket"
    >
      <Plus size={24} className="group-hover:rotate-90 transition-transform duration-200" />
    </button>
  );
}