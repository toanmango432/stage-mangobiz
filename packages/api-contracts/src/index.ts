/**
 * @mango/api-contracts
 *
 * Shared API contracts between frontend and backend for Mango POS.
 * These types define the request/response shapes for all API endpoints.
 *
 * @example
 * ```typescript
 * // Frontend
 * import { StoreLoginRequest, StoreLoginResponse } from '@mango/api-contracts';
 *
 * const request: StoreLoginRequest = { loginId: 'store1', password: '***' };
 * const response = await api.post<StoreLoginResponse>('/auth/store-login', request);
 *
 * // Edge Function (Deno)
 * import type { StoreLoginRequest, StoreLoginResponse } from '@mango/api-contracts';
 *
 * const body: StoreLoginRequest = await req.json();
 * // ... process and return StoreLoginResponse
 * ```
 */

// =============================================================================
// Auth Contracts
// =============================================================================

export type {
  // Session types
  StoreSession,
  MemberSession,
  MemberRole,
  AuthSession,
  // Request types
  StoreLoginRequest,
  MemberPinRequest,
  MemberPasswordRequest,
  MemberCardRequest,
  RefreshTokenRequest,
  // Response types
  StoreLoginResponse,
  MemberLoginResponse,
  RefreshTokenResponse,
  ValidateSessionResponse,
  // Error types
  AuthErrorCode,
  AuthError,
} from './auth';

export {
  // Zod schemas
  StoreLoginRequestSchema,
  StoreSessionSchema,
  StoreLoginResponseSchema,
  MemberPinRequestSchema,
  MemberPasswordRequestSchema,
  MemberCardRequestSchema,
  MemberSessionSchema,
  MemberLoginResponseSchema,
} from './auth';

// =============================================================================
// Sync Contracts
// =============================================================================

export type {
  // Entity types
  SyncableEntity,
  SyncAction,
  SyncStatus,
  // Operation types
  SyncOperation,
  SyncOperationResult,
  // Request types
  SyncPushRequest,
  SyncPullRequest,
  ResolveConflictRequest,
  // Response types
  SyncPushResponse,
  SyncPullResponse,
  EntityChanges,
  SyncStatusResponse,
  // Conflict types
  SyncConflict,
  ConflictResolutionStrategy,
  // Error types
  SyncErrorCode,
  SyncError,
} from './sync';

export {
  SyncOperationSchema,
  SyncPushRequestSchema,
  SyncPullRequestSchema,
} from './sync';

// =============================================================================
// Entity Contracts
// =============================================================================

export type {
  // Generic types
  PaginationParams,
  PaginationMeta,
  ListResponse,
  ItemResponse,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
  // Client types
  CreateClientRequest,
  UpdateClientRequest,
  SearchClientsRequest,
  // Staff types
  CreateStaffRequest,
  UpdateStaffRequest,
  ClockRequest,
  ClockResponse,
  // Appointment types
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  CheckInAppointmentRequest,
  CheckInAppointmentResponse,
  // Ticket types
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketServiceItem,
  CompleteTicketRequest,
  CompleteTicketResponse,
  // Transaction types
  CreateTransactionRequest,
  VoidTransactionRequest,
  RefundTransactionRequest,
  TransactionResultResponse,
} from './entities';

export {
  PaginationParamsSchema,
  CreateClientRequestSchema,
  CreateAppointmentRequestSchema,
  CreateTicketRequestSchema,
} from './entities';
