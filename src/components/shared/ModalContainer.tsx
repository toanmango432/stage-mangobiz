import React from 'react';

interface ModalContainerProps {
  children: React.ReactNode;
  zIndex?: number;
  maxWidth?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  children,
  zIndex = 90,
  maxWidth = '6xl'
}) => {
  return (
    <div
      className={`fixed inset-4 bg-white rounded-xl shadow-2xl flex flex-col max-w-${maxWidth} mx-auto`}
      style={{ zIndex }}
    >
      {children}
    </div>
  );
};
