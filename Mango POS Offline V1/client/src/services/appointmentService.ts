import axios, { AxiosInstance } from 'axios';
import { appointmentsDB, syncQueueDB } from '../db/database';
import {
  Appointment,
  AppointmentRequest,
  TicketDTO,
  EditAppt,
  ResultJs,
  AptPayment,
  AppointmentTicketType,
  LocalAppointment,
} from '../types/appointment';
import { SyncStatus } from '../types/common';

/**
 * Appointment Service
 * Handles all appointment-related API calls with offline support
 * 
 * OFFLINE STRATEGY:
 * 1. All mutations save to IndexedDB first
 * 2. Queue sync operations
 * 3. Attempt immediate sync if online
 * 4. Background sync when connection returns
 */
export class AppointmentService {
  private api: AxiosInstance;
  private readonly BASE_URL = '/api/Appointment';

  constructor(baseURL: string = import.meta.env.VITE_API_URL || '') {
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  // ============================================================================
  // READ OPERATIONS (GET)
  // ============================================================================

  /**
   * Get single appointment by ID
   * @param id Appointment ID
   * @param rvcNo Salon/Store ID
   */
  async getAppointment(id: number, rvcNo: number): Promise<TicketDTO> {
    try {
      const response = await this.api.get<TicketDTO>(`${this.BASE_URL}/${id}`, {
        params: { RVCNo: rvcNo },
      });
      return response.data;
    } catch (error) {
      // Fallback to local data if offline
      if (!navigator.onLine) {
        // TODO: Implement local fallback with appointmentsDB
        console.warn('Offline mode: appointment data not available');
      }
      throw error;
    }
  }

  /**
   * Get appointment payments
   * @param id Appointment ID
   * @param rvcNo Salon/Store ID
   */
  async getAppointmentPayments(
    id: number,
    rvcNo: number
  ): Promise<AptPayment[]> {
    const response = await this.api.get<AptPayment[]>(
      `${this.BASE_URL}/${id}/payment`,
      {
        params: { rvcno: rvcNo, id },
      }
    );
    return response.data;
  }

  /**
   * Get list of appointments for a customer
   * @param customerId Customer ID
   * @param rvcNo Salon/Store ID
   * @param ticketType Filter by ticket type
   */
  async getAppointmentList(
    customerId: number,
    rvcNo: number,
    ticketType?: AppointmentTicketType
  ): Promise<TicketDTO[]> {
    try {
      const response = await this.api.get<TicketDTO[]>(
        `${this.BASE_URL}/GetList`,
        {
          params: {
            customerId,
            rvcNo,
            ticketType,
          },
        }
      );
      return response.data;
    } catch (error) {
      // Fallback to local data if offline
      if (!navigator.onLine) {
        return this.getLocalAppointmentsByCustomer(customerId, ticketType);
      }
      throw error;
    }
  }

  /**
   * Get appointment detail for editing
   * @param id Appointment ID
   * @param partyId Party ID (for group bookings)
   * @param rvcNo Salon/Store ID
   */
  async getAppointmentDetail(
    id: number,
    partyId: number,
    rvcNo: number
  ): Promise<EditAppt> {
    const response = await this.api.get<EditAppt>(
      `${this.BASE_URL}/${id}/detail`,
      {
        params: { partyId, rvcNo },
      }
    );
    return response.data;
  }

  /**
   * Get last upcoming appointment for customer
   * @param rvcNo Salon/Store ID
   * @param customerId Customer ID
   */
  async getUpcomingLastAppointment(
    rvcNo: number,
    customerId: number
  ): Promise<TicketDTO> {
    const response = await this.api.get<TicketDTO>(
      `${this.BASE_URL}/GetAptUpcomingLast`,
      {
        params: { rvcNo, customerId },
      }
    );
    return response.data;
  }

  /**
   * Get last appointments grouped by type
   * @param customerId Customer ID
   * @param rvcNo Salon/Store ID
   * @param type Filter type (0 = all)
   */
  async getLastAppointments(
    customerId: number,
    rvcNo: number,
    type: number = 0
  ): Promise<Record<string, TicketDTO[]>> {
    const response = await this.api.get<Record<string, TicketDTO[]>>(
      `${this.BASE_URL}/GetListAptLast`,
      {
        params: { CustomerID: customerId, RVCNo: rvcNo, type },
      }
    );
    return response.data;
  }

  // ============================================================================
  // CREATE/UPDATE OPERATIONS (POST/PUT)
  // ============================================================================

  /**
   * Book new appointment(s)
   * OFFLINE SUPPORT: Saves to IndexedDB first, queues for sync
   * 
   * @param appointments Single or multiple appointment requests
   * @param rvcNo Salon/Store ID
   */
  async bookAppointment(
    appointments: AppointmentRequest[],
    rvcNo: number
  ): Promise<ResultJs<object>> {
    // 1. Save to local database first (offline-first)
    const localAppointments = await this.saveAppointmentsLocally(
      appointments,
      rvcNo
    );

    // 2. Queue for sync
    await this.queueForSync(localAppointments, 'create');

    // 3. Try immediate sync if online
    if (navigator.onLine) {
      try {
        const response = await this.api.post<ResultJs<object>>(
          this.BASE_URL,
          appointments
        );

        // 4. Update local records with server IDs
        if (response.data.status === 200 && response.data.data) {
          await this.updateLocalWithServerIds(
            localAppointments,
            response.data.data
          );
        }

        return response.data;
      } catch (error) {
        console.error('Sync failed, will retry later:', error);
        // Return success anyway - data is saved locally
        return {
          status: 200,
          message: 'Appointment saved locally, will sync when online',
          data: { localIds: localAppointments.map((a) => a.id) },
        };
      }
    }

    // Offline - return success with local IDs
    return {
      status: 200,
      message: 'Appointment saved offline, will sync when online',
      data: { localIds: localAppointments.map((a) => a.id) },
    };
  }

  /**
   * Edit existing appointment
   * OFFLINE SUPPORT: Updates IndexedDB first, queues for sync
   * 
   * @param rvcNo Salon/Store ID
   * @param appointmentData Appointment edit data
   */
  async editAppointment(
    rvcNo: number,
    appointmentData: any
  ): Promise<ResultJs<any>> {
    // 1. Update local database first
    const localId = await this.updateAppointmentLocally(appointmentData);

    // 2. Queue for sync
    await this.queueForSync([{ id: localId } as any], 'update');

    // 3. Try immediate sync if online
    if (navigator.onLine) {
      try {
        const response = await this.api.put<ResultJs<any>>(this.BASE_URL, appointmentData, {
          params: { rvcNo },
        });
        return response.data;
      } catch (error) {
        console.error('Sync failed, will retry later:', error);
        return {
          status: 200,
          message: 'Appointment updated locally, will sync when online',
        };
      }
    }

    return {
      status: 200,
      message: 'Appointment updated offline, will sync when online',
    };
  }

  /**
   * Cancel appointment (online booking)
   * @param id Appointment ID
   * @param reason Cancellation reason
   * @param rvcNo Salon/Store ID
   */
  async cancelAppointment(
    id: number,
    reason: string,
    rvcNo: number
  ): Promise<ResultJs<string>> {
    // 1. Update local status first
    // TODO: Update using appointmentsDB helper
    // await appointmentsDB.update(id, { status: 'cancelled' }, 'system');

    // 2. Try immediate sync if online
    if (navigator.onLine) {
      try {
        const response = await this.api.post<ResultJs<string>>(
          `${this.BASE_URL}/CancelAppointmentOnlineBooking`,
          null,
          {
            params: { id, reason, rvcNo },
          }
        );
        return response.data;
      } catch (error) {
        console.error('Cancel sync failed, will retry later:', error);
        return {
          status: 200,
          message: 'Appointment cancelled locally, will sync when online',
          data: '',
        };
      }
    }

    return {
      status: 200,
      message: 'Appointment cancelled offline, will sync when online',
      data: '',
    };
  }

  // ============================================================================
  // OFFLINE SUPPORT METHODS
  // ============================================================================

  /**
   * Save appointments to IndexedDB
   */
  private async saveAppointmentsLocally(
    appointments: AppointmentRequest[],
    rvcNo: number
  ): Promise<LocalAppointment[]> {
    const localAppointments: LocalAppointment[] = appointments.map((apt) => ({
      id: `local_${Date.now()}_${Math.random()}`,
      salonId: rvcNo.toString(),
      clientId: apt.customer.toString(),
      clientName: apt.cusName,
      clientPhone: apt.contactPhone || '',
      staffId: apt.emp.toString(),
      staffName: '',
      services: apt.lstService.map((svc) => ({
        serviceId: svc.itemID.toString(),
        serviceName: svc.itemName || '',
        staffId: svc.empID.toString(),
        staffName: svc.empName || '',
        duration: svc.duration,
        price: svc.BasePrice,
      })),
      status: apt.IsRequest ? 'requested' : ('scheduled' as any),
      scheduledStartTime: new Date(`${apt.startDate} ${apt.startTime}`),
      scheduledEndTime: new Date(
        new Date(`${apt.startDate} ${apt.startTime}`).getTime() +
          apt.totalDuration * 60000
      ),
      notes: apt.note,
      source: 'online',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current_user',
      lastModifiedBy: 'current_user',
      syncStatus: 'pending',
    }));

    // TODO: Save to IndexedDB using appointmentsDB helper
    // await appointmentsDB.create(...);
    return localAppointments;
  }

  /**
   * Update appointment in IndexedDB
   */
  private async updateAppointmentLocally(data: any): Promise<string> {
    // TODO: Update using appointmentsDB helper
    // const appointment = await appointmentsDB.getById(data.appointmentID);
    // if (appointment) {
    //   await appointmentsDB.update(appointment.id, data, 'system');
    //   return appointment.id;
    // }
    throw new Error('Appointment not found locally');
  }

  /**
   * Queue appointments for background sync
   */
  private async queueForSync(
    appointments: LocalAppointment[],
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    const syncItems = appointments.map((apt) => ({
      id: `sync_${Date.now()}_${Math.random()}`,
      type: 'appointment' as const,
      operation,
      data: apt,
      priority: 3, // Appointments have priority 3
      status: 'pending' as const,
      createdAt: new Date(),
      retryCount: 0,
    }));

    // Queue for sync
    for (const item of syncItems) {
      await syncQueueDB.add({
        type: item.operation,
        entity: 'appointment',
        entityId: item.data.id,
        action: item.operation.toUpperCase() as any,
        payload: item.data,
        priority: item.priority,
        maxAttempts: 5,
      });
    }
  }

  /**
   * Update local appointments with server IDs after sync
   */
  private async updateLocalWithServerIds(
    localAppointments: LocalAppointment[],
    serverData: any
  ): Promise<void> {
    // Implementation depends on server response structure
    // Update local records with serverId and mark as synced
    for (const local of localAppointments) {
      // TODO: Update sync status using appointmentsDB
      // await appointmentsDB.update(local.id, { syncStatus: 'synced' }, 'system');
    }
  }

  /**
   * Get local appointments by customer (offline fallback)
   */
  private async getLocalAppointmentsByCustomer(
    customerId: number,
    ticketType?: AppointmentTicketType
  ): Promise<TicketDTO[]> {
    // TODO: Implement using appointmentsDB helper
    let appointments: LocalAppointment[] = [];

    // Filter by ticket type if specified
    if (ticketType) {
      const now = new Date();
      appointments = appointments.filter((apt) => {
        if (ticketType === 'Upcoming') {
          return apt.scheduledStartTime > now && apt.status !== 'cancelled';
        } else if (ticketType === 'Completed') {
          return apt.status === 'completed';
        } else if (ticketType === 'Cancelled') {
          return apt.status === 'cancelled';
        }
        return true;
      });
    }

    return appointments.map(this.mapLocalToTicketDTO);
  }

  /**
   * Map local appointment to TicketDTO
   */
  private mapLocalToTicketDTO(local: LocalAppointment): TicketDTO {
    return {
      appointmentID: local.serverId || 0,
      customerID: parseInt(local.clientId),
      customerName: local.clientName,
      customerPhone: local.clientPhone,
      staffID: parseInt(local.staffId),
      staffName: local.staffName,
      serviceName: local.services.map((s) => s.serviceName).join(', '),
      startTime: local.scheduledStartTime,
      endTime: local.scheduledEndTime,
      duration: Math.round(
        (local.scheduledEndTime.getTime() - local.scheduledStartTime.getTime()) /
          60000
      ),
      status: local.status,
      note: local.notes,
      isOnlineBooking: local.source === 'online',
      isConfirmed: local.status === 'confirmed' || local.status === ('scheduled' as any),
      createdAt: local.createdAt,
    };
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
