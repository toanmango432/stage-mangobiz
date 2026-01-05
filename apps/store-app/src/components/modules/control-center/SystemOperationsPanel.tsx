import { useState } from 'react';
import {
  Clock,
  DollarSign,
  Receipt,
  Users,
  Bell,
  Database,
  Zap
} from 'lucide-react';

export function SystemOperationsPanel() {
  const [settings, setSettings] = useState({
    // Ticket & Checkout Settings
    autoCloseAfterCheckout: true,
    requireManagerApproval: false,
    allowDiscounts: true,
    maxDiscountPercent: 50,
    requireDiscountReason: true,
    allowVoidTickets: true,
    requireVoidReason: true,

    // Appointment Settings
    autoNoShowCancel: true,
    noShowMinutes: 15,
    bufferTimeBetweenAppointments: 10,
    allowDoubleBooking: false,
    requireDepositForBooking: false,
    depositPercent: 20,

    // Payment Settings
    defaultTipPercent: 20,
    suggestedTipOptions: [15, 18, 20, 25],
    acceptCash: true,
    acceptCard: true,
    acceptDigitalWallets: true,
    roundUpDonation: false,

    // Staff & Turn Settings
    enableTurnQueue: true,
    autoAssignWalkIns: true,
    staffClockInRequired: true,
    breakTimeTracking: true,

    // Notification Settings
    enableNotifications: true,
    notifyPendingTickets: true,
    notifyNewAppointments: true,
    notifyLateArrivals: true,
    pendingTicketAlertMinutes: 30,

    // Data & Backup
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    dataRetentionDays: 365,
    purgeOldDataAuto: false
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleNumberChange = (key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Ticket & Checkout Operations */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600" />
          Ticket & Checkout Operations
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-Close After Checkout</div>
              <div className="text-sm text-gray-600">
                Automatically close ticket after payment is complete
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoCloseAfterCheckout}
                onChange={() => handleToggle('autoCloseAfterCheckout')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Allow Discounts</div>
              <div className="text-sm text-gray-600">
                Enable discount application on tickets
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.allowDiscounts}
                onChange={() => handleToggle('allowDiscounts')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.allowDiscounts && (
            <div className="ml-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-900">
                  Maximum Discount Percentage
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.maxDiscountPercent}
                  onChange={(e) => handleNumberChange('maxDiscountPercent', Number(e.target.value))}
                  className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.requireDiscountReason}
                  onChange={() => handleToggle('requireDiscountReason')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Require reason for discount</span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Allow Void Tickets</div>
              <div className="text-sm text-gray-600">
                Enable ticket cancellation/voiding
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.allowVoidTickets}
                onChange={() => handleToggle('allowVoidTickets')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Require Manager Approval</div>
              <div className="text-sm text-gray-600">
                Require manager approval for refunds and voids
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.requireManagerApproval}
                onChange={() => handleToggle('requireManagerApproval')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Appointment Operations */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          Appointment Operations
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto No-Show Cancellation</div>
              <div className="text-sm text-gray-600">
                Automatically cancel appointments if client doesn't arrive
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoNoShowCancel}
                onChange={() => handleToggle('autoNoShowCancel')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.autoNoShowCancel && (
            <div className="ml-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  No-Show Time Threshold (minutes)
                </span>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.noShowMinutes}
                  onChange={(e) => handleNumberChange('noShowMinutes', Number(e.target.value))}
                  className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
                />
              </label>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                Buffer Time Between Appointments (minutes)
              </span>
              <input
                type="number"
                min="0"
                max="30"
                value={settings.bufferTimeBetweenAppointments}
                onChange={(e) => handleNumberChange('bufferTimeBetweenAppointments', Number(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </label>
            <p className="text-xs text-gray-600">
              Adds buffer time between appointments for cleanup and preparation
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Allow Double Booking</div>
              <div className="text-sm text-gray-600">
                Allow staff to book multiple appointments at same time
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.allowDoubleBooking}
                onChange={() => handleToggle('allowDoubleBooking')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Require Deposit for Bookings</div>
              <div className="text-sm text-gray-600">
                Require upfront deposit when booking appointments
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.requireDepositForBooking}
                onChange={() => handleToggle('requireDepositForBooking')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Payment Operations */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Payment Operations
        </h3>
        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                Default Tip Percentage
              </span>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.defaultTipPercent}
                onChange={(e) => handleNumberChange('defaultTipPercent', Number(e.target.value))}
                className="w-20 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </label>
            <p className="text-xs text-gray-600">
              Pre-selected tip amount at checkout
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">
              Accepted Payment Methods
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.acceptCash}
                  onChange={() => handleToggle('acceptCash')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Cash</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.acceptCard}
                  onChange={() => handleToggle('acceptCard')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Credit/Debit Cards</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.acceptDigitalWallets}
                  onChange={() => handleToggle('acceptDigitalWallets')}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">Digital Wallets (Apple Pay, Google Pay)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Round-Up Donation</div>
              <div className="text-sm text-gray-600">
                Ask customers to round up for charity
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.roundUpDonation}
                onChange={() => handleToggle('roundUpDonation')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Staff Operations */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-600" />
          Staff Operations
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Enable Turn Queue</div>
              <div className="text-sm text-gray-600">
                Manage staff turn rotation for walk-ins
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.enableTurnQueue}
                onChange={() => handleToggle('enableTurnQueue')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-Assign Walk-Ins</div>
              <div className="text-sm text-gray-600">
                Automatically assign walk-in clients to next available staff
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoAssignWalkIns}
                onChange={() => handleToggle('autoAssignWalkIns')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Clock-In Required</div>
              <div className="text-sm text-gray-600">
                Require staff to clock in before accepting clients
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.staffClockInRequired}
                onChange={() => handleToggle('staffClockInRequired')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Break Time Tracking</div>
              <div className="text-sm text-gray-600">
                Track staff break times and availability
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.breakTimeTracking}
                onChange={() => handleToggle('breakTimeTracking')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-yellow-600" />
          Notification Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Enable System Notifications</div>
              <div className="text-sm text-gray-600">
                Master toggle for all notifications
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.enableNotifications}
                onChange={() => handleToggle('enableNotifications')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.enableNotifications && (
            <>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm text-gray-700">Notify for pending tickets</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifyPendingTickets}
                    onChange={() => handleToggle('notifyPendingTickets')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm text-gray-700">Notify for new appointments</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifyNewAppointments}
                    onChange={() => handleToggle('notifyNewAppointments')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-sm text-gray-700">Notify for late arrivals</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifyLateArrivals}
                    onChange={() => handleToggle('notifyLateArrivals')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          Data Management
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-Backup Enabled</div>
              <div className="text-sm text-gray-600">
                Automatically backup data to cloud storage
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoBackupEnabled}
                onChange={() => handleToggle('autoBackupEnabled')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                Data Retention Period (days)
              </span>
              <input
                type="number"
                min="90"
                max="730"
                value={settings.dataRetentionDays}
                onChange={(e) => handleNumberChange('dataRetentionDays', Number(e.target.value))}
                className="w-24 px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </label>
            <p className="text-xs text-gray-600">
              How long to keep historical data before archival
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Auto-Purge Old Data</div>
              <div className="text-sm text-gray-600">
                Automatically delete data older than retention period
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.purgeOldDataAuto}
                onChange={() => handleToggle('purgeOldDataAuto')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg flex items-center justify-center gap-2">
          <Zap className="w-5 h-5" />
          Save All Settings
        </button>
      </div>
    </div>
  );
}
