export interface Ticket {
  id: number;
  number: number;
  clientName: string;
  clientType: string;
  service: string;
  time: string;
  duration: string;
  technician: string;
  techColor: string;
  status: 'waiting' | 'in-service' | 'completed';
  createdAt: Date;
  notes?: string;
}