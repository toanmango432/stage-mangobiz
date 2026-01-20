/**
 * Member Migration to Supabase Auth
 *
 * Production-ready migration script to:
 * 1. Create Supabase Auth users for existing members (or link to existing auth users)
 * 2. Hash existing PINs with bcrypt (cost factor 12)
 * 3. Preserve original PIN in pin_legacy column for rollback
 * 4. Send welcome emails with temporary passwords
 *
 * Prerequisites:
 * - Run migrations US-001 (029_add_supabase_auth_to_members.sql) and
 *   US-002 (030_create_member_session_revocations.sql) FIRST
 *
 * Environment Variables:
 * - SUPABASE_URL: Supabase project URL (REQUIRED - no default for safety)
 * - SUPABASE_SERVICE_ROLE_KEY: Admin key with auth.admin access (REQUIRED)
 * - DRY_RUN: Set to 'true' to preview changes without committing
 *
 * Usage:
 *   DRY_RUN=true SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/auth-migration/migrate-members-to-supabase-auth.ts
 *   SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/auth-migration/migrate-members-to-supabase-auth.ts
 *
 * @see docs/AUTH_MIGRATION_PLAN.md for full implementation details
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import {
  generateTemporaryPassword,
  sendWelcomeEmail,
  createEmptyResult,
  formatMigrationSummary,
  MigrationResult,
  MemberForMigration,
} from './utils';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Supabase project URL (REQUIRED for security)
 * Must be passed via environment variable to prevent accidental production use
 */
const SUPABASE_URL = process.env.SUPABASE_URL;

/**
 * Service role key is REQUIRED for auth.admin operations
 * Must be passed via environment variable for security
 */
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Configuration constants
 */
const CONFIG = {
  /** Set to true to preview changes without committing */
  DRY_RUN: process.env.DRY_RUN === 'true',

  /** Number of members to process in each batch */
  BATCH_SIZE: 50,

  /** bcrypt cost factor for PIN hashing (12 provides good security/performance balance) */
  BCRYPT_COST_FACTOR: 12,

  /** Number of email retry attempts before logging failure */
  EMAIL_RETRY_ATTEMPTS: 3,

  /** Base delay between email retries (ms) - exponential backoff applied */
  EMAIL_RETRY_BASE_DELAY_MS: 1000,

  /** Delay between batches to avoid rate limiting (ms) */
  BATCH_DELAY_MS: 1000,

  /** Output file for email failures (restricted permissions) */
  EMAIL_FAILURES_FILE: 'migration_email_failures.json',

  /** Number of database retry attempts for transient failures */
  DB_RETRY_ATTEMPTS: 3,

  /** Base delay between database retries (ms) - exponential backoff: 1s, 2s, 4s */
  DB_RETRY_BASE_DELAY_MS: 1000,

  /** Checkpoint file for resume capability */
  CHECKPOINT_FILE: 'migration_checkpoint.json',
};

// ============================================================================
// Types
// ============================================================================

/**
 * Raw member row from database query
 */
interface MemberRow {
  id: string;
  email: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  pin: string | null;
  auth_user_id: string | null;
  role: string | null;
  tenant_id: string | null;
}

/**
 * Member data structure from database
 * Extends MemberForMigration with additional fields needed for migration
 */
interface MemberRecord extends MemberForMigration {
  name: string;
  role: string;
  tenant_id: string | null;
}

/**
 * Checkpoint data for resume capability
 * Saved after each successful batch to allow resuming from last known good state
 */
interface MigrationCheckpoint {
  /** Last successfully processed batch number (1-indexed) */
  lastBatchCompleted: number;
  /** Total members processed so far */
  totalProcessed: number;
  /** Timestamp when checkpoint was saved */
  timestamp: string;
  /** Running totals for result tracking */
  result: {
    successCount: number;
    failedCount: number;
    skippedCount: number;
    emailFailedCount: number;
  };
  /** Array of successfully migrated member IDs (for deduplication) */
  processedMemberIds: string[];
}

// ============================================================================
// Supabase Admin Client
// ============================================================================

/**
 * Creates and validates the Supabase admin client
 */
function createSupabaseAdminClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error(
      'SUPABASE_URL environment variable is required.\n' +
        'This prevents accidental connection to the wrong Supabase project.\n' +
        'Usage: SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/auth-migration/migrate-members-to-supabase-auth.ts'
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY environment variable is required.\n' +
        'Usage: SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/auth-migration/migrate-members-to-supabase-auth.ts'
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
// Auth User Lookup
// ============================================================================

/**
 * Find existing Supabase Auth user by email using efficient direct lookup
 * Uses auth.admin.getUserByEmail() instead of listUsers() for better scalability
 *
 * @param supabaseAdmin - Supabase admin client
 * @param email - Email to search for
 * @returns User ID if found, null otherwise
 */
async function findExistingAuthUser(
  supabaseAdmin: SupabaseClient,
  email: string
): Promise<{ id: string } | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(
      email
    );

    if (error) {
      // "User not found" is expected for new users
      if (error.message.includes('not found')) {
        return null;
      }
      process.stdout.write(`⚠️  Error looking up ${email}: ${error.message}\n`);
      return null;
    }

    return data?.user ? { id: data.user.id } : null;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stdout.write(
      `⚠️  Exception looking up ${email}: ${errorMessage}\n`
    );
    return null;
  }
}

// ============================================================================
// Email Sending with Retry
// ============================================================================

/**
 * Send welcome email with retry logic and exponential backoff
 *
 * @param email - Recipient email
 * @param name - Recipient name
 * @param tempPassword - Temporary password to include
 * @param memberId - Member ID for tracking failures
 * @param result - Migration result to update on failure
 * @returns True if email sent successfully
 */
async function sendWelcomeEmailWithRetry(
  email: string,
  name: string,
  tempPassword: string,
  memberId: string,
  result: MigrationResult
): Promise<boolean> {
  for (let attempt = 1; attempt <= CONFIG.EMAIL_RETRY_ATTEMPTS; attempt++) {
    try {
      await sendWelcomeEmail(email, name, tempPassword);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        `⚠️  Email attempt ${attempt}/${CONFIG.EMAIL_RETRY_ATTEMPTS} failed for ${email}: ${errorMessage}\n`
      );

      if (attempt === CONFIG.EMAIL_RETRY_ATTEMPTS) {
        // Log failure for manual follow-up
        result.emailFailed.push({
          memberId,
          email,
          error: errorMessage,
        });
        return false;
      }

      // Exponential backoff
      const delay = CONFIG.EMAIL_RETRY_BASE_DELAY_MS * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

// ============================================================================
// Database Retry Logic
// ============================================================================

/**
 * Execute a database operation with retry logic and exponential backoff
 * Handles transient failures (network glitches, rate limits) gracefully
 *
 * @param operation - Async function that returns { data, error }
 * @param operationName - Name for logging purposes
 * @returns The operation result (data or error)
 */
async function updateWithRetry<T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>,
  operationName: string
): Promise<{ data: T | null; error: { message: string } | null }> {
  let lastError: { message: string } | null = null;

  for (let attempt = 1; attempt <= CONFIG.DB_RETRY_ATTEMPTS; attempt++) {
    const result = await operation();

    // Success or non-retryable error
    if (!result.error) {
      return result;
    }

    lastError = result.error;

    // Check if error is retryable (network, rate limit, timeout)
    const isRetryable =
      result.error.message.toLowerCase().includes('network') ||
      result.error.message.toLowerCase().includes('timeout') ||
      result.error.message.toLowerCase().includes('rate limit') ||
      result.error.message.toLowerCase().includes('connection') ||
      result.error.message.toLowerCase().includes('econnreset') ||
      result.error.message.toLowerCase().includes('socket');

    if (!isRetryable) {
      // Non-retryable error, return immediately
      return result;
    }

    if (attempt < CONFIG.DB_RETRY_ATTEMPTS) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = CONFIG.DB_RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      process.stdout.write(
        `⚠️  ${operationName} attempt ${attempt}/${CONFIG.DB_RETRY_ATTEMPTS} failed (${result.error.message}), retrying in ${delay}ms...\n`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  process.stdout.write(
    `❌ ${operationName} failed after ${CONFIG.DB_RETRY_ATTEMPTS} attempts\n`
  );
  return { data: null, error: lastError };
}

// ============================================================================
// Member Migration
// ============================================================================

/**
 * Migrate a single member to Supabase Auth
 *
 * @param supabaseAdmin - Supabase admin client
 * @param member - Member data to migrate
 * @param result - Migration result to update
 */
async function migrateMember(
  supabaseAdmin: SupabaseClient,
  member: MemberRecord,
  result: MigrationResult
): Promise<void> {
  // Skip if already migrated
  if (member.auth_user_id) {
    result.skipped.push({
      memberId: member.id,
      reason: 'already_migrated',
    });
    return;
  }

  // Skip if no email (email is required for Supabase Auth)
  if (!member.email) {
    result.skipped.push({
      memberId: member.id,
      reason: 'no_email',
    });
    process.stdout.write(
      `⚠️  Skipping member ${member.id} (${member.name}) - no email\n`
    );
    return;
  }

  // Check if Supabase user already exists with this email
  const existingUser = await findExistingAuthUser(supabaseAdmin, member.email);

  let authUserId: string;
  let tempPassword: string | null = null;
  let isExistingControlCenterUser = false;

  if (existingUser) {
    // Link to existing auth user (likely from Control Center)
    authUserId = existingUser.id;
    isExistingControlCenterUser = true;
    process.stdout.write(
      `🔗 Linking ${member.email} to existing auth user (Control Center)\n`
    );

    if (CONFIG.DRY_RUN) {
      process.stdout.write(
        `   [DRY RUN] Would link member ${member.id} to auth user ${authUserId}\n`
      );
      result.skipped.push({
        memberId: member.id,
        reason: 'dry_run_would_link',
      });
      return;
    }
  } else {
    // Create new Supabase Auth user with temporary password
    tempPassword = generateTemporaryPassword();

    if (CONFIG.DRY_RUN) {
      process.stdout.write(
        `   [DRY RUN] Would create auth user for ${member.email}\n`
      );
      result.skipped.push({
        memberId: member.id,
        reason: 'dry_run_would_create',
      });
      return;
    }

    const { data: newUser, error } =
      await supabaseAdmin.auth.admin.createUser({
        email: member.email,
        password: tempPassword,
        email_confirm: true, // Skip email verification for migration
        user_metadata: {
          name: member.name,
          role: member.role,
          tenant_id: member.tenant_id,
          migrated_from_member_id: member.id,
          migration_date: new Date().toISOString(),
        },
      });

    if (error) {
      result.failed.push({
        memberId: member.id,
        reason: `Auth user creation failed: ${error.message}`,
      });
      process.stdout.write(
        `❌ Failed to create auth user for ${member.email}: ${error.message}\n`
      );
      return;
    }

    authUserId = newUser.user.id;
  }

  // Hash existing PIN with bcrypt if it exists
  let pinHash: string | null = null;
  if (member.pin) {
    pinHash = await bcrypt.hash(member.pin, CONFIG.BCRYPT_COST_FACTOR);
  }

  // Update member record in database with retry logic
  const { error: updateError } = await updateWithRetry<null>(
    () =>
      supabaseAdmin
        .from('members')
        .update({
          auth_user_id: authUserId,
          pin_hash: pinHash,
          pin_legacy: member.pin, // Preserve for rollback
          pin: null, // Clear plaintext PIN
          last_online_auth: new Date().toISOString(),
        })
        .eq('id', member.id),
    `Update member ${member.id}`
  );

  if (updateError) {
    result.failed.push({
      memberId: member.id,
      reason: `Database update failed: ${updateError.message}`,
    });
    process.stdout.write(
      `❌ Failed to update member ${member.id}: ${updateError.message}\n`
    );
    return;
  }

  // Send welcome email (only for newly created users, not Control Center links)
  if (tempPassword && !isExistingControlCenterUser) {
    const emailSent = await sendWelcomeEmailWithRetry(
      member.email,
      member.name,
      tempPassword,
      member.id,
      result
    );

    if (!emailSent) {
      process.stdout.write(
        `⚠️  Email failed for ${member.email} - logged for manual follow-up\n`
      );
    }
  }

  result.success.push(member.id);
  process.stdout.write(
    `✅ Migrated ${member.email}${isExistingControlCenterUser ? ' (linked to Control Center)' : ''}\n`
  );
}

// ============================================================================
// Write Email Failures to File
// ============================================================================

/**
 * Write email failures to a JSON file with restricted permissions
 * This file contains sensitive data (temp passwords) for manual follow-up
 *
 * @param result - Migration result containing email failures
 */
function writeEmailFailures(result: MigrationResult): void {
  if (result.emailFailed.length === 0) {
    return;
  }

  const filePath = path.join(
    __dirname,
    CONFIG.EMAIL_FAILURES_FILE
  );

  // Write file with restricted permissions (owner read/write only)
  fs.writeFileSync(filePath, JSON.stringify(result.emailFailed, null, 2), {
    mode: 0o600,
  });

  process.stdout.write(
    `\n⚠️  Email failures written to ${filePath} (restricted permissions)\n`
  );
}

// ============================================================================
// Checkpoint Management
// ============================================================================

/**
 * Get the checkpoint file path
 */
function getCheckpointFilePath(): string {
  return path.join(__dirname, CONFIG.CHECKPOINT_FILE);
}

/**
 * Load checkpoint from file if it exists
 * Returns null if no checkpoint exists or file is corrupted
 */
function loadCheckpoint(): MigrationCheckpoint | null {
  const filePath = getCheckpointFilePath();

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const checkpoint = JSON.parse(content) as MigrationCheckpoint;

    // Validate checkpoint structure
    if (
      typeof checkpoint.lastBatchCompleted !== 'number' ||
      typeof checkpoint.totalProcessed !== 'number' ||
      !checkpoint.timestamp ||
      !checkpoint.result ||
      !Array.isArray(checkpoint.processedMemberIds)
    ) {
      process.stdout.write(
        '⚠️  Invalid checkpoint file format, starting fresh\n'
      );
      return null;
    }

    return checkpoint;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stdout.write(
      `⚠️  Failed to load checkpoint: ${errorMessage}, starting fresh\n`
    );
    return null;
  }
}

/**
 * Save checkpoint after each successful batch
 * Allows migration to resume from last known good state if interrupted
 *
 * @param batchNumber - The batch number that was just completed
 * @param totalProcessed - Total members processed so far
 * @param result - Current migration result
 * @param processedMemberIds - Array of successfully processed member IDs
 */
function saveCheckpoint(
  batchNumber: number,
  totalProcessed: number,
  result: MigrationResult,
  processedMemberIds: string[]
): void {
  const checkpoint: MigrationCheckpoint = {
    lastBatchCompleted: batchNumber,
    totalProcessed,
    timestamp: new Date().toISOString(),
    result: {
      successCount: result.success.length,
      failedCount: result.failed.length,
      skippedCount: result.skipped.length,
      emailFailedCount: result.emailFailed.length,
    },
    processedMemberIds,
  };

  const filePath = getCheckpointFilePath();

  try {
    // Write checkpoint with restricted permissions
    fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), {
      mode: 0o600,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stdout.write(
      `⚠️  Failed to save checkpoint: ${errorMessage}\n`
    );
    // Continue migration even if checkpoint save fails
  }
}

/**
 * Delete checkpoint file after successful migration completion
 */
function deleteCheckpoint(): void {
  const filePath = getCheckpointFilePath();

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      process.stdout.write('✅ Checkpoint file deleted (migration complete)\n');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        `⚠️  Failed to delete checkpoint file: ${errorMessage}\n`
      );
    }
  }
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Main migration entry point
 * Processes members in batches to avoid memory issues and rate limiting
 * Supports checkpoint/resume to recover from interruptions
 */
async function main(): Promise<void> {
  process.stdout.write(`\n${'='.repeat(60)}\n`);
  process.stdout.write(`Member to Supabase Auth Migration\n`);
  process.stdout.write(
    `Mode: ${CONFIG.DRY_RUN ? '🔍 DRY RUN (no changes)' : '🚀 LIVE'}\n`
  );
  process.stdout.write(`${'='.repeat(60)}\n\n`);

  // Create admin client
  let supabaseAdmin: SupabaseClient;
  try {
    supabaseAdmin = createSupabaseAdminClient();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    process.stdout.write(`❌ ${errorMessage}\n`);
    process.exit(1);
  }

  // Load checkpoint if it exists (for resume)
  const checkpoint = loadCheckpoint();
  let startBatch = 1;
  let processedMemberIds: string[] = [];

  if (checkpoint) {
    startBatch = checkpoint.lastBatchCompleted + 1;
    processedMemberIds = checkpoint.processedMemberIds;
    process.stdout.write(
      `📍 Resuming from checkpoint (last completed batch: ${checkpoint.lastBatchCompleted})\n`
    );
    process.stdout.write(
      `   Previous progress: ${checkpoint.totalProcessed} processed, ` +
        `${checkpoint.result.successCount} success, ` +
        `${checkpoint.result.failedCount} failed, ` +
        `${checkpoint.result.skippedCount} skipped\n`
    );
    process.stdout.write(
      `   Checkpoint saved: ${checkpoint.timestamp}\n\n`
    );
  }

  // Initialize result tracking
  const result = createEmptyResult();

  // Process members in batches
  let offset = (startBatch - 1) * CONFIG.BATCH_SIZE;
  let totalProcessed = checkpoint?.totalProcessed ?? 0;

  while (true) {
    // Fetch batch of members that haven't been migrated yet (with retry)
    const batchNumber = Math.floor(offset / CONFIG.BATCH_SIZE) + 1;
    const { data: members, error } = await updateWithRetry<MemberRow[]>(
      () =>
        supabaseAdmin
          .from('members')
          .select('id, email, name, first_name, last_name, pin, auth_user_id, role, tenant_id')
          .is('auth_user_id', null) // Only members not yet migrated
          .range(offset, offset + CONFIG.BATCH_SIZE - 1),
      `Fetch members batch ${batchNumber}`
    );

    if (error) {
      process.stdout.write(`❌ Failed to fetch members: ${error.message}\n`);
      // Save checkpoint before exiting so we can resume
      if (totalProcessed > 0) {
        saveCheckpoint(batchNumber - 1, totalProcessed, result, processedMemberIds);
        process.stdout.write(`📍 Checkpoint saved at batch ${batchNumber - 1}\n`);
      }
      process.exit(1);
    }

    if (!members || members.length === 0) {
      break;
    }

    process.stdout.write(
      `\nProcessing batch ${batchNumber} (${members.length} members)...\n`
    );

    // Process each member in the batch
    for (const member of members) {
      // Skip if already processed (from checkpoint)
      if (processedMemberIds.includes(member.id)) {
        continue;
      }

      // Convert to MemberRecord format
      const memberRecord: MemberRecord = {
        id: member.id,
        email: member.email,
        // Use name field, or construct from first_name/last_name if available
        name:
          member.name ||
          `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
          'Unknown',
        first_name: member.first_name,
        last_name: member.last_name,
        pin: member.pin,
        auth_user_id: member.auth_user_id,
        role: member.role || 'staff',
        tenant_id: member.tenant_id,
      };

      await migrateMember(supabaseAdmin, memberRecord, result);
      totalProcessed++;

      // Track processed member IDs for checkpoint
      processedMemberIds.push(member.id);
    }

    // Save checkpoint after each successful batch
    saveCheckpoint(batchNumber, totalProcessed, result, processedMemberIds);

    offset += CONFIG.BATCH_SIZE;

    // Rate limiting - pause between batches
    if (members.length === CONFIG.BATCH_SIZE) {
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.BATCH_DELAY_MS)
      );
    }
  }

  // Print summary
  process.stdout.write(formatMigrationSummary(result));

  // Write email failures to file for manual follow-up
  writeEmailFailures(result);

  // Delete checkpoint file on successful completion (not in dry run)
  if (!CONFIG.DRY_RUN) {
    deleteCheckpoint();
  }

  process.stdout.write(
    `\nMigration ${CONFIG.DRY_RUN ? 'preview ' : ''}complete! Total processed: ${totalProcessed}\n`
  );
}

// ============================================================================
// Run Migration
// ============================================================================

// Run with: DRY_RUN=true npx ts-node scripts/auth-migration/migrate-members-to-supabase-auth.ts
main().catch((err) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  process.stdout.write(`\n❌ Migration failed: ${errorMessage}\n`);
  process.exit(1);
});
