/**
 * Connect Settings Category
 * Mango Connect SDK integration settings for Conversations, AI Assistant, and Campaigns
 */

import { useMemo } from 'react';
import {
  Link2,
  MessageSquare,
  Bot,
  Megaphone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useConnectConfig } from '@/hooks/useConnectConfig';
import { useConnectSDK } from '@/hooks/useConnectSDK';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
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

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'loading';

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const config = {
    connected: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Connected' },
    disconnected: { icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Disconnected' },
    error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Error' },
    loading: { icon: Loader2, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Connecting...' },
  };
  const { icon: Icon, color, bg, label } = config[status];

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', bg, color)}>
      <Icon className={cn('w-3 h-3', status === 'loading' && 'animate-spin')} />
      {label}
    </span>
  );
}

function FeatureToggle({
  icon,
  title,
  description,
  enabled,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg border',
      disabled ? 'bg-gray-50 opacity-60' : 'bg-white'
    )}>
      <div className="flex items-center gap-3">
        <span className={cn('text-gray-400', !disabled && enabled && 'text-amber-600')}>
          {icon}
        </span>
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-label={`Toggle ${title}`}
      />
    </div>
  );
}

// =============================================================================
// FEATURE DISPLAY NAMES
// =============================================================================

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  conversations: 'Conversations',
  aiAssistant: 'AI Assistant',
  campaigns: 'Campaigns',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ConnectSettings() {
  const { toast } = useToast();
  const { config, loading: configLoading, updateConfig } = useConnectConfig();
  const { sdkModule, loading: sdkLoading, error: sdkError, isReady } = useConnectSDK();

  // Memoize connection status
  const connectionStatus = useMemo((): ConnectionStatus => {
    if (!config.enabled) return 'disconnected';
    if (sdkLoading || configLoading) return 'loading';
    if (sdkError) return 'error';
    if (sdkModule && isReady) return 'connected';
    if (sdkModule) return 'loading'; // SDK loaded but not ready yet
    return 'disconnected';
  }, [config.enabled, sdkLoading, configLoading, sdkError, sdkModule, isReady]);

  // Handle master toggle
  const handleEnableChange = async (enabled: boolean) => {
    try {
      await updateConfig({ enabled });
      toast({
        title: enabled ? 'Mango Connect enabled' : 'Mango Connect disabled',
        description: enabled
          ? 'The integration is now active.'
          : 'The integration has been disabled.',
      });
    } catch {
      toast({
        title: 'Failed to save',
        description: 'Could not update Connect settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle feature toggles
  const handleFeatureChange = async (feature: 'conversations' | 'aiAssistant' | 'campaigns', enabled: boolean) => {
    try {
      await updateConfig({
        features: {
          ...config.features,
          [feature]: enabled,
        },
      });
      const displayName = FEATURE_DISPLAY_NAMES[feature] || feature;
      toast({
        title: 'Settings saved',
        description: `${displayName} has been ${enabled ? 'enabled' : 'disabled'}.`,
      });
    } catch {
      toast({
        title: 'Failed to save',
        description: 'Could not update feature settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Integration Section */}
      <SettingsSection
        title="Mango Connect"
        icon={<Link2 className="w-5 h-5" />}
        action={<StatusBadge status={connectionStatus} />}
      >
        <div className="space-y-6">
          {/* Description */}
          <p className="text-sm text-gray-600">
            Mango Connect integrates messaging, AI assistance, and marketing campaigns directly into your POS.
            Enable the integration to access these features.
          </p>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-amber-50/50 border-amber-200">
            <div>
              <p className="font-medium text-gray-900">Enable Mango Connect</p>
              <p className="text-sm text-gray-500">
                Turn on to activate all Connect features
              </p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={handleEnableChange}
              aria-label="Enable Mango Connect"
            />
          </div>

          {/* Error Message */}
          {sdkError && config.enabled && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{sdkError}</p>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Features Section */}
      <SettingsSection
        title="Features"
        icon={<Bot className="w-5 h-5" />}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Choose which Connect features to enable for your store.
            {!config.enabled && ' Enable Mango Connect above to configure features.'}
          </p>

          <FeatureToggle
            icon={<MessageSquare className="w-5 h-5" />}
            title="Conversations"
            description="Two-way messaging with clients via SMS and email"
            enabled={config.features.conversations}
            disabled={!config.enabled}
            onChange={(enabled) => handleFeatureChange('conversations', enabled)}
          />

          <FeatureToggle
            icon={<Bot className="w-5 h-5" />}
            title="AI Assistant"
            description="AI-powered assistant for staff support and automation"
            enabled={config.features.aiAssistant}
            disabled={!config.enabled}
            onChange={(enabled) => handleFeatureChange('aiAssistant', enabled)}
          />

          <FeatureToggle
            icon={<Megaphone className="w-5 h-5" />}
            title="Campaigns"
            description="Marketing campaigns and automated client outreach"
            enabled={config.features.campaigns}
            disabled={!config.enabled}
            onChange={(enabled) => handleFeatureChange('campaigns', enabled)}
          />
        </div>
      </SettingsSection>
    </div>
  );
}

export default ConnectSettings;
