/**
 * QuickDeviceSetupModal Component
 * Modal for quick device management with Status and Add Device tabs
 * Responsive: full-screen on mobile, centered modal on desktop
 *
 * Created: US-007 - Quick device setup modal shell
 */

import { useState } from 'react';
import { X, Layers, Plus, Tablet, Printer, CreditCard } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import {
  getConnectedPads,
  selectAllPadDevices,
  selectOfflinePads,
} from '@/store/slices/padDevicesSlice';
import {
  selectConnectedHardwareDevices,
  selectConnectedPaymentTerminals,
  selectHardwareDevicesWithErrors,
  selectPaymentTerminalsWithErrors,
  selectHardwareDevices,
  selectPaymentTerminals,
} from '@/store/slices/settingsSlice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { DeviceStatusRow } from './DeviceStatusRow';
import type { DeviceStatusRowStatus } from './DeviceStatusRow';

export interface QuickDeviceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'status' | 'add';
}

export function QuickDeviceSetupModal({
  isOpen,
  onClose,
  initialTab = 'status',
}: QuickDeviceSetupModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'add'>(initialTab);

  // Pad devices
  const connectedPads = useAppSelector(getConnectedPads);
  const allPadDevices = useAppSelector(selectAllPadDevices);
  const offlinePads = useAppSelector(selectOfflinePads);

  // Hardware devices
  const connectedHardware = useAppSelector(selectConnectedHardwareDevices);
  const hardwareWithErrors = useAppSelector(selectHardwareDevicesWithErrors);
  const allHardwareDevices = useAppSelector(selectHardwareDevices);

  // Payment terminals
  const connectedTerminals = useAppSelector(selectConnectedPaymentTerminals);
  const terminalsWithErrors = useAppSelector(selectPaymentTerminalsWithErrors);
  const allPaymentTerminals = useAppSelector(selectPaymentTerminals);

  // Calculate aggregated status
  const totalConnected = connectedPads.length + connectedHardware.length + connectedTerminals.length;
  const totalErrors = offlinePads.length + hardwareWithErrors.length + terminalsWithErrors.length;
  const totalDevices = allPadDevices.length + allHardwareDevices.length + allPaymentTerminals.length;

  // Helper to map pad status to DeviceStatusRow status
  const getPadStatus = (status: 'online' | 'offline'): DeviceStatusRowStatus => {
    return status === 'online' ? 'connected' : 'disconnected';
  };

  // Helper to map hardware/terminal connectionStatus to DeviceStatusRow status
  const getDeviceStatus = (connectionStatus: string): DeviceStatusRowStatus => {
    if (connectionStatus === 'connected') return 'connected';
    if (connectionStatus === 'error') return 'error';
    return 'disconnected';
  };

  // Sort devices: errors first, then disconnected, then connected
  const sortByStatus = <T,>(
    devices: T[],
    getStatus: (device: T) => DeviceStatusRowStatus
  ): T[] => {
    const statusOrder: Record<DeviceStatusRowStatus, number> = { error: 0, disconnected: 1, connected: 2 };
    return [...devices].sort((a, b) => statusOrder[getStatus(a)] - statusOrder[getStatus(b)]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Custom header with close button */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-600" />
              <DialogTitle className="text-lg font-semibold">Device Setup</DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Summary */}
          <div className="mt-2 text-sm text-gray-500">
            {totalDevices === 0 ? (
              'No devices configured'
            ) : (
              <>
                {totalConnected} online
                {totalErrors > 0 && (
                  <span className="text-amber-600 font-medium ml-1">
                    ({totalErrors} issue{totalErrors > 1 ? 's' : ''})
                  </span>
                )}
              </>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'status' | 'add')}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="mx-6 mt-4 w-auto">
            <TabsTrigger value="status" className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Status
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Add Device
            </TabsTrigger>
          </TabsList>

          {/* Status Tab Content */}
          <TabsContent value="status" className="flex-1 overflow-y-auto px-0 m-0">
            <div className="py-2">
              {totalDevices === 0 ? (
                <div className="px-6 py-8 text-center">
                  <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-2">No devices configured</p>
                  <p className="text-xs text-gray-400">
                    Add devices to manage printers, payment terminals, and Mango Pads
                  </p>
                </div>
              ) : (
                <>
                  {/* Mango Pad Section */}
                  {allPadDevices.length > 0 && (
                    <div className="border-b border-gray-100 last:border-b-0">
                      <div className="px-6 py-2 bg-gray-50/50 flex items-center gap-2">
                        <Tablet className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Mango Pad
                        </span>
                        <span className="text-xs text-gray-400">({allPadDevices.length})</span>
                      </div>
                      <div>
                        {sortByStatus(allPadDevices, (d) => getPadStatus(d.status)).map((device) => {
                          const status = getPadStatus(device.status);
                          const hasError = status === 'disconnected' || status === 'error';
                          return (
                            <div key={device.id} className={hasError ? 'bg-amber-50/50' : ''}>
                              <DeviceStatusRow
                                name={device.name}
                                status={status}
                                type="pad"
                                lastSeen={device.lastSeen}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hardware Section */}
                  {allHardwareDevices.length > 0 && (
                    <div className="border-b border-gray-100 last:border-b-0">
                      <div className="px-6 py-2 bg-gray-50/50 flex items-center gap-2">
                        <Printer className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Hardware
                        </span>
                        <span className="text-xs text-gray-400">({allHardwareDevices.length})</span>
                      </div>
                      <div>
                        {sortByStatus(allHardwareDevices, (d) => getDeviceStatus(d.connectionStatus)).map((device) => {
                          const status = getDeviceStatus(device.connectionStatus);
                          const hasError = status === 'disconnected' || status === 'error';
                          return (
                            <div key={device.id} className={hasError ? 'bg-amber-50/50' : ''}>
                              <DeviceStatusRow
                                name={device.name}
                                status={status}
                                type={device.type === 'printer' ? 'printer' : device.type === 'scanner' ? 'scanner' : 'cash_drawer'}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment Terminals Section */}
                  {allPaymentTerminals.length > 0 && (
                    <div className="border-b border-gray-100 last:border-b-0">
                      <div className="px-6 py-2 bg-gray-50/50 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          Payment Terminals
                        </span>
                        <span className="text-xs text-gray-400">({allPaymentTerminals.length})</span>
                      </div>
                      <div>
                        {sortByStatus(allPaymentTerminals, (d) => getDeviceStatus(d.connectionStatus)).map((terminal) => {
                          const status = getDeviceStatus(terminal.connectionStatus);
                          const hasError = status === 'disconnected' || status === 'error';
                          return (
                            <div key={terminal.id} className={hasError ? 'bg-amber-50/50' : ''}>
                              <DeviceStatusRow
                                name={terminal.name}
                                status={status}
                                type="terminal"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Add Device Tab Content (Placeholder) */}
          <TabsContent value="add" className="flex-1 overflow-y-auto px-6 m-0">
            <div className="py-6 space-y-4">
              {/* Mango Pad Section */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Tablet className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Add Mango Pad</h4>
                    <p className="text-xs text-gray-500">Connect iPad for signatures and customer display</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Pairing functionality coming soon
                </p>
              </div>

              {/* Hardware Section */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Printer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Add Hardware</h4>
                    <p className="text-xs text-gray-500">Connect printers, scanners, and cash drawers</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Hardware setup coming soon
                </p>
              </div>

              {/* Payment Terminal Section */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Add Payment Terminal</h4>
                    <p className="text-xs text-gray-500">Connect card readers and payment devices</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Terminal setup coming soon
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default QuickDeviceSetupModal;
