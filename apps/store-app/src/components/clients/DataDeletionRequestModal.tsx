/**
 * DataDeletionRequestModal - GDPR/CCPA Compliant Data Deletion
 * Allows staff to process data deletion requests with clear warnings and confirmation.
 *
 * Features:
 * - Shows client name and summary of data to be deleted
 * - Prominent "cannot be undone" warning
 * - Lists what will be anonymized vs preserved
 * - Requires typing "DELETE" to confirm
 * - Processing and success/error states
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Trash2, Shield, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { processDataDeletion } from '@/store/slices/clientsSlice';
import { selectMemberId, selectCurrentUser } from '@/store/slices/authSlice';
import type { Client, ClientDataRequest } from '@/types';

interface DataDeletionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  request?: ClientDataRequest;
  onDeletionComplete?: (clientId: string) => void;
}

export function DataDeletionRequestModal({
  isOpen,
  onClose,
  client,
  request,
  onDeletionComplete,
}: DataDeletionRequestModalProps) {
  const dispatch = useAppDispatch();
  const currentMemberId = useAppSelector(selectMemberId);
  const currentUser = useAppSelector(selectCurrentUser);

  const [confirmText, setConfirmText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    if (!client || !currentMemberId) {
      setError('Session error: Please log in again.');
      return;
    }

    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await dispatch(
        processDataDeletion({
          clientId: client.id,
          storeId: client.storeId,
          performedBy: currentMemberId,
          performedByName: currentUser?.name || currentUser?.email || 'Staff',
          requestId: request?.id,
          confirmed: true,
        })
      ).unwrap();

      setSuccess(true);
      // Delay close to show success state
      setTimeout(() => {
        onDeletionComplete?.(client.id);
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to process data deletion:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process data deletion. Please try again.';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!client) {
    return null;
  }

  const clientName = `${client.firstName} ${client.lastName}`;

  // Data that will be anonymized
  const anonymizedData = [
    'Name (replaced with "DELETED")',
    'Email (replaced with anonymized address)',
    'Phone number (replaced with "0000000000")',
    'Display name and nickname',
    'Profile photo',
  ];

  // Data that will be cleared (set to null)
  const clearedData = [
    'Address information',
    'Emergency contacts',
    'Staff alerts',
    'Hair, skin, and nail profiles',
    'Medical information',
    'Personal preferences',
    'Birthday and anniversary',
    'Referral information',
    'Client notes',
    'Form responses and signatures',
  ];

  // Data that will be preserved (for accounting)
  const preservedData = [
    'Transaction history (amounts and dates only)',
    'Visit counts and statistics',
    'Loyalty points balance',
    'Membership status',
    'Gift card balances',
    'Appointment records (with anonymized name)',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="w-5 h-5" />
            Delete Client Data
          </DialogTitle>
          <DialogDescription>
            Process GDPR/CCPA data deletion request for {clientName}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {success && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Data Deletion Complete
            </h3>
            <p className="text-sm text-gray-600">
              Client data has been anonymized. The profile will be updated shortly.
            </p>
          </div>
        )}

        {/* Main Content */}
        {!success && (
          <div className="space-y-4">
            {/* Critical Warning Banner */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-800 text-lg">
                  This action cannot be undone!
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  All personal information for <strong>{clientName}</strong> will be permanently
                  anonymized. This complies with GDPR/CCPA "right to be forgotten" requirements.
                </p>
              </div>
            </div>

            {/* Client Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>{' '}
                  <span className="font-medium">{clientName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>{' '}
                  <span className="font-medium">{client.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="font-medium">{client.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Visits:</span>{' '}
                  <span className="font-medium">{client.visitSummary?.totalVisits || 0}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Data Impact Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Will Be Removed */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h4 className="font-medium text-red-700">Will Be Anonymized/Removed</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-7">
                  {anonymizedData.map((item, index) => (
                    <li key={`anon-${index}`} className="list-disc">
                      {item}
                    </li>
                  ))}
                  {clearedData.map((item, index) => (
                    <li key={`clear-${index}`} className="list-disc text-gray-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Will Be Preserved */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium text-green-700">Will Be Preserved</h4>
                </div>
                <p className="text-xs text-gray-500 ml-7 -mt-2">
                  (Required for accounting/legal compliance)
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-7">
                  {preservedData.map((item, index) => (
                    <li key={`preserve-${index}`} className="list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            {/* Request Info (if from a data request) */}
            {request && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Processing Data Request</p>
                  <p className="text-blue-600">
                    Request ID: {request.id.slice(0, 8)}...
                    {' | '}
                    Submitted: {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Type DELETE to confirm */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Type <strong className="text-red-600">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => {
                  setConfirmText(e.target.value.toUpperCase());
                  setError(null);
                }}
                placeholder="Type DELETE"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 focus:outline-none text-lg tracking-wider"
                disabled={isProcessing}
              />
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">&#9696;</span>
                    Processing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Client Data
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DataDeletionRequestModal;
