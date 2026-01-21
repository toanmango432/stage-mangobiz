/**
 * Create Test Users Script
 *
 * Creates 10 test users with Supabase Auth accounts for development and testing.
 * Users are assigned to existing stores in the database.
 *
 * Environment Variables:
 * - SUPABASE_URL: Supabase project URL (REQUIRED)
 * - SUPABASE_SERVICE_ROLE_KEY: Admin key with auth.admin access (REQUIRED)
 *
 * Usage:
 *   SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/auth-migration/create-test-users.ts
 *
 * Roles Distribution:
 * - 2 owners (testuser1, testuser2)
 * - 3 managers (testuser3, testuser4, testuser5)
 * - 5 staff (testuser6-testuser10)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import { generateTemporaryPassword } from './utils';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CONFIG = {
  /** bcrypt cost factor for PIN hashing */
  BCRYPT_COST_FACTOR: 12,
  /** Email domain for test users */
  EMAIL_DOMAIN: 'mangobiz.com',
  /** Default PIN for all test users (for easy testing) */
  DEFAULT_PIN: '1234',
};

// ============================================================================
// Types
// ============================================================================

interface TestUserConfig {
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'staff';
  /** Optional fixed password (for demo users). If not provided, a random password is generated. */
  password?: string;
}

interface StoreRow {
  id: string;
  name: string;
  tenant_id: string;
}

interface CreatedUser {
  email: string;
  name: string;
  role: string;
  password: string;
  pin: string;
  storeId: string;
  storeName: string;
}

// ============================================================================
// Test User Definitions
// ============================================================================

const TEST_USERS: TestUserConfig[] = [
  // Demo Salon Users (shown on login page with fixed passwords)
  { email: 'owner@demosalon.com', firstName: 'Salon', lastName: 'Owner', role: 'owner', password: 'owner123' },
  { email: 'jane@demosalon.com', firstName: 'Jane', lastName: 'Staff', role: 'staff', password: 'jane123' },
  { email: 'mike@demosalon.com', firstName: 'Mike', lastName: 'Manager', role: 'manager', password: 'mike123' },
  // 2 Additional Owners
  { email: 'testuser1@mangobiz.com', firstName: 'Test', lastName: 'Owner1', role: 'owner' },
  { email: 'testuser2@mangobiz.com', firstName: 'Test', lastName: 'Owner2', role: 'owner' },
  // 3 Managers
  { email: 'testuser3@mangobiz.com', firstName: 'Test', lastName: 'Manager1', role: 'manager' },
  { email: 'testuser4@mangobiz.com', firstName: 'Test', lastName: 'Manager2', role: 'manager' },
  { email: 'testuser5@mangobiz.com', firstName: 'Test', lastName: 'Manager3', role: 'manager' },
  // 5 Staff
  { email: 'testuser6@mangobiz.com', firstName: 'Test', lastName: 'Staff1', role: 'staff' },
  { email: 'testuser7@mangobiz.com', firstName: 'Test', lastName: 'Staff2', role: 'staff' },
  { email: 'testuser8@mangobiz.com', firstName: 'Test', lastName: 'Staff3', role: 'staff' },
  { email: 'testuser9@mangobiz.com', firstName: 'Test', lastName: 'Staff4', role: 'staff' },
  { email: 'testuser10@mangobiz.com', firstName: 'Test', lastName: 'Staff5', role: 'staff' },
];

// ============================================================================
// Supabase Admin Client
// ============================================================================

function createSupabaseAdminClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error(
      'SUPABASE_URL environment variable is required.\n' +
        'Usage: SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/auth-migration/create-test-users.ts'
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is required.\n' +
        'Usage: SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/auth-migration/create-test-users.ts'
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// Fetch Available Stores
// ============================================================================

async function fetchAvailableStores(supabase: SupabaseClient): Promise<StoreRow[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, tenant_id')
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch stores: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No stores found in database. Please create at least one store first.');
  }

  return data as StoreRow[];
}

// ============================================================================
// Check for Existing User
// ============================================================================

async function findExistingAuthUser(
  supabase: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserByEmail(email);

    if (error) {
      if (error.message.includes('not found')) {
        return null;
      }
      process.stdout.write(`  Warning: Error looking up ${email}: ${error.message}\n`);
      return null;
    }

    return data?.user ? { id: data.user.id } : null;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stdout.write(`  Warning: Exception looking up ${email}: ${errorMessage}\n`);
    return null;
  }
}

// ============================================================================
// Check for Existing Member
// ============================================================================

async function findExistingMember(
  supabase: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    process.stdout.write(`  Warning: Error looking up member ${email}: ${error.message}\n`);
    return null;
  }

  return data;
}

// ============================================================================
// Create Single Test User
// ============================================================================

async function createTestUser(
  supabase: SupabaseClient,
  userConfig: TestUserConfig,
  store: StoreRow
): Promise<CreatedUser | null> {
  const fullName = `${userConfig.firstName} ${userConfig.lastName}`;

  process.stdout.write(`\nCreating ${userConfig.email} (${userConfig.role})...\n`);

  // Check if auth user already exists
  const existingAuthUser = await findExistingAuthUser(supabase, userConfig.email);
  if (existingAuthUser) {
    process.stdout.write(`  Skipping: Auth user already exists\n`);
    return null;
  }

  // Check if member already exists
  const existingMember = await findExistingMember(supabase, userConfig.email);
  if (existingMember) {
    process.stdout.write(`  Skipping: Member record already exists\n`);
    return null;
  }

  // Use configured password or generate a temporary one
  const password = userConfig.password || generateTemporaryPassword();

  // Create Supabase Auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: userConfig.email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: fullName,
      role: userConfig.role,
      tenant_id: store.tenant_id,
      is_test_user: true,
      created_at: new Date().toISOString(),
    },
  });

  if (authError) {
    process.stdout.write(`  Error creating auth user: ${authError.message}\n`);
    return null;
  }

  // Hash the default PIN
  const pinHash = await bcrypt.hash(CONFIG.DEFAULT_PIN, CONFIG.BCRYPT_COST_FACTOR);

  // Create member record
  const { error: memberError } = await supabase.from('members').insert({
    auth_user_id: authUser.user.id,
    email: userConfig.email,
    first_name: userConfig.firstName,
    last_name: userConfig.lastName,
    name: fullName,
    role: userConfig.role,
    store_id: store.id,
    tenant_id: store.tenant_id,
    pin_hash: pinHash,
    is_active: true,
    last_online_auth: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (memberError) {
    process.stdout.write(`  Error creating member: ${memberError.message}\n`);
    // Attempt to clean up auth user
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return null;
  }

  process.stdout.write(`  Created successfully\n`);

  return {
    email: userConfig.email,
    name: fullName,
    role: userConfig.role,
    password: password,
    pin: CONFIG.DEFAULT_PIN,
    storeId: store.id,
    storeName: store.name,
  };
}

// ============================================================================
// Main Function
// ============================================================================

async function main(): Promise<void> {
  process.stdout.write(`\n${'='.repeat(60)}\n`);
  process.stdout.write(`Create Test Users Script\n`);
  process.stdout.write(`${'='.repeat(60)}\n\n`);

  // Create admin client
  let supabase: SupabaseClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stdout.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  }

  // Fetch available stores
  process.stdout.write('Fetching available stores...\n');
  let stores: StoreRow[];
  try {
    stores = await fetchAvailableStores(supabase);
    process.stdout.write(`Found ${stores.length} store(s):\n`);
    stores.forEach((store) => {
      process.stdout.write(`  - ${store.name} (${store.id})\n`);
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stdout.write(`Error: ${errorMessage}\n`);
    process.exit(1);
  }

  // Create test users
  const createdUsers: CreatedUser[] = [];
  const failedUsers: string[] = [];

  for (let i = 0; i < TEST_USERS.length; i++) {
    const userConfig = TEST_USERS[i];
    // Distribute users across stores (round-robin)
    const store = stores[i % stores.length];

    const result = await createTestUser(supabase, userConfig, store);
    if (result) {
      createdUsers.push(result);
    } else {
      failedUsers.push(userConfig.email);
    }
  }

  // Print summary
  process.stdout.write(`\n${'='.repeat(60)}\n`);
  process.stdout.write(`SUMMARY\n`);
  process.stdout.write(`${'='.repeat(60)}\n\n`);

  if (createdUsers.length > 0) {
    process.stdout.write(`Created ${createdUsers.length} test user(s):\n\n`);
    process.stdout.write(`${'Email'.padEnd(30)} ${'Role'.padEnd(10)} ${'Password'.padEnd(15)} PIN\n`);
    process.stdout.write(`${'-'.repeat(30)} ${'-'.repeat(10)} ${'-'.repeat(15)} ${'-'.repeat(6)}\n`);

    for (const user of createdUsers) {
      process.stdout.write(
        `${user.email.padEnd(30)} ${user.role.padEnd(10)} ${user.password.padEnd(15)} ${user.pin}\n`
      );
    }

    process.stdout.write(`\nStore assignments:\n`);
    for (const user of createdUsers) {
      process.stdout.write(`  ${user.email} -> ${user.storeName}\n`);
    }
  }

  if (failedUsers.length > 0) {
    process.stdout.write(`\nFailed/Skipped: ${failedUsers.length} user(s)\n`);
    failedUsers.forEach((email) => {
      process.stdout.write(`  - ${email}\n`);
    });
  }

  process.stdout.write(`\n${'='.repeat(60)}\n`);
  process.stdout.write(`Total: ${createdUsers.length} created, ${failedUsers.length} failed/skipped\n`);
  process.stdout.write(`${'='.repeat(60)}\n`);

  if (createdUsers.length > 0) {
    process.stdout.write(`\nNOTE: Save the passwords above - they are only displayed once!\n`);
    process.stdout.write(`All test users have PIN: ${CONFIG.DEFAULT_PIN}\n`);
  }
}

// ============================================================================
// Run Script
// ============================================================================

main().catch((err) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  process.stdout.write(`\nFatal error: ${errorMessage}\n`);
  process.exit(1);
});
