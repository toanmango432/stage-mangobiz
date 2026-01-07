/**
 * Email templates for various notifications
 */

interface EmailData {
  customerName: string;
  [key: string]: any;
}

const emailStyles = `
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #9b87f5 0%, #7E69AB 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
    .button { display: inline-block; background: #9b87f5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .info-box { background: #f9fafb; border-left: 4px solid #9b87f5; padding: 15px; margin: 20px 0; }
  </style>
`;

export const orderConfirmationEmail = (data: EmailData & {
  orderNumber: string;
  orderTotal: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; price: string }>;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <h2>Thank you for your order, ${data.customerName}!</h2>
          <p>Your order has been confirmed and will be processed shortly.</p>
          
          <div class="info-box">
            <strong>Order #${data.orderNumber}</strong><br>
            Date: ${data.orderDate}<br>
            Total: $${data.orderTotal}
          </div>

          <h3>Order Items:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${data.items.map(item => `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 0;">${item.name} (x${item.quantity})</td>
                <td style="text-align: right; padding: 10px 0;">$${item.price}</td>
              </tr>
            `).join('')}
          </table>

          <a href="{{ORDER_TRACKING_URL}}" class="button">Track Your Order</a>

          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>Mango Nail Salon<br>
          123 Main Street, Suite 100<br>
          Email: info@mangonailsalon.com | Phone: (555) 123-4567</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const bookingConfirmationEmail = (data: EmailData & {
  bookingDate: string;
  bookingTime: string;
  serviceName: string;
  staffName: string;
  duration: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.customerName}!</h2>
          <p>Your appointment has been confirmed. We look forward to seeing you!</p>
          
          <div class="info-box">
            <strong>Appointment Details</strong><br>
            Service: ${data.serviceName}<br>
            Date: ${data.bookingDate}<br>
            Time: ${data.bookingTime}<br>
            Duration: ${data.duration}<br>
            Stylist: ${data.staffName}
          </div>

          <a href="{{ADD_TO_CALENDAR_URL}}" class="button">Add to Calendar</a>

          <h3>Before Your Appointment:</h3>
          <ul>
            <li>Please arrive 5 minutes early</li>
            <li>Remove any nail polish before arrival</li>
            <li>Cancel at least 24 hours in advance to avoid fees</li>
          </ul>

          <p>Need to reschedule? <a href="{{RESCHEDULE_URL}}">Click here</a></p>
        </div>
        <div class="footer">
          <p>Mango Nail Salon<br>
          123 Main Street, Suite 100<br>
          Email: info@mangonailsalon.com | Phone: (555) 123-4567</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const giftCardEmail = (data: EmailData & {
  giftCardCode: string;
  amount: string;
  senderName: string;
  message?: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎁 You've Received a Gift Card!</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.customerName}!</h2>
          <p>${data.senderName} has sent you a gift card for Mango Nail Salon!</p>
          
          ${data.message ? `
            <div class="info-box">
              <strong>Personal Message:</strong><br>
              "${data.message}"
            </div>
          ` : ''}

          <div style="text-align: center; padding: 30px; background: #f9fafb; margin: 20px 0; border-radius: 8px;">
            <h2 style="margin: 0; color: #9b87f5;">$${data.amount}</h2>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Gift Card Value</p>
            <div style="background: white; padding: 15px; margin-top: 20px; border: 2px dashed #9b87f5; border-radius: 6px;">
              <strong style="font-size: 24px; letter-spacing: 2px;">${data.giftCardCode}</strong>
            </div>
          </div>

          <a href="{{REDEEM_URL}}" class="button">Redeem Now</a>

          <p style="font-size: 14px; color: #6b7280;">
            This gift card can be used for any service or product at Mango Nail Salon.
          </p>
        </div>
        <div class="footer">
          <p>Mango Nail Salon<br>
          123 Main Street, Suite 100<br>
          Email: info@mangonailsalon.com | Phone: (555) 123-4567</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const membershipWelcomeEmail = (data: EmailData & {
  membershipTier: string;
  benefits: string[];
  activationDate: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${data.membershipTier}!</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${data.customerName}!</h2>
          <p>Your ${data.membershipTier} membership is now active as of ${data.activationDate}.</p>
          
          <div class="info-box">
            <strong>Your Membership Benefits:</strong>
            <ul style="margin: 10px 0 0 0;">
              ${data.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
            </ul>
          </div>

          <a href="{{MEMBER_PORTAL_URL}}" class="button">View Member Dashboard</a>

          <h3>What's Next?</h3>
          <ul>
            <li>Book your first appointment with member pricing</li>
            <li>Browse exclusive member products</li>
            <li>Invite friends and earn rewards</li>
          </ul>
        </div>
        <div class="footer">
          <p>Mango Nail Salon<br>
          123 Main Street, Suite 100<br>
          Email: info@mangonailsalon.com | Phone: (555) 123-4567</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const appointmentReminderEmail = (data: EmailData & {
  bookingDate: string;
  bookingTime: string;
  serviceName: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${emailStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Reminder</h1>
        </div>
        <div class="content">
          <h2>Hi ${data.customerName}!</h2>
          <p>This is a friendly reminder about your upcoming appointment.</p>
          
          <div class="info-box">
            <strong>Tomorrow's Appointment</strong><br>
            Service: ${data.serviceName}<br>
            Date: ${data.bookingDate}<br>
            Time: ${data.bookingTime}
          </div>

          <p>We look forward to seeing you!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="{{CONFIRM_URL}}" class="button">Confirm Appointment</a>
            <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
              Need to reschedule? <a href="{{RESCHEDULE_URL}}">Click here</a>
            </p>
          </div>
        </div>
        <div class="footer">
          <p>Mango Nail Salon<br>
          123 Main Street, Suite 100<br>
          Email: info@mangonailsalon.com | Phone: (555) 123-4567</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
