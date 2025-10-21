import React from 'react';
import { SalonCenter } from './components/SalonCenter';
import { TicketProvider } from './context/TicketContext';
export function App() {
  return <TicketProvider>
      <div className="w-full h-screen bg-gray-50">
        <SalonCenter />
      </div>
    </TicketProvider>;
}