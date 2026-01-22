/**
 * Send Form Edge Function
 *
 * Sends consultation/consent forms to clients via email or SMS.
 * Creates a form_delivery record with a unique token for secure form access.
 *
 * Required Environment Variables:
 * - RESEND_API_KEY: Resend API key for email sending
 * - TWILIO_ACCOUNT_SID: Twilio account SID for SMS
 * - TWILIO_AUTH_TOKEN: Twilio auth token for SMS
 * - TWILIO_PHONE_NUMBER: Twilio phone number for sending SMS
 * - FORM_BASE_URL: Base URL for form completion (e.g., https://app.mango.com)
 * - SUPABASE_URL: Supabase project URL (auto-provided)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (auto-provided)
 *
 * Deploy: supabase functions deploy send-form
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface SendFormRequest {
  clientId: string;
  formTemplateId: string;
  deliveryMethod: 'email' | 'sms';
  appointmentId?: string;
  storeId: string;
}

interface SendFormResponse {
  success: boolean;
  delivery?: {
    id: string;
    token: string;
    formLink: string;
    expiresAt: string;
    deliveryStatus: string;
    messageId?: string;
  };
  error?: string;
}

interface FormTemplate {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  expiration_hours: number;
  is_active: boolean;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

interface Store {
  id: string;
  name: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== EMAIL TEMPLATE ====================

function generateFormEmailHtml(data: {
  clientName: string;
  formName: string;
  formDescription?: string;
  storeName: string;
  formLink: string;
  expiresAt: string;
}): string {
  const { clientName, formName, formDescription, storeName, formLink, expiresAt } = data;
  const expiresDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Form - ${storeName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a5f4a, #2d7a5f); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">
                📋 ${formName}
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${storeName}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 16px 0; color: #333; font-size: 16px;">
                Hi ${clientName},
              </p>
              <p style="margin: 0 0 16px 0; color: #555; font-size: 15px; line-height: 1.6;">
                ${storeName} has sent you a form to complete${formDescription ? ': ' + formDescription : '.'}
              </p>
              <p style="margin: 0 0 24px 0; color: #555; font-size: 15px; line-height: 1.6;">
                Please complete this form at your earliest convenience. The link will expire on <strong>${expiresDate}</strong>.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${formLink}" style="display: inline-block; background: linear-gradient(135deg, #1a5f4a, #2d7a5f); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(26, 95, 74, 0.3);">
                Complete Form
              </a>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #f9f9f9; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin: 0; color: #1a5f4a; font-size: 12px; word-break: break-all;">
                  ${formLink}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 24px 30px; border-top: 1px solid #eee;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      This link expires on ${expiresDate}.
                    </p>
                    <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">
                      If you didn't expect this form, please contact ${storeName}.
                    </p>
                    <p style="margin: 16px 0 0 0; color: #bbb; font-size: 11px;">
                      Powered by Mango POS
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ==================== EMAIL SENDING ====================

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!RESEND_API_KEY) {
    console.error('[send-form] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mango Forms <forms@mango.com>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-form] Resend error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[send-form] Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// ==================== SMS SENDING ====================

async function sendSms(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
  const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
  const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('[send-form] Twilio credentials not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    // Format phone number (ensure it has country code)
    const formattedPhone = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-form] Twilio error:', data);
      return { success: false, error: data.message || 'Failed to send SMS' };
    }

    return { success: true, messageId: data.sid };
  } catch (error) {
    console.error('[send-form] SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

// ==================== MAIN HANDLER ====================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: SendFormRequest = await req.json();
    const { clientId, formTemplateId, deliveryMethod, appointmentId, storeId } = body;

    // Validate required fields
    if (!clientId || !formTemplateId || !deliveryMethod || !storeId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: clientId, formTemplateId, deliveryMethod, storeId',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate delivery method
    if (deliveryMethod !== 'email' && deliveryMethod !== 'sms') {
      return new Response(JSON.stringify({ error: 'Invalid delivery method. Must be "email" or "sms"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch form template
    const { data: formTemplate, error: templateError } = await supabase
      .from('form_templates')
      .select('id, store_id, name, description, expiration_hours, is_active')
      .eq('id', formTemplateId)
      .eq('store_id', storeId)
      .single();

    if (templateError || !formTemplate) {
      console.error('[send-form] Form template not found:', templateError);
      return new Response(JSON.stringify({ error: 'Form template not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!formTemplate.is_active) {
      return new Response(JSON.stringify({ error: 'Form template is not active' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      console.error('[send-form] Client not found:', clientError);
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate client has required contact info for delivery method
    if (deliveryMethod === 'email' && !client.email) {
      return new Response(JSON.stringify({ error: 'Client does not have an email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (deliveryMethod === 'sms' && !client.phone) {
      return new Response(JSON.stringify({ error: 'Client does not have a phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch store name
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('[send-form] Store not found:', storeError);
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate token (UUID) and calculate expiration
    const token = crypto.randomUUID();
    const expirationHours = formTemplate.expiration_hours || 24;
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

    // Build form link
    const formBaseUrl = Deno.env.get('FORM_BASE_URL') || 'https://app.mango.com';
    const formLink = `${formBaseUrl}/forms/complete/${token}`;

    // Create form_delivery record
    const { data: delivery, error: deliveryError } = await supabase
      .from('form_deliveries')
      .insert({
        store_id: storeId,
        form_template_id: formTemplateId,
        client_id: clientId,
        appointment_id: appointmentId || null,
        delivery_method: deliveryMethod,
        token,
        delivery_email: deliveryMethod === 'email' ? client.email : null,
        delivery_phone: deliveryMethod === 'sms' ? client.phone : null,
        expires_at: expiresAt,
        delivery_status: 'pending',
      })
      .select()
      .single();

    if (deliveryError || !delivery) {
      console.error('[send-form] Failed to create delivery record:', deliveryError);
      return new Response(JSON.stringify({ error: 'Failed to create delivery record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send the form via selected method
    const clientName = `${client.first_name} ${client.last_name}`.trim() || 'Valued Customer';
    let sendResult: { success: boolean; messageId?: string; error?: string };

    if (deliveryMethod === 'email') {
      const html = generateFormEmailHtml({
        clientName,
        formName: formTemplate.name,
        formDescription: formTemplate.description,
        storeName: store.name,
        formLink,
        expiresAt,
      });
      const subject = `📋 ${store.name} - Please complete: ${formTemplate.name}`;
      sendResult = await sendEmail(client.email!, subject, html);
    } else {
      // SMS message (keep it short)
      const smsMessage = `${store.name}: Please complete your ${formTemplate.name}. Click here: ${formLink} (Expires in ${expirationHours}h)`;
      sendResult = await sendSms(client.phone!, smsMessage);
    }

    // Update delivery record with send result
    const updateData: Record<string, unknown> = {
      delivery_status: sendResult.success ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
    };

    if (sendResult.messageId) {
      updateData.message_id = sendResult.messageId;
    }

    if (!sendResult.success && sendResult.error) {
      updateData.delivery_error = sendResult.error;
    }

    const { error: updateError } = await supabase
      .from('form_deliveries')
      .update(updateData)
      .eq('id', delivery.id);

    if (updateError) {
      console.error('[send-form] Failed to update delivery record:', updateError);
    }

    // Return response
    if (!sendResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: sendResult.error || 'Failed to send form',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response: SendFormResponse = {
      success: true,
      delivery: {
        id: delivery.id,
        token,
        formLink,
        expiresAt,
        deliveryStatus: 'sent',
        messageId: sendResult.messageId,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[send-form] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
