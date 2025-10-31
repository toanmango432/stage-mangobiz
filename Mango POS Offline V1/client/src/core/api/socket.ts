import { io, Socket } from 'socket.io-client';
import { settingsDB } from '@/core/db';
import { store } from '@/core/store';

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
      // store.dispatch(setOnlineStatus(true));
      
      // Join salon room
      if (this.salonId) {
        this.socket?.emit('join:salon', this.salonId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket: Disconnected -', reason);
      // store.dispatch(setOnlineStatus(false));
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
    });

    this.socket.on('appointment:updated', (data) => {
      console.log('📅 Socket: Appointment updated', data);
    });

    this.socket.on('ticket:created', (data) => {
      console.log('🎫 Socket: New ticket created', data);
    });

    this.socket.on('ticket:updated', (data) => {
      console.log('🎫 Socket: Ticket updated', data);
    });

    this.socket.on('staff:updated', (data) => {
      console.log('👤 Socket: Staff updated', data);
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

