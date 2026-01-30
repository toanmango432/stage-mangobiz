/**
 * @mango/ai-tools - Client Tool Handlers
 *
 * Handlers for executing client-related AI tools.
 * These handlers bridge AI tool calls to business operations via the data provider.
 *
 * Usage:
 * - Import handlers for specific tool operations
 * - Pass validated input and ExecutionContext
 * - Returns ToolResult<T> with success/error
 */

import type {
  ExecutionContext,
  ToolResult,
  ToolHandler,
} from '../types';
import {
  successResult,
  errorResult,
} from '../types';
import type {
  SearchClientsInput,
  GetClientInput,
  GetClientHistoryInput,
  CreateClientInput,
  UpdateClientInput,
  AddClientNoteInput,
} from '../schemas/clients';

// ============================================================================
// Data Provider Interface
// ============================================================================

/**
 * Interface for client data operations.
 * Implementations can use Supabase, IndexedDB, or any other data source.
 * This interface is injected at runtime to decouple handlers from data layer.
 */
export interface ClientDataProvider {
  /**
   * Search for clients matching criteria
   */
  searchClients(params: {
    storeId: string;
    query: string;
    filters?: Record<string, unknown>;
    limit: number;
    offset: number;
  }): Promise<{
    clients: ClientSummary[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Get a single client by ID
   */
  getClient(params: {
    storeId: string;
    clientId: string;
  }): Promise<ClientDetails | null>;

  /**
   * Get client visit history
   */
  getClientHistory(params: {
    storeId: string;
    clientId: string;
    includeAppointments: boolean;
    includeTickets: boolean;
    limit: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ClientHistory | null>;

  /**
   * Create a new client
   */
  createClient(params: {
    storeId: string;
    data: CreateClientData;
  }): Promise<CreatedClient>;

  /**
   * Update an existing client
   */
  updateClient(params: {
    storeId: string;
    clientId: string;
    data: UpdateClientData;
  }): Promise<UpdatedClient>;

  /**
   * Add a note to a client's profile
   */
  addClientNote(params: {
    storeId: string;
    clientId: string;
    note: string;
    category: string;
    isPrivate: boolean;
    userId: string;
  }): Promise<ClientNote>;
}

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Summary client info returned by search
 */
export interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  isVip: boolean;
  loyaltyTier?: string;
  lastVisitDate?: string;
  totalVisits: number;
}

/**
 * Full client details
 */
export interface ClientDetails {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: string;
  isVip: boolean;
  isBlocked: boolean;
  loyaltyTier?: string;
  pointsBalance?: number;
  membershipStatus?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisitDate?: string;
  preferredStaff?: string[];
  tags?: string[];
  notes?: Array<{
    id: string;
    content: string;
    category: string;
    createdAt: string;
  }>;
}

/**
 * Client visit history
 */
export interface ClientHistory {
  clientId: string;
  appointments?: Array<{
    id: string;
    date: string;
    services: string[];
    staffName: string;
    status: string;
  }>;
  tickets?: Array<{
    id: string;
    date: string;
    total: number;
    itemCount: number;
    staffName: string;
  }>;
  summary: {
    totalAppointments: number;
    totalTransactions: number;
    totalSpent: number;
    averageTicket: number;
  };
}

/**
 * Data for creating a new client
 */
export interface CreateClientData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthday?: string;
  gender?: string;
  address?: {
    street?: string;
    apt?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  source?: string;
  sourceDetails?: string;
  referredByClientId?: string;
  allowEmail?: boolean;
  allowSms?: boolean;
  allowMarketing?: boolean;
  notes?: string;
}

/**
 * Data for updating a client
 */
export interface UpdateClientData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string | null;
  birthday?: string | null;
  gender?: string | null;
  address?: {
    street?: string;
    apt?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;
  isVip?: boolean;
  preferredStaffIds?: string[];
  preferredLanguage?: string;
  allowEmail?: boolean;
  allowSms?: boolean;
  allowMarketing?: boolean;
  tags?: string[];
}

/**
 * Created client response
 */
export interface CreatedClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  createdAt: string;
}

/**
 * Updated client response
 */
export interface UpdatedClient {
  id: string;
  firstName: string;
  lastName: string;
  updatedAt: string;
  updatedFields: string[];
}

/**
 * Client note
 */
export interface ClientNote {
  id: string;
  clientId: string;
  content: string;
  category: string;
  isPrivate: boolean;
  createdAt: string;
}

// ============================================================================
// Handler State
// ============================================================================

/**
 * Data provider instance (must be set before handlers can be used)
 */
let dataProvider: ClientDataProvider | null = null;

/**
 * Set the data provider for client handlers.
 * Must be called during app initialization before any handlers are invoked.
 *
 * @param provider - The data provider implementation
 */
export function setClientDataProvider(provider: ClientDataProvider): void {
  dataProvider = provider;
}

/**
 * Get the current data provider.
 * Throws if not initialized.
 */
function getDataProvider(): ClientDataProvider {
  if (!dataProvider) {
    throw new Error(
      'Client data provider not initialized. Call setClientDataProvider() during app setup.'
    );
  }
  return dataProvider;
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle searchClients tool invocation.
 *
 * Searches for clients by name, phone, or email with optional filters.
 */
export const handleSearchClients: ToolHandler<
  SearchClientsInput,
  {
    clients: ClientSummary[];
    total: number;
    hasMore: boolean;
  }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing searchClients', {
    query: input.query,
    filters: input.filters,
    limit: input.limit,
  });

  try {
    const provider = getDataProvider();

    const result = await provider.searchClients({
      storeId: context.storeId,
      query: input.query,
      filters: input.filters,
      limit: input.limit,
      offset: input.offset,
    });

    context.logger.info('searchClients completed', {
      resultCount: result.clients.length,
      total: result.total,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(result, {
      executionTimeMs: Date.now() - startTime,
      count: result.clients.length,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('searchClients failed', { error: errorMessage });

    return errorResult(
      `Failed to search clients: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getClient tool invocation.
 *
 * Retrieves complete details for a specific client.
 */
export const handleGetClient: ToolHandler<
  GetClientInput,
  { client: ClientDetails }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getClient', {
    clientId: input.clientId,
  });

  try {
    const provider = getDataProvider();

    const client = await provider.getClient({
      storeId: context.storeId,
      clientId: input.clientId,
    });

    if (!client) {
      context.logger.warn('Client not found', { clientId: input.clientId });
      return errorResult(
        `Client with ID '${input.clientId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getClient completed', {
      clientId: client.id,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { client },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getClient failed', { error: errorMessage });

    return errorResult(
      `Failed to get client: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle getClientHistory tool invocation.
 *
 * Retrieves a client's visit history including appointments and tickets.
 */
export const handleGetClientHistory: ToolHandler<
  GetClientHistoryInput,
  ClientHistory
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing getClientHistory', {
    clientId: input.clientId,
    includeAppointments: input.includeAppointments,
    includeTickets: input.includeTickets,
  });

  try {
    const provider = getDataProvider();

    const history = await provider.getClientHistory({
      storeId: context.storeId,
      clientId: input.clientId,
      includeAppointments: input.includeAppointments,
      includeTickets: input.includeTickets,
      limit: input.limit,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    if (!history) {
      context.logger.warn('Client not found for history', { clientId: input.clientId });
      return errorResult(
        `Client with ID '${input.clientId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    context.logger.info('getClientHistory completed', {
      clientId: input.clientId,
      appointmentsCount: history.appointments?.length ?? 0,
      ticketsCount: history.tickets?.length ?? 0,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(history, {
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('getClientHistory failed', { error: errorMessage });

    return errorResult(
      `Failed to get client history: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle createClient tool invocation.
 *
 * Creates a new client record.
 */
export const handleCreateClient: ToolHandler<
  CreateClientInput,
  { client: CreatedClient }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing createClient', {
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
  });

  try {
    const provider = getDataProvider();

    const createdClient = await provider.createClient({
      storeId: context.storeId,
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        birthday: input.birthday,
        gender: input.gender,
        address: input.address,
        source: input.source,
        sourceDetails: input.sourceDetails,
        referredByClientId: input.referredByClientId,
        allowEmail: input.allowEmail,
        allowSms: input.allowSms,
        allowMarketing: input.allowMarketing,
        notes: input.notes,
      },
    });

    context.logger.info('createClient completed', {
      clientId: createdClient.id,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { client: createdClient },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('createClient failed', { error: errorMessage });

    // Check for duplicate phone error
    if (errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('already exists')) {
      return errorResult(
        `A client with this phone number already exists`,
        'CONFLICT',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to create client: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle updateClient tool invocation.
 *
 * Updates an existing client's information.
 */
export const handleUpdateClient: ToolHandler<
  UpdateClientInput,
  { client: UpdatedClient; updatedFields: string[] }
> = async (input, context) => {
  const startTime = Date.now();

  // Extract clientId and data fields
  const { clientId, ...updateData } = input;

  // Identify which fields are being updated
  const updatedFields = Object.keys(updateData).filter(
    (key) => updateData[key as keyof typeof updateData] !== undefined
  );

  context.logger.info('Executing updateClient', {
    clientId,
    updatedFields,
  });

  try {
    const provider = getDataProvider();

    const updatedClient = await provider.updateClient({
      storeId: context.storeId,
      clientId,
      data: updateData,
    });

    context.logger.info('updateClient completed', {
      clientId: updatedClient.id,
      updatedFields,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { client: updatedClient, updatedFields },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('updateClient failed', { error: errorMessage });

    // Check for not found error
    if (errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Client with ID '${clientId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to update client: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

/**
 * Handle addClientNote tool invocation.
 *
 * Adds a note to a client's profile.
 */
export const handleAddClientNote: ToolHandler<
  AddClientNoteInput,
  { note: ClientNote }
> = async (input, context) => {
  const startTime = Date.now();

  context.logger.info('Executing addClientNote', {
    clientId: input.clientId,
    category: input.category,
    isPrivate: input.isPrivate,
  });

  try {
    const provider = getDataProvider();

    // Medical notes are always private
    const isPrivate = input.category === 'medical' ? true : input.isPrivate;

    const note = await provider.addClientNote({
      storeId: context.storeId,
      clientId: input.clientId,
      note: input.note,
      category: input.category,
      isPrivate,
      userId: context.userId,
    });

    context.logger.info('addClientNote completed', {
      noteId: note.id,
      clientId: input.clientId,
      executionTimeMs: Date.now() - startTime,
    });

    return successResult(
      { note },
      { executionTimeMs: Date.now() - startTime }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    context.logger.error('addClientNote failed', { error: errorMessage });

    // Check for client not found
    if (errorMessage.toLowerCase().includes('not found')) {
      return errorResult(
        `Client with ID '${input.clientId}' not found`,
        'NOT_FOUND',
        { executionTimeMs: Date.now() - startTime }
      );
    }

    return errorResult(
      `Failed to add client note: ${errorMessage}`,
      'INTERNAL_ERROR',
      { executionTimeMs: Date.now() - startTime }
    );
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * All client tool handlers mapped by tool name.
 */
export const clientHandlers = {
  searchClients: handleSearchClients,
  getClient: handleGetClient,
  getClientHistory: handleGetClientHistory,
  createClient: handleCreateClient,
  updateClient: handleUpdateClient,
  addClientNote: handleAddClientNote,
};
