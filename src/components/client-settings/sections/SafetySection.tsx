import React, { useState, useEffect } from 'react';
import type { EnhancedClient } from '../types';
import type { PatchTest, ClientFormResponse, FormTemplate, MedicalInfo } from '../../../types';
import { patchTestsDB, formResponsesDB, formTemplatesDB } from '../../../db/database';
import { PatchTestCard } from '../components/PatchTestCard';
import { PatchTestModal } from '../components/PatchTestModal';
import { ConsultationFormsCard } from '../components/ConsultationFormsCard';
import { FormResponseViewer } from '../components/FormResponseViewer';
import { Card, Toggle, Textarea, Badge, Button } from '../components/SharedComponents';

interface SafetySectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

// Mock service options - in production would come from services API
const SERVICE_OPTIONS = [
  { value: 'color-service', label: 'Hair Color' },
  { value: 'highlights', label: 'Highlights/Balayage' },
  { value: 'perm', label: 'Permanent Wave' },
  { value: 'relaxer', label: 'Chemical Relaxer' },
  { value: 'keratin', label: 'Keratin Treatment' },
  { value: 'lash-tint', label: 'Lash/Brow Tint' },
  { value: 'lash-lift', label: 'Lash Lift' },
  { value: 'facial', label: 'Chemical Peel/Facial' },
];

export const SafetySection: React.FC<SafetySectionProps> = ({
  client,
  onChange,
}) => {
  // Patch Tests State
  const [patchTests, setPatchTests] = useState<PatchTest[]>([]);
  const [showPatchTestModal, setShowPatchTestModal] = useState(false);
  const [editingPatchTest, setEditingPatchTest] = useState<PatchTest | undefined>();
  const [loadingTests, setLoadingTests] = useState(true);

  // Form Responses State
  const [formResponses, setFormResponses] = useState<ClientFormResponse[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([]);
  const [viewingResponse, setViewingResponse] = useState<ClientFormResponse | null>(null);
  const [loadingForms, setLoadingForms] = useState(true);

  // Medical Info State
  const medicalInfo = client.medicalInfo || {};
  const [editingMedical, setEditingMedical] = useState(false);
  const [localMedical, setLocalMedical] = useState<MedicalInfo>(medicalInfo);

  // Load patch tests
  useEffect(() => {
    const loadPatchTests = async () => {
      try {
        setLoadingTests(true);
        const tests = await patchTestsDB.getByClientId(client.id);
        setPatchTests(tests);
      } catch (error) {
        console.error('Failed to load patch tests:', error);
      } finally {
        setLoadingTests(false);
      }
    };
    loadPatchTests();
  }, [client.id]);

  // Load form responses and templates
  useEffect(() => {
    const loadForms = async () => {
      try {
        setLoadingForms(true);
        const [responses, templates] = await Promise.all([
          formResponsesDB.getByClientId(client.id),
          formTemplatesDB.getActiveByStore('current-store'), // Would use actual store ID
        ]);
        setFormResponses(responses);
        setFormTemplates(templates);
      } catch (error) {
        console.error('Failed to load forms:', error);
      } finally {
        setLoadingForms(false);
      }
    };
    loadForms();
  }, [client.id]);

  // Patch Test Handlers
  const handleAddPatchTest = () => {
    setEditingPatchTest(undefined);
    setShowPatchTestModal(true);
  };

  const handleEditPatchTest = (test: PatchTest) => {
    setEditingPatchTest(test);
    setShowPatchTestModal(true);
  };

  const handleSavePatchTest = async (testData: Omit<PatchTest, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    try {
      if (editingPatchTest) {
        // Update existing
        await patchTestsDB.update(editingPatchTest.id, testData);
        setPatchTests(prev => prev.map(t =>
          t.id === editingPatchTest.id ? { ...t, ...testData, updatedAt: new Date().toISOString() } : t
        ));
      } else {
        // Create new
        const newTest = await patchTestsDB.create(testData);
        setPatchTests(prev => [...prev, newTest]);
      }
      setShowPatchTestModal(false);
      setEditingPatchTest(undefined);
    } catch (error) {
      console.error('Failed to save patch test:', error);
    }
  };

  const handleDeletePatchTest = async (testId: string) => {
    try {
      await patchTestsDB.delete(testId);
      setPatchTests(prev => prev.filter(t => t.id !== testId));
    } catch (error) {
      console.error('Failed to delete patch test:', error);
    }
  };

  // Form Handlers
  const handleViewResponse = (response: ClientFormResponse) => {
    setViewingResponse(response);
  };

  const handleSendForm = async (templateId: string) => {
    // In production, this would send the form via email/SMS
    console.log('Sending form template:', templateId);
    // For now, create a pending response
    const template = formTemplates.find(t => t.id === templateId);
    if (template) {
      const newResponse = await formResponsesDB.create({
        formTemplateId: templateId,
        templateName: template.name,
        clientId: client.id,
        responses: {},
        status: 'pending',
        sentAt: new Date().toISOString(),
        completedBy: 'client',
      });
      setFormResponses(prev => [...prev, newResponse]);
    }
  };

  // Medical Info Handlers
  const handleMedicalChange = (field: keyof MedicalInfo, value: any) => {
    setLocalMedical(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMedical = () => {
    onChange({ medicalInfo: localMedical });
    setEditingMedical(false);
  };

  const handleCancelMedical = () => {
    setLocalMedical(medicalInfo);
    setEditingMedical(false);
  };

  // Check for any safety concerns
  const hasAllergies = (localMedical.allergies?.length || 0) > 0;
  const hasMedicalConditions = (localMedical.medicalConditions?.length || 0) > 0;
  const hasExpiredTests = patchTests.some(t => new Date(t.expiresAt) < new Date() && t.result === 'pass');
  const hasPendingForms = formResponses.some(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Safety Summary Banner */}
      {(hasAllergies || hasExpiredTests || hasPendingForms) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldAlertIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Safety Alerts</h3>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {hasAllergies && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Client has documented allergies
                  </li>
                )}
                {hasExpiredTests && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Patch test(s) have expired
                  </li>
                )}
                {hasPendingForms && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Pending consultation forms
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Medical Information */}
      <Card
        title="Medical Information"
        description="Important health and safety details"
        actions={
          !editingMedical ? (
            <Button variant="outline" size="sm" onClick={() => setEditingMedical(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelMedical}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveMedical}>
                Save
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergies
              {hasAllergies && (
                <Badge variant="error" size="sm" className="ml-2">
                  {localMedical.allergies?.length} recorded
                </Badge>
              )}
            </label>
            {editingMedical ? (
              <Textarea
                value={localMedical.allergies?.join(', ') || ''}
                onChange={(v) => handleMedicalChange('allergies', v.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Enter allergies separated by commas..."
                rows={2}
              />
            ) : (
              <p className={`text-sm ${hasAllergies ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                {localMedical.allergies?.join(', ') || 'None documented'}
              </p>
            )}
          </div>

          {/* Medications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
            {editingMedical ? (
              <Textarea
                value={localMedical.medications?.join(', ') || ''}
                onChange={(v) => handleMedicalChange('medications', v.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Enter medications separated by commas..."
                rows={2}
              />
            ) : (
              <p className="text-sm text-gray-500">
                {localMedical.medications?.join(', ') || 'None documented'}
              </p>
            )}
          </div>

          {/* Medical Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Conditions
              {hasMedicalConditions && (
                <Badge variant="warning" size="sm" className="ml-2">
                  {localMedical.medicalConditions?.length} recorded
                </Badge>
              )}
            </label>
            {editingMedical ? (
              <Textarea
                value={localMedical.medicalConditions?.join(', ') || ''}
                onChange={(v) => handleMedicalChange('medicalConditions', v.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Enter conditions separated by commas..."
                rows={2}
              />
            ) : (
              <p className="text-sm text-gray-500">
                {localMedical.medicalConditions?.join(', ') || 'None documented'}
              </p>
            )}
          </div>

          {/* Quick Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <Toggle
              label="Pregnancy Status"
              description={localMedical.pregnancyStatus === 'pregnant' ? 'Currently pregnant' : localMedical.pregnancyStatus === 'nursing' ? 'Currently nursing' : 'N/A'}
              checked={localMedical.pregnancyStatus === 'pregnant' || localMedical.pregnancyStatus === 'nursing'}
              onChange={(checked) => handleMedicalChange('pregnancyStatus', checked ? 'pregnant' : 'not_applicable')}
              disabled={!editingMedical}
            />
            <Toggle
              label="Has Pacemaker"
              description="Cannot receive certain treatments"
              checked={localMedical.pacemaker || false}
              onChange={(checked) => handleMedicalChange('pacemaker', checked)}
              disabled={!editingMedical}
            />
            <Toggle
              label="Blood Thinner Medication"
              description="May affect certain procedures"
              checked={localMedical.bloodThinner || false}
              onChange={(checked) => handleMedicalChange('bloodThinner', checked)}
              disabled={!editingMedical}
            />
            <Toggle
              label="Diabetic"
              description="Special care may be required"
              checked={localMedical.diabetic || false}
              onChange={(checked) => handleMedicalChange('diabetic', checked)}
              disabled={!editingMedical}
            />
            <Toggle
              label="Latex Allergy"
              description="Use latex-free gloves"
              checked={localMedical.hasLatexAllergy || false}
              onChange={(checked) => handleMedicalChange('hasLatexAllergy', checked)}
              disabled={!editingMedical}
            />
          </div>

          {/* Notes */}
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            {editingMedical ? (
              <Textarea
                value={localMedical.notes || ''}
                onChange={(v) => handleMedicalChange('notes', v)}
                placeholder="Any other medical information to note..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-500">
                {localMedical.notes || 'No additional notes'}
              </p>
            )}
          </div>

          {/* Consent Form Status */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Medical Consent Form</p>
              <p className="text-xs text-gray-500">
                {localMedical.consentFormSigned
                  ? `Signed on ${new Date(localMedical.consentFormDate || '').toLocaleDateString()}`
                  : 'Not yet signed'
                }
              </p>
            </div>
            <Badge variant={localMedical.consentFormSigned ? 'success' : 'warning'}>
              {localMedical.consentFormSigned ? 'Signed' : 'Pending'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Patch Tests */}
      {loadingTests ? (
        <Card title="Patch Tests">
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading patch tests...</p>
          </div>
        </Card>
      ) : (
        <PatchTestCard
          patchTests={patchTests}
          onAddTest={handleAddPatchTest}
          onEditTest={handleEditPatchTest}
          onDeleteTest={handleDeletePatchTest}
        />
      )}

      {/* Consultation Forms */}
      {loadingForms ? (
        <Card title="Consultation Forms">
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading forms...</p>
          </div>
        </Card>
      ) : (
        <ConsultationFormsCard
          formResponses={formResponses}
          onViewResponse={handleViewResponse}
          onSendForm={handleSendForm}
          availableTemplates={formTemplates.map(t => ({ id: t.id, name: t.name }))}
        />
      )}

      {/* Patch Test Modal */}
      {showPatchTestModal && (
        <PatchTestModal
          clientId={client.id}
          existingTest={editingPatchTest}
          serviceOptions={SERVICE_OPTIONS}
          staffName="Current Staff" // Would come from auth context
          onSave={handleSavePatchTest}
          onClose={() => {
            setShowPatchTestModal(false);
            setEditingPatchTest(undefined);
          }}
        />
      )}

      {/* Form Response Viewer */}
      {viewingResponse && (
        <FormResponseViewer
          response={viewingResponse}
          template={formTemplates.find(t => t.id === viewingResponse.formTemplateId)}
          onClose={() => setViewingResponse(null)}
        />
      )}
    </div>
  );
};

// Icons
const ShieldAlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
  </svg>
);

export default SafetySection;
