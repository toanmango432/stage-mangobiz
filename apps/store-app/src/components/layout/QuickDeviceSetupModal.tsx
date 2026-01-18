/**
 * QuickDeviceSetupModal Component
 * Modal for quick device management with Status and Add Device tabs
 * Responsive: full-screen on mobile, centered modal on desktop
 *
 * Created: US-007 - Quick device setup modal shell
 * Updated: US-009 - Add new device flow with forms
 */

import { useState, useEffect } from 'react';
import { Layers, Plus, Tablet, Printer, CreditCard, RefreshCw, Unlink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  getConnectedPads,
  selectAllPadDevices,
  selectOfflinePads,
  removeDevice as removePadDevice,
  updateDeviceStatus as updatePadDeviceStatus,
} from '@/store/slices/padDevicesSlice';
import {
  selectConnectedHardwareDevices,
  selectConnectedPaymentTerminals,
  selectHardwareDevicesWithErrors,
  selectPaymentTerminalsWithErrors,
  selectHardwareDevices,
  selectPaymentTerminals,
  updateDeviceStatus,
  updateTerminalStatus,
  removeHardwareDevice,
  removePaymentTerminal,
  addHardwareDevice,
  addPaymentTerminal,
} from '@/store/slices/settingsSlice';
import type { HardwareDeviceType, ConnectionType, TerminalType } from '@/types/settings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { DeviceStatusRow } from './DeviceStatusRow';
import type { DeviceStatusRowStatus, DeviceStatusRowType } from './DeviceStatusRow';
import { selectStoreId } from '@/store/slices/authSlice';
import {
  registerDevice,
  regeneratePairingCode,
  formatPairingCode,
  getStoredPairingCode,
} from '@/services/deviceRegistration';

export interface QuickDeviceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'status' | 'add';
}

/** Device info for unpair confirmation dialog */
interface DeviceToUnpair {
  id: string;
  name: string;
  category: 'pad' | 'hardware' | 'terminal';
}

export function QuickDeviceSetupModal({
  isOpen,
  onClose,
  initialTab = 'status',
}: QuickDeviceSetupModalProps) {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector(selectStoreId);
  const [activeTab, setActiveTab] = useState<'status' | 'add'>(initialTab);
  const [deviceToUnpair, setDeviceToUnpair] = useState<DeviceToUnpair | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);

  // Mango Pad pairing state
  const [storePairingCode, setStorePairingCode] = useState<string | null>(null);
  const [isPairingCodeLoading, setIsPairingCodeLoading] = useState(false);

  const [hardwareForm, setHardwareForm] = useState({
    name: '',
    type: '' as HardwareDeviceType | '',
    connectionType: '' as ConnectionType | '',
  });
  const [isAddingHardware, setIsAddingHardware] = useState(false);

  const [terminalForm, setTerminalForm] = useState({
    name: '',
    type: '' as TerminalType | '',
    terminalId: '',
  });
  const [isAddingTerminal, setIsAddingTerminal] = useState(false);

  // Fetch pairing code when Add tab is shown
  useEffect(() => {
    const fetchPairingCode = async () => {
      // Check for stored code first
      const storedCode = getStoredPairingCode();
      if (storedCode) {
        setStorePairingCode(storedCode);
        return;
      }

      // If no stored code and we have storeId, register device to get code
      if (storeId && activeTab === 'add') {
        setIsPairingCodeLoading(true);
        try {
          const result = await registerDevice(storeId);
          if (result.success) {
            setStorePairingCode(result.pairingCode);
          } else {
            console.error('[QuickDeviceSetupModal] Failed to get pairing code:', result.error);
          }
        } catch (error) {
          console.error('[QuickDeviceSetupModal] Error fetching pairing code:', error);
        }
        setIsPairingCodeLoading(false);
      }
    };

    if (isOpen && activeTab === 'add') {
      fetchPairingCode();
    }
  }, [isOpen, activeTab, storeId]);

  // Handle refresh pairing code
  const handleRefreshPairingCode = async () => {
    if (!storeId) {
      toast.error('Store ID not available');
      return;
    }

    setIsPairingCodeLoading(true);
    try {
      const result = await regeneratePairingCode(storeId);
      if (result.success) {
        setStorePairingCode(result.pairingCode);
        toast.success('New pairing code generated');
      } else {
        toast.error(result.error || 'Failed to generate new code');
      }
    } catch (error) {
      console.error('[QuickDeviceSetupModal] Error refreshing pairing code:', error);
      toast.error('Failed to refresh pairing code');
    }
    setIsPairingCodeLoading(false);
  };

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

  // Handle retry connection for a device
  const handleRetryConnection = async (
    deviceId: string,
    deviceName: string,
    category: 'pad' | 'hardware' | 'terminal'
  ) => {
    setIsRetrying(deviceId);
    try {
      if (category === 'pad') {
        // For pads, set status to online (simulates retry - actual reconnection is via MQTT)
        dispatch(updatePadDeviceStatus({ id: deviceId, status: 'online' }));
        toast.success(`Reconnecting to ${deviceName}...`);
      } else if (category === 'hardware') {
        dispatch(updateDeviceStatus({ id: deviceId, status: 'connected' }));
        toast.success(`${deviceName} reconnected`);
      } else {
        dispatch(updateTerminalStatus({ id: deviceId, status: 'connected' }));
        toast.success(`${deviceName} reconnected`);
      }
    } catch {
      toast.error(`Failed to reconnect ${deviceName}`);
    } finally {
      setIsRetrying(null);
    }
  };

  // Handle unpair/remove device
  const handleUnpairDevice = async () => {
    if (!deviceToUnpair) return;

    const { id, name, category } = deviceToUnpair;
    try {
      if (category === 'pad') {
        dispatch(removePadDevice(id));
        toast.success(`${name} unpaired successfully`);
      } else if (category === 'hardware') {
        const result = await dispatch(removeHardwareDevice(id));
        if (removeHardwareDevice.rejected.match(result)) {
          throw new Error(result.payload as string);
        }
        toast.success(`${name} removed successfully`);
      } else {
        const result = await dispatch(removePaymentTerminal(id));
        if (removePaymentTerminal.rejected.match(result)) {
          throw new Error(result.payload as string);
        }
        toast.success(`${name} removed successfully`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to remove ${name}: ${message}`);
    } finally {
      setDeviceToUnpair(null);
    }
  };

  // Open unpair confirmation dialog
  const confirmUnpair = (id: string, name: string, category: 'pad' | 'hardware' | 'terminal') => {
    setDeviceToUnpair({ id, name, category });
  };

  // Handle add hardware device
  const handleAddHardware = async () => {
    if (!hardwareForm.name || !hardwareForm.type || !hardwareForm.connectionType) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsAddingHardware(true);
    try {
      const result = await dispatch(addHardwareDevice({
        name: hardwareForm.name,
        type: hardwareForm.type as HardwareDeviceType,
        connectionType: hardwareForm.connectionType as ConnectionType,
        connectionStatus: 'disconnected',
      }));

      if (addHardwareDevice.rejected.match(result)) {
        throw new Error(result.payload as string);
      }

      toast.success(`${hardwareForm.name} added successfully`);
      setHardwareForm({ name: '', type: '', connectionType: '' });
      setActiveTab('status');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add device';
      toast.error(message);
    } finally {
      setIsAddingHardware(false);
    }
  };

  // Handle add payment terminal
  const handleAddTerminal = async () => {
    if (!terminalForm.name || !terminalForm.type) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsAddingTerminal(true);
    try {
      const result = await dispatch(addPaymentTerminal({
        name: terminalForm.name,
        type: terminalForm.type as TerminalType,
        terminalId: terminalForm.terminalId || undefined,
        connectionStatus: 'disconnected',
      }));

      if (addPaymentTerminal.rejected.match(result)) {
        throw new Error(result.payload as string);
      }

      toast.success(`${terminalForm.name} added successfully`);
      setTerminalForm({ name: '', type: '', terminalId: '' });
      setActiveTab('status');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add terminal';
      toast.error(message);
    } finally {
      setIsAddingTerminal(false);
    }
  };

  // Hardware type options
  const hardwareTypeOptions: { value: HardwareDeviceType; label: string }[] = [
    { value: 'printer', label: 'Receipt Printer' },
    { value: 'cash_drawer', label: 'Cash Drawer' },
    { value: 'scanner', label: 'Barcode Scanner' },
  ];

  // Connection type options
  const connectionTypeOptions: { value: ConnectionType; label: string }[] = [
    { value: 'bluetooth', label: 'Bluetooth' },
    { value: 'usb', label: 'USB' },
    { value: 'network', label: 'Network (Wi-Fi/Ethernet)' },
  ];

  // Terminal type options
  const terminalTypeOptions: { value: TerminalType; label: string }[] = [
    { value: 'fiserv_ttp', label: 'Fiserv Tap to Pay' },
    { value: 'stripe_s700', label: 'Stripe S700' },
    { value: 'wisepad_3', label: 'WisePad 3' },
    { value: 'square_reader', label: 'Square Reader' },
  ];

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header - close button provided by DialogContent */}
        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <DialogTitle className="text-lg font-semibold">Device Setup</DialogTitle>
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
                              <div className="flex items-center justify-between px-6 py-2">
                                <DeviceStatusRow
                                  name={device.name}
                                  status={status}
                                  type="pad"
                                  lastSeen={device.lastSeen}
                                />
                                <div className="flex items-center gap-1 ml-2">
                                  {hasError && (
                                    <button
                                      onClick={() => handleRetryConnection(device.id, device.name, 'pad')}
                                      disabled={isRetrying === device.id}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                      title="Retry Connection"
                                    >
                                      <RefreshCw className={`w-3.5 h-3.5 ${isRetrying === device.id ? 'animate-spin' : ''}`} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => confirmUnpair(device.id, device.name, 'pad')}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Unpair Device"
                                  >
                                    <Unlink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
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
                          const deviceType: DeviceStatusRowType = device.type === 'printer' ? 'printer' : device.type === 'scanner' ? 'scanner' : 'cash_drawer';
                          return (
                            <div key={device.id} className={hasError ? 'bg-amber-50/50' : ''}>
                              <div className="flex items-center justify-between px-6 py-2">
                                <DeviceStatusRow
                                  name={device.name}
                                  status={status}
                                  type={deviceType}
                                />
                                <div className="flex items-center gap-1 ml-2">
                                  {hasError && (
                                    <button
                                      onClick={() => handleRetryConnection(device.id, device.name, 'hardware')}
                                      disabled={isRetrying === device.id}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                      title="Retry Connection"
                                    >
                                      <RefreshCw className={`w-3.5 h-3.5 ${isRetrying === device.id ? 'animate-spin' : ''}`} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => confirmUnpair(device.id, device.name, 'hardware')}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Remove Device"
                                  >
                                    <Unlink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
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
                              <div className="flex items-center justify-between px-6 py-2">
                                <DeviceStatusRow
                                  name={terminal.name}
                                  status={status}
                                  type="terminal"
                                />
                                <div className="flex items-center gap-1 ml-2">
                                  {hasError && (
                                    <button
                                      onClick={() => handleRetryConnection(terminal.id, terminal.name, 'terminal')}
                                      disabled={isRetrying === terminal.id}
                                      className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                      title="Retry Connection"
                                    >
                                      <RefreshCw className={`w-3.5 h-3.5 ${isRetrying === terminal.id ? 'animate-spin' : ''}`} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => confirmUnpair(terminal.id, terminal.name, 'terminal')}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Remove Terminal"
                                  >
                                    <Unlink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
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

          {/* Add Device Tab Content */}
          <TabsContent value="add" className="flex-1 overflow-y-auto px-6 m-0">
            <div className="py-6 space-y-4">
              {/* Mango Pad Section */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Tablet className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Add Mango Pad</h4>
                    <p className="text-xs text-gray-500">Connect iPad for signatures and customer display</p>
                  </div>
                </div>

                {/* Display pairing code for Mango Pad */}
                <div className="mt-3 space-y-3">
                  <p className="text-sm text-gray-600">
                    Enter this code on your Mango Pad to pair:
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-3xl font-mono font-bold tracking-widest bg-white px-6 py-3 rounded-lg border border-gray-200">
                      {isPairingCodeLoading ? (
                        <span className="text-gray-400">---</span>
                      ) : storePairingCode ? (
                        formatPairingCode(storePairingCode)
                      ) : (
                        <span className="text-gray-400">------</span>
                      )}
                    </div>
                    <button
                      onClick={handleRefreshPairingCode}
                      disabled={isPairingCodeLoading}
                      className="p-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                      title="Generate new code"
                    >
                      {isPairingCodeLoading ? (
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5 text-purple-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    The device will appear automatically once paired via MQTT
                  </p>
                </div>
              </div>

              {/* Hardware Section */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Printer className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Add Hardware</h4>
                    <p className="text-xs text-gray-500">Connect printers, scanners, and cash drawers</p>
                  </div>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Device Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Front Desk Printer"
                      value={hardwareForm.name}
                      onChange={(e) => setHardwareForm({ ...hardwareForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Device Type</label>
                      <Select
                        value={hardwareForm.type}
                        onValueChange={(value: HardwareDeviceType) =>
                          setHardwareForm({ ...hardwareForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {hardwareTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Connection</label>
                      <Select
                        value={hardwareForm.connectionType}
                        onValueChange={(value: ConnectionType) =>
                          setHardwareForm({ ...hardwareForm, connectionType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select connection" />
                        </SelectTrigger>
                        <SelectContent>
                          {connectionTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <button
                    onClick={handleAddHardware}
                    disabled={isAddingHardware || !hardwareForm.name || !hardwareForm.type || !hardwareForm.connectionType}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingHardware ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Hardware Device
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Payment Terminal Section */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Add Payment Terminal</h4>
                    <p className="text-xs text-gray-500">Connect card readers and payment devices</p>
                  </div>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-700">Terminal Name</label>
                    <Input
                      type="text"
                      placeholder="e.g., Checkout Terminal 1"
                      value={terminalForm.name}
                      onChange={(e) => setTerminalForm({ ...terminalForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">Terminal Type</label>
                      <Select
                        value={terminalForm.type}
                        onValueChange={(value: TerminalType) =>
                          setTerminalForm({ ...terminalForm, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {terminalTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-gray-700">
                        Terminal ID <span className="text-gray-400">(optional)</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Serial number"
                        value={terminalForm.terminalId}
                        onChange={(e) => setTerminalForm({ ...terminalForm, terminalId: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddTerminal}
                    disabled={isAddingTerminal || !terminalForm.name || !terminalForm.type}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingTerminal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Payment Terminal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Unpair Confirmation Dialog */}
    <AlertDialog open={deviceToUnpair !== null} onOpenChange={(open) => !open && setDeviceToUnpair(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Device</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <span className="font-medium">{deviceToUnpair?.name}</span>?
            This action cannot be undone and you will need to pair the device again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnpairDevice}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export default QuickDeviceSetupModal;
