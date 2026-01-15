import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CreateTicketModal } from '@/components/tickets/CreateTicketModal';

interface CreateTicketButtonProps {
  onClick?: () => void;
  'data-id'?: string;
}

export function CreateTicketButton({
  onClick,
  'data-id': dataId
}: CreateTicketButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // If custom onClick is provided, use it (for backward compatibility)
    if (onClick) {
      onClick();
    } else {
      // Otherwise, open the CreateTicketModal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <button
        data-id={dataId}
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        aria-label="Create new ticket"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-200" />
      </button>

      <CreateTicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
