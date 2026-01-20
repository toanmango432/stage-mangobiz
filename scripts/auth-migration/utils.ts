/**
 * Auth Migration Utilities
 *
 * Utility functions for the member migration script.
 * Run migration with: DRY_RUN=true npx ts-node scripts/auth-migration/migrate-members-to-supabase-auth.ts
 *
 * @see docs/AUTH_MIGRATION_PLAN.md for full implementation details
 */

import * as crypto from 'crypto';

/**
 * Result tracking for migration operations.
 * Each array contains member IDs that fell into that category.
 */
export interface MigrationResult {
  /** Member IDs successfully migrated */
  success: string[];
  /** Member IDs that failed migration (with reason) */
  failed: Array<{ memberId: string; reason: string }>;
  /** Member IDs skipped (already migrated or no email) */
  skipped: Array<{ memberId: string; reason: string }>;
  /** Member IDs where email sending failed */
  emailFailed: Array<{ memberId: string; email: string; error: string }>;
}

/**
 * Member data structure for migration
 */
export interface MemberForMigration {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  pin: string | null;
  auth_user_id: string | null;
}

// Character sets for password generation
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const ALL_CHARS = UPPERCASE + LOWERCASE + NUMBERS;

/**
 * Generates a cryptographically secure temporary password.
 *
 * The password is 12 characters long and guaranteed to contain:
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 *
 * Uses crypto.randomBytes for secure random number generation.
 *
 * @returns A 12-character alphanumeric password
 *
 * @example
 * const password = generateTemporaryPassword();
 * // Returns something like: "Kp7xN2mWqR4j"
 */
export function generateTemporaryPassword(): string {
  const PASSWORD_LENGTH = 12;

  // Generate random bytes for secure selection
  const randomBytes = crypto.randomBytes(PASSWORD_LENGTH);

  // Start by ensuring we have at least one of each required type
  const passwordChars: string[] = [];

  // Add one random character from each required set
  passwordChars.push(UPPERCASE[randomBytes[0] % UPPERCASE.length]);
  passwordChars.push(LOWERCASE[randomBytes[1] % LOWERCASE.length]);
  passwordChars.push(NUMBERS[randomBytes[2] % NUMBERS.length]);

  // Fill the remaining positions with random characters from all sets
  for (let i = 3; i < PASSWORD_LENGTH; i++) {
    passwordChars.push(ALL_CHARS[randomBytes[i] % ALL_CHARS.length]);
  }

  // Shuffle the array to randomize positions of required characters
  // Fisher-Yates shuffle using remaining random bytes
  const additionalBytes = crypto.randomBytes(PASSWORD_LENGTH);
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = additionalBytes[i] % (i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
}

/**
 * Sends a welcome email with temporary password to a migrated member.
 *
 * Currently a stub implementation that logs to console.
 * Will be replaced with actual SMTP/email service integration when configured.
 *
 * @param email - The member's email address
 * @param name - The member's display name
 * @param tempPassword - The temporary password to include in the email
 *
 * @example
 * await sendWelcomeEmail('john@example.com', 'John Doe', 'Kp7xN2mWqR4j');
 * // Logs: "[EMAIL STUB] Welcome email to john@example.com..."
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  tempPassword: string
): Promise<void> {
  // STUB: Log email details for now
  // TODO: Implement actual email sending when SMTP is configured
  const emailContent = {
    to: email,
    subject: 'Welcome to Mango POS - Your New Login',
    body: `
Hi ${name},

Your Mango POS account has been upgraded with enhanced security.

Your temporary password is: ${tempPassword}

Please log in and change your password immediately.

Best,
The Mango POS Team
    `.trim(),
  };

  // Log email stub (will be replaced with actual sending)
  process.stdout.write(
    `[EMAIL STUB] Welcome email to ${email} (${name}) - temp password: ${tempPassword.substring(0, 3)}***\n`
  );

  // Simulate async operation for future email service integration
  await Promise.resolve(emailContent);
}

/**
 * Creates an empty MigrationResult object for tracking migration progress.
 *
 * @returns A new MigrationResult with empty arrays
 */
export function createEmptyResult(): MigrationResult {
  return {
    success: [],
    failed: [],
    skipped: [],
    emailFailed: [],
  };
}

/**
 * Formats the migration result for console output.
 *
 * @param result - The migration result to format
 * @returns Formatted string summary
 */
export function formatMigrationSummary(result: MigrationResult): string {
  const lines: string[] = [
    '',
    '='.repeat(50),
    'MIGRATION SUMMARY',
    '='.repeat(50),
    '',
    `SUCCESS:      ${result.success.length} members migrated`,
    `FAILED:       ${result.failed.length} members failed`,
    `SKIPPED:      ${result.skipped.length} members skipped`,
    `EMAIL FAILED: ${result.emailFailed.length} email failures`,
    '',
  ];

  if (result.failed.length > 0) {
    lines.push('Failed Members:');
    result.failed.forEach(({ memberId, reason }) => {
      lines.push(`  - ${memberId}: ${reason}`);
    });
    lines.push('');
  }

  if (result.skipped.length > 0) {
    lines.push('Skipped Members:');
    result.skipped.forEach(({ memberId, reason }) => {
      lines.push(`  - ${memberId}: ${reason}`);
    });
    lines.push('');
  }

  if (result.emailFailed.length > 0) {
    lines.push('Email Failures (check migration_email_failures.json):');
    result.emailFailed.forEach(({ memberId, email, error }) => {
      lines.push(`  - ${memberId} (${email}): ${error}`);
    });
    lines.push('');
  }

  lines.push('='.repeat(50));

  return lines.join('\n');
}
