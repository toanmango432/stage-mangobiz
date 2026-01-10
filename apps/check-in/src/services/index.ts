/**
 * Services Layer
 *
 * Exports all data services for the Check-In app.
 * Services handle communication with Supabase and IndexedDB.
 *
 * Usage pattern:
 *   import { dataService } from '@/services';
 *   const client = await dataService.clients.getByPhone(phone);
 */

export { dataService } from './dataService';
export { supabase } from './supabase';
export { db } from './db';
export { smsService } from './smsService';
