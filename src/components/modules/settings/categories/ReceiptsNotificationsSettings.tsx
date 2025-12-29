/**
 * Receipts & Notifications Settings Category
 * Receipt Header/Footer/Options, Client/Staff/Owner Notifications
 */

import { useSelector, useDispatch } from 'react-redux';
import { 
  Receipt, 
  Bell, 
  Mail, 
  MessageSquare,
  Printer,
  QrCode,
  Clock,
  Users,
  User,
  Building2
} from 'lucide-react';
import type { AppDispatch } from '@/store';
import {
  selectReceiptSettings,
  selectNotificationSettings,
  updateReceiptHeader,
  updateReceiptFooter,
  updateReceiptOptions,
  updateClientNotifications,
  updateStaffNotifications,
  updateOwnerNotifications,
} from '@/store/slices/settingsSlice';
import type { NotificationChannel } from '@/types/settings';
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
  hint 
}: { 
  label: string; 
  children: React.ReactNode; 
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
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
}: { 
  value: string | number; 
  onChange: (value: string) => void; 
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
    />
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

// Notification Channel Toggle Row
function NotificationRow({
  label,
  description,
  channel,
  onChange,
}: {
  label: string;
  description: string;
  channel: NotificationChannel;
  onChange: (channel: NotificationChannel) => void;
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={channel.email}
            onChange={(e) => onChange({ ...channel, email: e.target.checked })}
            className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-gray-600">Email</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={channel.sms}
            onChange={(e) => onChange({ ...channel, sms: e.target.checked })}
            className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-gray-600">SMS</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={channel.push}
            onChange={(e) => onChange({ ...channel, push: e.target.checked })}
            className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
          />
          <span className="text-sm text-gray-600">Push</span>
        </label>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ReceiptsNotificationsSettings() {
  const dispatch = useDispatch<AppDispatch>();
  const receipts = useSelector(selectReceiptSettings);
  const notifications = useSelector(selectNotificationSettings);

  if (!receipts || !notifications) {
    return <div className="text-gray-500">Loading settings...</div>;
  }

  const { header, footer, options } = receipts;
  const { client, staff, owner } = notifications;

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleHeaderChange = (field: string, value: boolean | string) => {
    dispatch(updateReceiptHeader({ [field]: value }));
  };

  const handleFooterChange = (field: string, value: boolean | string) => {
    dispatch(updateReceiptFooter({ [field]: value }));
  };

  const handleOptionsChange = (field: string, value: boolean) => {
    dispatch(updateReceiptOptions({ [field]: value }));
  };

  const handleClientNotificationChange = (field: string, value: NotificationChannel | number) => {
    dispatch(updateClientNotifications({ [field]: value }));
  };

  const handleStaffNotificationChange = (field: string, value: NotificationChannel) => {
    dispatch(updateStaffNotifications({ [field]: value }));
  };

  const handleOwnerNotificationChange = (field: string, value: NotificationChannel | number) => {
    dispatch(updateOwnerNotifications({ [field]: value }));
  };

  return (
    <div>
      {/* Receipt Header */}
      <SettingsSection title="Receipt Header" icon={<Receipt className="w-5 h-5" />}>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Show Logo</p>
            <p className="text-sm text-gray-500">Display business logo on receipt</p>
          </div>
          <Toggle
            checked={header.showLogo}
            onChange={(checked) => handleHeaderChange('showLogo', checked)}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Show Address</p>
            <p className="text-sm text-gray-500">Display business address</p>
          </div>
          <Toggle
            checked={header.showAddress}
            onChange={(checked) => handleHeaderChange('showAddress', checked)}
          />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Show Phone</p>
            <p className="text-sm text-gray-500">Display business phone number</p>
          </div>
          <Toggle
            checked={header.showPhone}
            onChange={(checked) => handleHeaderChange('showPhone', checked)}
          />
        </div>

        <FormField label="Custom Header Text" hint="Additional text to display in header">
          <textarea
            value={header.text || ''}
            onChange={(e) => handleHeaderChange('text', e.target.value)}
            placeholder="Enter custom header text..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            rows={2}
          />
        </FormField>
      </SettingsSection>

      {/* Receipt Footer */}
      <SettingsSection title="Receipt Footer" icon={<MessageSquare className="w-5 h-5" />}>
        <FormField label="Thank You Message">
          <Input
            value={footer.thankYouMessage}
            onChange={(v) => handleFooterChange('thankYouMessage', v)}
            placeholder="Thank you for visiting!"
          />
        </FormField>

        <FormField label="Return Policy" hint="Display your return/refund policy">
          <textarea
            value={footer.returnPolicy || ''}
            onChange={(e) => handleFooterChange('returnPolicy', e.target.value)}
            placeholder="Enter return policy..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            rows={2}
          />
        </FormField>

        <FormField label="Custom Footer Text">
          <textarea
            value={footer.text || ''}
            onChange={(e) => handleFooterChange('text', e.target.value)}
            placeholder="Enter custom footer text..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
            rows={2}
          />
        </FormField>

        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div>
            <p className="font-medium text-gray-900">Show Social Media</p>
            <p className="text-sm text-gray-500">Display social media handles</p>
          </div>
          <Toggle
            checked={footer.showSocialMedia}
            onChange={(checked) => handleFooterChange('showSocialMedia', checked)}
          />
        </div>
      </SettingsSection>

      {/* Receipt Options */}
      <SettingsSection title="Receipt Options" icon={<Printer className="w-5 h-5" />}>
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Auto-Print Receipt</p>
              <p className="text-sm text-gray-500">Automatically print after payment</p>
            </div>
            <Toggle
              checked={options.autoPrint}
              onChange={(checked) => handleOptionsChange('autoPrint', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Email Receipt</p>
                <p className="text-sm text-gray-500">Send receipt via email</p>
              </div>
            </div>
            <Toggle
              checked={options.emailReceipt}
              onChange={(checked) => handleOptionsChange('emailReceipt', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">SMS Receipt</p>
                <p className="text-sm text-gray-500">Send receipt via text message</p>
              </div>
            </div>
            <Toggle
              checked={options.smsReceipt}
              onChange={(checked) => handleOptionsChange('smsReceipt', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">QR Code</p>
                <p className="text-sm text-gray-500">Include QR code for digital receipt</p>
              </div>
            </div>
            <Toggle
              checked={options.qrCode}
              onChange={(checked) => handleOptionsChange('qrCode', checked)}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Client Notifications */}
      <SettingsSection title="Client Notifications" icon={<Users className="w-5 h-5" />}>
        <p className="text-sm text-gray-500 mb-4">Configure how clients receive notifications</p>
        
        <NotificationRow
          label="Appointment Confirmation"
          description="Sent when appointment is booked"
          channel={client.appointmentConfirmation}
          onChange={(channel) => handleClientNotificationChange('appointmentConfirmation', channel)}
        />

        <NotificationRow
          label="Appointment Reminder"
          description="Sent before scheduled appointment"
          channel={client.appointmentReminder}
          onChange={(channel) => handleClientNotificationChange('appointmentReminder', channel)}
        />

        <NotificationRow
          label="Appointment Cancelled"
          description="Sent when appointment is cancelled"
          channel={client.appointmentCancelled}
          onChange={(channel) => handleClientNotificationChange('appointmentCancelled', channel)}
        />

        <NotificationRow
          label="Receipt"
          description="Sent after payment is completed"
          channel={client.receipt}
          onChange={(channel) => handleClientNotificationChange('receipt', channel)}
        />

        <NotificationRow
          label="Marketing"
          description="Promotional messages and offers"
          channel={client.marketing}
          onChange={(channel) => handleClientNotificationChange('marketing', channel)}
        />

        <div className="mt-4 pt-4 border-t border-gray-200">
          <FormField label="Reminder Timing" hint="Hours before appointment to send reminder">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <Input
                type="number"
                value={client.reminderTiming}
                onChange={(v) => handleClientNotificationChange('reminderTiming', parseInt(v) || 24)}
                placeholder="24"
              />
              <span className="text-sm text-gray-500">hours before</span>
            </div>
          </FormField>
        </div>
      </SettingsSection>

      {/* Staff Notifications */}
      <SettingsSection title="Staff Notifications" icon={<User className="w-5 h-5" />}>
        <p className="text-sm text-gray-500 mb-4">Configure how staff receive notifications</p>
        
        <NotificationRow
          label="New Appointment"
          description="When a new appointment is assigned"
          channel={staff.newAppointment}
          onChange={(channel) => handleStaffNotificationChange('newAppointment', channel)}
        />

        <NotificationRow
          label="Schedule Change"
          description="When schedule is modified"
          channel={staff.scheduleChange}
          onChange={(channel) => handleStaffNotificationChange('scheduleChange', channel)}
        />

        <NotificationRow
          label="Time-Off Approved"
          description="When time-off request is approved"
          channel={staff.timeOffApproved}
          onChange={(channel) => handleStaffNotificationChange('timeOffApproved', channel)}
        />
      </SettingsSection>

      {/* Owner/Manager Notifications */}
      <SettingsSection title="Owner/Manager Notifications" icon={<Building2 className="w-5 h-5" />}>
        <p className="text-sm text-gray-500 mb-4">Configure owner and manager alerts</p>
        
        <NotificationRow
          label="Daily Summary"
          description="End of day sales and activity report"
          channel={owner.dailySummary}
          onChange={(channel) => handleOwnerNotificationChange('dailySummary', channel)}
        />

        <NotificationRow
          label="Large Transaction"
          description="Alert for transactions over threshold"
          channel={owner.largeTransaction}
          onChange={(channel) => handleOwnerNotificationChange('largeTransaction', channel)}
        />

        <NotificationRow
          label="Refund Processed"
          description="When a refund is issued"
          channel={owner.refundProcessed}
          onChange={(channel) => handleOwnerNotificationChange('refundProcessed', channel)}
        />

        <NotificationRow
          label="License Alert"
          description="License expiration and renewal notices"
          channel={owner.licenseAlert}
          onChange={(channel) => handleOwnerNotificationChange('licenseAlert', channel)}
        />

        <div className="mt-4 pt-4 border-t border-gray-200">
          <FormField label="Large Transaction Threshold" hint="Amount that triggers alert">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">$</span>
              <Input
                type="number"
                value={owner.largeTransactionThreshold || 500}
                onChange={(v) => handleOwnerNotificationChange('largeTransactionThreshold', parseInt(v) || 500)}
                placeholder="500"
              />
            </div>
          </FormField>
        </div>
      </SettingsSection>
    </div>
  );
}

export default ReceiptsNotificationsSettings;
