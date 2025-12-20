import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface TicketPanelContextType {
  isOpen: boolean;
  openTicketPanel: () => void;
  closeTicketPanel: () => void;
  toggleTicketPanel: () => void;
}

const TicketPanelContext = createContext<TicketPanelContextType | undefined>(undefined);

interface TicketPanelProviderProps {
  children: ReactNode;
}

export function TicketPanelProvider({ children }: TicketPanelProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openTicketPanel = useCallback(() => {
    // Clear any stored pending ticket - we're creating a new one
    localStorage.removeItem('checkout-pending-ticket');
    setIsOpen(true);
  }, []);

  const closeTicketPanel = useCallback(() => {
    setIsOpen(false);
    localStorage.removeItem('checkout-pending-ticket');
  }, []);

  const toggleTicketPanel = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) {
        localStorage.removeItem('checkout-pending-ticket');
      }
      return !prev;
    });
  }, []);

  return (
    <TicketPanelContext.Provider value={{ isOpen, openTicketPanel, closeTicketPanel, toggleTicketPanel }}>
      {children}
    </TicketPanelContext.Provider>
  );
}

export function useTicketPanel() {
  const context = useContext(TicketPanelContext);
  if (context === undefined) {
    throw new Error('useTicketPanel must be used within a TicketPanelProvider');
  }
  return context;
}
