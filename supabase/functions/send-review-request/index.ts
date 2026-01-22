/**
 * Send Review Request Edge Function
 *
 * Sends review requests to clients after appointments via email or SMS.
 * Creates a review_request record to track delivery and completion.
 *
 * Required Environment Variables:
 * - RESEND_API_KEY: Resend API key for email sending
 * - TWILIO_ACCOUNT_SID: Twilio account SID for SMS
 * - TWILIO_AUTH_TOKEN: Twilio auth token for SMS
 * - TWILIO_PHONE_NUMBER: Twilio phone number for sending SMS
 * - SUPABASE_URL: Supabase project URL (auto-provided)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (auto-provided)
 *
 * Deploy: supabase functions deploy send-review-request
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface SendReviewRequestInput {
  clientId: string;
  appointmentId?: string;
  storeId: string;
  deliveryMethod?: 'email' | 'sms'; // Auto-detect if not specified
}

interface SendReviewResponse {
  success: boolean;
  reviewRequest?: {
    id: string;
    status: string;
    sentVia: string;
    sentAt: string;
  };
  error?: string;
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

interface ReviewSettings {
  id: string;
  store_id: string;
  enabled: boolean;
  delay_hours: number;
  reminder_days?: number;
  platforms: Record<string, string>; // { google: "url", yelp: "url", etc. }
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== EMAIL TEMPLATE ====================

function generateReviewEmailHtml(data: {
  clientName: string;
  storeName: string;
  platforms: Record<string, string>;
}): string {
  const { clientName, storeName, platforms } = data;

  // Generate platform buttons
  const platformButtons = Object.entries(platforms).map(([platform, url]) => {
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const colors: Record<string, string> = {
      google: '#4285F4',
      yelp: '#D32323',
      facebook: '#1877F2',
    };
    const color = colors[platform.toLowerCase()] || '#1a5f4a';

    return `
      <tr>
        <td style="padding: 8px 30px;">
          <a href="${url}" style="display: block; background: ${color}; color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; text-align: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);">
            Leave a Review on ${platformName}
          </a>
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We'd Love Your Feedback - ${storeName}</title>
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
                ⭐ We'd Love Your Feedback
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
                Thank you for visiting ${storeName}! We hope you had a wonderful experience with us.
              </p>
              <p style="margin: 0 0 24px 0; color: #555; font-size: 15px; line-height: 1.6;">
                Your feedback helps us improve and lets others know what to expect. Would you mind taking a moment to leave us a review?
              </p>
            </td>
          </tr>

          <!-- CTA Buttons -->
          ${platformButtons}

          <!-- Thank You -->
          <tr>
            <td style="padding: 24px 30px;">
              <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6; text-align: center;">
                Your honest feedback means the world to us. Thank you for being a valued client!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 24px 30px; border-top: 1px solid #eee;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: #999; font-size: 12px;">
                      If you have any concerns, please contact us directly at ${storeName}.
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
    console.error('[send-review-request] RESEND_API_KEY not configured');
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
        from: 'Mango Reviews <reviews@mango.com>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-review-request] Resend error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[send-review-request] Email send error:', error);
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
    console.error('[send-review-request] Twilio credentials not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    // Encode credentials for Basic Auth
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-review-request] Twilio error:', data);
      return { success: false, error: data.message || 'Failed to send SMS' };
    }

    return { success: true, messageId: data.sid };
  } catch (error) {
    console.error('[send-review-request] SMS send error:', error);
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
    const body: SendReviewRequestInput = await req.json();
    const { clientId, appointmentId, storeId, deliveryMethod } = body;

    // Validate required fields
    if (!clientId || !storeId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: clientId, storeId',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch review settings
    const { data: settings, error: settingsError } = await supabase
      .from('review_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();

    if (settingsError || !settings) {
      console.error('[send-review-request] Review settings not found:', settingsError);
      return new Response(JSON.stringify({ error: 'Review settings not configured' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!settings.enabled) {
      return new Response(JSON.stringify({ error: 'Review automation is not enabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if platforms are configured
    const platforms = settings.platforms as Record<string, string>;
    if (!platforms || Object.keys(platforms).length === 0) {
      return new Response(JSON.stringify({ error: 'No review platforms configured' }), {
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
      console.error('[send-review-request] Client not found:', clientError);
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine delivery method (auto-detect if not specified)
    let finalDeliveryMethod = deliveryMethod;
    if (!finalDeliveryMethod) {
      // Prefer email if available, fallback to SMS
      if (client.email) {
        finalDeliveryMethod = 'email';
      } else if (client.phone) {
        finalDeliveryMethod = 'sms';
      } else {
        return new Response(
          JSON.stringify({ error: 'Client has no email or phone number' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate client has required contact info
    if (finalDeliveryMethod === 'email' && !client.email) {
      return new Response(JSON.stringify({ error: 'Client does not have an email address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (finalDeliveryMethod === 'sms' && !client.phone) {
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
      console.error('[send-review-request] Store not found:', storeError);
      return new Response(JSON.stringify({ error: 'Store not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create review_request record
    const { data: reviewRequest, error: requestError } = await supabase
      .from('review_requests')
      .insert({
        client_id: clientId,
        appointment_id: appointmentId || null,
        store_id: storeId,
        status: 'pending',
        sent_via: finalDeliveryMethod,
      })
      .select()
      .single();

    if (requestError || !reviewRequest) {
      console.error('[send-review-request] Failed to create review request:', requestError);
      return new Response(JSON.stringify({ error: 'Failed to create review request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send review request
    const clientName = `${client.first_name} ${client.last_name}`;
    let sendResult: { success: boolean; messageId?: string; error?: string };

    if (finalDeliveryMethod === 'email') {
      const emailHtml = generateReviewEmailHtml({
        clientName,
        storeName: store.name,
        platforms,
      });
      const subject = `We'd love your feedback - ${store.name}`;
      sendResult = await sendEmail(client.email!, subject, emailHtml);
    } else {
      // SMS
      const platformLinks = Object.entries(platforms)
        .map(([platform, url]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}`)
        .join('\n');
      const smsMessage = `Hi ${clientName}! Thank you for visiting ${store.name}. We'd love your feedback:\n\n${platformLinks}\n\nYour review helps us improve!`;
      sendResult = await sendSms(client.phone!, smsMessage);
    }

    // Update review_request with send result
    const updateData: Record<string, unknown> = {
      sent_at: new Date().toISOString(),
    };

    if (sendResult.success) {
      updateData.status = 'sent';
    } else {
      updateData.status = 'pending'; // Keep as pending if send failed
    }

    const { error: updateError } = await supabase
      .from('review_requests')
      .update(updateData)
      .eq('id', reviewRequest.id);

    if (updateError) {
      console.error('[send-review-request] Failed to update review request:', updateError);
    }

    // Return response
    if (!sendResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: sendResult.error || 'Failed to send review request',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response: SendReviewResponse = {
      success: true,
      reviewRequest: {
        id: reviewRequest.id,
        status: 'sent',
        sentVia: finalDeliveryMethod,
        sentAt: updateData.sent_at as string,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[send-review-request] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
