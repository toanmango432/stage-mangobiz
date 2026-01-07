// Email Notification Templates
import type { Notification } from '@/types/notification';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateGenerator {
  private static baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
      .button:hover { background: #7c3aed; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      .highlight { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; }
      .divider { height: 1px; background: #e5e7eb; margin: 20px 0; }
    </style>
  `;

  static generateBookingConfirmation(bookingData: {
    clientName: string;
    serviceName: string;
    date: string;
    time: string;
    duration: string;
    price: number;
    location: string;
    bookingId: string;
  }): EmailTemplate {
    const subject = `Booking Confirmed - ${bookingData.serviceName} on ${bookingData.date}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        ${this.baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Your appointment is all set</p>
          </div>
          
          <div class="content">
            <h2>Hello ${bookingData.clientName}!</h2>
            <p>We're excited to confirm your appointment with us. Here are the details:</p>
            
            <div class="highlight">
              <h3>📅 Appointment Details</h3>
              <p><strong>Service:</strong> ${bookingData.serviceName}</p>
              <p><strong>Date:</strong> ${bookingData.date}</p>
              <p><strong>Time:</strong> ${bookingData.time}</p>
              <p><strong>Duration:</strong> ${bookingData.duration}</p>
              <p><strong>Price:</strong> $${bookingData.price.toFixed(2)}</p>
              <p><strong>Location:</strong> ${bookingData.location}</p>
              <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
            </div>
            
            <p>We can't wait to see you! If you need to make any changes, please contact us at least 24 hours in advance.</p>
            
            <div style="text-align: center;">
              <a href="/bookings/${bookingData.bookingId}" class="button">View Booking Details</a>
            </div>
            
            <div class="divider"></div>
            
            <h3>📝 What to Expect</h3>
            <ul>
              <li>Please arrive 10 minutes early</li>
              <li>Bring a valid ID</li>
              <li>Wear comfortable clothing</li>
              <li>Let us know of any allergies or concerns</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Mango Salon!</p>
            <p>Questions? Contact us at <a href="mailto:info@mangosalon.com">info@mangosalon.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Booking Confirmed - ${bookingData.serviceName}

Hello ${bookingData.clientName}!

We're excited to confirm your appointment with us. Here are the details:

Service: ${bookingData.serviceName}
Date: ${bookingData.date}
Time: ${bookingData.time}
Duration: ${bookingData.duration}
Price: $${bookingData.price.toFixed(2)}
Location: ${bookingData.location}
Booking ID: ${bookingData.bookingId}

We can't wait to see you! If you need to make any changes, please contact us at least 24 hours in advance.

View your booking: /bookings/${bookingData.bookingId}

What to Expect:
- Please arrive 10 minutes early
- Bring a valid ID
- Wear comfortable clothing
- Let us know of any allergies or concerns

Thank you for choosing Mango Salon!
Questions? Contact us at info@mangosalon.com
    `;

    return { subject, html, text };
  }

  static generateOrderConfirmation(orderData: {
    clientName: string;
    orderId: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    shippingAddress: string;
    estimatedDelivery: string;
  }): EmailTemplate {
    const subject = `Order Confirmed - #${orderData.orderId}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        ${this.baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Order Confirmed!</h1>
            <p>Your order is being processed</p>
          </div>
          
          <div class="content">
            <h2>Hello ${orderData.clientName}!</h2>
            <p>Thank you for your order! We're getting everything ready for you.</p>
            
            <div class="highlight">
              <h3>📋 Order Details</h3>
              <p><strong>Order ID:</strong> #${orderData.orderId}</p>
              <p><strong>Total:</strong> $${orderData.total.toFixed(2)}</p>
              <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
            </div>
            
            <h3>🛍️ Items Ordered</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map(item => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f3f4f6;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f3f4f6;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f3f4f6;">$${item.price.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="highlight">
              <h3>🚚 Shipping Address</h3>
              <p>${orderData.shippingAddress}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="/orders/${orderData.orderId}" class="button">Track Your Order</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for shopping with Mango Salon!</p>
            <p>Questions? Contact us at <a href="mailto:orders@mangosalon.com">orders@mangosalon.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Order Confirmed - #${orderData.orderId}

Hello ${orderData.clientName}!

Thank you for your order! We're getting everything ready for you.

Order Details:
Order ID: #${orderData.orderId}
Total: $${orderData.total.toFixed(2)}
Estimated Delivery: ${orderData.estimatedDelivery}

Items Ordered:
${orderData.items.map(item => `${item.name} x${item.quantity} - $${item.price.toFixed(2)}`).join('\n')}

Shipping Address:
${orderData.shippingAddress}

Track your order: /orders/${orderData.orderId}

Thank you for shopping with Mango Salon!
Questions? Contact us at orders@mangosalon.com
    `;

    return { subject, html, text };
  }

  static generatePromotionNotification(promotionData: {
    clientName: string;
    title: string;
    description: string;
    discount: string;
    code: string;
    expiresAt: string;
    promotionId: string;
  }): EmailTemplate {
    const subject = `🎉 Special Offer: ${promotionData.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        ${this.baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Special Offer!</h1>
            <p>Don't miss out on this amazing deal</p>
          </div>
          
          <div class="content">
            <h2>Hello ${promotionData.clientName}!</h2>
            <p>We have an exclusive offer just for you:</p>
            
            <div class="highlight" style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 2px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">${promotionData.title}</h3>
              <p style="color: #92400e; font-size: 18px; margin: 10px 0;">${promotionData.description}</p>
              <p style="color: #92400e; font-size: 24px; font-weight: bold; margin: 15px 0;">${promotionData.discount} OFF!</p>
              <p style="color: #92400e; font-size: 16px; font-weight: 600;">Use code: <span style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${promotionData.code}</span></p>
              <p style="color: #92400e; font-size: 14px;">Expires: ${promotionData.expiresAt}</p>
            </div>
            
            <p>This offer is only available for a limited time, so don't wait!</p>
            
            <div style="text-align: center;">
              <a href="/promotions/${promotionData.promotionId}" class="button">Shop Now & Save</a>
            </div>
            
            <div class="divider"></div>
            
            <h3>✨ Why Choose Mango Salon?</h3>
            <ul>
              <li>Premium quality products</li>
              <li>Expert beauty professionals</li>
              <li>Fast and reliable shipping</li>
              <li>100% satisfaction guarantee</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Thank you for being a valued customer!</p>
            <p>Questions? Contact us at <a href="mailto:info@mangosalon.com">info@mangosalon.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Special Offer: ${promotionData.title}

Hello ${promotionData.clientName}!

We have an exclusive offer just for you:

${promotionData.title}
${promotionData.description}
${promotionData.discount} OFF!
Use code: ${promotionData.code}
Expires: ${promotionData.expiresAt}

This offer is only available for a limited time, so don't wait!

Shop now: /promotions/${promotionData.promotionId}

Why Choose Mango Salon?
- Premium quality products
- Expert beauty professionals
- Fast and reliable shipping
- 100% satisfaction guarantee

Thank you for being a valued customer!
Questions? Contact us at info@mangosalon.com
    `;

    return { subject, html, text };
  }

  static generateAnnouncementNotification(announcementData: {
    clientName: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    announcementId: string;
  }): EmailTemplate {
    const priorityEmojis = {
      low: '📢',
      medium: '🔔',
      high: '🚨'
    };

    const priorityColors = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#ef4444'
    };

    const subject = `${priorityEmojis[announcementData.priority]} ${announcementData.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        ${this.baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, ${priorityColors[announcementData.priority]}, ${priorityColors[announcementData.priority]}dd);">
            <h1>${priorityEmojis[announcementData.priority]} Important Update</h1>
            <p>Please read this important information</p>
          </div>
          
          <div class="content">
            <h2>Hello ${announcementData.clientName}!</h2>
            
            <div class="highlight" style="border-left: 4px solid ${priorityColors[announcementData.priority]};">
              <h3 style="color: ${priorityColors[announcementData.priority]}; margin-top: 0;">${announcementData.title}</h3>
              <p style="white-space: pre-line;">${announcementData.message}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="/announcements/${announcementData.announcementId}" class="button">Read Full Announcement</a>
            </div>
            
            <div class="divider"></div>
            
            <p>We appreciate your understanding and continued support. If you have any questions about this announcement, please don't hesitate to contact us.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for being part of the Mango Salon community!</p>
            <p>Questions? Contact us at <a href="mailto:info@mangosalon.com">info@mangosalon.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${announcementData.title}

Hello ${announcementData.clientName}!

${announcementData.title}

${announcementData.message}

Read full announcement: /announcements/${announcementData.announcementId}

We appreciate your understanding and continued support. If you have any questions about this announcement, please don't hesitate to contact us.

Thank you for being part of the Mango Salon community!
Questions? Contact us at info@mangosalon.com
    `;

    return { subject, html, text };
  }

  // Generic template for any notification
  static generateGeneric(notification: Notification): EmailTemplate {
    const subject = notification.title;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        ${this.baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          
          <div class="content">
            <p>${notification.message}</p>
            
            ${notification.actionUrl ? `
              <div style="text-align: center;">
                <a href="${notification.actionUrl}" class="button">${notification.actionLabel || 'Learn More'}</a>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Mango Salon!</p>
            <p>Questions? Contact us at <a href="mailto:info@mangosalon.com">info@mangosalon.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${notification.title}

${notification.message}

${notification.actionUrl ? `${notification.actionLabel || 'Learn More'}: ${notification.actionUrl}` : ''}

Thank you for choosing Mango Salon!
Questions? Contact us at info@mangosalon.com
    `;

    return { subject, html, text };
  }
}