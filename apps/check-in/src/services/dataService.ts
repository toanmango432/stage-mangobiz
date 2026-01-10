/**
 * DataService - Unified data access layer for Check-In App
 *
 * Routes data operations to either Supabase (online) or IndexedDB (offline).
 * All Redux thunks should use dataService instead of direct database access.
 *
 * Pattern: Component → Redux Thunk → dataService → Supabase/IndexedDB
 */

import { supabase } from './supabase';
import { db } from './db';
import type {
  Client,
  NewClientInput,
  Service,
  ServiceCategory,
  Technician,
  CheckIn,
  CheckInService,
  CheckInGuest,
  TechnicianPreference,
  PartyPreference,
  Appointment,
} from '../types';

const isOnline = (): boolean => navigator.onLine;

type SupabaseClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  zip_code: string | null;
  sms_opt_in: boolean;
  preferred_technician_id: string | null;
  loyalty_points: number;
  loyalty_points_to_next_reward: number;
  created_at: string;
  last_visit_at: string | null;
  visit_count: number;
};

type SupabaseServiceRow = {
  id: string;
  name: string;
  category_id: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  description: string | null;
  thumbnail_url: string | null;
  service_categories: { id: string; name: string; display_order: number } | null;
};

type SupabaseTechnicianRow = {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  photo_url: string | null;
  status: string;
  service_ids: string[];
  estimated_wait_minutes: number | null;
};

const toClient = (row: SupabaseClientRow): Client => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  phone: row.phone,
  email: row.email ?? undefined,
  zipCode: row.zip_code ?? undefined,
  smsOptIn: row.sms_opt_in,
  preferredTechnicianId: row.preferred_technician_id ?? undefined,
  loyaltyPoints: row.loyalty_points ?? 0,
  loyaltyPointsToNextReward: row.loyalty_points_to_next_reward ?? 100,
  createdAt: row.created_at,
  lastVisitAt: row.last_visit_at ?? undefined,
  visitCount: row.visit_count ?? 0,
});

const toService = (row: SupabaseServiceRow): Service => ({
  id: row.id,
  name: row.name,
  categoryId: row.category_id,
  categoryName: row.service_categories?.name ?? 'Uncategorized',
  price: row.price,
  durationMinutes: row.duration_minutes,
  isActive: row.is_active,
  description: row.description ?? undefined,
  thumbnailUrl: row.thumbnail_url ?? undefined,
});

const toTechnician = (row: SupabaseTechnicianRow): Technician => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  displayName: row.display_name,
  photoUrl: row.photo_url ?? undefined,
  status: row.status as Technician['status'],
  serviceIds: row.service_ids ?? [],
  estimatedWaitMinutes: row.estimated_wait_minutes ?? undefined,
});

export const dataService = {
  clients: {
    async getByPhone(phone: string): Promise<Client | null> {
      const normalizedPhone = phone.replace(/\D/g, '');

      if (isOnline()) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('phone', normalizedPhone)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw new Error(error.message);
        }

        if (data) {
          const client = toClient(data as SupabaseClientRow);
          await db.clients.put(client);
          return client;
        }
        return null;
      }

      const client = await db.clients.where('phone').equals(normalizedPhone).first();
      return client ?? null;
    },

    async create(input: NewClientInput): Promise<Client> {
      const normalizedPhone = input.phone.replace(/\D/g, '');

      if (isOnline()) {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            first_name: input.firstName,
            last_name: input.lastName,
            phone: normalizedPhone,
            email: input.email ?? null,
            zip_code: input.zipCode ?? null,
            sms_opt_in: input.smsOptIn,
            loyalty_points: 0,
            loyalty_points_to_next_reward: 100,
            visit_count: 0,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);

        const client = toClient(data as SupabaseClientRow);
        await db.clients.put(client);
        return client;
      }

      const client: Client = {
        id: crypto.randomUUID(),
        firstName: input.firstName,
        lastName: input.lastName,
        phone: normalizedPhone,
        email: input.email,
        zipCode: input.zipCode,
        smsOptIn: input.smsOptIn,
        loyaltyPoints: 0,
        loyaltyPointsToNextReward: 100,
        createdAt: new Date().toISOString(),
        visitCount: 0,
      };

      await db.clients.add(client);
      await db.syncQueue.add({
        id: crypto.randomUUID(),
        type: 'client',
        payload: JSON.stringify(client),
        createdAt: new Date().toISOString(),
        attempts: 0,
      });

      return client;
    },

    async getById(id: string): Promise<Client | null> {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) return null;
        return toClient(data as SupabaseClientRow);
      }

      const client = await db.clients.get(id);
      return client ?? null;
    },
  },

  services: {
    async getAll(): Promise<Service[]> {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('services')
          .select('*, service_categories(id, name, display_order)')
          .eq('is_active', true)
          .order('name');

        if (error) throw new Error(error.message);

        const services = (data as SupabaseServiceRow[]).map(toService);
        await db.services.bulkPut(services);
        return services;
      }

      return db.services.where('isActive').equals(1).toArray();
    },

    async getByCategory(): Promise<ServiceCategory[]> {
      const services = await this.getAll();
      const categoryMap = new Map<string, ServiceCategory>();

      for (const service of services) {
        if (!categoryMap.has(service.categoryId)) {
          categoryMap.set(service.categoryId, {
            id: service.categoryId,
            name: service.categoryName,
            displayOrder: 0,
            services: [],
          });
        }
        categoryMap.get(service.categoryId)!.services.push(service);
      }

      return Array.from(categoryMap.values());
    },
  },

  technicians: {
    async getAll(): Promise<Technician[]> {
      if (isOnline()) {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('display_name');

        if (error) throw new Error(error.message);

        const technicians = (data as SupabaseTechnicianRow[]).map(toTechnician);
        await db.technicians.bulkPut(technicians);
        return technicians;
      }

      return db.technicians.toArray();
    },

    async getAvailable(): Promise<Technician[]> {
      const all = await this.getAll();
      return all.filter((t) => t.status === 'available');
    },

    async getByServiceId(serviceId: string): Promise<Technician[]> {
      const all = await this.getAll();
      return all.filter((t) => t.serviceIds.includes(serviceId));
    },
  },

  checkins: {
    async create(params: {
      storeId: string;
      clientId: string;
      clientName: string;
      clientPhone: string;
      services: CheckInService[];
      technicianPreference: TechnicianPreference;
      guests?: CheckInGuest[];
      partyPreference?: PartyPreference;
      deviceId: string;
    }): Promise<CheckIn> {
      const checkInNumber = this.generateCheckInNumber();

      const checkin: CheckIn = {
        id: crypto.randomUUID(),
        checkInNumber,
        storeId: params.storeId,
        clientId: params.clientId,
        clientName: params.clientName,
        clientPhone: params.clientPhone,
        services: params.services,
        technicianPreference: params.technicianPreference,
        guests: params.guests ?? [],
        partyPreference: params.partyPreference,
        status: 'waiting',
        queuePosition: 0,
        estimatedWaitMinutes: 0,
        checkedInAt: new Date().toISOString(),
        source: 'kiosk',
        deviceId: params.deviceId,
        syncStatus: isOnline() ? 'synced' : 'pending',
      };

      if (isOnline()) {
        const { error } = await supabase.from('checkins').insert({
          id: checkin.id,
          check_in_number: checkin.checkInNumber,
          store_id: checkin.storeId,
          client_id: checkin.clientId,
          client_name: checkin.clientName,
          client_phone: checkin.clientPhone,
          services: checkin.services,
          technician_preference: checkin.technicianPreference,
          guests: checkin.guests,
          party_preference: checkin.partyPreference,
          status: checkin.status,
          queue_position: checkin.queuePosition,
          estimated_wait_minutes: checkin.estimatedWaitMinutes,
          checked_in_at: checkin.checkedInAt,
          source: checkin.source,
          device_id: checkin.deviceId,
          sync_status: checkin.syncStatus,
        });

        if (error) throw new Error(error.message);
      }

      await db.checkins.add(checkin);

      if (!isOnline()) {
        await db.syncQueue.add({
          id: crypto.randomUUID(),
          type: 'checkin',
          payload: JSON.stringify(checkin),
          createdAt: new Date().toISOString(),
          attempts: 0,
        });
      }

      return checkin;
    },

    generateCheckInNumber(): string {
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const letter = letters[Math.floor(Math.random() * letters.length)];
      const number = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
      return `${letter}${number}`;
    },

    async getById(id: string): Promise<CheckIn | null> {
      const checkin = await db.checkins.get(id);
      return checkin ?? null;
    },

    async updateStatus(id: string, status: CheckIn['status']): Promise<void> {
      await db.checkins.update(id, { status });

      if (isOnline()) {
        await supabase.from('checkins').update({ status }).eq('id', id);
      }
    },

    async updateQueuePosition(id: string, position: number, waitMinutes: number): Promise<void> {
      await db.checkins.update(id, {
        queuePosition: position,
        estimatedWaitMinutes: waitMinutes,
      });
    },
  },

  appointments: {
    async getByQrCode(qrData: string): Promise<Appointment | null> {
      if (!isOnline()) return null;

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('qr_code', qrData)
        .single();

      if (error) return null;

      return {
        id: data.id,
        clientId: data.client_id,
        clientName: data.client_name,
        clientPhone: data.client_phone,
        services: data.services,
        technicianId: data.technician_id,
        technicianName: data.technician_name,
        scheduledAt: data.scheduled_at,
        status: data.status,
      };
    },

    async confirmArrival(id: string): Promise<void> {
      if (!isOnline()) return;

      await supabase
        .from('appointments')
        .update({ status: 'arrived' })
        .eq('id', id);
    },
  },

  upsells: {
    /**
     * Get popular add-on services based on selected services.
     * Returns services that complement the selected ones, sorted by popularity.
     */
    async getForServices(selectedServiceIds: string[]): Promise<Service[]> {
      if (selectedServiceIds.length === 0) return [];

      // Get all services
      const allServices = await dataService.services.getAll();
      
      // Filter out already selected services
      const availableServices = allServices.filter(
        (s) => !selectedServiceIds.includes(s.id)
      );

      // Get category IDs of selected services
      const selectedCategories = new Set(
        allServices
          .filter((s) => selectedServiceIds.includes(s.id))
          .map((s) => s.categoryId)
      );

      // Upsell logic: prioritize same-category add-ons and quick add-ons (short duration, lower price)
      const scored = availableServices.map((service) => {
        let score = 0;
        
        // Same category gets higher score
        if (selectedCategories.has(service.categoryId)) {
          score += 3;
        }
        
        // Quick add-ons (under 30 min) score higher
        if (service.durationMinutes <= 30) {
          score += 2;
        }
        
        // Lower price add-ons are more likely to be added
        if (service.price <= 30) {
          score += 2;
        } else if (service.price <= 50) {
          score += 1;
        }

        return { service, score };
      });

      // Sort by score descending, then by price ascending
      scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.service.price - b.service.price;
      });

      // Return top 4 upsell suggestions
      return scored.slice(0, 4).map((s) => s.service);
    },
  },

  sync: {
    async processQueue(): Promise<number> {
      if (!isOnline()) return 0;

      const pending = await db.syncQueue.toArray();
      let processed = 0;

      for (const item of pending) {
        try {
          const payload = JSON.parse(item.payload);

          if (item.type === 'checkin') {
            await supabase.from('checkins').upsert(payload);
          } else if (item.type === 'client') {
            await supabase.from('clients').upsert({
              id: payload.id,
              first_name: payload.firstName,
              last_name: payload.lastName,
              phone: payload.phone,
              email: payload.email,
              zip_code: payload.zipCode,
              sms_opt_in: payload.smsOptIn,
            });
          }

          await db.syncQueue.delete(item.id);
          processed++;
        } catch {
          await db.syncQueue.update(item.id, { attempts: item.attempts + 1 });
        }
      }

      return processed;
    },

    async getPendingCount(): Promise<number> {
      return db.syncQueue.count();
    },
  },
};
