/**
 * Database Test Setup
 * Utilities for setting up and managing test database
 */

import { db } from '../db/schema';
import { Client, Service, Staff, LocalAppointment } from '../types';

// Test salon ID
export const TEST_SALON_ID = 'test-salon-123';

/**
 * Clear all data from the test database
 */
export async function clearTestDatabase() {
  try {
    await db.clients.clear();
    await db.services.clear();
    await db.staff.clear();
    await db.appointments.clear();
    await db.tickets.clear();
    await db.transactions.clear();
  } catch (error) {
    console.error('Error clearing test database:', error);
  }
}

/**
 * Seed the database with test data
 */
export async function seedTestDatabase(data?: {
  clients?: Client[];
  services?: Service[];
  staff?: Staff[];
  appointments?: LocalAppointment[];
}) {
  try {
    // Clear existing data first
    await clearTestDatabase();

    // Add test data if provided
    if (data?.clients) {
      await db.clients.bulkAdd(data.clients);
    }
    if (data?.services) {
      await db.services.bulkAdd(data.services);
    }
    if (data?.staff) {
      await db.staff.bulkAdd(data.staff);
    }
    if (data?.appointments) {
      await db.appointments.bulkAdd(data.appointments);
    }
  } catch (error) {
    console.error('Error seeding test database:', error);
  }
}

/**
 * Reset database between tests
 */
export async function resetTestDatabase() {
  await clearTestDatabase();
  await seedTestDatabase();
}

/**
 * Wait for IndexedDB operations to complete
 */
export function waitForDb(ms = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}