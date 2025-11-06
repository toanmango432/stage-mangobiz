import React from 'react';
import { X } from 'lucide-react';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="text-lg font-bold">{title}</h3>
      <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
