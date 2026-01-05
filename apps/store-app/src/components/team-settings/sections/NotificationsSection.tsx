import React from 'react';
import type { NotificationPreferences } from '../types';
import { Card, SectionHeader, Toggle, Badge } from '../components/SharedComponents';

interface NotificationsSectionProps {
  notifications: NotificationPreferences;
  onChange: (notifications: NotificationPreferences) => void;
}

export const NotificationsSection: React.FC<NotificationsSectionProps> = ({
  notifications,
  onChange,
}) => {
  const updateEmail = (key: keyof NotificationPreferences['email'], value: boolean) => {
    onChange({
      ...notifications,
      email: { ...notifications.email, [key]: value },
    });
  };

  const updateSms = (key: keyof NotificationPreferences['sms'], value: boolean) => {
    onChange({
      ...notifications,
      sms: { ...notifications.sms, [key]: value },
    });
  };

  const updatePush = (key: keyof NotificationPreferences['push'], value: boolean) => {
    onChange({
      ...notifications,
      push: { ...notifications.push, [key]: value },
    });
  };

  // Count enabled notifications
  const emailCount = Object.values(notifications.email).filter(Boolean).length;
  const smsCount = Object.values(notifications.sms).filter(Boolean).length;
  const pushCount = Object.values(notifications.push).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md" className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MailIcon className="w-5 h-5 text-cyan-500" />
            <p className="text-2xl font-bold text-gray-900">{emailCount}</p>
          </div>
          <p className="text-sm text-gray-500">Email Alerts</p>
        </Card>
        <Card padding="md" className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PhoneIcon className="w-5 h-5 text-emerald-500" />
            <p className="text-2xl font-bold text-gray-900">{smsCount}</p>
          </div>
          <p className="text-sm text-gray-500">SMS Alerts</p>
        </Card>
        <Card padding="md" className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BellIcon className="w-5 h-5 text-purple-500" />
            <p className="text-2xl font-bold text-gray-900">{pushCount}</p>
          </div>
          <p className="text-sm text-gray-500">Push Alerts</p>
        </Card>
      </div>

      {/* Email Notifications */}
      <Card padding="lg">
        <SectionHeader
          title="Email Notifications"
          subtitle="Notifications sent to team member's email"
          icon={<MailIcon className="w-5 h-5" />}
          action={
            <Badge variant={emailCount > 0 ? 'success' : 'outline'}>
              {emailCount} enabled
            </Badge>
          }
        />

        <div className="space-y-1">
          <NotificationGroup title="Appointments">
            <NotificationItem
              label="Appointment Reminders"
              description="Daily reminders for upcoming appointments"
              enabled={notifications.email.appointmentReminders}
              onChange={(v) => updateEmail('appointmentReminders', v)}
            />
            <NotificationItem
              label="Appointment Changes"
              description="When appointments are modified or rescheduled"
              enabled={notifications.email.appointmentChanges}
              onChange={(v) => updateEmail('appointmentChanges', v)}
            />
            <NotificationItem
              label="New Bookings"
              description="When new appointments are booked"
              enabled={notifications.email.newBookings}
              onChange={(v) => updateEmail('newBookings', v)}
            />
            <NotificationItem
              label="Cancellations"
              description="When appointments are cancelled"
              enabled={notifications.email.cancellations}
              onChange={(v) => updateEmail('cancellations', v)}
            />
          </NotificationGroup>

          <NotificationGroup title="Reports & Summaries">
            <NotificationItem
              label="Daily Summary"
              description="End-of-day summary of appointments and revenue"
              enabled={notifications.email.dailySummary}
              onChange={(v) => updateEmail('dailySummary', v)}
            />
            <NotificationItem
              label="Weekly Summary"
              description="Weekly performance and statistics report"
              enabled={notifications.email.weeklySummary}
              onChange={(v) => updateEmail('weeklySummary', v)}
            />
          </NotificationGroup>

          <NotificationGroup title="Other">
            <NotificationItem
              label="Marketing Emails"
              description="Promotional and marketing communications"
              enabled={notifications.email.marketingEmails}
              onChange={(v) => updateEmail('marketingEmails', v)}
            />
            <NotificationItem
              label="System Updates"
              description="Important updates and feature announcements"
              enabled={notifications.email.systemUpdates}
              onChange={(v) => updateEmail('systemUpdates', v)}
            />
          </NotificationGroup>
        </div>
      </Card>

      {/* SMS Notifications */}
      <Card padding="lg">
        <SectionHeader
          title="SMS Notifications"
          subtitle="Text messages to team member's phone"
          icon={<PhoneIcon className="w-5 h-5" />}
          action={
            <Badge variant={smsCount > 0 ? 'success' : 'outline'}>
              {smsCount} enabled
            </Badge>
          }
        />

        <div className="space-y-1">
          <NotificationItem
            label="Appointment Reminders"
            description="SMS reminders for upcoming appointments"
            enabled={notifications.sms.appointmentReminders}
            onChange={(v) => updateSms('appointmentReminders', v)}
          />
          <NotificationItem
            label="Appointment Changes"
            description="SMS when appointments are modified"
            enabled={notifications.sms.appointmentChanges}
            onChange={(v) => updateSms('appointmentChanges', v)}
          />
          <NotificationItem
            label="New Bookings"
            description="SMS when new appointments are booked"
            enabled={notifications.sms.newBookings}
            onChange={(v) => updateSms('newBookings', v)}
          />
          <NotificationItem
            label="Cancellations"
            description="SMS when appointments are cancelled"
            enabled={notifications.sms.cancellations}
            onChange={(v) => updateSms('cancellations', v)}
          />
          <NotificationItem
            label="Urgent Alerts"
            description="Important urgent notifications"
            enabled={notifications.sms.urgentAlerts}
            onChange={(v) => updateSms('urgentAlerts', v)}
            highlight
          />
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">SMS Charges May Apply</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Standard carrier rates may apply for SMS messages. Consider using push notifications for cost-effective alerts.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Push Notifications */}
      <Card padding="lg">
        <SectionHeader
          title="Push Notifications"
          subtitle="In-app and mobile push notifications"
          icon={<BellIcon className="w-5 h-5" />}
          action={
            <Badge variant={pushCount > 0 ? 'success' : 'outline'}>
              {pushCount} enabled
            </Badge>
          }
        />

        <div className="space-y-1">
          <NotificationItem
            label="Appointment Reminders"
            description="Push notifications for upcoming appointments"
            enabled={notifications.push.appointmentReminders}
            onChange={(v) => updatePush('appointmentReminders', v)}
          />
          <NotificationItem
            label="New Bookings"
            description="Push when new appointments are booked"
            enabled={notifications.push.newBookings}
            onChange={(v) => updatePush('newBookings', v)}
          />
          <NotificationItem
            label="Messages"
            description="Push notifications for new messages"
            enabled={notifications.push.messages}
            onChange={(v) => updatePush('messages', v)}
          />
          <NotificationItem
            label="Team Updates"
            description="Notifications about team changes and announcements"
            enabled={notifications.push.teamUpdates}
            onChange={(v) => updatePush('teamUpdates', v)}
          />
        </div>
      </Card>

      {/* Reminder Timing */}
      <Card padding="lg">
        <SectionHeader
          title="Reminder Timing"
          subtitle="When to send appointment reminders"
          icon={<ClockIcon className="w-5 h-5" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Reminder
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={notifications.reminderTiming.firstReminder}
                onChange={(e) =>
                  onChange({
                    ...notifications,
                    reminderTiming: {
                      ...notifications.reminderTiming,
                      firstReminder: Number(e.target.value),
                    },
                  })
                }
                min="1"
                max="168"
                className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-gray-500">hours before</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Usually 24 hours before the appointment
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Reminder (Optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={notifications.reminderTiming.secondReminder || ''}
                onChange={(e) =>
                  onChange({
                    ...notifications,
                    reminderTiming: {
                      ...notifications.reminderTiming,
                      secondReminder: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
                min="1"
                max="24"
                placeholder="Off"
                className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-gray-500">hours before</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Leave blank to disable second reminder
            </p>
          </div>
        </div>

        {/* Reminder Timeline Visual */}
        <div className="mt-6 p-4 bg-cyan-50 rounded-xl">
          <p className="text-sm font-medium text-gray-700 mb-4">Reminder Timeline</p>
          <div className="relative">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-cyan-200 rounded" />
            <div className="relative flex justify-between items-center">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow" />
                <span className="text-xs text-gray-600 mt-2">
                  {notifications.reminderTiming.firstReminder}h before
                </span>
                <span className="text-xs text-gray-400">1st Reminder</span>
              </div>
              {notifications.reminderTiming.secondReminder && (
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow" />
                  <span className="text-xs text-gray-600 mt-2">
                    {notifications.reminderTiming.secondReminder}h before
                  </span>
                  <span className="text-xs text-gray-400">2nd Reminder</span>
                </div>
              )}
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow flex items-center justify-center">
                  <CalendarIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-600 mt-2">Appointment</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card padding="md" className="bg-gray-50">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              const allEnabled = {
                email: Object.fromEntries(Object.keys(notifications.email).map((k) => [k, true])) as typeof notifications.email,
                sms: Object.fromEntries(Object.keys(notifications.sms).map((k) => [k, true])) as typeof notifications.sms,
                push: Object.fromEntries(Object.keys(notifications.push).map((k) => [k, true])) as typeof notifications.push,
                reminderTiming: notifications.reminderTiming,
              };
              onChange(allEnabled);
            }}
            className="px-4 py-2 text-sm text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
          >
            Enable All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => {
              const allDisabled = {
                email: Object.fromEntries(Object.keys(notifications.email).map((k) => [k, false])) as typeof notifications.email,
                sms: Object.fromEntries(Object.keys(notifications.sms).map((k) => [k, false])) as typeof notifications.sms,
                push: Object.fromEntries(Object.keys(notifications.push).map((k) => [k, false])) as typeof notifications.push,
                reminderTiming: notifications.reminderTiming,
              };
              onChange(allDisabled);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Disable All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={() => {
              const essential = {
                email: {
                  ...notifications.email,
                  appointmentReminders: true,
                  appointmentChanges: true,
                  newBookings: true,
                  cancellations: true,
                },
                sms: {
                  ...notifications.sms,
                  urgentAlerts: true,
                },
                push: {
                  ...notifications.push,
                  appointmentReminders: true,
                  newBookings: true,
                },
                reminderTiming: notifications.reminderTiming,
              };
              onChange(essential);
            }}
            className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Essential Only
          </button>
        </div>
      </Card>
    </div>
  );
};

// Notification Group Component
interface NotificationGroupProps {
  title: string;
  children: React.ReactNode;
}

const NotificationGroup: React.FC<NotificationGroupProps> = ({ title, children }) => (
  <div className="mb-4">
    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h4>
    <div className="space-y-1">{children}</div>
  </div>
);

// Notification Item Component
interface NotificationItemProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  highlight?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  label,
  description,
  enabled,
  onChange,
  highlight = false,
}) => (
  <div
    className={`
      p-3 rounded-xl transition-colors
      ${highlight ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}
    `}
  >
    <Toggle
      enabled={enabled}
      onChange={onChange}
      label={label}
      description={description}
      size="sm"
    />
  </div>
);

// Icons
const MailIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default NotificationsSection;
