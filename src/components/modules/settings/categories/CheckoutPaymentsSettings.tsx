/**
 * Checkout & Payments Settings Category
 * Tips, Discounts, Service Charges, Rounding, Payment Methods, Terminals, Gateway, Hardware
 */

import { useSelector, useDispatch } from 'react-redux';
import { 
  CreditCard, 
  Percent, 
  DollarSign, 
  Smartphone, 
  Wallet,
  Calculator,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import type { AppDispatch } from '@/store';
import {
  selectCheckoutSettings,
  selectPaymentTerminals,
  selectHardwareDevices,
  updateTipSettings,
  updateTipDistribution,
  updateDiscountSettings,
  updateServiceChargeSettings,
  updateRoundingSettings,
  updatePaymentMethods,
  updatePaymentGateway,
  addPaymentTerminal,
  removePaymentTerminal,
  updateTerminalStatus,
} from '@/store/slices/settingsSlice';
import type { 
  TipCalculation, 
  TipDistributionMethod, 
  TipDefaultSelection,
  ServiceChargeApplyTo,
  RoundingMethod,
  TerminalType,
  GatewayProvider,
  GatewayApiMode,
} from '@/types/settings';
import { cn } from '@/lib/utils';

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SettingsSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <span className="text-amber-600">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function FormField({ 
  label, 
  children, 
  required = false,
  hint 
}: { 
  label: string; 
  children: React.ReactNode; 
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ 
  value, 
  onChange, 
  placeholder,
  type = 'text',
  min,
  max,
  step,
  ...props 
}: { 
  value: string | number; 
  onChange: (value: string) => void; 
  placeholder?: string;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
      {...props}
    />
  );
}

function Select<T extends string>({ 
  value, 
  onChange, 
  options 
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({ 
  checked, 
  onChange, 
  label 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label?: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-amber-500' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}

// =============================================================================
// OPTIONS
// =============================================================================

const TIP_CALCULATION_OPTIONS: { value: TipCalculation; label: string }[] = [
  { value: 'pre_tax', label: 'Pre-tax (before tax)' },
  { value: 'post_tax', label: 'Post-tax (after tax)' },
];

const TIP_DISTRIBUTION_OPTIONS: { value: TipDistributionMethod; label: string }[] = [
  { value: 'per_provider', label: 'Per Provider' },
  { value: 'split_evenly', label: 'Split Evenly' },
  { value: 'custom', label: 'Custom' },
];

const TIP_DEFAULT_OPTIONS: { value: TipDefaultSelection; label: string }[] = [
  { value: 'none', label: 'No default' },
  { value: 'tip1', label: 'First option' },
  { value: 'tip2', label: 'Second option' },
  { value: 'tip3', label: 'Third option' },
];

const SERVICE_CHARGE_APPLY_OPTIONS: { value: ServiceChargeApplyTo; label: string }[] = [
  { value: 'all', label: 'All items' },
  { value: 'services', label: 'Services only' },
  { value: 'products', label: 'Products only' },
];

const ROUNDING_METHOD_OPTIONS: { value: RoundingMethod; label: string }[] = [
  { value: 'nearest_005', label: 'Nearest $0.05' },
  { value: 'nearest_010', label: 'Nearest $0.10' },
  { value: 'up', label: 'Round up' },
  { value: 'down', label: 'Round down' },
];

const TERMINAL_TYPE_OPTIONS: { value: TerminalType; label: string }[] = [
  { value: 'stripe_s700', label: 'Stripe S700' },
  { value: 'wisepad_3', label: 'WisePad 3' },
  { value: 'fiserv_ttp', label: 'Fiserv TTP' },
  { value: 'square_reader', label: 'Square Reader' },
];

const GATEWAY_PROVIDER_OPTIONS: { value: GatewayProvider; label: string }[] = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'fiserv', label: 'Fiserv' },
  { value: 'square', label: 'Square' },
  { value: 'paypal', label: 'PayPal' },
];

const GATEWAY_MODE_OPTIONS: { value: GatewayApiMode; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: 'sandbox', label: 'Sandbox/Test' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CheckoutPaymentsSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const checkout = useSelector(selectCheckoutSettings);
  const terminals = useSelector(selectPaymentTerminals);
  // Hardware devices will be used in Phase 5
  useSelector(selectHardwareDevices);

  if (!checkout) {
    return <div className="text-gray-500">Loading checkout settings...</div>;
  }

  const { tips, tipDistribution, discounts, serviceCharge, rounding, paymentMethods, gateway } = checkout;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleTipChange = (field: string, value: boolean | string | number) => {
    dispatch(updateTipSettings({ [field]: value }));
  };

  const handleTipSuggestionChange = (index: number, value: string) => {
    const newSuggestions = [...tips.suggestions] as [number, number, number];
    newSuggestions[index] = parseFloat(value) || 0;
    dispatch(updateTipSettings({ suggestions: newSuggestions }));
  };

  const handleTipDistributionChange = (field: string, value: string | number | boolean) => {
    dispatch(updateTipDistribution({ [field]: value }));
  };

  const handleDiscountChange = (field: string, value: string | number | boolean) => {
    dispatch(updateDiscountSettings({ [field]: value }));
  };

  const handleServiceChargeChange = (field: string, value: string | number | boolean) => {
    dispatch(updateServiceChargeSettings({ [field]: value }));
  };

  const handleRoundingChange = (field: string, value: string | boolean) => {
    dispatch(updateRoundingSettings({ [field]: value }));
  };

  const handlePaymentMethodToggle = (method: string, enabled: boolean) => {
    dispatch(updatePaymentMethods({ [method]: enabled }));
  };

  const handleGatewayChange = (field: string, value: string) => {
    dispatch(updatePaymentGateway({ [field]: value }));
  };

  const handleAddTerminal = () => {
    dispatch(addPaymentTerminal({
      type: 'stripe_s700',
      name: `Terminal ${terminals.length + 1}`,
      connectionStatus: 'disconnected',
    }));
  };

  const handleRemoveTerminal = (terminalId: string) => {
    if (confirm('Are you sure you want to remove this terminal?')) {
      dispatch(removePaymentTerminal(terminalId));
    }
  };

  const handleTestTerminal = (terminalId: string) => {
    // Simulate testing connection
    dispatch(updateTerminalStatus({ id: terminalId, status: 'connected' }));
  };

  return (
    <div>
      {/* Tip Settings */}
      <SettingsSection title="Tip Settings" icon={<Percent className="w-5 h-5" />}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-medium text-gray-900">Enable Tips</p>
            <p className="text-sm text-gray-500">Show tip prompts during checkout</p>
          </div>
          <Toggle
            checked={tips.enabled}
            onChange={(checked) => handleTipChange('enabled', checked)}
          />
        </div>

        {tips.enabled && (
          <>
            <FormField label="Tip Calculation" hint="When to calculate tip percentage">
              <Select
                value={tips.calculation}
                onChange={(v) => handleTipChange('calculation', v)}
                options={TIP_CALCULATION_OPTIONS}
              />
            </FormField>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suggested Tip Percentages
              </label>
              <div className="grid grid-cols-3 gap-3">
                {tips.suggestions.map((suggestion, index) => (
                  <div key={index} className="relative">
                    <input
                      type="number"
                      value={suggestion}
                      onChange={(e) => handleTipSuggestionChange(index, e.target.value)}
                      min={0}
                      max={100}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                ))}
              </div>
            </div>

            <FormField label="Default Selection">
              <Select
                value={tips.defaultSelection}
                onChange={(v) => handleTipChange('defaultSelection', v)}
                options={TIP_DEFAULT_OPTIONS}
              />
            </FormField>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Allow Custom Tip</p>
                <p className="text-sm text-gray-500">Let customers enter custom amount</p>
              </div>
              <Toggle
                checked={tips.customAllowed}
                onChange={(checked) => handleTipChange('customAllowed', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Show "No Tip" Option</p>
                <p className="text-sm text-gray-500">Display button to skip tip</p>
              </div>
              <Toggle
                checked={tips.noTipOption}
                onChange={(checked) => handleTipChange('noTipOption', checked)}
              />
            </div>
          </>
        )}
      </SettingsSection>

      {/* Tip Distribution */}
      <SettingsSection title="Tip Distribution" icon={<Wallet className="w-5 h-5" />}>
        <FormField label="Distribution Method" hint="How tips are split among providers">
          <Select
            value={tipDistribution.method}
            onChange={(v) => handleTipDistributionChange('method', v)}
            options={TIP_DISTRIBUTION_OPTIONS}
          />
        </FormField>

        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Pool Tips</p>
            <p className="text-sm text-gray-500">Combine all tips for distribution</p>
          </div>
          <Toggle
            checked={tipDistribution.poolTips}
            onChange={(checked) => handleTipDistributionChange('poolTips', checked)}
          />
        </div>

        <FormField label="House Cut (%)" hint="Percentage retained by business">
          <Input
            type="number"
            value={tipDistribution.houseCut}
            onChange={(v) => handleTipDistributionChange('houseCut', parseFloat(v) || 0)}
            min={0}
            max={100}
            step={0.5}
          />
        </FormField>
      </SettingsSection>

      {/* Discount Settings */}
      <SettingsSection title="Discount Settings" icon={<DollarSign className="w-5 h-5" />}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-medium text-gray-900">Enable Discounts</p>
            <p className="text-sm text-gray-500">Allow discounts at checkout</p>
          </div>
          <Toggle
            checked={discounts.enabled}
            onChange={(checked) => handleDiscountChange('enabled', checked)}
          />
        </div>

        {discounts.enabled && (
          <>
            <FormField label="Maximum Discount (%)" hint="Limit how much can be discounted">
              <Input
                type="number"
                value={discounts.maxPercent}
                onChange={(v) => handleDiscountChange('maxPercent', parseFloat(v) || 0)}
                min={0}
                max={100}
              />
            </FormField>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Require Reason</p>
                <p className="text-sm text-gray-500">Staff must enter discount reason</p>
              </div>
              <Toggle
                checked={discounts.requireReason}
                onChange={(checked) => handleDiscountChange('requireReason', checked)}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Require Manager Approval</p>
                <p className="text-sm text-gray-500">Discounts over threshold need approval</p>
              </div>
              <Toggle
                checked={discounts.requireApproval}
                onChange={(checked) => handleDiscountChange('requireApproval', checked)}
              />
            </div>

            {discounts.requireApproval && (
              <FormField label="Approval Threshold (%)" hint="Discounts above this need approval">
                <Input
                  type="number"
                  value={discounts.approvalThreshold}
                  onChange={(v) => handleDiscountChange('approvalThreshold', parseFloat(v) || 0)}
                  min={0}
                  max={100}
                />
              </FormField>
            )}
          </>
        )}
      </SettingsSection>

      {/* Service Charges */}
      <SettingsSection title="Service Charges" icon={<Calculator className="w-5 h-5" />}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-medium text-gray-900">Enable Service Charge</p>
            <p className="text-sm text-gray-500">Automatically add service fee</p>
          </div>
          <Toggle
            checked={serviceCharge.enabled}
            onChange={(checked) => handleServiceChargeChange('enabled', checked)}
          />
        </div>

        {serviceCharge.enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Charge Percentage">
                <Input
                  type="number"
                  value={serviceCharge.percent}
                  onChange={(v) => handleServiceChargeChange('percent', parseFloat(v) || 0)}
                  min={0}
                  max={100}
                  step={0.5}
                />
              </FormField>
              <FormField label="Display Name">
                <Input
                  value={serviceCharge.name}
                  onChange={(v) => handleServiceChargeChange('name', v)}
                  placeholder="Service Fee"
                />
              </FormField>
            </div>

            <FormField label="Apply To">
              <Select
                value={serviceCharge.applyTo}
                onChange={(v) => handleServiceChargeChange('applyTo', v)}
                options={SERVICE_CHARGE_APPLY_OPTIONS}
              />
            </FormField>
          </>
        )}
      </SettingsSection>

      {/* Rounding */}
      <SettingsSection title="Cash Rounding" icon={<Calculator className="w-5 h-5" />}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-medium text-gray-900">Enable Cash Rounding</p>
            <p className="text-sm text-gray-500">Round cash totals for easier change</p>
          </div>
          <Toggle
            checked={rounding.enabled}
            onChange={(checked) => handleRoundingChange('enabled', checked)}
          />
        </div>

        {rounding.enabled && (
          <FormField label="Rounding Method">
            <Select
              value={rounding.method}
              onChange={(v) => handleRoundingChange('method', v)}
              options={ROUNDING_METHOD_OPTIONS}
            />
          </FormField>
        )}
      </SettingsSection>

      {/* Payment Methods */}
      <SettingsSection title="Payment Methods" icon={<CreditCard className="w-5 h-5" />}>
        <p className="text-sm text-gray-500 mb-4">Enable or disable payment options</p>
        
        <div className="space-y-3">
          {[
            { key: 'card', label: 'Card (Chip/Swipe)', description: 'Credit and debit cards' },
            { key: 'tapToPay', label: 'Tap to Pay (NFC)', description: 'Contactless payments' },
            { key: 'cash', label: 'Cash', description: 'Cash payments' },
            { key: 'giftCard', label: 'Gift Card', description: 'Store gift cards' },
            { key: 'storeCredit', label: 'Store Credit', description: 'Client store credit' },
            { key: 'check', label: 'Check', description: 'Personal checks' },
            { key: 'custom', label: 'Custom (Venmo/Zelle)', description: 'Manual entry payments' },
          ].map((method) => (
            <div key={method.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium text-gray-900">{method.label}</p>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
              <Toggle
                checked={paymentMethods[method.key as keyof typeof paymentMethods]}
                onChange={(checked) => handlePaymentMethodToggle(method.key, checked)}
              />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Payment Gateway */}
      <SettingsSection title="Payment Gateway" icon={<Wifi className="w-5 h-5" />}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Gateway Provider">
            <Select
              value={gateway?.provider || 'stripe'}
              onChange={(v) => handleGatewayChange('provider', v)}
              options={GATEWAY_PROVIDER_OPTIONS}
            />
          </FormField>
          <FormField label="API Mode">
            <Select
              value={gateway?.apiMode || 'sandbox'}
              onChange={(v) => handleGatewayChange('apiMode', v)}
              options={GATEWAY_MODE_OPTIONS}
            />
          </FormField>
        </div>

        <FormField label="Merchant ID" hint="Your gateway merchant identifier">
          <Input
            value={gateway?.merchantId || ''}
            onChange={(v) => handleGatewayChange('merchantId', v)}
            placeholder="Enter merchant ID"
          />
        </FormField>

        <div className="flex items-center gap-2 mt-4 p-3 bg-gray-50 rounded-lg">
          <div className={cn(
            'w-2 h-2 rounded-full',
            gateway?.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'
          )} />
          <span className="text-sm text-gray-600">
            Status: {gateway?.connectionStatus || 'Not configured'}
          </span>
        </div>
      </SettingsSection>

      {/* Payment Terminals */}
      <SettingsSection title="Payment Terminals" icon={<Smartphone className="w-5 h-5" />}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">Manage connected payment terminals</p>
          <button
            onClick={handleAddTerminal}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Terminal
          </button>
        </div>

        {terminals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No terminals configured</p>
            <p className="text-sm">Click "Add Terminal" to pair a device</p>
          </div>
        ) : (
          <div className="space-y-3">
            {terminals.map((terminal) => (
              <div key={terminal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    terminal.connectionStatus === 'connected' ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    {terminal.connectionStatus === 'connected' ? (
                      <Wifi className="w-5 h-5 text-green-600" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{terminal.name}</p>
                    <p className="text-sm text-gray-500">
                      {TERMINAL_TYPE_OPTIONS.find(t => t.value === terminal.type)?.label || terminal.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestTerminal(terminal.id)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Test connection"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveTerminal(terminal.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove terminal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SettingsSection>
    </div>
  );
}

export default CheckoutPaymentsSettings;
