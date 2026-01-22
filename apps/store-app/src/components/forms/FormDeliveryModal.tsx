/**
 * FormDeliveryModal - Send forms to clients via email or SMS
 *
 * PRD Reference: Client Module Phase 3 - US-021
 *
 * Features:
 * - Select form template from dropdown
 * - Select delivery method (Email/SMS/Both)
 * - Shows client contact info (email/phone)
 * - Warning if contact info missing for selected method
 * - Preview of form link
 * - Send button with loading state
 * - Success confirmation with 'Copy Link' option
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Mail,
  Phone,
  Send,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectStoreId } from '@/store/slices/authSlice';
import { sendFormToClient } from '@/store/slices/formsSlice';
import { supabase } from '@/services/supabase/client';
import type { Client } from '@/types/client';
import type { FormDeliveryMethod } from '@/types/form';

interface FormDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  appointmentId?: string;
  onSendComplete?: () => void;
}

type DeliveryMethodOption = FormDeliveryMethod | 'both';

interface FormTemplateOption {
  id: string;
  name: string;
  description?: string;
}

export function FormDeliveryModal({
  isOpen,
  onClose,
  client,
  appointmentId,
  onSendComplete,
}: FormDeliveryModalProps) {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector(selectStoreId);

  // Form state
  const [formTemplates, setFormTemplates] = useState<FormTemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodOption>('email');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Send state
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    formLink?: string;
    emailSent?: boolean;
    smsSent?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch form templates on mount
  useEffect(() => {
    if (isOpen && storeId) {
      fetchFormTemplates();
    }
  }, [isOpen, storeId]);

  const fetchFormTemplates = async () => {
    if (!storeId) return;

    setIsLoadingTemplates(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('form_templates')
        .select('id, name, description')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('[FormDeliveryModal] Error fetching templates:', fetchError);
        setError('Failed to load form templates.');
        return;
      }

      setFormTemplates(data || []);
    } catch (err) {
      console.error('[FormDeliveryModal] Unexpected error:', err);
      setError('Failed to load form templates.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Contact info validation
  const hasEmail = !!client.email;
  const hasPhone = !!client.phone;

  const canSendEmail = hasEmail;
  const canSendSms = hasPhone;
  const canSendBoth = hasEmail && hasPhone;

  const isDeliveryMethodValid = (): boolean => {
    switch (deliveryMethod) {
      case 'email':
        return canSendEmail;
      case 'sms':
        return canSendSms;
      case 'both':
        return canSendBoth;
      default:
        return false;
    }
  };

  const getContactWarning = (): string | null => {
    switch (deliveryMethod) {
      case 'email':
        if (!hasEmail) return 'Client has no email address on file.';
        break;
      case 'sms':
        if (!hasPhone) return 'Client has no phone number on file.';
        break;
      case 'both':
        if (!hasEmail && !hasPhone) return 'Client has no email or phone on file.';
        if (!hasEmail) return 'Client has no email address. Only SMS will be sent.';
        if (!hasPhone) return 'Client has no phone number. Only email will be sent.';
        break;
    }
    return null;
  };

  const handleSend = async () => {
    if (!storeId || !selectedTemplateId || !isDeliveryMethodValid()) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // If method is 'both', we send email first, then SMS
      const methods: FormDeliveryMethod[] =
        deliveryMethod === 'both' ? ['email', 'sms'] : [deliveryMethod];

      let formLink: string | undefined;
      let emailSent = false;
      let smsSent = false;

      for (const method of methods) {
        // Skip if client doesn't have the required contact info
        if (method === 'email' && !hasEmail) continue;
        if (method === 'sms' && !hasPhone) continue;

        const result = await dispatch(
          sendFormToClient({
            clientId: client.id,
            formTemplateId: selectedTemplateId,
            deliveryMethod: method,
            appointmentId,
            storeId,
          })
        ).unwrap();

        // Build the form link from the token
        const baseUrl = import.meta.env.VITE_FORM_BASE_URL || window.location.origin;
        formLink = `${baseUrl}/forms/complete/${result.token}`;

        if (method === 'email') emailSent = true;
        if (method === 'sms') smsSent = true;
      }

      setSendResult({
        success: true,
        formLink,
        emailSent,
        smsSent,
      });

      onSendComplete?.();
    } catch (err) {
      console.error('[FormDeliveryModal] Send error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send form. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = useCallback(async () => {
    if (!sendResult?.formLink) return;

    try {
      await navigator.clipboard.writeText(sendResult.formLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[FormDeliveryModal] Copy failed:', err);
    }
  }, [sendResult?.formLink]);

  const handleClose = () => {
    // Reset state
    setSelectedTemplateId('');
    setDeliveryMethod('email');
    setError(null);
    setSendResult(null);
    setCopied(false);
    onClose();
  };

  const selectedTemplate = formTemplates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />
            Send Form to Client
          </DialogTitle>
          <DialogDescription>
            Send a form to {client.firstName} {client.lastName} via email or SMS.
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {sendResult?.success ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-gray-900 mb-1">Form Sent Successfully</h3>
              <p className="text-sm text-gray-600">
                {sendResult.emailSent && sendResult.smsSent && 'Email and SMS sent.'}
                {sendResult.emailSent && !sendResult.smsSent && 'Email sent.'}
                {!sendResult.emailSent && sendResult.smsSent && 'SMS sent.'}
              </p>
            </div>

            {/* Form Link */}
            {sendResult.formLink && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Form Link</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border rounded px-2 py-1 truncate">
                    {sendResult.formLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* Form State */
          <div className="space-y-4 py-2">
            {/* Client Contact Info */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Client Contact</div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className={hasEmail ? 'text-gray-900' : 'text-gray-400 italic'}>
                  {client.email || 'No email on file'}
                </span>
                {hasEmail && <Badge variant="outline" className="text-xs">Available</Badge>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className={hasPhone ? 'text-gray-900' : 'text-gray-400 italic'}>
                  {client.phone || 'No phone on file'}
                </span>
                {hasPhone && <Badge variant="outline" className="text-xs">Available</Badge>}
              </div>
            </div>

            {/* Form Template Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Form Template
              </label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={isLoadingTemplates}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingTemplates ? 'Loading...' : 'Choose a form...'} />
                </SelectTrigger>
                <SelectContent>
                  {formTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                  {formTemplates.length === 0 && !isLoadingTemplates && (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No form templates available
                    </div>
                  )}
                </SelectContent>
              </Select>
              {selectedTemplate?.description && (
                <p className="text-xs text-gray-500">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Delivery Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Delivery Method
              </label>
              <RadioGroup
                value={deliveryMethod}
                onValueChange={(value) => setDeliveryMethod(value as DeliveryMethodOption)}
                className="grid grid-cols-3 gap-2"
              >
                <label
                  className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    deliveryMethod === 'email'
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!canSendEmail ? 'opacity-50' : ''}`}
                >
                  <RadioGroupItem value="email" id="email" disabled={!canSendEmail} />
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">Email</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    deliveryMethod === 'sms'
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!canSendSms ? 'opacity-50' : ''}`}
                >
                  <RadioGroupItem value="sms" id="sms" disabled={!canSendSms} />
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">SMS</span>
                </label>

                <label
                  className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    deliveryMethod === 'both'
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!canSendEmail && !canSendSms ? 'opacity-50' : ''}`}
                >
                  <RadioGroupItem
                    value="both"
                    id="both"
                    disabled={!canSendEmail && !canSendSms}
                  />
                  <span className="text-sm font-medium">Both</span>
                </label>
              </RadioGroup>
            </div>

            {/* Contact Warning */}
            {getContactWarning() && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{getContactWarning()}</AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={isSending}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!selectedTemplateId || !isDeliveryMethodValid() || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Form
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

export default FormDeliveryModal;
