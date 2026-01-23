import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { EnhancedClient, ClientGender, ClientSource, EmergencyContact } from '../types';
import type { BlockReason, Client, StaffAlert } from '@/types';
import { genderLabels, sourceLabels } from '../constants';
import {
  Card,
  Input,
  Select,
  Toggle,
  Avatar,
  Badge,
  Button,
  PhoneIcon,
  MailIcon,
  CalendarIcon,
} from '../components/SharedComponents';
import { StaffAlertBanner } from '../components/StaffAlertBanner';
import { BlockClientModal } from '../components/BlockClientModal';
import { ConsentManagement } from '@/components/clients/ConsentManagement';
import { DataDeletionRequestModal } from '@/components/clients/DataDeletionRequestModal';
import { FormDeliveryModal } from '@/components/forms/FormDeliveryModal';
import { LinkedStoresPanel } from '@/components/clients/LinkedStoresPanel';
import { EcosystemConsentModal } from '@/components/clients/EcosystemConsentModal';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMemberId, selectMemberName, selectMemberRole, selectStoreId } from '@/store/slices/authSlice';
import { exportClientData, createDataRequest } from '@/store/slices/clientsSlice';
import { fetchLinkedStores } from '@/store/slices/clientsSlice/multiStoreThunks';
import { FileText } from 'lucide-react';

interface ProfileSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
  onSetStaffAlert?: (message: string) => void;
  onClearStaffAlert?: () => void;
  onBlockClient?: (reason: BlockReason, note?: string) => void;
  onUnblockClient?: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  client,
  onChange,
  onSetStaffAlert,
  onClearStaffAlert,
  onBlockClient,
  onUnblockClient,
}) => {
  const dispatch = useAppDispatch();
  const memberId = useAppSelector(selectMemberId);
  const memberName = useAppSelector(selectMemberName);
  const memberRole = useAppSelector(selectMemberRole);
  const storeId = useAppSelector(selectStoreId);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showFormDeliveryModal, setShowFormDeliveryModal] = useState(false);
  const [showEcosystemModal, setShowEcosystemModal] = useState(false);
  const [linkedStoresCount, setLinkedStoresCount] = useState(0);
  const [ecosystemExpanded, setEcosystemExpanded] = useState(false);

  // Check if user has permission to delete client data (managers/owners only)
  const canDeleteClientData = memberRole === 'owner' || memberRole === 'manager' || memberRole === 'admin';

  // Fetch linked stores count for ecosystem section
  useEffect(() => {
    const loadLinkedStoresCount = async () => {
      if (client.id) {
        try {
          const result = await dispatch(fetchLinkedStores({ clientId: client.id })).unwrap();
          setLinkedStoresCount(result.length);
        } catch (err) {
          // Silently handle - client may not be part of ecosystem
          console.debug('[ProfileSection] Could not fetch linked stores:', err);
        }
      }
    };
    loadLinkedStoresCount();
  }, [dispatch, client.id]);

  // Export data state
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const updateContact = (field: string, value: string) => {
    onChange({
      contact: { ...client.contact, [field]: value },
    });
  };

  const updateAddress = (field: string, value: string) => {
    onChange({
      address: { ...client.address, [field]: value },
    });
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const contacts = [...(client.emergencyContact ? [client.emergencyContact] : [])];
    if (contacts[index]) {
      contacts[index] = { ...contacts[index], [field]: value };
      onChange({ emergencyContact: contacts[0] });
    }
  };

  const addEmergencyContact = () => {
    onChange({
      emergencyContact: { name: '', phone: '', relationship: '' },
    });
  };

  const removeEmergencyContact = () => {
    onChange({ emergencyContact: undefined });
  };

  const handleSetStaffAlert = (message: string) => {
    if (onSetStaffAlert) {
      onSetStaffAlert(message);
    }
  };

  const handleClearStaffAlert = () => {
    if (onClearStaffAlert) {
      onClearStaffAlert();
    }
  };

  const handleBlock = (reason: BlockReason, note?: string) => {
    if (onBlockClient) {
      onBlockClient(reason, note);
    }
    setShowBlockModal(false);
  };

  const handleUnblock = () => {
    if (onUnblockClient) {
      onUnblockClient();
    }
    setShowBlockModal(false);
  };

  const genderOptions = Object.entries(genderLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const sourceOptions = Object.entries(sourceLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Convert client's staffAlert to the expected format if needed
  // Type guard to check if staffAlert is a StaffAlert object
  const isStaffAlertObject = (alert: unknown): alert is StaffAlert =>
    typeof alert === 'object' && alert !== null && 'message' in alert;

  const staffAlert = client.staffAlert ? {
    message: typeof client.staffAlert === 'string' ? client.staffAlert : isStaffAlertObject(client.staffAlert) ? client.staffAlert.message : '',
    createdAt: isStaffAlertObject(client.staffAlert) ? client.staffAlert.createdAt : new Date().toISOString(),
    createdBy: isStaffAlertObject(client.staffAlert) ? client.staffAlert.createdBy : '',
    createdByName: isStaffAlertObject(client.staffAlert) ? client.staffAlert.createdByName : 'Staff',
  } : undefined;

  // Convert EnhancedClient to Client type for ConsentManagement component
  const clientForConsent: Client = useMemo(() => ({
    id: client.id,
    storeId: client.storeId,
    firstName: client.firstName,
    lastName: client.lastName,
    displayName: client.displayName,
    phone: client.contact.phone,
    email: client.contact.email,
    avatar: client.avatar,
    gender: client.gender,
    birthday: client.birthday,
    isBlocked: client.isBlocked,
    isVip: client.isVip,
    communicationPreferences: client.communicationPreferences,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    syncStatus: client.syncStatus,
    mangoIdentityId: client.mangoIdentityId,
  }), [client]);

  // Handle consent preference updates
  const handleConsentChange = (updates: Partial<Client>) => {
    // Map Client updates back to EnhancedClient format
    if (updates.communicationPreferences) {
      onChange({ communicationPreferences: updates.communicationPreferences });
    }
  };

  // Handle export client data
  const handleExportData = useCallback(async () => {
    if (!storeId || !memberId) {
      setExportError('Store or member information is missing');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    setDownloadUrl(null);

    try {
      // First create a data request record
      const requestResult = await dispatch(createDataRequest({
        clientId: client.id,
        storeId,
        requestType: 'export',
        notes: 'Initiated from client profile',
      })).unwrap();

      // Then trigger the export with the request ID
      const exportResult = await dispatch(exportClientData({
        clientId: client.id,
        storeId,
        performedBy: memberId,
        performedByName: memberName,
        requestId: requestResult.id,
      })).unwrap();

      setDownloadUrl(exportResult.downloadUrl);
      setExportSuccess(true);

      // Auto-clear success message after 10 seconds
      setTimeout(() => {
        setExportSuccess(false);
      }, 10000);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message :
        typeof err === 'string' ? err :
        'Failed to export client data'
      );
    } finally {
      setIsExporting(false);
    }
  }, [dispatch, client.id, storeId, memberId, memberName]);

  // Trigger download when URL is available
  const handleDownload = useCallback(() => {
    if (downloadUrl) {
      // Create a temporary anchor to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `client-data-${client.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [downloadUrl, client.id]);

  // Handle opening the data deletion modal
  const handleOpenDeletionModal = useCallback(() => {
    setShowDeletionModal(true);
  }, []);

  // Handle closing the deletion modal
  const handleCloseDeletionModal = useCallback(() => {
    setShowDeletionModal(false);
  }, []);

  // Handle successful data deletion
  const handleDeletionComplete = useCallback((deletedClientId: string) => {
    setShowDeletionModal(false);
    // The client profile will be updated automatically via Redux state
    console.log(`Client ${deletedClientId} data has been anonymized`);
  }, []);

  return (
    <div className="space-y-6">
      {/* Staff Alert Banner - High Visibility */}
      {(onSetStaffAlert || staffAlert) && (
        <StaffAlertBanner
          alert={staffAlert}
          onSetAlert={handleSetStaffAlert}
          onClearAlert={handleClearStaffAlert}
          canEdit={!!onSetStaffAlert}
        />
      )}

      {/* Blocked Client Warning */}
      {client.isBlocked && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <BlockIcon className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">Client is Blocked</h3>
              <p className="text-sm text-red-600 mt-1">
                This client cannot book appointments.
                {client.blockReason && ` Reason: ${client.blockReason}`}
              </p>
              {onUnblockClient && (
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-800 underline"
                >
                  Manage block status
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <Card>
        <div className="flex items-start gap-6">
          <div className="relative">
            <Avatar
              src={client.avatar}
              name={`${client.firstName} ${client.lastName}`}
              size="xl"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50">
              <CameraIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {client.firstName} {client.lastName}
              </h2>
              {client.isVip && (
                <Badge variant="warning" size="sm">VIP</Badge>
              )}
              {client.isBlocked && (
                <Badge variant="error" size="sm">Blocked</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                {client.contact.phone}
              </div>
              {client.contact.email && (
                <div className="flex items-center gap-1.5">
                  <MailIcon className="w-4 h-4 text-gray-400" />
                  {client.contact.email}
                </div>
              )}
              {client.birthday && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  {formatDate(client.birthday)}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500">Client since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(client.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total visits</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.visitSummary.totalVisits}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total spent</p>
                  <p className="text-sm font-medium text-gray-900">
                    ${client.visitSummary.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFormDeliveryModal(true)}
                icon={<FileText className="w-4 h-4" />}
              >
                Send Form
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={client.firstName}
            onChange={(v) => onChange({ firstName: v })}
            required
          />
          <Input
            label="Last Name"
            value={client.lastName}
            onChange={(v) => onChange({ lastName: v })}
            required
          />
          <Input
            label="Display Name / Nickname"
            value={client.displayName || ''}
            onChange={(v) => onChange({ displayName: v })}
            placeholder="How they like to be called"
          />
          <Select
            label="Gender"
            value={client.gender || ''}
            onChange={(v) => onChange({ gender: v as ClientGender })}
            options={genderOptions}
            placeholder="Select gender"
          />
          <Input
            label="Birthday"
            value={client.birthday || ''}
            onChange={(v) => onChange({ birthday: v })}
            type="date"
          />
        </div>
      </Card>

      {/* Contact Information */}
      <Card title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            value={client.contact.phone}
            onChange={(v) => updateContact('phone', v)}
            type="tel"
            required
          />
          <Select
            label="Phone Type"
            value={client.contact.phoneType}
            onChange={(v) => updateContact('phoneType', v)}
            options={[
              { value: 'mobile', label: 'Mobile' },
              { value: 'home', label: 'Home' },
              { value: 'work', label: 'Work' },
            ]}
          />
          <Input
            label="Email"
            value={client.contact.email || ''}
            onChange={(v) => updateContact('email', v)}
            type="email"
            placeholder="email@example.com"
          />
          <Input
            label="Alternate Phone"
            value={client.contact.alternatePhone || ''}
            onChange={(v) => updateContact('alternatePhone', v)}
            type="tel"
            placeholder="(555) 123-4567"
          />
        </div>
      </Card>

      {/* Address */}
      <Card title="Address">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Street Address"
            value={client.address?.street || ''}
            onChange={(v) => updateAddress('street', v)}
            placeholder="123 Main Street"
            className="md:col-span-2"
          />
          <Input
            label="Apt/Suite"
            value={client.address?.apt || ''}
            onChange={(v) => updateAddress('apt', v)}
            placeholder="Apt 4B"
          />
          <Input
            label="City"
            value={client.address?.city || ''}
            onChange={(v) => updateAddress('city', v)}
            placeholder="Los Angeles"
          />
          <Input
            label="State"
            value={client.address?.state || ''}
            onChange={(v) => updateAddress('state', v)}
            placeholder="CA"
          />
          <Input
            label="ZIP Code"
            value={client.address?.zipCode || ''}
            onChange={(v) => updateAddress('zipCode', v)}
            placeholder="90001"
          />
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card title="Emergency Contact">
        {client.emergencyContact ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Contact Name"
                value={client.emergencyContact.name}
                onChange={(v) => updateEmergencyContact(0, 'name', v)}
                placeholder="John Doe"
                required
              />
              <Input
                label="Phone Number"
                value={client.emergencyContact.phone}
                onChange={(v) => updateEmergencyContact(0, 'phone', v)}
                type="tel"
                placeholder="(555) 123-4567"
                required
              />
              <Input
                label="Relationship"
                value={client.emergencyContact.relationship}
                onChange={(v) => updateEmergencyContact(0, 'relationship', v)}
                placeholder="Spouse, Parent, etc."
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={removeEmergencyContact}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove Emergency Contact
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <EmergencyIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-3">
              No emergency contact on file
            </p>
            <Button variant="secondary" size="sm" onClick={addEmergencyContact}>
              Add Emergency Contact
            </Button>
          </div>
        )}
      </Card>

      {/* Source & Referral */}
      <Card title="How They Found You">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Source"
            value={client.source || ''}
            onChange={(v) => onChange({ source: v as ClientSource })}
            options={sourceOptions}
            placeholder="Select source"
          />
          {client.source === 'referral' && (
            <Input
              label="Referred By"
              value={client.referredByClientName || ''}
              onChange={(v) => onChange({ referredByClientName: v })}
              placeholder="Enter referrer's name"
            />
          )}
        </div>
      </Card>

      {/* Status Settings */}
      <Card title="Client Status">
        <div className="space-y-4">
          <Toggle
            label="VIP Client"
            description="Mark this client as a VIP for priority service"
            checked={client.isVip}
            onChange={(v) => onChange({ isVip: v })}
          />

          {/* Block/Unblock with modal */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Block Status</p>
              <p className="text-sm text-gray-500">
                {client.isBlocked
                  ? 'This client is blocked from booking'
                  : 'Client can book appointments normally'
                }
              </p>
            </div>
            <button
              onClick={() => setShowBlockModal(true)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${client.isBlocked
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                }
              `}
            >
              {client.isBlocked ? 'Unblock Client' : 'Block Client'}
            </button>
          </div>
        </div>
      </Card>

      {/* Privacy & Consent - GDPR/CCPA Compliance */}
      <ConsentManagement
        client={clientForConsent}
        onChange={handleConsentChange}
      />

      {/* Mango Network - Cross-Store Identity Sharing */}
      <Card>
        <button
          onClick={() => setEcosystemExpanded(!ecosystemExpanded)}
          className="w-full flex items-center justify-between p-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <NetworkIcon className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Mango Network</h3>
              <p className="text-sm text-gray-500">
                {client.mangoIdentityId
                  ? `Opted in${linkedStoresCount > 0 ? ` · ${linkedStoresCount} linked store${linkedStoresCount > 1 ? 's' : ''}` : ''}`
                  : 'Not participating in cross-store sharing'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {client.mangoIdentityId && (
              <Badge variant="success" size="sm">Active</Badge>
            )}
            <ChevronIcon className={`w-5 h-5 text-gray-400 transition-transform ${ecosystemExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Collapsible Content */}
        {ecosystemExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {/* Status Row */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Ecosystem Status</p>
                <p className="text-sm text-gray-500">
                  {client.mangoIdentityId
                    ? 'Client can be recognized at other Mango locations'
                    : 'Client is not linked to the Mango ecosystem'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEcosystemModal(true)}
              >
                Manage
              </Button>
            </div>

            {/* Linked Stores Panel - Only show if opted in */}
            {client.mangoIdentityId && storeId && (
              <LinkedStoresPanel
                clientId={client.id}
                currentStoreId={storeId}
                onUnlink={() => {
                  // Refresh linked stores count after unlink
                  dispatch(fetchLinkedStores({ clientId: client.id }))
                    .unwrap()
                    .then((result) => setLinkedStoresCount(result.length))
                    .catch(() => setLinkedStoresCount(0));
                }}
              />
            )}

            {/* Info Box */}
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
              <p className="text-xs text-cyan-700">
                The Mango Network allows clients to share their safety information (allergies, blocks)
                and optionally other preferences across participating Mango locations.
                Safety data is always shared for client protection.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Data Management - GDPR Data Portability */}
      <Card title="Data Management">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Export or manage client data in compliance with GDPR/CCPA regulations.
          </p>

          {/* Export Success Message */}
          {exportSuccess && downloadUrl && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Export completed successfully!
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Click the download button to save the file.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <DownloadIcon className="w-4 h-4" />
                Download
              </button>
            </div>
          )}

          {/* Export Error Message */}
          {exportError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  Export failed
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  {exportError}
                </p>
              </div>
              <button
                onClick={() => setExportError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Export Button */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Export Client Data</p>
              <p className="text-sm text-gray-500">
                Download all data associated with this client (profile, appointments, transactions)
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportData}
              disabled={isExporting}
              icon={isExporting ? <LoadingSpinner /> : <DownloadIcon className="w-4 h-4" />}
            >
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </div>

          {/* Delete Client Data Button - Only visible to managers/owners */}
          {canDeleteClientData && (
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-red-800">Delete Client Data</p>
                <p className="text-sm text-red-600">
                  Permanently anonymize all personal information (GDPR/CCPA compliant)
                </p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleOpenDeletionModal}
                icon={<TrashIcon className="w-4 h-4" />}
              >
                Delete Data
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Block Client Modal */}
      {showBlockModal && (
        <BlockClientModal
          clientName={`${client.firstName} ${client.lastName}`}
          isBlocked={client.isBlocked}
          currentReason={client.blockReason as any}
          currentNote={client.blockReason}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onClose={() => setShowBlockModal(false)}
        />
      )}

      {/* Data Deletion Request Modal - GDPR/CCPA Compliance */}
      <DataDeletionRequestModal
        isOpen={showDeletionModal}
        onClose={handleCloseDeletionModal}
        client={clientForConsent}
        onDeletionComplete={handleDeletionComplete}
      />

      {/* Form Delivery Modal - Phase 3 Forms */}
      <FormDeliveryModal
        isOpen={showFormDeliveryModal}
        onClose={() => setShowFormDeliveryModal(false)}
        client={clientForConsent}
        onSendComplete={() => setShowFormDeliveryModal(false)}
      />

      {/* Ecosystem Consent Modal - Multi-Store Sharing */}
      <EcosystemConsentModal
        isOpen={showEcosystemModal}
        onClose={() => setShowEcosystemModal(false)}
        client={clientForConsent}
        onComplete={() => {
          // Refresh linked stores after opt-in/opt-out
          dispatch(fetchLinkedStores({ clientId: client.id }))
            .unwrap()
            .then((result) => setLinkedStoresCount(result.length))
            .catch(() => setLinkedStoresCount(0));
        }}
      />
    </div>
  );
};

// Camera Icon
const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Block Icon
const BlockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

// Emergency Icon
const EmergencyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

// Download Icon
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Check Circle Icon
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// X Circle Icon
const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// X Icon (for dismissing)
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Loading Spinner
const LoadingSpinner: React.FC = () => (
  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Trash Icon (for delete button)
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Network Icon (for Mango Network section)
const NetworkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

// Chevron Icon (for collapsible sections)
const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default ProfileSection;
