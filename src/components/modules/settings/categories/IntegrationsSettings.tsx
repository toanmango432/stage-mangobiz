/**
 * Integrations Settings Category
 * Third-party connections: Calendar, Accounting, Payments, Marketing, etc.
 */

import { useState } from 'react';
import { 
  Plug,
  Calendar,
  DollarSign,
  Mail,
  MessageSquare,
  Share2,
  Webhook,
  Key,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Settings,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import type { 
  IntegrationProvider, 
  IntegrationStatus,
  WebhookEventType 
} from '@/types/integration';
import { cn } from '@/lib/utils';

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SettingsSection({ 
  title, 
  icon, 
  children,
  action
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-amber-600">{icon}</span>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const config = {
    connected: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Connected' },
    disconnected: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Not Connected' },
    error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Error' },
    pending: { icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' },
  };
  const { icon: Icon, color, bg, label } = config[status];
  
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', bg, color)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// =============================================================================
// INTEGRATION DATA
// =============================================================================

interface IntegrationItem {
  id: string;
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: 'calendar' | 'accounting' | 'payment' | 'marketing' | 'communication';
  icon: React.ReactNode;
  status: IntegrationStatus;
  lastSync?: string;
  popular?: boolean;
}

const INTEGRATIONS: IntegrationItem[] = [
  // Calendar
  {
    id: 'google-calendar',
    provider: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync appointments with Google Calendar',
    category: 'calendar',
    icon: <Calendar className="w-5 h-5" />,
    status: 'disconnected',
    popular: true,
  },
  {
    id: 'google-reserve',
    provider: 'google-reserve',
    name: 'Reserve with Google',
    description: 'Accept bookings directly from Google Search',
    category: 'calendar',
    icon: <Calendar className="w-5 h-5" />,
    status: 'disconnected',
  },
  // Accounting
  {
    id: 'quickbooks',
    provider: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync transactions and invoices',
    category: 'accounting',
    icon: <DollarSign className="w-5 h-5" />,
    status: 'disconnected',
    popular: true,
  },
  {
    id: 'xero',
    provider: 'xero',
    name: 'Xero',
    description: 'Accounting and invoicing sync',
    category: 'accounting',
    icon: <DollarSign className="w-5 h-5" />,
    status: 'disconnected',
  },
  // Payment
  {
    id: 'stripe',
    provider: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscriptions',
    category: 'payment',
    icon: <DollarSign className="w-5 h-5" />,
    status: 'connected',
    lastSync: new Date().toISOString(),
    popular: true,
  },
  {
    id: 'square',
    provider: 'square',
    name: 'Square',
    description: 'Payment processing',
    category: 'payment',
    icon: <DollarSign className="w-5 h-5" />,
    status: 'disconnected',
  },
  // Marketing
  {
    id: 'mailchimp',
    provider: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing campaigns',
    category: 'marketing',
    icon: <Mail className="w-5 h-5" />,
    status: 'disconnected',
    popular: true,
  },
  {
    id: 'instagram',
    provider: 'instagram',
    name: 'Instagram',
    description: 'Social media booking link',
    category: 'marketing',
    icon: <Share2 className="w-5 h-5" />,
    status: 'disconnected',
  },
  {
    id: 'facebook',
    provider: 'facebook',
    name: 'Facebook',
    description: 'Social media integration',
    category: 'marketing',
    icon: <Share2 className="w-5 h-5" />,
    status: 'disconnected',
  },
  // Communication
  {
    id: 'twilio',
    provider: 'twilio',
    name: 'Twilio',
    description: 'SMS notifications and reminders',
    category: 'communication',
    icon: <MessageSquare className="w-5 h-5" />,
    status: 'connected',
    lastSync: new Date(Date.now() - 3600000).toISOString(),
    popular: true,
  },
  {
    id: 'sendgrid',
    provider: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional email delivery',
    category: 'communication',
    icon: <Mail className="w-5 h-5" />,
    status: 'disconnected',
  },
];

const WEBHOOK_EVENTS: { type: WebhookEventType; label: string; description: string }[] = [
  { type: 'appointment.created', label: 'Appointment Created', description: 'When a new appointment is booked' },
  { type: 'appointment.updated', label: 'Appointment Updated', description: 'When an appointment is modified' },
  { type: 'appointment.cancelled', label: 'Appointment Cancelled', description: 'When an appointment is cancelled' },
  { type: 'appointment.completed', label: 'Appointment Completed', description: 'When an appointment is marked complete' },
  { type: 'transaction.completed', label: 'Transaction Completed', description: 'When a payment is processed' },
  { type: 'client.created', label: 'Client Created', description: 'When a new client is added' },
  { type: 'client.updated', label: 'Client Updated', description: 'When client info is modified' },
];

// Mock API keys
const MOCK_API_KEYS = [
  { id: '1', name: 'Production Key', prefix: 'mango_live_abc...', createdAt: '2024-01-15', lastUsed: '2024-12-28' },
  { id: '2', name: 'Development Key', prefix: 'mango_test_xyz...', createdAt: '2024-06-01', lastUsed: '2024-12-20' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function IntegrationsSettings() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  const categories = [
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'accounting', label: 'Accounting', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'payment', label: 'Payment', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'marketing', label: 'Marketing', icon: <Mail className="w-4 h-4" /> },
    { id: 'communication', label: 'Communication', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const filteredIntegrations = selectedCategory 
    ? INTEGRATIONS.filter(i => i.category === selectedCategory)
    : INTEGRATIONS;

  const connectedCount = INTEGRATIONS.filter(i => i.status === 'connected').length;

  const handleConnect = (integration: IntegrationItem) => {
    // In production, this would initiate OAuth flow or show config modal
    console.log('Connect:', integration.provider);
    alert(`Connect to ${integration.name} - OAuth flow would start here`);
  };

  const handleDisconnect = (integration: IntegrationItem) => {
    if (confirm(`Disconnect from ${integration.name}?`)) {
      console.log('Disconnect:', integration.provider);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Overview */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
            <p className="text-sm text-gray-600 mt-1">
              Connect third-party services to extend your POS capabilities
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-600">{connectedCount}</p>
            <p className="text-sm text-gray-500">Connected</p>
          </div>
        </div>
      </div>

      {/* Third-Party Integrations */}
      <SettingsSection 
        title="Connected Services" 
        icon={<Plug className="w-5 h-5" />}
      >
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              !selectedCategory 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                selectedCategory === cat.id 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Integration List */}
        <div className="space-y-3">
          {filteredIntegrations.map((integration) => (
            <div 
              key={integration.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  integration.status === 'connected' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                )}>
                  {integration.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{integration.name}</p>
                    {integration.popular && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                  {integration.lastSync && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last sync: {formatDate(integration.lastSync)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={integration.status} />
                {integration.status === 'connected' ? (
                  <div className="flex items-center gap-1">
                    <button
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDisconnect(integration)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(integration)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
                  >
                    Connect
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Webhooks */}
      <SettingsSection 
        title="Webhooks" 
        icon={<Webhook className="w-5 h-5" />}
        action={
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Receive real-time notifications when events occur in your store.
        </p>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Available Events</p>
          <div className="grid grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map((event) => (
              <div key={event.type} className="text-sm">
                <span className="font-mono text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center py-6 text-gray-500">
          <Webhook className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="font-medium">No webhooks configured</p>
          <p className="text-sm">Add a webhook to receive event notifications</p>
        </div>
      </SettingsSection>

      {/* API Keys */}
      <SettingsSection 
        title="API Keys" 
        icon={<Key className="w-5 h-5" />}
        action={
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          API keys for programmatic access to your store data.
        </p>

        <div className="space-y-3">
          {MOCK_API_KEYS.map((key) => (
            <div 
              key={key.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div>
                <p className="font-medium text-gray-900">{key.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm font-mono bg-gray-200 px-2 py-0.5 rounded">
                    {showApiKey === key.id ? 'mango_live_abcdefghijklmnop' : key.prefix}
                  </code>
                  <button
                    onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {showApiKey === key.id ? (
                      <EyeOff className="w-3 h-3 text-gray-500" />
                    ) : (
                      <Eye className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded">
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Created {formatDate(key.createdAt)} • Last used {formatDate(key.lastUsed)}
                </p>
              </div>
              <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800">
            <strong>Security:</strong> Keep your API keys secret. Never expose them in client-side code.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}

export default IntegrationsSettings;
