/**
 * Generate Form PDF Edge Function
 *
 * Generates a PDF document from a completed form submission.
 * Uploads to Supabase Storage and returns a public URL for download.
 *
 * Required Environment Variables:
 * - SUPABASE_URL: Supabase project URL (auto-provided)
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (auto-provided)
 *
 * Deploy: supabase functions deploy generate-form-pdf
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from 'https://esm.sh/pdf-lib@1.17.1';

// ==================== TYPES ====================

interface GeneratePdfRequest {
  formSubmissionId: string;
  storeId: string;
}

interface GeneratePdfResponse {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  sections: FormSection[];
}

interface FormSection {
  id: string;
  type: string;
  label: string;
  description?: string;
  required: boolean;
  config?: Record<string, unknown>;
}

interface FormSubmission {
  id: string;
  store_id: string;
  form_template_id: string;
  client_id: string;
  responses: Record<string, unknown>;
  signature_image?: string;
  signature_type?: 'draw' | 'type';
  signature_typed_name?: string;
  status: string;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
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

// ==================== HELPERS ====================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not provided';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// ==================== PDF GENERATION ====================

interface PdfContext {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  y: number;
  margin: number;
  maxWidth: number;
  lineHeight: number;
  pageHeight: number;
}

function createNewPage(ctx: PdfContext): void {
  ctx.page = ctx.doc.addPage([612, 792]); // US Letter
  ctx.y = ctx.pageHeight - ctx.margin;
}

function checkPageSpace(ctx: PdfContext, neededHeight: number): void {
  if (ctx.y - neededHeight < ctx.margin) {
    createNewPage(ctx);
  }
}

function drawText(
  ctx: PdfContext,
  text: string,
  options: {
    font?: PDFFont;
    size?: number;
    color?: { r: number; g: number; b: number };
    indent?: number;
  } = {}
): void {
  const { font = ctx.font, size = 12, color = { r: 0, g: 0, b: 0 }, indent = 0 } = options;

  // Word wrap
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];
  const effectiveWidth = ctx.maxWidth - indent;

  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > effectiveWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    lines.push(line);
  }

  for (const l of lines) {
    checkPageSpace(ctx, ctx.lineHeight);
    ctx.page.drawText(l, {
      x: ctx.margin + indent,
      y: ctx.y,
      size,
      font,
      color: rgb(color.r, color.g, color.b),
    });
    ctx.y -= ctx.lineHeight;
  }
}

function drawSectionHeader(ctx: PdfContext, title: string): void {
  checkPageSpace(ctx, ctx.lineHeight * 2);
  ctx.y -= 10; // Extra spacing before section

  // Draw background
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: ctx.y - 5,
    width: ctx.maxWidth,
    height: ctx.lineHeight + 5,
    color: rgb(0.1, 0.37, 0.29), // Mango green
  });

  ctx.page.drawText(title, {
    x: ctx.margin + 10,
    y: ctx.y,
    size: 14,
    font: ctx.boldFont,
    color: rgb(1, 1, 1),
  });

  ctx.y -= ctx.lineHeight + 15;
}

function drawLabelValue(ctx: PdfContext, label: string, value: string): void {
  checkPageSpace(ctx, ctx.lineHeight * 2);

  // Label
  ctx.page.drawText(label + ':', {
    x: ctx.margin,
    y: ctx.y,
    size: 11,
    font: ctx.boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  ctx.y -= ctx.lineHeight;

  // Value (with word wrap)
  drawText(ctx, value || 'Not provided', {
    size: 12,
    indent: 10,
  });

  ctx.y -= 5; // Extra spacing
}

async function generateFormPdf(
  template: FormTemplate,
  submission: FormSubmission,
  client: Client,
  store: Store
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const ctx: PdfContext = {
    doc,
    page: doc.addPage([612, 792]), // US Letter
    font,
    boldFont,
    y: 0,
    margin: 50,
    maxWidth: 612 - 100, // Page width - margins
    lineHeight: 18,
    pageHeight: 792,
  };

  ctx.y = ctx.pageHeight - ctx.margin;

  // ===== HEADER =====
  ctx.page.drawText(store.name, {
    x: ctx.margin,
    y: ctx.y,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.37, 0.29),
  });
  ctx.y -= 30;

  ctx.page.drawText(template.name, {
    x: ctx.margin,
    y: ctx.y,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  ctx.y -= 25;

  if (template.description) {
    drawText(ctx, template.description, {
      size: 11,
      color: { r: 0.4, g: 0.4, b: 0.4 },
    });
    ctx.y -= 10;
  }

  // Draw separator line
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y },
    end: { x: ctx.margin + ctx.maxWidth, y: ctx.y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  ctx.y -= 20;

  // ===== CLIENT INFORMATION =====
  drawSectionHeader(ctx, 'Client Information');

  const clientName = `${client.first_name} ${client.last_name}`.trim();
  drawLabelValue(ctx, 'Name', clientName);
  if (client.email) {
    drawLabelValue(ctx, 'Email', client.email);
  }
  if (client.phone) {
    drawLabelValue(ctx, 'Phone', client.phone);
  }

  // ===== FORM RESPONSES =====
  drawSectionHeader(ctx, 'Form Responses');

  for (const section of template.sections) {
    // Skip info_text sections (display only)
    if (section.type === 'info_text') {
      continue;
    }

    const value = submission.responses[section.id];
    drawLabelValue(ctx, section.label, formatValue(value));
  }

  // ===== SIGNATURE =====
  if (submission.signature_image || submission.signature_typed_name) {
    drawSectionHeader(ctx, 'Signature');

    if (submission.signature_type === 'type' && submission.signature_typed_name) {
      // Typed signature
      checkPageSpace(ctx, 40);
      ctx.page.drawText(submission.signature_typed_name, {
        x: ctx.margin + 10,
        y: ctx.y,
        size: 18,
        font: await doc.embedFont(StandardFonts.TimesRomanItalic),
        color: rgb(0, 0, 0),
      });
      ctx.y -= 25;
      drawText(ctx, '(Typed Signature)', {
        size: 10,
        color: { r: 0.5, g: 0.5, b: 0.5 },
        indent: 10,
      });
    } else if (submission.signature_image) {
      // Drawn signature (base64 image)
      try {
        // Extract base64 data
        const base64Data = submission.signature_image.replace(/^data:image\/\w+;base64,/, '');
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        // Try to embed as PNG first, then as JPEG
        let image;
        try {
          image = await doc.embedPng(imageBytes);
        } catch {
          image = await doc.embedJpg(imageBytes);
        }

        // Scale to fit
        const maxWidth = 200;
        const maxHeight = 60;
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = image.width * scale;
        const height = image.height * scale;

        checkPageSpace(ctx, height + 30);

        ctx.page.drawImage(image, {
          x: ctx.margin + 10,
          y: ctx.y - height,
          width,
          height,
        });
        ctx.y -= height + 20;
      } catch (error) {
        console.error('[generate-form-pdf] Failed to embed signature image:', error);
        drawText(ctx, '[Signature image could not be rendered]', {
          size: 10,
          color: { r: 0.5, g: 0.5, b: 0.5 },
        });
      }
    }
  }

  // ===== SUBMISSION METADATA =====
  drawSectionHeader(ctx, 'Submission Details');

  drawLabelValue(ctx, 'Submission ID', submission.id);
  drawLabelValue(ctx, 'Status', submission.status.toUpperCase());
  if (submission.completed_at) {
    drawLabelValue(ctx, 'Completed At', formatDate(submission.completed_at));
  }
  drawLabelValue(ctx, 'Submitted At', formatDate(submission.created_at));

  // ===== FOOTER (on each page) =====
  const pages = doc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const footerText = `Generated by ${store.name} via Mango POS | Page ${i + 1} of ${pages.length}`;
    const footerWidth = font.widthOfTextAtSize(footerText, 9);

    page.drawText(footerText, {
      x: (612 - footerWidth) / 2,
      y: 30,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  return await doc.save();
}

// ==================== MAIN HANDLER ====================

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
    const body: GeneratePdfRequest = await req.json();
    const { formSubmissionId, storeId } = body;

    // Validate required fields
    if (!formSubmissionId || !storeId) {
      return jsonResponse({ error: 'formSubmissionId and storeId are required' }, 400);
    }

    const supabase = getSupabaseClient();

    // 1. Fetch form submission
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('id', formSubmissionId)
      .eq('store_id', storeId)
      .single();

    if (submissionError || !submission) {
      console.error('[generate-form-pdf] Submission not found:', submissionError);
      return jsonResponse({ error: 'Form submission not found' }, 404);
    }

    // 2. Fetch form template
    const { data: template, error: templateError } = await supabase
      .from('form_templates')
      .select('id, name, description, sections')
      .eq('id', submission.form_template_id)
      .single();

    if (templateError || !template) {
      console.error('[generate-form-pdf] Template not found:', templateError);
      return jsonResponse({ error: 'Form template not found' }, 404);
    }

    // 3. Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone')
      .eq('id', submission.client_id)
      .single();

    if (clientError || !client) {
      console.error('[generate-form-pdf] Client not found:', clientError);
      return jsonResponse({ error: 'Client not found' }, 404);
    }

    // 4. Fetch store
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      console.error('[generate-form-pdf] Store not found:', storeError);
      return jsonResponse({ error: 'Store not found' }, 404);
    }

    // 5. Generate PDF
    console.log(`[generate-form-pdf] Generating PDF for submission ${formSubmissionId}`);
    const pdfBytes = await generateFormPdf(template, submission, client, store);

    // 6. Upload to Supabase Storage
    const fileName = `form_${formSubmissionId}_${Date.now()}.pdf`;
    const filePath = `${storeId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('form-submissions')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[generate-form-pdf] Upload error:', uploadError);
      return jsonResponse({ error: 'Failed to upload PDF' }, 500);
    }

    // 7. Get public URL
    const { data: urlData } = supabase.storage.from('form-submissions').getPublicUrl(filePath);

    const response: GeneratePdfResponse = {
      success: true,
      pdfUrl: urlData.publicUrl,
    };

    console.log(`[generate-form-pdf] PDF generated and uploaded: ${urlData.publicUrl}`);

    return jsonResponse(response);
  } catch (error) {
    console.error('[generate-form-pdf] Error:', error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate PDF',
      },
      500
    );
  }
});
