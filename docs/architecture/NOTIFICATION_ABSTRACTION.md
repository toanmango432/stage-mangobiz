# Notification Abstraction Layer

> Provider pattern for SMS/Email with future Mango AI integration

---

## Overview

Mango POS uses an **abstraction layer** for all notifications (SMS, Email, Push). This allows:

- **Current**: Direct integration with Twilio (SMS) and SendGrid (Email)
- **Future**: Seamless switch to Mango AI for intelligent communications

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MANGO POS                                          │
│                                                                              │
│   ┌─────────────┐     ┌─────────────────────────────────────────────────┐   │
│   │ Appointment │────►│           NotificationService                   │   │
│   │  Reminder   │     │                                                 │   │
│   └─────────────┘     │   ┌─────────────────────────────────────────┐   │   │
│                       │   │        NotificationProvider             │   │   │
│   ┌─────────────┐     │   │            (Interface)                  │   │   │
│   │   Booking   │────►│   └───────────────┬───────────────┬─────────┘   │   │
│   │ Confirmation│     │                   │               │             │   │
│   └─────────────┘     │                   ▼               ▼             │   │
│                       │   ┌───────────────────┐   ┌─────────────────┐   │   │
│   ┌─────────────┐     │   │  DirectProvider   │   │ MangoAIProvider │   │   │
│   │  Marketing  │────►│   │  (Twilio/SendGrid)│   │    (Future)     │   │   │
│   │  Campaign   │     │   └─────────┬─────────┘   └────────┬────────┘   │   │
│   └─────────────┘     │             │                      │            │   │
│                       └─────────────┼──────────────────────┼────────────┘   │
│                                     │                      │                │
└─────────────────────────────────────┼──────────────────────┼────────────────┘
                                      │                      │
                                      ▼                      ▼
                              ┌───────────────┐      ┌───────────────┐
                              │    Twilio     │      │   Mango AI    │
                              │   SendGrid    │      │    (API)      │
                              └───────────────┘      └───────────────┘
```

---

## Provider Interface

```typescript
// packages/notifications/src/types.ts

interface NotificationRequest {
  type: 'sms' | 'email' | 'push';
  recipient: {
    id: string;           // Client or staff ID
    phone?: string;
    email?: string;
    pushToken?: string;
  };
  template: string;       // Template name
  data: Record<string, unknown>;  // Template variables
  metadata?: {
    salonId: string;
    priority?: 'high' | 'normal' | 'low';
    scheduledFor?: Date;
    campaignId?: string;
  };
}

interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
  cost?: number;
}

interface NotificationProvider {
  name: string;

  send(request: NotificationRequest): Promise<NotificationResult>;
  sendBulk(requests: NotificationRequest[]): Promise<NotificationResult[]>;

  getStatus(messageId: string): Promise<MessageStatus>;
  cancelScheduled(messageId: string): Promise<boolean>;
}

type MessageStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'cancelled';
```

---

## Direct Provider (Current)

Uses Twilio for SMS and SendGrid for Email directly:

```typescript
// packages/notifications/src/providers/DirectProvider.ts

import twilio from 'twilio';
import sgMail from '@sendgrid/mail';

export class DirectProvider implements NotificationProvider {
  name = 'direct';

  private twilioClient: twilio.Twilio;
  private templates: Map<string, Template>;

  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    this.templates = loadTemplates();
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      const message = this.renderTemplate(request.template, request.data);

      if (request.type === 'sms') {
        const result = await this.twilioClient.messages.create({
          body: message,
          to: request.recipient.phone!,
          from: process.env.TWILIO_PHONE_NUMBER
        });

        return {
          success: true,
          messageId: result.sid,
          provider: 'twilio',
          cost: parseFloat(result.price || '0')
        };
      }

      if (request.type === 'email') {
        const result = await sgMail.send({
          to: request.recipient.email!,
          from: process.env.SENDGRID_FROM_EMAIL!,
          subject: this.getSubject(request.template, request.data),
          html: message
        });

        return {
          success: true,
          messageId: result[0].headers['x-message-id'],
          provider: 'sendgrid'
        };
      }

      throw new Error(`Unsupported type: ${request.type}`);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.name
      };
    }
  }

  async sendBulk(requests: NotificationRequest[]): Promise<NotificationResult[]> {
    // Process in batches of 100
    const results: NotificationResult[] = [];
    const batchSize = 100;

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(req => this.send(req))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private renderTemplate(name: string, data: Record<string, unknown>): string {
    const template = this.templates.get(name);
    if (!template) throw new Error(`Template not found: ${name}`);

    return template.render(data);
  }
}
```

---

## Mango AI Provider (Future)

When Mango AI is ready, switch providers:

```typescript
// packages/notifications/src/providers/MangoAIProvider.ts

export class MangoAIProvider implements NotificationProvider {
  name = 'mango-ai';

  private apiClient: MangoAIClient;

  constructor() {
    this.apiClient = new MangoAIClient({
      apiKey: process.env.MANGO_AI_API_KEY,
      baseUrl: process.env.MANGO_AI_URL
    });
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    // Mango AI handles:
    // - Template selection based on context
    // - Personalization using client history
    // - Optimal send time calculation
    // - A/B testing
    // - Multi-channel orchestration

    const result = await this.apiClient.notifications.send({
      salonId: request.metadata?.salonId,
      recipientId: request.recipient.id,
      intent: request.template,  // AI determines best template
      context: request.data,
      channels: [request.type]
    });

    return {
      success: result.status === 'accepted',
      messageId: result.id,
      provider: 'mango-ai'
    };
  }

  async sendBulk(requests: NotificationRequest[]): Promise<NotificationResult[]> {
    // Mango AI optimizes bulk sends:
    // - Batches by carrier for SMS
    // - Optimizes send times per recipient
    // - Handles rate limiting automatically

    const result = await this.apiClient.notifications.sendBulk({
      salonId: requests[0].metadata?.salonId,
      messages: requests.map(req => ({
        recipientId: req.recipient.id,
        intent: req.template,
        context: req.data,
        channels: [req.type]
      }))
    });

    return result.messages.map(msg => ({
      success: msg.status === 'accepted',
      messageId: msg.id,
      provider: 'mango-ai'
    }));
  }
}
```

---

## Notification Service

Main service that uses the configured provider:

```typescript
// packages/notifications/src/NotificationService.ts

export class NotificationService {
  private provider: NotificationProvider;

  constructor() {
    // Select provider based on environment
    const providerName = process.env.NOTIFICATION_PROVIDER || 'direct';

    switch (providerName) {
      case 'mango-ai':
        this.provider = new MangoAIProvider();
        break;
      case 'direct':
      default:
        this.provider = new DirectProvider();
    }

    console.log(`Using notification provider: ${this.provider.name}`);
  }

  // Appointment reminder
  async sendAppointmentReminder(
    clientId: string,
    appointment: Appointment
  ): Promise<NotificationResult> {
    const client = await getClient(clientId);

    return this.provider.send({
      type: client.preferredContact === 'email' ? 'email' : 'sms',
      recipient: {
        id: clientId,
        phone: client.phone,
        email: client.email
      },
      template: 'appointment-reminder',
      data: {
        clientName: client.firstName,
        serviceName: appointment.serviceName,
        dateTime: formatDateTime(appointment.startTime),
        staffName: appointment.staffName,
        salonName: appointment.salonName,
        confirmUrl: `${BASE_URL}/confirm/${appointment.id}`,
        cancelUrl: `${BASE_URL}/cancel/${appointment.id}`
      },
      metadata: {
        salonId: appointment.salonId,
        priority: 'high'
      }
    });
  }

  // Booking confirmation
  async sendBookingConfirmation(
    clientId: string,
    booking: Booking
  ): Promise<NotificationResult> {
    const client = await getClient(clientId);

    return this.provider.send({
      type: 'sms', // Always SMS for confirmations
      recipient: {
        id: clientId,
        phone: client.phone
      },
      template: 'booking-confirmation',
      data: {
        clientName: client.firstName,
        serviceName: booking.serviceName,
        dateTime: formatDateTime(booking.startTime),
        staffName: booking.staffName
      },
      metadata: {
        salonId: booking.salonId,
        priority: 'high'
      }
    });
  }

  // Marketing campaign
  async sendCampaign(
    campaignId: string,
    recipients: CampaignRecipient[]
  ): Promise<CampaignResult> {
    const campaign = await getCampaign(campaignId);

    const requests: NotificationRequest[] = recipients.map(r => ({
      type: campaign.channel,
      recipient: {
        id: r.clientId,
        phone: r.phone,
        email: r.email
      },
      template: campaign.template,
      data: {
        clientName: r.firstName,
        ...campaign.data
      },
      metadata: {
        salonId: campaign.salonId,
        campaignId: campaign.id,
        priority: 'low'
      }
    }));

    const results = await this.provider.sendBulk(requests);

    return {
      campaignId,
      total: recipients.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
  }
}
```

---

## Templates

### SMS Templates

```typescript
// packages/notifications/src/templates/sms.ts

export const smsTemplates = {
  'appointment-reminder': `
Hi {{clientName}}! Reminder: Your {{serviceName}} appointment is tomorrow at {{dateTime}} with {{staffName}}. Reply C to confirm or R to reschedule.
  `.trim(),

  'booking-confirmation': `
Thanks for booking with us, {{clientName}}! Your {{serviceName}} is confirmed for {{dateTime}} with {{staffName}}. See you soon!
  `.trim(),

  'waitlist-available': `
Good news {{clientName}}! A spot opened up for {{serviceName}} on {{dateTime}}. Reply YES to book or this offer expires in 2 hours.
  `.trim()
};
```

### Email Templates

```typescript
// packages/notifications/src/templates/email.ts

export const emailTemplates = {
  'appointment-reminder': {
    subject: 'Reminder: Your appointment tomorrow',
    html: `
      <h1>Hi {{clientName}}!</h1>
      <p>This is a reminder for your upcoming appointment:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Date & Time:</strong> {{dateTime}}</p>
        <p><strong>With:</strong> {{staffName}}</p>
      </div>
      <p>
        <a href="{{confirmUrl}}" style="...">Confirm</a>
        <a href="{{cancelUrl}}" style="...">Cancel</a>
      </p>
    `
  }
};
```

---

## Environment Configuration

```bash
# .env

# Provider selection
NOTIFICATION_PROVIDER=direct  # 'direct' or 'mango-ai'

# Direct provider (Twilio + SendGrid)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@mangobiz.com

# Mango AI provider (future)
MANGO_AI_API_KEY=...
MANGO_AI_URL=https://api.mango-ai.com
```

---

## Migration Path

### Phase 1: Direct Provider (Current)

```
Mango POS → DirectProvider → Twilio/SendGrid
```

### Phase 2: Dual Mode (Testing)

```
Mango POS → NotificationService
             ├── 90% → DirectProvider
             └── 10% → MangoAIProvider (A/B test)
```

### Phase 3: Mango AI (Future)

```
Mango POS → MangoAIProvider → Mango AI
```

---

## Queue Integration

For bulk campaigns, use a job queue:

```typescript
// services/marketing-service/src/workers/campaignWorker.ts

import { Queue, Worker } from 'bullmq';

const campaignQueue = new Queue('campaigns', {
  connection: redis
});

const worker = new Worker('campaigns', async (job) => {
  const { campaignId, recipients } = job.data;

  const notificationService = new NotificationService();

  // Process in chunks to avoid rate limits
  const chunkSize = 100;
  for (let i = 0; i < recipients.length; i += chunkSize) {
    const chunk = recipients.slice(i, i + chunkSize);

    await notificationService.sendCampaign(campaignId, chunk);

    // Update progress
    await job.updateProgress((i + chunkSize) / recipients.length * 100);

    // Rate limit: 100 messages per second
    await sleep(1000);
  }
}, { connection: redis });
```

---

## Related Documentation

- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) - Overall architecture
- [Monorepo Architecture](./MONOREPO_ARCHITECTURE.md) - Package structure
- [Marketing PRD](../product/PRD-Marketing-Module.md) - Campaign requirements

---

*Last updated: January 2025*
