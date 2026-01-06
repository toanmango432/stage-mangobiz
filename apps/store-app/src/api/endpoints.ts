import { apiClient, retryRequest } from './client';
import type { 
  Appointment, 
  Ticket, 
  Transaction, 
  Staff, 
  Client, 
  Service 
} from '../types';

// ============================================
// Authentication API
// ============================================
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  loginSalonMode: async (storeId: string, pin: string) => {
    const response = await apiClient.post('/auth/salon-mode', { storeId, pin });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  verifyToken: async () => {
    const response = await apiClient.get('/auth/verify');
    return response.data;
  },
};

// ============================================
// Appointments API
// ============================================
export const appointmentsAPI = {
  getAll: async (storeId: string, date?: string) => {
    const response = await retryRequest(() =>
      apiClient.get<Appointment[]>(`/appointments`, { params: { storeId, date } })
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  create: async (appointment: Partial<Appointment>) => {
    const response = await apiClient.post<Appointment>('/appointments', appointment);
    return response.data;
  },

  update: async (id: string, updates: Partial<Appointment>) => {
    const response = await apiClient.put<Appointment>(`/appointments/${id}`, updates);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },

  checkIn: async (id: string) => {
    const response = await apiClient.post<Appointment>(`/appointments/${id}/check-in`);
    return response.data;
  },
};

// ============================================
// Tickets API
// ============================================
export const ticketsAPI = {
  getAll: async (storeId: string, status?: string) => {
    const response = await retryRequest(() =>
      apiClient.get<Ticket[]>(`/tickets`, { params: { storeId, status } })
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  create: async (ticket: Partial<Ticket>) => {
    const response = await apiClient.post<Ticket>('/tickets', ticket);
    return response.data;
  },

  update: async (id: string, updates: Partial<Ticket>) => {
    const response = await apiClient.put<Ticket>(`/tickets/${id}`, updates);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.post<Ticket>(`/tickets/${id}/complete`);
    return response.data;
  },

  void: async (id: string, reason: string) => {
    const response = await apiClient.post<Ticket>(`/tickets/${id}/void`, { reason });
    return response.data;
  },
};

// ============================================
// Transactions API
// ============================================
export const transactionsAPI = {
  getAll: async (storeId: string, startDate?: string, endDate?: string) => {
    const response = await retryRequest(() =>
      apiClient.get<Transaction[]>(`/transactions`, { 
        params: { storeId, startDate, endDate } 
      })
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  create: async (transaction: Partial<Transaction>) => {
    const response = await apiClient.post<Transaction>('/transactions', transaction);
    return response.data;
  },

  void: async (id: string, reason: string) => {
    const response = await apiClient.post<Transaction>(`/transactions/${id}/void`, { reason });
    return response.data;
  },

  refund: async (id: string, amount: number, reason: string) => {
    const response = await apiClient.post<Transaction>(`/transactions/${id}/refund`, { 
      amount, 
      reason 
    });
    return response.data;
  },
};

// ============================================
// Staff API
// ============================================
export const staffAPI = {
  getAll: async (storeId: string) => {
    const response = await retryRequest(() =>
      apiClient.get<Staff[]>(`/staff`, { params: { storeId } })
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Staff>(`/staff/${id}`);
    return response.data;
  },

  update: async (id: string, updates: Partial<Staff>) => {
    const response = await apiClient.put<Staff>(`/staff/${id}`, updates);
    return response.data;
  },

  clockIn: async (id: string) => {
    const response = await apiClient.post<Staff>(`/staff/${id}/clock-in`);
    return response.data;
  },

  clockOut: async (id: string) => {
    const response = await apiClient.post<Staff>(`/staff/${id}/clock-out`);
    return response.data;
  },
};

// ============================================
// Clients API
// ============================================
export const clientsAPI = {
  search: async (storeId: string, query: string) => {
    const response = await apiClient.get<Client[]>(`/clients/search`, { 
      params: { storeId, query } 
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Client>(`/clients/${id}`);
    return response.data;
  },

  create: async (client: Partial<Client>) => {
    const response = await apiClient.post<Client>('/clients', client);
    return response.data;
  },

  update: async (id: string, updates: Partial<Client>) => {
    const response = await apiClient.put<Client>(`/clients/${id}`, updates);
    return response.data;
  },
};

// ============================================
// Services API
// ============================================
export const servicesAPI = {
  getAll: async (storeId: string) => {
    const response = await retryRequest(() =>
      apiClient.get<Service[]>(`/services`, { params: { storeId } })
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Service>(`/services/${id}`);
    return response.data;
  },
};

// ============================================
// Sync API
// ============================================
export const syncAPI = {
  push: async (operations: any[]) => {
    const response = await apiClient.post('/sync/push', { operations });
    return response.data;
  },

  pull: async (storeId: string, lastSyncAt?: string) => {
    const response = await apiClient.get('/sync/pull', { 
      params: { storeId, lastSyncAt } 
    });
    return response.data;
  },

  resolveConflict: async (entityType: string, entityId: string, resolution: any) => {
    const response = await apiClient.post('/sync/resolve-conflict', {
      entityType,
      entityId,
      resolution,
    });
    return response.data;
  },
};

// Export all APIs
export default {
  auth: authAPI,
  appointments: appointmentsAPI,
  tickets: ticketsAPI,
  transactions: transactionsAPI,
  staff: staffAPI,
  clients: clientsAPI,
  services: servicesAPI,
  sync: syncAPI,
};
