import React, { useState } from 'react';
import type { EnhancedClient } from '../types';
import { Card, Input, Select, Toggle, Textarea } from '../components/SharedComponents';

interface BeautyProfileSectionProps {
  client: EnhancedClient;
  onChange: (updates: Partial<EnhancedClient>) => void;
}

export const BeautyProfileSection: React.FC<BeautyProfileSectionProps> = ({
  client,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'hair' | 'skin' | 'nail' | 'medical'>('hair');

  const updateHairProfile = (field: string, value: any) => {
    onChange({
      hairProfile: { ...client.hairProfile, [field]: value },
    });
  };

  const updateSkinProfile = (field: string, value: any) => {
    onChange({
      skinProfile: { ...client.skinProfile, [field]: value },
    });
  };

  const updateNailProfile = (field: string, value: any) => {
    onChange({
      nailProfile: { ...client.nailProfile, [field]: value },
    });
  };

  const updateMedicalInfo = (field: string, value: any) => {
    onChange({
      medicalInfo: { ...client.medicalInfo, [field]: value },
    });
  };

  const tabs = [
    { id: 'hair', label: 'Hair Profile', icon: <ScissorsIcon className="w-4 h-4" /> },
    { id: 'skin', label: 'Skin Profile', icon: <SparkleIcon className="w-4 h-4" /> },
    { id: 'nail', label: 'Nail Profile', icon: <HandIcon className="w-4 h-4" /> },
    { id: 'medical', label: 'Medical Info', icon: <HeartIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-500'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hair Profile Tab */}
      {activeTab === 'hair' && (
        <div className="space-y-6">
          <Card title="Hair Characteristics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Hair Type"
                value={client.hairProfile?.type || ''}
                onChange={(v) => updateHairProfile('type', v)}
                options={[
                  { value: 'straight', label: 'Straight' },
                  { value: 'wavy', label: 'Wavy' },
                  { value: 'curly', label: 'Curly' },
                  { value: 'coily', label: 'Coily' },
                ]}
                placeholder="Select type"
              />

              <Select
                label="Hair Texture"
                value={client.hairProfile?.texture || ''}
                onChange={(v) => updateHairProfile('texture', v)}
                options={[
                  { value: 'fine', label: 'Fine' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'coarse', label: 'Coarse' },
                ]}
                placeholder="Select texture"
              />

              <Select
                label="Hair Density"
                value={client.hairProfile?.density || ''}
                onChange={(v) => updateHairProfile('density', v)}
                options={[
                  { value: 'thin', label: 'Thin' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'thick', label: 'Thick' },
                ]}
                placeholder="Select density"
              />

              <Select
                label="Porosity"
                value={client.hairProfile?.porosity || ''}
                onChange={(v) => updateHairProfile('porosity', v)}
                options={[
                  { value: 'low', label: 'Low Porosity' },
                  { value: 'normal', label: 'Normal Porosity' },
                  { value: 'high', label: 'High Porosity' },
                ]}
                placeholder="Select porosity"
              />

              <Select
                label="Scalp Condition"
                value={client.hairProfile?.scalpCondition || ''}
                onChange={(v) => updateHairProfile('scalpCondition', v)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'dry', label: 'Dry' },
                  { value: 'oily', label: 'Oily' },
                  { value: 'sensitive', label: 'Sensitive' },
                  { value: 'dandruff', label: 'Dandruff' },
                ]}
                placeholder="Select condition"
              />
            </div>
          </Card>

          <Card title="Color History">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Natural Hair Color"
                value={client.hairProfile?.naturalColor || ''}
                onChange={(v) => updateHairProfile('naturalColor', v)}
                placeholder="e.g., Dark Brown, Black"
              />

              <Input
                label="Current Hair Color"
                value={client.hairProfile?.currentColor || ''}
                onChange={(v) => updateHairProfile('currentColor', v)}
                placeholder="e.g., Caramel Balayage"
              />
            </div>

            <Textarea
              label="Previous Color History"
              value={client.hairProfile?.previousColorHistory || ''}
              onChange={(v) => updateHairProfile('previousColorHistory', v)}
              placeholder="Note any previous color treatments, box dye history, etc."
              rows={3}
            />

            {/* Color Formulas */}
            {client.hairProfile?.colorFormulas && client.hairProfile.colorFormulas.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Saved Color Formulas</h4>
                <div className="space-y-3">
                  {client.hairProfile.colorFormulas.map((formula) => (
                    <div
                      key={formula.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{formula.formula}</p>
                          <p className="text-sm text-gray-500">
                            {formula.brand} {formula.developer && `| ${formula.developer}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(formula.date).toLocaleDateString()}
                        </span>
                      </div>
                      {formula.processingTime && (
                        <p className="text-sm text-gray-600 mt-2">
                          Processing: {formula.processingTime}
                        </p>
                      )}
                      {formula.notes && (
                        <p className="text-sm text-gray-500 mt-1">{formula.notes}</p>
                      )}
                      {formula.staffName && (
                        <p className="text-xs text-gray-400 mt-2">By: {formula.staffName}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Chemical Treatments">
            <Input
              label="Chemical Treatments"
              value={client.hairProfile?.chemicalTreatments?.join(', ') || ''}
              onChange={(v) =>
                updateHairProfile(
                  'chemicalTreatments',
                  v.split(',').map((t) => t.trim()).filter(Boolean)
                )
              }
              placeholder="e.g., Keratin, Relaxer, Perm (comma separated)"
            />
          </Card>
        </div>
      )}

      {/* Skin Profile Tab */}
      {activeTab === 'skin' && (
        <div className="space-y-6">
          <Card title="Skin Analysis">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Skin Type"
                value={client.skinProfile?.type || ''}
                onChange={(v) => updateSkinProfile('type', v)}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'dry', label: 'Dry' },
                  { value: 'oily', label: 'Oily' },
                  { value: 'combination', label: 'Combination' },
                  { value: 'sensitive', label: 'Sensitive' },
                ]}
                placeholder="Select skin type"
              />

              <Select
                label="Fitzpatrick Scale (Skin Phototype)"
                value={String(client.skinProfile?.fitzpatrickScale || '')}
                onChange={(v) => updateSkinProfile('fitzpatrickScale', v ? parseInt(v) : undefined)}
                options={[
                  { value: '1', label: 'Type I - Very Fair' },
                  { value: '2', label: 'Type II - Fair' },
                  { value: '3', label: 'Type III - Medium' },
                  { value: '4', label: 'Type IV - Olive' },
                  { value: '5', label: 'Type V - Brown' },
                  { value: '6', label: 'Type VI - Dark Brown/Black' },
                ]}
                placeholder="Select phototype"
              />
            </div>

            {/* Skin Concerns */}
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Skin Concerns
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'acne', label: 'Acne' },
                  { value: 'aging', label: 'Aging' },
                  { value: 'hyperpigmentation', label: 'Hyperpigmentation' },
                  { value: 'rosacea', label: 'Rosacea' },
                  { value: 'eczema', label: 'Eczema' },
                  { value: 'dehydration', label: 'Dehydration' },
                  { value: 'sun_damage', label: 'Sun Damage' },
                  { value: 'fine_lines', label: 'Fine Lines' },
                  { value: 'large_pores', label: 'Large Pores' },
                  { value: 'uneven_texture', label: 'Uneven Texture' },
                  { value: 'dark_circles', label: 'Dark Circles' },
                ].map((concern) => {
                  const isSelected = client.skinProfile?.concerns?.includes(concern.value as any);
                  return (
                    <button
                      key={concern.value}
                      type="button"
                      onClick={() => {
                        const current = client.skinProfile?.concerns || [];
                        const updated = isSelected
                          ? current.filter((c) => c !== concern.value)
                          : [...current, concern.value];
                        updateSkinProfile('concerns', updated);
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                        ${isSelected
                          ? 'bg-cyan-100 text-cyan-700 border-2 border-cyan-500'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                        }
                      `}
                    >
                      {concern.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card title="Sensitivities & Current Products">
            <div className="space-y-4">
              <Input
                label="Skin Allergies"
                value={client.skinProfile?.allergies?.join(', ') || ''}
                onChange={(v) =>
                  updateSkinProfile(
                    'allergies',
                    v.split(',').map((a) => a.trim()).filter(Boolean)
                  )
                }
                placeholder="e.g., Fragrances, Retinol (comma separated)"
              />

              <Input
                label="Sensitivities"
                value={client.skinProfile?.sensitivities?.join(', ') || ''}
                onChange={(v) =>
                  updateSkinProfile(
                    'sensitivities',
                    v.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="e.g., AHA/BHA, Strong acids (comma separated)"
              />

              <Textarea
                label="Current Skincare Products"
                value={client.skinProfile?.currentProducts || ''}
                onChange={(v) => updateSkinProfile('currentProducts', v)}
                placeholder="List current skincare routine..."
                rows={3}
              />

              <Textarea
                label="Treatment History"
                value={client.skinProfile?.treatmentHistory || ''}
                onChange={(v) => updateSkinProfile('treatmentHistory', v)}
                placeholder="Previous facial treatments, peels, etc."
                rows={3}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Nail Profile Tab */}
      {activeTab === 'nail' && (
        <div className="space-y-6">
          <Card title="Nail Profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Nail Condition"
                value={client.nailProfile?.condition || ''}
                onChange={(v) => updateNailProfile('condition', v)}
                options={[
                  { value: 'healthy', label: 'Healthy' },
                  { value: 'brittle', label: 'Brittle' },
                  { value: 'peeling', label: 'Peeling' },
                  { value: 'ridged', label: 'Ridged' },
                  { value: 'discolored', label: 'Discolored' },
                ]}
                placeholder="Select condition"
              />

              <Select
                label="Preferred Shape"
                value={client.nailProfile?.preferredShape || ''}
                onChange={(v) => updateNailProfile('preferredShape', v)}
                options={[
                  { value: 'round', label: 'Round' },
                  { value: 'square', label: 'Square' },
                  { value: 'oval', label: 'Oval' },
                  { value: 'almond', label: 'Almond' },
                  { value: 'coffin', label: 'Coffin/Ballerina' },
                  { value: 'stiletto', label: 'Stiletto' },
                ]}
                placeholder="Select shape"
              />

              <Input
                label="Allergies"
                value={client.nailProfile?.allergies?.join(', ') || ''}
                onChange={(v) =>
                  updateNailProfile(
                    'allergies',
                    v.split(',').map((a) => a.trim()).filter(Boolean)
                  )
                }
                placeholder="e.g., Latex, Acetone (comma separated)"
              />

              <Input
                label="Preferred Colors"
                value={client.nailProfile?.preferredColors?.join(', ') || ''}
                onChange={(v) =>
                  updateNailProfile(
                    'preferredColors',
                    v.split(',').map((c) => c.trim()).filter(Boolean)
                  )
                }
                placeholder="e.g., Nude, French, Red (comma separated)"
              />
            </div>

            <Textarea
              label="Notes"
              value={client.nailProfile?.notes || ''}
              onChange={(v) => updateNailProfile('notes', v)}
              placeholder="Any additional notes about nail services..."
              rows={3}
              className="mt-4"
            />
          </Card>
        </div>
      )}

      {/* Medical Info Tab */}
      {activeTab === 'medical' && (
        <div className="space-y-6">
          <Card
            title="Medical Information"
            description="Important health information for safe treatments"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Confidential Information</p>
                  <p className="text-sm text-amber-700 mt-1">
                    This medical information is kept confidential and is only used to ensure
                    client safety during treatments.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Allergies"
                value={client.medicalInfo?.allergies?.join(', ') || ''}
                onChange={(v) =>
                  updateMedicalInfo(
                    'allergies',
                    v.split(',').map((a) => a.trim()).filter(Boolean)
                  )
                }
                placeholder="e.g., PPD, Latex, Fragrances (comma separated)"
              />

              <Input
                label="Current Medications"
                value={client.medicalInfo?.medications?.join(', ') || ''}
                onChange={(v) =>
                  updateMedicalInfo(
                    'medications',
                    v.split(',').map((m) => m.trim()).filter(Boolean)
                  )
                }
                placeholder="e.g., Blood thinners, Accutane (comma separated)"
              />

              <Input
                label="Medical Conditions"
                value={client.medicalInfo?.medicalConditions?.join(', ') || ''}
                onChange={(v) =>
                  updateMedicalInfo(
                    'medicalConditions',
                    v.split(',').map((c) => c.trim()).filter(Boolean)
                  )
                }
                placeholder="e.g., Diabetes, Hypertension (comma separated)"
              />

              <Select
                label="Pregnancy Status"
                value={client.medicalInfo?.pregnancyStatus || ''}
                onChange={(v) => updateMedicalInfo('pregnancyStatus', v)}
                options={[
                  { value: 'not_applicable', label: 'Not Applicable' },
                  { value: 'pregnant', label: 'Pregnant' },
                  { value: 'nursing', label: 'Nursing' },
                  { value: 'trying', label: 'Trying to Conceive' },
                ]}
                placeholder="Select status"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <Toggle
                  label="Has Pacemaker"
                  checked={client.medicalInfo?.pacemaker || false}
                  onChange={(v) => updateMedicalInfo('pacemaker', v)}
                />

                <Toggle
                  label="Taking Blood Thinners"
                  checked={client.medicalInfo?.bloodThinner || false}
                  onChange={(v) => updateMedicalInfo('bloodThinner', v)}
                />

                <Toggle
                  label="Diabetic"
                  checked={client.medicalInfo?.diabetic || false}
                  onChange={(v) => updateMedicalInfo('diabetic', v)}
                />

                <Toggle
                  label="Latex Allergy"
                  checked={client.medicalInfo?.hasLatexAllergy || false}
                  onChange={(v) => updateMedicalInfo('hasLatexAllergy', v)}
                />
              </div>

              <Textarea
                label="Recent Surgeries"
                value={client.medicalInfo?.recentSurgeries || ''}
                onChange={(v) => updateMedicalInfo('recentSurgeries', v)}
                placeholder="Note any recent surgeries or procedures..."
                rows={2}
              />

              <Textarea
                label="Additional Medical Notes"
                value={client.medicalInfo?.notes || ''}
                onChange={(v) => updateMedicalInfo('notes', v)}
                placeholder="Any other relevant medical information..."
                rows={3}
              />
            </div>
          </Card>

          <Card title="Consent Form">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Consent Form Status</p>
                {client.medicalInfo?.consentFormSigned ? (
                  <p className="text-sm text-gray-500">
                    Signed on {new Date(client.medicalInfo.consentFormDate!).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Not signed</p>
                )}
              </div>
              <Toggle
                label=""
                checked={client.medicalInfo?.consentFormSigned || false}
                onChange={(v) => {
                  updateMedicalInfo('consentFormSigned', v);
                  if (v) {
                    updateMedicalInfo('consentFormDate', new Date().toISOString());
                  }
                }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Icons
const ScissorsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
  </svg>
);

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const HandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
  </svg>
);

const HeartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const AlertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

export default BeautyProfileSection;
