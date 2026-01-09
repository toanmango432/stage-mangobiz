/**
 * Send Gift Card Email Edge Function
 *
 * Sends beautifully designed gift card emails to recipients.
 * Uses Resend for email delivery.
 *
 * Required Environment Variables:
 * - RESEND_API_KEY: Resend API key for email sending
 * - SUPABASE_URL: Supabase project URL (auto-provided)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (auto-provided)
 *
 * Deploy: supabase functions deploy send-gift-card-email
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==================== TYPES ====================

interface GiftCardEmailRequest {
  giftCardId: string;
  code: string;
  amount: number;
  recipientName?: string;
  recipientEmail: string;
  senderName?: string;
  message?: string;
  storeName: string;
  storeId: string;
  designTemplate?: string;
  scheduledFor?: string; // ISO date string for scheduled delivery
}

interface GiftCardEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  scheduledFor?: string;
}

// ==================== CORS HEADERS ====================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ==================== EMAIL TEMPLATE ====================

function generateGiftCardEmailHtml(data: GiftCardEmailRequest): string {
  const {
    code,
    amount,
    recipientName,
    senderName,
    message,
    storeName,
    designTemplate = 'default',
  } = data;

  // Design template colors
  const designs: Record<string, { primary: string; secondary: string; accent: string }> = {
    default: { primary: '#1a5f4a', secondary: '#d4a853', accent: '#faf9f7' },
    birthday: { primary: '#e91e63', secondary: '#ffc107', accent: '#fff8e1' },
    holiday: { primary: '#c62828', secondary: '#2e7d32', accent: '#f1f8e9' },
    thankyou: { primary: '#6a1b9a', secondary: '#f06292', accent: '#fce4ec' },
    celebration: { primary: '#1565c0', secondary: '#ffd54f', accent: '#e3f2fd' },
  };

  const colors = designs[designTemplate] || designs.default;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift Card from ${storeName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: ${colors.accent}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary}); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🎁 You've Received a Gift Card!
              </h1>
              ${senderName ? `<p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">From ${senderName}</p>` : ''}
            </td>
          </tr>

          <!-- Gift Card Visual -->
          <tr>
            <td style="padding: 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, ${colors.primary} 0%, ${adjustColor(colors.primary, 20)} 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);">
                <tr>
                  <td style="padding: 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                          ${storeName}
                        </td>
                        <td style="text-align: right;">
                          <span style="color: ${colors.secondary}; font-size: 14px;">Gift Card</span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 20px 0;">
                          <div style="color: white; font-size: 48px; font-weight: 700;">
                            $${amount.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 12px 16px;">
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 4px;">Gift Card Code</div>
                            <div style="color: white; font-size: 20px; font-family: 'Courier New', monospace; letter-spacing: 2px; font-weight: 600;">
                              ${code}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${message ? `
          <!-- Personal Message -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: white; border-radius: 12px; padding: 24px; border-left: 4px solid ${colors.secondary};">
                <div style="color: #666; font-size: 14px; margin-bottom: 8px;">Personal Message</div>
                <div style="color: #333; font-size: 16px; line-height: 1.6; font-style: italic;">
                  "${message}"
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 20px 30px; text-align: center;">
              <p style="margin: 0; color: #333; font-size: 18px;">
                ${recipientName ? `Dear ${recipientName},` : 'Hello!'}
              </p>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                You've received a gift card worth <strong style="color: ${colors.primary};">$${amount.toFixed(2)}</strong> to spend at ${storeName}.
                Present this code at checkout to redeem your gift.
              </p>
            </td>
          </tr>

          <!-- How to Use -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: white; border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 16px 0; color: ${colors.primary}; font-size: 16px;">How to Use Your Gift Card</h3>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: ${colors.secondary}; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">1</span>
                    </td>
                    <td style="padding: 8px 0 8px 12px; color: #555; font-size: 14px;">
                      Visit ${storeName} in person or book online
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: ${colors.secondary}; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">2</span>
                    </td>
                    <td style="padding: 8px 0 8px 12px; color: #555; font-size: 14px;">
                      At checkout, select "Gift Card" as your payment method
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; vertical-align: top;">
                      <span style="display: inline-block; width: 24px; height: 24px; background-color: ${colors.secondary}; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: 600;">3</span>
                    </td>
                    <td style="padding: 8px 0 8px 12px; color: #555; font-size: 14px;">
                      Enter your code: <strong style="font-family: 'Courier New', monospace;">${code}</strong>
                    </td>
                  </tr>
                </table>
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
                      This gift card does not expire. No cash value.
                    </p>
                    <p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">
                      Questions? Contact ${storeName} directly.
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

// Helper to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

// ==================== EMAIL SENDING ====================

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

  if (!RESEND_API_KEY) {
    console.error('[send-gift-card-email] RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Mango Gift Cards <giftcards@mango.com>',
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[send-gift-card-email] Resend error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('[send-gift-card-email] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
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
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: GiftCardEmailRequest = await req.json();
    const {
      giftCardId,
      code,
      amount,
      recipientEmail,
      storeName,
      storeId,
      scheduledFor,
    } = body;

    // Validate required fields
    if (!giftCardId || !code || !amount || !recipientEmail || !storeName || !storeId) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: giftCardId, code, amount, recipientEmail, storeName, storeId',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle scheduled delivery
    if (scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      const now = new Date();

      if (scheduledDate > now) {
        // Store in Supabase for scheduled delivery (pg_cron will handle it)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        // Update gift card with scheduled delivery time
        const { error: updateError } = await supabase
          .from('gift_cards')
          .update({
            delivery_scheduled_at: scheduledFor,
            email_status: 'scheduled',
          })
          .eq('id', giftCardId)
          .eq('store_id', storeId);

        if (updateError) {
          console.error('[send-gift-card-email] Failed to schedule:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to schedule email delivery' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const response: GiftCardEmailResponse = {
          success: true,
          scheduledFor,
        };

        return new Response(
          JSON.stringify(response),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate email HTML
    const html = generateGiftCardEmailHtml(body);
    const subject = `🎁 You've received a $${amount.toFixed(2)} gift card from ${storeName}!`;

    // Send email
    const sendResult = await sendEmail(recipientEmail, subject, html);

    if (!sendResult.success) {
      return new Response(
        JSON.stringify({ success: false, error: sendResult.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update gift card email status in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await supabase
      .from('gift_cards')
      .update({
        email_sent_at: new Date().toISOString(),
        email_status: 'sent',
        email_message_id: sendResult.messageId,
      })
      .eq('id', giftCardId)
      .eq('store_id', storeId);

    const response: GiftCardEmailResponse = {
      success: true,
      messageId: sendResult.messageId,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-gift-card-email] Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
