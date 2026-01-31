/**
 * Search Index - In-Memory Index for Fast Searching
 *
 * Maintains an in-memory index of all searchable entities
 * built from IndexedDB data. Supports:
 * - Text search with fuzzy matching
 * - Phone number prefix matching
 * - Incremental updates (add/update/remove)
 */

import type {
  SearchEntityType,
  IndexedEntity,
  FuzzyMatchOptions,
  SearchBadge,
} from './types';
import {
  findBestMatch,
  matchPhone,
  normalizePhone,
  normalizeText,
} from './fuzzyMatcher';
import { dataService } from '@/services/dataService';
import type { Client } from '@/types/client';
import type { Staff } from '@/types/staff';
import type { Service } from '@/types/service';
import type { LocalAppointment } from '@/types/appointment';
import type { Ticket } from '@/types/Ticket';
import type { Transaction } from '@/types/transaction';
import { SETTINGS_REGISTRY, SETTING_CATEGORY_CONFIG } from './settingsRegistry';
import type { SettingEntry } from './settingsRegistry';
import { PAGES_REGISTRY } from './pagesRegistry';
import type { PageEntry } from './pagesRegistry';

// ============================================================================
// Search Index Class
// ============================================================================

export class SearchIndex {
  /** Main entity index: key -> IndexedEntity */
  private entities: Map<string, IndexedEntity> = new Map();

  /** Phone prefix index: normalized prefix -> entity keys */
  private phoneIndex: Map<string, Set<string>> = new Map();

  /** Store ID this index is built for */
  private _storeId = '';

  /** Last index update timestamp */
  private lastUpdate = 0;

  /** Whether index is currently being built */
  private isBuilding = false;

  // ==========================================================================
  // Index Building
  // ==========================================================================

  /**
   * Build the complete search index from IndexedDB
   *
   * @param storeId - Store ID to build index for
   */
  async buildIndex(storeId: string): Promise<void> {
    if (this.isBuilding) {
      console.warn('[SearchIndex] Index build already in progress');
      return;
    }

    this.isBuilding = true;
    const startTime = performance.now();

    try {
      // Clear existing index
      this.entities.clear();
      this.phoneIndex.clear();
      this._storeId = storeId;

      // Fetch all data in parallel
      const [clients, staff, services, appointments, tickets, transactions] =
        await Promise.all([
          this.fetchClients(storeId),
          this.fetchStaff(storeId),
          this.fetchServices(storeId),
          this.fetchAppointments(storeId),
          this.fetchTickets(storeId),
          this.fetchTransactions(storeId),
        ]);

      // Index each entity type
      clients.forEach((c) => this.indexClient(c));
      staff.forEach((s) => this.indexStaff(s));
      services.forEach((s) => this.indexService(s));
      appointments.forEach((a) => this.indexAppointment(a));
      tickets.forEach((t) => this.indexTicket(t));
      transactions.forEach((t) => this.indexTransaction(t));

      // Index settings (static data from registry)
      this.indexSettings();

      // Index pages (static navigation data from registry)
      this.indexPages();

      this.lastUpdate = Date.now();

      const duration = performance.now() - startTime;
      console.log(
        `[SearchIndex] Built index with ${this.entities.size} entities in ${duration.toFixed(0)}ms`
      );
    } catch (error) {
      console.error('[SearchIndex] Failed to build index:', error);
      throw error;
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * Check if index is ready for searching
   */
  isReady(): boolean {
    return this.entities.size > 0 && !this.isBuilding;
  }

  /**
   * Get index statistics
   */
  getStats(): {
    totalEntities: number;
    byType: Record<SearchEntityType, number>;
    phoneIndexSize: number;
    lastUpdate: number;
    storeId: string;
  } {
    const byType: Record<SearchEntityType, number> = {
      client: 0,
      staff: 0,
      service: 0,
      appointment: 0,
      ticket: 0,
      transaction: 0,
      setting: 0,
      giftcard: 0,
      page: 0,
    };

    for (const entity of this.entities.values()) {
      byType[entity.type]++;
    }

    return {
      totalEntities: this.entities.size,
      byType,
      phoneIndexSize: this.phoneIndex.size,
      lastUpdate: this.lastUpdate,
      storeId: this._storeId,
    };
  }

  // ==========================================================================
  // Data Fetching (from IndexedDB via dataService)
  // ==========================================================================

  private async fetchClients(_storeId: string): Promise<Client[]> {
    try {
      return await dataService.clients.getAll();
    } catch (error) {
      console.error('[SearchIndex] Failed to fetch clients:', error);
      return [];
    }
  }

  private async fetchStaff(_storeId: string): Promise<Staff[]> {
    try {
      return await dataService.staff.getAll();
    } catch (error) {
      console.error('[SearchIndex] Failed to fetch staff:', error);
      return [];
    }
  }

  private async fetchServices(_storeId: string): Promise<Service[]> {
    try {
      return await dataService.services.getAll();
    } catch (error) {
      console.error('[SearchIndex] Failed to fetch services:', error);
      return [];
    }
  }

  private async fetchAppointments(_storeId: string): Promise<LocalAppointment[]> {
    try {
      // Get appointments for today and upcoming (limit to recent/relevant)
      const today = new Date();
      return await dataService.appointments.getByDate(today);
    } catch (error) {
      console.error('[SearchIndex] Failed to fetch appointments:', error);
      return [];
    }
  }

  private async fetchTickets(_storeId: string): Promise<Ticket[]> {
    try {
      // Get active tickets (pending, in-service)
      return await dataService.tickets.getOpenTickets();
    } catch (error) {
      console.error('[SearchIndex] Failed to fetch tickets:', error);
      return [];
    }
  }

  private async fetchTransactions(_storeId: string): Promise<Transaction[]> {
    try {
      // Get today's transactions
      return await dataService.transactions.getByDate(new Date());
    } catch (error) {
      console.error('[SearchIndex] Failed to fetch transactions:', error);
      return [];
    }
  }

  // ==========================================================================
  // Entity Indexing
  // ==========================================================================

  private indexClient(client: Client): void {
    const key = `client:${client.id}`;
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.trim();
    const normalizedPhone = client.phone ? normalizePhone(client.phone) : '';

    const badges: SearchBadge[] = [];
    if (client.isVip) badges.push({ label: 'VIP', color: 'purple' });
    if (client.isBlocked) badges.push({ label: 'Blocked', color: 'red' });

    const indexed: IndexedEntity = {
      key,
      id: client.id,
      type: 'client',
      searchableText: [
        normalizeText(client.firstName || ''),
        normalizeText(client.lastName || ''),
        normalizeText(fullName),
        normalizeText(client.email || ''),
      ].filter(Boolean),
      phoneNumbers: normalizedPhone ? [normalizedPhone] : [],
      displayData: {
        title: fullName || 'Unknown Client',
        subtitle: client.phone || '',
        avatar: client.avatar,
        badges,
        isVip: client.isVip,
        isBlocked: client.isBlocked,
        phone: client.phone,
        email: client.email,
      },
      timestamp: client.updatedAt
        ? new Date(client.updatedAt).getTime()
        : Date.now(),
    };

    this.entities.set(key, indexed);
    if (normalizedPhone) {
      this.addToPhoneIndex(normalizedPhone, key);
    }
  }

  private indexStaff(staff: Staff): void {
    const key = `staff:${staff.id}`;
    const normalizedPhone = staff.phone ? normalizePhone(staff.phone) : '';

    const badges: SearchBadge[] = [];
    if (staff.status === 'available') {
      badges.push({ label: 'Available', color: 'green' });
    } else if (staff.status === 'busy') {
      badges.push({ label: 'Busy', color: 'orange' });
    } else if (staff.status === 'clocked-out') {
      badges.push({ label: 'Off', color: 'gray' });
    }

    const indexed: IndexedEntity = {
      key,
      id: staff.id,
      type: 'staff',
      searchableText: [
        normalizeText(staff.name || ''),
        normalizeText(staff.email || ''),
        normalizeText(staff.role || ''),
      ].filter(Boolean),
      phoneNumbers: normalizedPhone ? [normalizedPhone] : [],
      displayData: {
        title: staff.name || 'Unknown Staff',
        subtitle: staff.role || 'Team Member',
        avatar: staff.avatar,
        badges,
        status: staff.status,
        phone: staff.phone,
        email: staff.email,
        role: staff.role,
      },
      timestamp: staff.updatedAt
        ? new Date(staff.updatedAt).getTime()
        : Date.now(),
    };

    this.entities.set(key, indexed);
    if (normalizedPhone) {
      this.addToPhoneIndex(normalizedPhone, key);
    }
  }

  private indexService(service: Service): void {
    const key = `service:${service.id}`;

    const badges: SearchBadge[] = [];
    if (service.category) {
      badges.push({ label: service.category, color: 'green' });
    }

    const indexed: IndexedEntity = {
      key,
      id: service.id,
      type: 'service',
      searchableText: [
        normalizeText(service.name || ''),
        normalizeText(service.description || ''),
        normalizeText(service.category || ''),
      ].filter(Boolean),
      phoneNumbers: [],
      displayData: {
        title: service.name || 'Unknown Service',
        subtitle: `$${service.price?.toFixed(2) || '0.00'} • ${service.duration || 0}min`,
        badges,
        category: service.category,
        price: service.price,
        duration: service.duration,
      },
      timestamp: service.updatedAt
        ? new Date(service.updatedAt).getTime()
        : Date.now(),
    };

    this.entities.set(key, indexed);
  }

  private indexAppointment(appointment: LocalAppointment): void {
    const key = `appointment:${appointment.id}`;
    const normalizedPhone = appointment.clientPhone
      ? normalizePhone(appointment.clientPhone)
      : '';

    const badges: SearchBadge[] = [];
    const status = appointment.status || 'scheduled';
    if (status === 'checked-in') {
      badges.push({ label: 'Checked In', color: 'green' });
    } else if (status === 'in-service') {
      badges.push({ label: 'In Service', color: 'blue' });
    } else if (status === 'scheduled') {
      badges.push({ label: 'Scheduled', color: 'gray' });
    } else if (status === 'waiting') {
      badges.push({ label: 'Waiting', color: 'amber' });
    }

    // Format time for display
    const startTime = appointment.scheduledStartTime
      ? new Date(appointment.scheduledStartTime)
      : null;
    const timeStr = startTime
      ? startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';

    const serviceNames = appointment.services
      ?.map((s) => s.serviceName)
      .join(', ') || '';

    const indexed: IndexedEntity = {
      key,
      id: appointment.id,
      type: 'appointment',
      searchableText: [
        normalizeText(appointment.clientName || ''),
        normalizeText(appointment.staffName || ''),
        normalizeText(serviceNames),
      ].filter(Boolean),
      phoneNumbers: normalizedPhone ? [normalizedPhone] : [],
      displayData: {
        title: `${appointment.clientName || 'Unknown'} - ${timeStr}`,
        subtitle: `${serviceNames} • ${appointment.staffName || 'Unassigned'}`,
        badges,
        status: appointment.status,
        phone: appointment.clientPhone,
      },
      timestamp: startTime?.getTime() || Date.now(),
    };

    this.entities.set(key, indexed);
    if (normalizedPhone) {
      this.addToPhoneIndex(normalizedPhone, key);
    }
  }

  private indexTicket(ticket: Ticket): void {
    const key = `ticket:${ticket.id}`;
    const normalizedPhone = ticket.clientPhone
      ? normalizePhone(ticket.clientPhone)
      : '';

    const badges: SearchBadge[] = [];
    const status = ticket.status || 'pending';
    if (status === 'pending' || status === 'unpaid') {
      badges.push({
        label: status === 'unpaid' ? 'Unpaid' : 'Pending',
        color: status === 'unpaid' ? 'orange' : 'amber',
      });
    } else if (status === 'paid' || status === 'completed') {
      badges.push({ label: 'Paid', color: 'green' });
    } else if (status === 'partial-payment') {
      badges.push({ label: 'Partial', color: 'blue' });
    }

    const serviceNames = ticket.services
      ?.map((s) => s.serviceName)
      .join(', ') || '';
    const staffNames = ticket.services
      ?.map((s) => s.staffName)
      .filter(Boolean)
      .join(', ') || '';

    const ticketNumber = ticket.number || ticket.id.slice(-4);

    const indexed: IndexedEntity = {
      key,
      id: ticket.id,
      type: 'ticket',
      searchableText: [
        normalizeText(ticket.clientName || ''),
        normalizeText(serviceNames),
        normalizeText(staffNames),
        String(ticketNumber),
      ].filter(Boolean),
      phoneNumbers: normalizedPhone ? [normalizedPhone] : [],
      displayData: {
        title: `#${ticketNumber} - ${ticket.clientName || 'Walk-in'}`,
        subtitle: `${serviceNames || 'No services'} • $${ticket.total?.toFixed(2) || '0.00'}`,
        badges,
        status: ticket.status,
        phone: ticket.clientPhone,
        total: ticket.total,
        number: typeof ticketNumber === 'number' ? ticketNumber : parseInt(ticketNumber) || 0,
      },
      timestamp: ticket.createdAt
        ? new Date(ticket.createdAt).getTime()
        : Date.now(),
    };

    this.entities.set(key, indexed);
    if (normalizedPhone) {
      this.addToPhoneIndex(normalizedPhone, key);
    }
  }

  private indexTransaction(transaction: Transaction): void {
    const key = `transaction:${transaction.id}`;

    const badges: SearchBadge[] = [];
    if (transaction.status === 'completed') {
      badges.push({ label: 'Completed', color: 'green' });
    } else if (transaction.status === 'refunded') {
      badges.push({ label: 'Refunded', color: 'red' });
    } else if (transaction.status === 'voided') {
      badges.push({ label: 'Voided', color: 'gray' });
    }

    const serviceNames = transaction.services
      ?.map((s) => s.name)
      .join(', ') || '';

    // Format date for display
    const createdAt = transaction.createdAt
      ? new Date(transaction.createdAt)
      : new Date();
    const dateStr = createdAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeStr = createdAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const indexed: IndexedEntity = {
      key,
      id: transaction.id,
      type: 'transaction',
      searchableText: [
        normalizeText(transaction.clientName || ''),
        normalizeText(serviceNames),
        String(transaction.ticketNumber || ''),
      ].filter(Boolean),
      phoneNumbers: [],
      displayData: {
        title: `$${transaction.total?.toFixed(2) || '0.00'} - ${transaction.clientName || 'Walk-in'}`,
        subtitle: `${dateStr} ${timeStr} • ${transaction.paymentMethod || 'Unknown'}`,
        badges,
        status: transaction.status,
        total: transaction.total,
        number: transaction.ticketNumber,
      },
      timestamp: createdAt.getTime(),
    };

    this.entities.set(key, indexed);
  }

  /**
   * Index all settings from the registry (static data)
   */
  private indexSettings(): void {
    SETTINGS_REGISTRY.forEach((setting) => this.indexSetting(setting));
  }

  private indexSetting(setting: SettingEntry): void {
    const key = `setting:${setting.id}`;
    const categoryConfig = SETTING_CATEGORY_CONFIG[setting.category];

    const badges: SearchBadge[] = [
      { label: categoryConfig.label, color: 'slate' },
    ];

    const indexed: IndexedEntity = {
      key,
      id: setting.id,
      type: 'setting',
      searchableText: [
        normalizeText(setting.label),
        normalizeText(setting.category),
        normalizeText(setting.description || ''),
        ...setting.keywords.map((k) => normalizeText(k)),
      ].filter(Boolean),
      phoneNumbers: [],
      displayData: {
        title: setting.label,
        subtitle: setting.description || `${categoryConfig.label} Settings`,
        badges,
        category: setting.category,
        // Store the path for navigation
        status: setting.path,
      },
      timestamp: Date.now(), // Static data, no real timestamp
    };

    this.entities.set(key, indexed);
  }

  /**
   * Index all pages from the registry (static navigation data)
   */
  private indexPages(): void {
    PAGES_REGISTRY.forEach((page) => this.indexPage(page));
  }

  private indexPage(page: PageEntry): void {
    const key = `page:${page.id}`;

    const badges: SearchBadge[] = [
      { label: page.category.charAt(0).toUpperCase() + page.category.slice(1), color: 'indigo' },
    ];

    const indexed: IndexedEntity = {
      key,
      id: page.id,
      type: 'page',
      searchableText: [
        normalizeText(page.label),
        normalizeText(page.description || ''),
        ...page.keywords.map((k) => normalizeText(k)),
      ].filter(Boolean),
      phoneNumbers: [],
      displayData: {
        title: page.label,
        subtitle: page.description,
        badges,
        category: page.category,
        // Store the page id for navigation
        status: page.id,
      },
      timestamp: Date.now(), // Static data, no real timestamp
    };

    this.entities.set(key, indexed);
  }

  // ==========================================================================
  // Phone Index Management
  // ==========================================================================

  /**
   * Add a phone number to the phone prefix index
   * Indexes all prefixes from 3 digits up to full number
   */
  private addToPhoneIndex(normalizedPhone: string, entityKey: string): void {
    // Index all prefixes from 3 digits onwards
    for (let len = 3; len <= normalizedPhone.length; len++) {
      const prefix = normalizedPhone.substring(0, len);
      let keys = this.phoneIndex.get(prefix);
      if (!keys) {
        keys = new Set();
        this.phoneIndex.set(prefix, keys);
      }
      keys.add(entityKey);
    }

    // Also index suffixes (last N digits) for "last 4" searches
    for (let len = 3; len <= Math.min(normalizedPhone.length, 7); len++) {
      const suffix = normalizedPhone.substring(normalizedPhone.length - len);
      let keys = this.phoneIndex.get(suffix);
      if (!keys) {
        keys = new Set();
        this.phoneIndex.set(suffix, keys);
      }
      keys.add(entityKey);
    }
  }

  /**
   * Remove a phone number from the phone prefix index
   */
  private removeFromPhoneIndex(normalizedPhone: string, entityKey: string): void {
    for (let len = 3; len <= normalizedPhone.length; len++) {
      const prefix = normalizedPhone.substring(0, len);
      const keys = this.phoneIndex.get(prefix);
      if (keys) {
        keys.delete(entityKey);
        if (keys.size === 0) {
          this.phoneIndex.delete(prefix);
        }
      }
    }

    for (let len = 3; len <= Math.min(normalizedPhone.length, 7); len++) {
      const suffix = normalizedPhone.substring(normalizedPhone.length - len);
      const keys = this.phoneIndex.get(suffix);
      if (keys) {
        keys.delete(entityKey);
        if (keys.size === 0) {
          this.phoneIndex.delete(suffix);
        }
      }
    }
  }

  // ==========================================================================
  // Searching
  // ==========================================================================

  /**
   * Search the index by text query
   *
   * @param query - Normalized search query
   * @param options - Search options
   * @returns Matching entities with scores
   */
  searchByText(
    query: string,
    entityTypes?: SearchEntityType[],
    options?: FuzzyMatchOptions
  ): Array<{ entity: IndexedEntity; score: number; matchedField: string }> {
    const results: Array<{
      entity: IndexedEntity;
      score: number;
      matchedField: string;
    }> = [];

    const normalizedQuery = normalizeText(query);
    if (normalizedQuery.length < 2) return results;

    for (const entity of this.entities.values()) {
      // Filter by entity type if specified
      if (entityTypes && !entityTypes.includes(entity.type)) {
        continue;
      }

      // Try to match against all searchable text
      const bestMatch = findBestMatch(normalizedQuery, entity.searchableText, options);

      if (bestMatch) {
        results.push({
          entity,
          score: bestMatch.result.score,
          matchedField: bestMatch.target,
        });
      }
    }

    return results;
  }

  /**
   * Search the index by phone number
   *
   * @param phoneDigits - Digits to search for
   * @param entityTypes - Optional filter by entity types
   * @returns Matching entities with scores
   */
  searchByPhone(
    phoneDigits: string,
    entityTypes?: SearchEntityType[]
  ): Array<{ entity: IndexedEntity; score: number; matchedField: string }> {
    const results: Array<{
      entity: IndexedEntity;
      score: number;
      matchedField: string;
    }> = [];

    const normalizedDigits = phoneDigits.replace(/\D/g, '');
    if (normalizedDigits.length < 3) return results;

    // Look up in phone index
    const matchingKeys = this.phoneIndex.get(normalizedDigits);
    if (!matchingKeys) return results;

    for (const key of matchingKeys) {
      const entity = this.entities.get(key);
      if (!entity) continue;

      // Filter by entity type if specified
      if (entityTypes && !entityTypes.includes(entity.type)) {
        continue;
      }

      // Calculate match score for the phone
      for (const phone of entity.phoneNumbers) {
        const matchResult = matchPhone(normalizedDigits, phone);
        if (matchResult.isMatch) {
          results.push({
            entity,
            score: matchResult.score,
            matchedField: entity.displayData.phone || phone,
          });
          break; // One match per entity is enough
        }
      }
    }

    return results;
  }

  /**
   * Search by ticket number
   *
   * @param ticketNumber - Ticket number to search for
   * @returns Matching tickets
   */
  searchByTicketNumber(
    ticketNumber: string
  ): Array<{ entity: IndexedEntity; score: number; matchedField: string }> {
    const results: Array<{
      entity: IndexedEntity;
      score: number;
      matchedField: string;
    }> = [];

    const normalizedNumber = ticketNumber.replace(/\D/g, '');
    if (!normalizedNumber) return results;

    for (const entity of this.entities.values()) {
      if (entity.type !== 'ticket') continue;

      const entityNumber = String(entity.displayData.number || '');
      if (entityNumber.includes(normalizedNumber)) {
        // Exact match gets perfect score
        const score = entityNumber === normalizedNumber ? 1.0 : 0.8;
        results.push({
          entity,
          score,
          matchedField: `#${entityNumber}`,
        });
      }
    }

    return results;
  }

  /**
   * Search by amount range
   *
   * @param min - Minimum amount
   * @param max - Maximum amount
   * @param entityTypes - Types to search (ticket, transaction)
   * @returns Matching entities
   */
  searchByAmount(
    min: number,
    max: number,
    entityTypes: SearchEntityType[] = ['ticket', 'transaction']
  ): Array<{ entity: IndexedEntity; score: number; matchedField: string }> {
    const results: Array<{
      entity: IndexedEntity;
      score: number;
      matchedField: string;
    }> = [];

    for (const entity of this.entities.values()) {
      if (!entityTypes.includes(entity.type)) continue;

      const amount = entity.displayData.total;
      if (typeof amount !== 'number') continue;

      if (amount >= min && amount <= max) {
        // Score based on how close to the center of the range
        const center = (min + max) / 2;
        const distance = Math.abs(amount - center);
        const range = (max - min) / 2 || 1;
        const score = 1 - distance / range * 0.3;

        results.push({
          entity,
          score,
          matchedField: `$${amount.toFixed(2)}`,
        });
      }
    }

    return results;
  }

  // ==========================================================================
  // Incremental Updates
  // ==========================================================================

  /**
   * Add or update a single entity in the index
   */
  updateEntity(type: SearchEntityType, data: unknown): void {
    switch (type) {
      case 'client':
        this.indexClient(data as Client);
        break;
      case 'staff':
        this.indexStaff(data as Staff);
        break;
      case 'service':
        this.indexService(data as Service);
        break;
      case 'appointment':
        this.indexAppointment(data as LocalAppointment);
        break;
      case 'ticket':
        this.indexTicket(data as Ticket);
        break;
      case 'transaction':
        this.indexTransaction(data as Transaction);
        break;
      case 'setting':
        this.indexSetting(data as SettingEntry);
        break;
      case 'giftcard':
        // Gift cards deferred - no data layer yet
        break;
      case 'page':
        this.indexPage(data as PageEntry);
        break;
    }
    this.lastUpdate = Date.now();
  }

  /**
   * Remove an entity from the index
   */
  removeEntity(type: SearchEntityType, id: string): void {
    const key = `${type}:${id}`;
    const entity = this.entities.get(key);

    if (entity) {
      // Remove from phone index
      for (const phone of entity.phoneNumbers) {
        this.removeFromPhoneIndex(phone, key);
      }
      // Remove from main index
      this.entities.delete(key);
      this.lastUpdate = Date.now();
    }
  }

  /**
   * Clear the entire index
   */
  clear(): void {
    this.entities.clear();
    this.phoneIndex.clear();
    this._storeId = '';
    this.lastUpdate = 0;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/** Global search index instance */
export const searchIndex = new SearchIndex();
