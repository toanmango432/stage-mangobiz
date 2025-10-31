import { io, Socket } from 'socket.io-client';
import { settingsDB } from '../db/database';
import { store } from '../store';
import { setOnlineStatus } from '../store/slices/syncSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private salonId: string | null = null;

  async connect() {
    try {
      // Get auth token and salon ID
      const token = await settingsDB.get('auth_token');
      this.salonId = await settingsDB.get('salon_id');

      if (!token || !this.salonId) {
        console.warn('⚠️ Socket: No auth token or salon ID found');
        return;
      }

      // Create socket connection
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
          salonId: this.salonId,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventListeners();
      
      console.log('🔌 Socket: Connecting...');
    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket: Connected');
      this.reconnectAttempts = 0;
      store.dispatch(setOnlineStatus(true));
      
      // Join salon room
      if (this.salonId) {
        this.socket?.emit('join:salon', this.salonId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket: Disconnected -', reason);
      store.dispatch(setOnlineStatus(false));
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket: Connection error -', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Socket: Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket: Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    // Data sync events
    this.socket.on('appointment:created', (data) => {
      console.log('📅 Socket: New appointment created', data);
      // Dispatch to Redux store
      // store.dispatch(addAppointment(data));
    });

    this.socket.on('appointment:updated', (data) => {
      console.log('📅 Socket: Appointment updated', data);
      // store.dispatch(updateAppointment(data));
    });

    this.socket.on('appointment:deleted', (data) => {
      console.log('📅 Socket: Appointment deleted', data);
      // store.dispatch(removeAppointment(data.id));
    });

    this.socket.on('ticket:created', (data) => {
      console.log('🎫 Socket: New ticket created', data);
      // store.dispatch(addTicket(data));
    });

    this.socket.on('ticket:updated', (data) => {
      console.log('🎫 Socket: Ticket updated', data);
      // store.dispatch(updateTicket(data));
    });

    this.socket.on('staff:updated', (data) => {
      console.log('👤 Socket: Staff updated', data);
      // store.dispatch(updateStaff(data));
    });

    this.socket.on('staff:clockIn', (data) => {
      console.log('⏰ Socket: Staff clocked in', data);
      // store.dispatch(updateStaff(data));
    });

    this.socket.on('staff:clockOut', (data) => {
      console.log('⏰ Socket: Staff clocked out', data);
      // store.dispatch(updateStaff(data));
    });

    // Sync events
    this.socket.on('sync:required', (data) => {
      console.log('🔄 Socket: Sync required', data);
      // Trigger sync process
      // store.dispatch(triggerSync());
    });

    this.socket.on('sync:conflict', (data) => {
      console.log('⚠️ Socket: Sync conflict detected', data);
      // Handle conflict resolution
      // store.dispatch(handleSyncConflict(data));
    });

    // Turn queue events (for Phase 5)
    this.socket.on('queue:updated', (data) => {
      console.log('📋 Socket: Turn queue updated', data);
      // store.dispatch(updateTurnQueue(data));
    });

    // Payment events (for Phase 6)
    this.socket.on('payment:completed', (data) => {
      console.log('💳 Socket: Payment completed', data);
      // store.dispatch(addTransaction(data));
    });
  }

  // Emit events
  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('⚠️ Socket: Not connected, cannot emit event:', event);
    }
  }

  // Join salon room
  joinSalon(salonId: string) {
    this.salonId = salonId;
    this.emit('join:salon', salonId);
  }

  // Leave salon room
  leaveSalon() {
    if (this.salonId) {
      this.emit('leave:salon', this.salonId);
      this.salonId = null;
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      console.log('🔌 Socket: Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance (for advanced usage)
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

export default socketClient;
