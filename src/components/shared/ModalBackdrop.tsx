import React from 'react';

interface ModalBackdropProps {
  onClick: () => void;
  zIndex?: number;
}

export const ModalBackdrop: React.FC<ModalBackdropProps> = ({ onClick, zIndex = 80 }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50"
      style={{ zIndex }}
      onClick={onClick}
    />
  );
};
