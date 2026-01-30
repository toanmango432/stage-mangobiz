/**
 * AI Tools Edge Function
 *
 * Main entry point for Mango Connect to invoke AI tools in Mango Biz.
 * This function validates authentication, executes tools via the dispatcher,
 * and logs all invocations for audit purposes.
 *
 * Authentication:
 * - Requires valid Supabase auth token in Authorization header
 * - Service role key is also accepted for server-to-server calls
 *
 * Request format:
 * POST /ai-tools
 * {
 *   "toolName": "searchClients",
 *   "parameters": { "query": "John", "limit": 10 },
 *   "context": { "sessionId": "optional-session-id" }
 * }
 *
 * Response format:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "executionTimeMs": 42,
 *   "metadata": { ... }
 * }
 *
 * Deploy: supabase functions deploy ai-tools
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

/**
 * Request body for AI tool invocation
 */
interface AIToolRequest {
  /** Name of the tool to execute (e.g., 'searchClients', 'bookAppointment') */
  toolName: string;
  /** Parameters to pass to the tool (validated against tool schema) */
  parameters: Record<string, unknown>;
  /** Optional context information */
  context?: {
    /** Session ID for grouping related tool calls */
    sessionId?: string;
  };
}

/**
 * Response body for AI tool invocation
 */
interface AIToolResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
  executionTimeMs: number;
  metadata?: Record<string, unknown>;
}

/**
 * Audit log entry for ai_tool_invocations table
 */
interface AuditLogEntry {
  store_id: string;
  user_id: string | null;
  tool_name: string;
  parameters: Record<string, unknown>;
  result: Record<string, unknown>;
  success: boolean;
  error_message: string | null;
  execution_time_ms: number;
  metadata?: Record<string, unknown>;
}

/**
 * Logger implementation for tool execution
 */
interface ToolLogger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Execution context for tool handlers
 */
interface ExecutionContext {
  storeId: string;
  userId: string;
  logger: ToolLogger;
  requestId?: string;
  sessionId?: string;
  timezone?: string;
}

/**
 * Tool result from handler execution
 */
interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tool definition from registry
 */
interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  parameters: unknown;
  returns?: unknown;
  requiresPermission?: boolean;
  permissionLevel?: string;
}

/**
 * Validation result from registry
 */
interface ValidationResult {
  success: boolean;
  data?: unknown;
  message?: string;
}

// ==================== TOOL REGISTRY (Embedded) ====================

/**
 * This section embeds the tool registry functionality directly in the edge function.
 * In a full implementation, this would import from @mango/ai-tools package.
 * For Deno edge functions, we need to inline the essential registry functions.
 */

// Tool schemas and definitions - simplified inline version
// The full schemas are in packages/ai-tools/src/schemas/

const SUPPORTED_TOOLS = new Set([
  // Clients
  'searchClients',
  'getClient',
  'getClientHistory',
  'createClient',
  'updateClient',
  'addClientNote',
  // Appointments
  'searchAppointments',
  'getAppointment',
  'checkAvailability',
  'bookAppointment',
  'rescheduleAppointment',
  'cancelAppointment',
  // Services
  'searchServices',
  'getService',
  'getServicesByStaff',
  'getPopularServices',
  'getServicePricing',
  // Tickets
  'getOpenTickets',
  'getTicket',
  'createTicket',
  'addTicketItem',
  'applyDiscount',
  'closeTicket',
  'voidTicket',
  'removeTicketItem',
  // Staff
  'searchStaff',
  'getStaff',
  'getStaffSchedule',
  'getStaffAvailability',
  'getOnDutyStaff',
  'getStaffPerformance',
  // Analytics
  'getDashboardMetrics',
  'getSalesReport',
  'getClientRetention',
  'getServicePopularity',
  'getPeakHours',
  // System
  'getStoreInfo',
  'getCurrentTime',
  'getBusinessHours',
  'isStoreOpen',
  'getSystemStatus',
  'logAIAction',
]);

// Tool category mappings for validation
const TOOL_CATEGORIES: Record<string, string> = {
  searchClients: 'clients',
  getClient: 'clients',
  getClientHistory: 'clients',
  createClient: 'clients',
  updateClient: 'clients',
  addClientNote: 'clients',
  searchAppointments: 'appointments',
  getAppointment: 'appointments',
  checkAvailability: 'appointments',
  bookAppointment: 'appointments',
  rescheduleAppointment: 'appointments',
  cancelAppointment: 'appointments',
  searchServices: 'services',
  getService: 'services',
  getServicesByStaff: 'services',
  getPopularServices: 'services',
  getServicePricing: 'services',
  getOpenTickets: 'tickets',
  getTicket: 'tickets',
  createTicket: 'tickets',
  addTicketItem: 'tickets',
  applyDiscount: 'tickets',
  closeTicket: 'tickets',
  voidTicket: 'tickets',
  removeTicketItem: 'tickets',
  searchStaff: 'staff',
  getStaff: 'staff',
  getStaffSchedule: 'staff',
  getStaffAvailability: 'staff',
  getOnDutyStaff: 'staff',
  getStaffPerformance: 'staff',
  getDashboardMetrics: 'analytics',
  getSalesReport: 'analytics',
  getClientRetention: 'analytics',
  getServicePopularity: 'analytics',
  getPeakHours: 'analytics',
  getStoreInfo: 'system',
  getCurrentTime: 'system',
  getBusinessHours: 'system',
  isStoreOpen: 'system',
  getSystemStatus: 'system',
  logAIAction: 'system',
};

// Tools that require elevated permissions
const PERMISSION_REQUIRED_TOOLS = new Set([
  'getSalesReport',
  'getClientRetention',
  'getStaffPerformance',
  'voidTicket',
]);

function isToolSupported(toolName: string): boolean {
  return SUPPORTED_TOOLS.has(toolName);
}

function getToolCategory(toolName: string): string | undefined {
  return TOOL_CATEGORIES[toolName];
}

function requiresPermission(toolName: string): boolean {
  return PERMISSION_REQUIRED_TOOLS.has(toolName);
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-store-id, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== HELPERS ====================

/**
 * Create Supabase client with service role for full access
 */
function getSupabaseServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create Supabase client with user's auth token
 */
function getSupabaseUserClient(authToken: string): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Generate a request ID for tracing
 */
function generateRequestId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a logger implementation
 */
function createLogger(requestId: string): ToolLogger {
  const prefix = `[ai-tools:${requestId}]`;

  return {
    debug: (message: string, data?: Record<string, unknown>) => {
      console.debug(prefix, message, data ? JSON.stringify(data) : '');
    },
    info: (message: string, data?: Record<string, unknown>) => {
      console.info(prefix, message, data ? JSON.stringify(data) : '');
    },
    warn: (message: string, data?: Record<string, unknown>) => {
      console.warn(prefix, message, data ? JSON.stringify(data) : '');
    },
    error: (message: string, data?: Record<string, unknown>) => {
      console.error(prefix, message, data ? JSON.stringify(data) : '');
    },
  };
}

/**
 * Validate UUID format
 */
function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ==================== AUTHENTICATION ====================

interface AuthResult {
  success: boolean;
  user?: User;
  storeId?: string;
  error?: string;
}

/**
 * Authenticate the request and extract user/store context
 */
async function authenticateRequest(
  req: Request,
  supabaseService: SupabaseClient
): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  const storeIdHeader = req.headers.get('X-Store-ID');

  if (!authHeader) {
    return { success: false, error: 'Missing Authorization header' };
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return { success: false, error: 'Invalid Authorization header format' };
  }

  // Check if this is a service role key (for server-to-server calls)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (token === serviceRoleKey) {
    // Service role key - require X-Store-ID header
    if (!storeIdHeader) {
      return {
        success: false,
        error: 'X-Store-ID header required for service role authentication',
      };
    }

    if (!isValidUUID(storeIdHeader)) {
      return { success: false, error: 'Invalid X-Store-ID format' };
    }

    // Verify store exists
    const { data: store, error: storeError } = await supabaseService
      .from('stores')
      .select('id, status')
      .eq('id', storeIdHeader)
      .single();

    if (storeError || !store) {
      return { success: false, error: 'Store not found' };
    }

    if (store.status === 'suspended') {
      return { success: false, error: 'Store is suspended' };
    }

    return {
      success: true,
      storeId: storeIdHeader,
      user: undefined, // No user for service role
    };
  }

  // Regular user token - verify with Supabase Auth
  const supabaseUser = getSupabaseUserClient(token);
  const {
    data: { user },
    error: authError,
  } = await supabaseUser.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Invalid or expired token' };
  }

  // Get user's store membership
  const { data: membership, error: membershipError } = await supabaseService
    .from('members')
    .select('store_id, role, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (membershipError || !membership) {
    return { success: false, error: 'User is not a member of any store' };
  }

  // Allow X-Store-ID header to override if user is a member of multiple stores
  const storeId = storeIdHeader || membership.store_id;

  // Verify user has access to the requested store
  if (storeIdHeader && storeIdHeader !== membership.store_id) {
    // Check if user is a member of the requested store
    const { data: otherMembership } = await supabaseService
      .from('members')
      .select('store_id')
      .eq('user_id', user.id)
      .eq('store_id', storeIdHeader)
      .eq('is_active', true)
      .single();

    if (!otherMembership) {
      return { success: false, error: 'User does not have access to this store' };
    }
  }

  return {
    success: true,
    user,
    storeId,
  };
}

// ==================== AUDIT LOGGING ====================

/**
 * Log tool invocation to ai_tool_invocations table
 */
async function logToolInvocation(
  supabase: SupabaseClient,
  entry: AuditLogEntry,
  logger: ToolLogger
): Promise<void> {
  try {
    const { error } = await supabase.from('ai_tool_invocations').insert({
      id: crypto.randomUUID(),
      store_id: entry.store_id,
      user_id: entry.user_id,
      tool_name: entry.tool_name,
      parameters: entry.parameters,
      result: entry.result,
      success: entry.success,
      error_message: entry.error_message,
      execution_time_ms: entry.execution_time_ms,
      metadata: entry.metadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Log but don't fail the request
      logger.error('Failed to log tool invocation', {
        error: error.message,
        toolName: entry.tool_name,
      });
    }
  } catch (err) {
    logger.error('Exception logging tool invocation', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

// ==================== TOOL EXECUTION ====================

/**
 * Execute a tool with the given parameters.
 *
 * Note: This is a placeholder implementation that returns a "not implemented" response.
 * In production, this would import and call the actual handlers from @mango/ai-tools.
 *
 * The handlers require data providers to be configured, which connect to the actual
 * data layer (Supabase/IndexedDB). For the edge function, we would need to create
 * Supabase-backed data providers.
 */
async function executeToolHandler(
  toolName: string,
  parameters: Record<string, unknown>,
  context: ExecutionContext
): Promise<ToolResult> {
  const startTime = Date.now();

  // Log execution start
  context.logger.info('Executing tool', {
    toolName,
    storeId: context.storeId,
    userId: context.userId,
    requestId: context.requestId,
  });

  // Validate tool exists
  if (!isToolSupported(toolName)) {
    return {
      success: false,
      error: `Tool '${toolName}' not found in registry`,
      errorCode: 'NOT_FOUND',
      metadata: { executionTimeMs: Date.now() - startTime },
    };
  }

  // Check permission requirements
  if (requiresPermission(toolName)) {
    context.logger.info('Tool requires elevated permissions', {
      toolName,
      category: getToolCategory(toolName),
    });
    // Note: Permission validation should be done by the handler's data provider
    // based on the user's role in the store
  }

  // TODO: Implement actual tool execution
  // This would involve:
  // 1. Creating Supabase-backed data providers
  // 2. Injecting them into handlers via set*DataProvider functions
  // 3. Importing and calling executeTool from @mango/ai-tools
  //
  // For now, return a placeholder response indicating the tool was recognized
  // but execution is not yet implemented in the edge function.

  const category = getToolCategory(toolName);

  return {
    success: false,
    error: `Tool '${toolName}' is registered but edge function execution is not yet implemented. ` +
           `This tool belongs to the '${category}' category. ` +
           `To complete implementation, create Supabase-backed data providers and connect them to handlers.`,
    errorCode: 'NOT_IMPLEMENTED',
    metadata: {
      executionTimeMs: Date.now() - startTime,
      toolName,
      category,
      parametersReceived: Object.keys(parameters),
    },
  };
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  const startTime = Date.now();
  const requestId = req.headers.get('X-Request-ID') || generateRequestId();
  const logger = createLogger(requestId);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, error: 'Method not allowed', errorCode: 'METHOD_NOT_ALLOWED' },
      405
    );
  }

  let toolName = '';
  let parameters: Record<string, unknown> = {};
  let storeId = '';
  let userId: string | null = null;

  try {
    // Get service client for auth and logging
    const supabaseService = getSupabaseServiceClient();

    // Authenticate request
    const authResult = await authenticateRequest(req, supabaseService);

    if (!authResult.success || !authResult.storeId) {
      logger.warn('Authentication failed', { error: authResult.error });
      return jsonResponse(
        {
          success: false,
          error: authResult.error || 'Authentication failed',
          errorCode: 'UNAUTHORIZED',
          executionTimeMs: Date.now() - startTime,
        },
        401
      );
    }

    storeId = authResult.storeId;
    userId = authResult.user?.id || null;

    // Parse request body
    let body: AIToolRequest;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: 'Invalid JSON in request body',
          errorCode: 'INVALID_INPUT',
          executionTimeMs: Date.now() - startTime,
        },
        400
      );
    }

    // Validate required fields
    if (!body.toolName || typeof body.toolName !== 'string') {
      return jsonResponse(
        {
          success: false,
          error: 'Missing or invalid toolName',
          errorCode: 'INVALID_INPUT',
          executionTimeMs: Date.now() - startTime,
        },
        400
      );
    }

    toolName = body.toolName;
    parameters = body.parameters || {};

    // Validate tool exists in registry
    if (!isToolSupported(toolName)) {
      logger.warn('Unknown tool requested', { toolName });

      // Log the failed invocation
      await logToolInvocation(
        supabaseService,
        {
          store_id: storeId,
          user_id: userId,
          tool_name: toolName,
          parameters,
          result: { error: 'Tool not found' },
          success: false,
          error_message: `Tool '${toolName}' not found in registry`,
          execution_time_ms: Date.now() - startTime,
          metadata: { requestId },
        },
        logger
      );

      return jsonResponse(
        {
          success: false,
          error: `Tool '${toolName}' not found in registry`,
          errorCode: 'NOT_FOUND',
          executionTimeMs: Date.now() - startTime,
        },
        404
      );
    }

    // Create execution context
    const context: ExecutionContext = {
      storeId,
      userId: userId || 'service-account',
      logger,
      requestId,
      sessionId: body.context?.sessionId,
      timezone: 'UTC', // Could be fetched from store settings
    };

    // Execute the tool
    const result = await executeToolHandler(toolName, parameters, context);

    const executionTimeMs = Date.now() - startTime;

    // Log the invocation
    await logToolInvocation(
      supabaseService,
      {
        store_id: storeId,
        user_id: userId,
        tool_name: toolName,
        parameters,
        result: result.success ? { data: result.data } : { error: result.error },
        success: result.success,
        error_message: result.error || null,
        execution_time_ms: executionTimeMs,
        metadata: {
          requestId,
          sessionId: body.context?.sessionId,
          ...(result.metadata || {}),
        },
      },
      logger
    );

    // Return response
    const response: AIToolResponse = {
      success: result.success,
      data: result.data,
      error: result.error,
      errorCode: result.errorCode,
      executionTimeMs,
      metadata: {
        requestId,
        toolName,
        category: getToolCategory(toolName),
        ...result.metadata,
      },
    };

    logger.info('Tool execution completed', {
      toolName,
      success: result.success,
      executionTimeMs,
    });

    return jsonResponse(response, result.success ? 200 : 400);
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    logger.error('Unhandled error in ai-tools function', {
      error: errorMessage,
      toolName,
      storeId,
    });

    // Try to log the error
    try {
      const supabaseService = getSupabaseServiceClient();
      await logToolInvocation(
        supabaseService,
        {
          store_id: storeId || 'unknown',
          user_id: userId,
          tool_name: toolName || 'unknown',
          parameters,
          result: { error: errorMessage },
          success: false,
          error_message: errorMessage,
          execution_time_ms: executionTimeMs,
          metadata: { requestId, unhandledError: true },
        },
        logger
      );
    } catch {
      // Ignore logging errors in error handler
    }

    return jsonResponse(
      {
        success: false,
        error: errorMessage,
        errorCode: 'INTERNAL_ERROR',
        executionTimeMs,
        metadata: { requestId },
      },
      500
    );
  }
});
