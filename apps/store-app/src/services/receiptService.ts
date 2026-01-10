import { supabase } from '@/services/supabase/client';
import type { Ticket, Client } from '@/types';

export interface ReceiptService {
  id: string;
  name: string;
  price: number;
  staffName?: string;
}

export interface ReceiptClient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface ReceiptData {
  transactionId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  date: Date;
  client?: ReceiptClient;
  services: ReceiptService[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  tipAmount?: number;
  paymentMethod?: string;
  amountPaid?: number;
  changeDue?: number;
  pointsRedeemed?: number;
  pointsDiscount?: number;
  couponCode?: string;
  couponDiscount?: number;
}

export interface BusinessInfo {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
}

/**
 * Generate receipt data from a ticket and client information.
 */
export function generateReceiptData(
  ticket: Partial<Ticket>,
  businessInfo: BusinessInfo,
  client?: Partial<Client>
): ReceiptData {
  const services: ReceiptService[] = (ticket.services || []).map((s) => ({
    id: s.id || '',
    name: s.name || s.serviceName || 'Service',
    price: s.price || 0,
    staffName: s.staffName,
  }));

  return {
    transactionId: ticket.id || `TXN-${Date.now().toString().slice(-8)}`,
    businessName: businessInfo.businessName || 'Mango Spa & Salon',
    businessAddress: businessInfo.businessAddress || '',
    businessPhone: businessInfo.businessPhone || '',
    date: new Date(),
    client: client
      ? {
          id: client.id || '',
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          email: client.email,
          phone: client.phone,
        }
      : undefined,
    services,
    subtotal: ticket.subtotal || 0,
    discount: ticket.discount,
    tax: ticket.tax || 0,
    total: ticket.total || 0,
    tipAmount: ticket.tip,
    paymentMethod: ticket.paymentMethod,
  };
}

/**
 * Format receipt data as plain text for printing or SMS.
 */
export function formatReceiptText(data: ReceiptData): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(40));
  lines.push(data.businessName.toUpperCase());
  if (data.businessAddress) lines.push(data.businessAddress);
  if (data.businessPhone) lines.push(data.businessPhone);
  lines.push('='.repeat(40));

  // Date and transaction info
  lines.push('');
  lines.push(`Date: ${data.date.toLocaleDateString()}`);
  lines.push(`Time: ${data.date.toLocaleTimeString()}`);
  lines.push(`Transaction: ${data.transactionId}`);

  // Client info
  if (data.client) {
    lines.push(`Client: ${data.client.firstName} ${data.client.lastName}`);
  }

  lines.push('');
  lines.push('-'.repeat(40));

  // Services
  for (const service of data.services) {
    const name = service.name.substring(0, 28);
    const price = `$${service.price.toFixed(2)}`;
    lines.push(`${name.padEnd(30)}${price.padStart(10)}`);
    if (service.staffName) {
      lines.push(`  (${service.staffName})`);
    }
  }

  lines.push('-'.repeat(40));

  // Totals
  lines.push(`${'Subtotal'.padEnd(30)}$${data.subtotal.toFixed(2).padStart(9)}`);

  if (data.discount && data.discount > 0) {
    lines.push(`${'Discount'.padEnd(30)}-$${data.discount.toFixed(2).padStart(8)}`);
  }

  if (data.pointsDiscount && data.pointsDiscount > 0) {
    lines.push(`${'Points Discount'.padEnd(30)}-$${data.pointsDiscount.toFixed(2).padStart(8)}`);
  }

  if (data.couponDiscount && data.couponDiscount > 0) {
    lines.push(`${'Coupon'.padEnd(30)}-$${data.couponDiscount.toFixed(2).padStart(8)}`);
  }

  lines.push(`${'Tax'.padEnd(30)}$${data.tax.toFixed(2).padStart(9)}`);

  if (data.tipAmount && data.tipAmount > 0) {
    lines.push(`${'Tip'.padEnd(30)}$${data.tipAmount.toFixed(2).padStart(9)}`);
  }

  lines.push('='.repeat(40));

  const grandTotal = data.total + (data.tipAmount || 0);
  lines.push(`${'TOTAL'.padEnd(30)}$${grandTotal.toFixed(2).padStart(9)}`);

  lines.push('='.repeat(40));

  // Payment info
  if (data.paymentMethod) {
    lines.push(`Payment: ${data.paymentMethod}`);
  }
  if (data.amountPaid !== undefined) {
    lines.push(`Paid: $${data.amountPaid.toFixed(2)}`);
  }
  if (data.changeDue !== undefined && data.changeDue > 0) {
    lines.push(`Change: $${data.changeDue.toFixed(2)}`);
  }

  // Footer
  lines.push('');
  lines.push('Thank you for your visit!');
  lines.push('');

  return lines.join('\n');
}

/**
 * Send receipt via email using Supabase Edge Function.
 */
export async function sendReceiptEmail(
  data: ReceiptData,
  email?: string
): Promise<void> {
  const toEmail = email || data.client?.email;

  if (!toEmail) {
    throw new Error('Email address is required');
  }

  const { error } = await supabase.functions.invoke('send-receipt-email', {
    body: {
      to: toEmail,
      subject: `Receipt from ${data.businessName}`,
      receiptData: data,
    },
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send receipt summary via SMS using Supabase Edge Function.
 */
export async function sendReceiptSMS(
  data: ReceiptData,
  phone?: string
): Promise<void> {
  const toPhone = phone || data.client?.phone;

  if (!toPhone) {
    throw new Error('Phone number is required');
  }

  const grandTotal = data.total + (data.tipAmount || 0);
  const message = `Thank you for visiting ${data.businessName}! Your total was $${grandTotal.toFixed(2)}. Transaction: ${data.transactionId}`;

  const { error } = await supabase.functions.invoke('send-receipt-sms', {
    body: {
      to: toPhone,
      message,
    },
  });

  if (error) {
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Print receipt using browser print dialog.
 * Creates an invisible iframe with formatted receipt HTML.
 */
export function printReceipt(data: ReceiptData): void {
  const printContent = generatePrintHTML(data);

  // Create hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(printContent);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }

  // Clean up after print
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}

/**
 * Generate HTML for printing.
 */
function generatePrintHTML(data: ReceiptData): string {
  const servicesHTML = data.services
    .map(
      (s) => `
    <tr>
      <td>${s.name}${s.staffName ? `<br><small>(${s.staffName})</small>` : ''}</td>
      <td style="text-align: right;">$${s.price.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const grandTotal = data.total + (data.tipAmount || 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          margin: 0 auto;
          padding: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
        }
        .header h1 {
          font-size: 16px;
          margin: 0;
        }
        .header p {
          margin: 2px 0;
          font-size: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        td {
          padding: 3px 0;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .total {
          font-weight: bold;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.businessName}</h1>
        ${data.businessAddress ? `<p>${data.businessAddress}</p>` : ''}
        ${data.businessPhone ? `<p>${data.businessPhone}</p>` : ''}
      </div>

      <p>Date: ${data.date.toLocaleDateString()} ${data.date.toLocaleTimeString()}</p>
      <p>Receipt #: ${data.transactionId}</p>
      ${data.client ? `<p>Client: ${data.client.firstName} ${data.client.lastName}</p>` : ''}

      <div class="divider"></div>

      <table>
        ${servicesHTML}
      </table>

      <div class="divider"></div>

      <table>
        <tr>
          <td>Subtotal</td>
          <td style="text-align: right;">$${data.subtotal.toFixed(2)}</td>
        </tr>
        ${data.discount ? `<tr><td>Discount</td><td style="text-align: right;">-$${data.discount.toFixed(2)}</td></tr>` : ''}
        <tr>
          <td>Tax</td>
          <td style="text-align: right;">$${data.tax.toFixed(2)}</td>
        </tr>
        ${data.tipAmount ? `<tr><td>Tip</td><td style="text-align: right;">$${data.tipAmount.toFixed(2)}</td></tr>` : ''}
        <tr class="total">
          <td>TOTAL</td>
          <td style="text-align: right;">$${grandTotal.toFixed(2)}</td>
        </tr>
      </table>

      <div class="divider"></div>

      ${data.paymentMethod ? `<p>Payment: ${data.paymentMethod}</p>` : ''}

      <div class="footer">
        <p>Thank you for visiting!</p>
        <p>We appreciate your business.</p>
      </div>
    </body>
    </html>
  `;
}

export default {
  generateReceiptData,
  formatReceiptText,
  sendReceiptEmail,
  sendReceiptSMS,
  printReceipt,
};
