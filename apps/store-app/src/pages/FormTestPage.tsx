/**
 * Form System Test Page
 * For validating Form Builder, Form Completion Portal, and Signature Capture
 */

import React, { useState } from 'react';
import { FormBuilder, FormCompletionPortal, SignatureCapture } from '../components/forms';
import { PRE_BUILT_TEMPLATES } from '../constants/formTemplates';
import type { FormTemplate } from '../types/form';
import type { TemplateLibraryItem } from '../types/form';

type TestView = 'builder' | 'portal' | 'signature' | 'templates';

export const FormTestPage: React.FC = () => {
  const [activeView, setActiveView] = useState<TestView>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const handleTemplateSave = async (template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
    console.log('Template saved:', template);
    alert('Template saved! Check console for details.');
  };

  const handleFormComplete = (responses: Record<string, unknown>) => {
    console.log('Form completed:', responses);
    alert('Form completed! Check console for responses.');
  };

  const handleSignatureChange = (data: { type: 'draw' | 'type'; dataUrl?: string; typedName?: string } | null) => {
    if (data?.dataUrl) {
      setSignatureData(data.dataUrl);
    } else {
      setSignatureData(null);
    }
    console.log('Signature data:', data);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Form System Test Page</h1>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          {(['templates', 'builder', 'portal', 'signature'] as TestView[]).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === view
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeView === 'templates' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Pre-built Templates</h2>
              <p className="text-gray-600 mb-4">
                Click on a template to preview it in the Form Completion Portal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRE_BUILT_TEMPLATES.map((item: TemplateLibraryItem) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      // Convert TemplateLibraryItem to FormTemplate for the portal
                      const template: FormTemplate = {
                        id: item.id,
                        storeId: 'test-store',
                        ...item.template,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        syncStatus: 'local',
                      };
                      setSelectedTemplate(template);
                      setActiveView('portal');
                    }}
                    className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.template.sections.length} sections
                      </span>
                      {item.template.requiresSignature && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Signature Required
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'builder' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Form Builder</h2>
              <p className="text-gray-600 mb-4">
                Create or edit form templates with drag-and-drop sections.
              </p>
              <FormBuilder
                template={selectedTemplate || undefined}
                onSave={handleTemplateSave}
                onCancel={() => setActiveView('templates')}
                storeId="test-store"
              />
            </div>
          )}

          {activeView === 'portal' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Form Completion Portal</h2>
              {selectedTemplate ? (
                <>
                  <p className="text-gray-600 mb-4">
                    Previewing: <strong>{selectedTemplate.name}</strong>
                  </p>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="mb-4 text-blue-600 hover:underline"
                  >
                    ← Back to templates
                  </button>
                  <FormCompletionPortal
                    template={selectedTemplate}
                    onSubmit={async (responses) => {
                      handleFormComplete(responses);
                    }}
                    onSaveDraft={(responses) => console.log('Draft saved:', responses)}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No template selected.</p>
                  <button
                    onClick={() => setActiveView('templates')}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Select a template
                  </button>
                </div>
              )}
            </div>
          )}

          {activeView === 'signature' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Signature Capture</h2>
              <p className="text-gray-600 mb-4">
                Test the standalone signature capture component.
              </p>
              <div className="max-w-md">
                <SignatureCapture
                  onChange={handleSignatureChange}
                  required={false}
                />
              </div>
              {signatureData && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Captured Signature:</h3>
                  <img
                    src={signatureData}
                    alt="Captured signature"
                    className="border rounded-lg max-w-md"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-800 text-gray-100 rounded-lg text-sm font-mono">
          <p>Active View: {activeView}</p>
          <p>Selected Template: {selectedTemplate?.name || 'None'}</p>
          <p>Signature Captured: {signatureData ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default FormTestPage;
