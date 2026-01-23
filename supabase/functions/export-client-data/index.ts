/**
 * Export Client Data Edge Function
 *
 * GDPR/CCPA compliant data export function.
 * Exports all client data in JSON format for data portability requests.
 *
 * Endpoint:
 * - POST /export-client-data - Export all client data
 *
 * Request body:
 * {
 *   clientId: string      - Required: The client's UUID
 *   storeId: string       - Required: The store's UUID
 *   performedBy?: string  - Optional: UUID of the staff member requesting export
 *   performedByName?: string - Optional: Name of the staff member
 *   requestId?: string    - Optional: data_request ID to update status
 * }
 *
 * Response:
 * {
 *   data: {
 *     exportedAt: string
 *     client: { ... }
 *     appointments: [ ... ]
 *     tickets: [ ... ]
 *     transactions: [ ... ]
 *   }
 *   downloadUrl?: string  - Base64 data URI for download
 * }
 *
 * Deploy: supabase functions deploy export-client-data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface ExportRequest {
  clientId: string;
  storeId: string;
  performedBy?: string;
  performedByName?: string;
  requestId?: string;
}

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  preferences?: Record<string, unknown>;
  isVip?: boolean;
  consentMarketing?: boolean;
  consentMarketingAt?: string;
  consentDataProcessing?: boolean;
  consentDataProcessingAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentData {
  id: string;
  clientName: string;
  services: unknown[];
  status: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  notes?: string;
  createdAt: string;
}

interface TicketData {
  id: string;
  clientName: string;
  services: unknown[];
  products: unknown[];
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  createdAt: string;
}

interface TransactionData {
  id: string;
  type: string;
  paymentMethod: string;
  amount: number;
  tip: number;
  total: number;
  status: string;
  createdAt: string;
}

interface ExportedData {
  exportedAt: string;
  exportVersion: string;
  client: ClientData;
  appointments: AppointmentData[];
  tickets: TicketData[];
  transactions: TransactionData[];
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-store-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== HELPERS ====================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Convert snake_case to camelCase for client data
function toClientData(row: Record<string, unknown>): ClientData {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: row.email as string | undefined,
    phone: row.phone as string | undefined,
    dateOfBirth: row.date_of_birth as string | undefined,
    gender: row.gender as string | undefined,
    source: row.source as string | undefined,
    notes: row.notes as string | undefined,
    tags: row.tags as string[] | undefined,
    preferences: row.preferences as Record<string, unknown> | undefined,
    isVip: row.is_vip as boolean | undefined,
    consentMarketing: row.consent_marketing as boolean | undefined,
    consentMarketingAt: row.consent_marketing_at as string | undefined,
    consentDataProcessing: row.consent_data_processing as boolean | undefined,
    consentDataProcessingAt: row.consent_data_processing_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toAppointmentData(row: Record<string, unknown>): AppointmentData {
  return {
    id: row.id as string,
    clientName: row.client_name as string,
    services: row.services as unknown[] || [],
    status: row.status as string,
    scheduledStartTime: row.scheduled_start_time as string,
    scheduledEndTime: row.scheduled_end_time as string,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
  };
}

function toTicketData(row: Record<string, unknown>): TicketData {
  return {
    id: row.id as string,
    clientName: row.client_name as string,
    services: row.services as unknown[] || [],
    products: row.products as unknown[] || [],
    status: row.status as string,
    subtotal: row.subtotal as number,
    discount: row.discount as number,
    tax: row.tax as number,
    tip: row.tip as number,
    total: row.total as number,
    createdAt: row.created_at as string,
  };
}

function toTransactionData(row: Record<string, unknown>): TransactionData {
  return {
    id: row.id as string,
    type: row.type as string,
    paymentMethod: row.payment_method as string,
    amount: row.amount as number,
    tip: row.tip as number,
    total: row.total as number,
    status: row.status as string,
    createdAt: row.created_at as string,
  };
}

// ==================== MAIN HANDLER ====================

async function handleExport(
  supabase: SupabaseClient,
  request: ExportRequest
): Promise<Response> {
  const { clientId, storeId, performedBy, performedByName, requestId } = request;

  // Validate required fields
  if (!clientId || !storeId) {
    return jsonResponse({ error: 'clientId and storeId are required' }, 400);
  }

  console.log(`[export-client-data] Starting export for client ${clientId} in store ${storeId}`);

  try {
    // 1. Fetch client profile
    const { data: clientRow, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('store_id', storeId)
      .single();

    if (clientError || !clientRow) {
      console.error('[export-client-data] Client not found:', clientError);
      return jsonResponse({ error: 'Client not found' }, 404);
    }

    // 2. Fetch appointments
    const { data: appointmentRows, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, client_name, services, status, scheduled_start_time, scheduled_end_time, notes, created_at')
      .eq('client_id', clientId)
      .eq('store_id', storeId)
      .order('scheduled_start_time', { ascending: false });

    if (appointmentsError) {
      console.error('[export-client-data] Error fetching appointments:', appointmentsError);
    }

    // 3. Fetch tickets
    const { data: ticketRows, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, client_name, services, products, status, subtotal, discount, tax, tip, total, created_at')
      .eq('client_id', clientId)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('[export-client-data] Error fetching tickets:', ticketsError);
    }

    // 4. Fetch transactions
    const { data: transactionRows, error: transactionsError } = await supabase
      .from('transactions')
      .select('id, type, payment_method, amount, tip, total, status, created_at')
      .eq('client_id', clientId)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('[export-client-data] Error fetching transactions:', transactionsError);
    }

    // 5. Assemble export data
    const exportData: ExportedData = {
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
      client: toClientData(clientRow),
      appointments: (appointmentRows || []).map(toAppointmentData),
      tickets: (ticketRows || []).map(toTicketData),
      transactions: (transactionRows || []).map(toTransactionData),
    };

    // 6. Log export action to data_retention_logs
    const fieldsExported = [
      'profile',
      'preferences',
      'consent',
      ...(exportData.appointments.length > 0 ? ['appointments'] : []),
      ...(exportData.tickets.length > 0 ? ['tickets'] : []),
      ...(exportData.transactions.length > 0 ? ['transactions'] : []),
    ];

    const { error: logError } = await supabase.from('data_retention_logs').insert({
      client_id: clientId,
      store_id: storeId,
      action: 'data_exported',
      fields_affected: fieldsExported,
      performed_by: performedBy || null,
      performed_by_name: performedByName || null,
      performed_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('[export-client-data] Error logging export action:', logError);
      // Continue anyway - export is more important than logging
    }

    // 7. Update data request status if requestId provided
    if (requestId) {
      const { error: updateError } = await supabase
        .from('client_data_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_by: performedBy || null,
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('[export-client-data] Error updating request status:', updateError);
      }
    }

    // 8. Generate download URL (base64 encoded JSON)
    const jsonString = JSON.stringify(exportData, null, 2);
    const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
    const downloadUrl = `data:application/json;base64,${base64Data}`;

    console.log(`[export-client-data] Export completed for client ${clientId}: ${exportData.appointments.length} appointments, ${exportData.tickets.length} tickets, ${exportData.transactions.length} transactions`);

    return jsonResponse({
      success: true,
      data: exportData,
      downloadUrl,
      summary: {
        appointmentCount: exportData.appointments.length,
        ticketCount: exportData.tickets.length,
        transactionCount: exportData.transactions.length,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[export-client-data] Unexpected error:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Failed to export client data',
    }, 500);
  }
}

// ==================== SERVE ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    const supabase = getSupabaseClient();
    const body: ExportRequest = await req.json();

    return await handleExport(supabase, body);
  } catch (error) {
    console.error('[export-client-data] Error parsing request:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Invalid request body',
    }, 400);
  }
});
