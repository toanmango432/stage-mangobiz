import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

// Type for ticket data that can be opened in the panel
export interface TicketData {
  id: string;
  number?: number;
  clientId?: string;
  clientName: string;
  clientType?: string;
  service?: string;
  services?: Array<{
    id?: string;
    serviceId?: string;
    serviceName?: string;
    name?: string;
    price?: number;
    duration?: number;
    status?: string;
    staffId?: string;
    staffName?: string;
  }>;
  checkoutServices?: Array<{
    id?: string;
    serviceId?: string;
    serviceName?: string;
    name?: string;
    price?: number;
    duration?: number;
    status?: string;
    staffId?: string;
    staffName?: string;
  }>;
  technician?: string;
  techId?: string;
  duration?: string;
  subtotal?: number;
  discount?: number;
  status?: string;
  time?: string;
  notes?: string;
}

interface TicketPanelContextType {
  isOpen: boolean;
  openTicketPanel: () => void;
  openTicketWithData: (ticket: TicketData) => void;
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

  // Open the panel with an existing ticket's data
  const openTicketWithData = useCallback((ticket: TicketData) => {
    console.log('🎫 TicketPanelContext.openTicketWithData called:', ticket);
    // Store the ticket data in localStorage so TicketPanel can load it
    localStorage.setItem('checkout-pending-ticket', JSON.stringify(ticket));
    console.log('🎫 Setting isOpen to true');
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

  // PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isOpen,
    openTicketPanel,
    openTicketWithData,
    closeTicketPanel,
    toggleTicketPanel,
  }), [isOpen, openTicketPanel, openTicketWithData, closeTicketPanel, toggleTicketPanel]);

  return (
    <TicketPanelContext.Provider value={contextValue}>
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
