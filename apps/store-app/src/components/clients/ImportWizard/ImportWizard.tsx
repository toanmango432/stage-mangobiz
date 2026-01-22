/**
 * ImportWizard - Phase 3 Client Import Wizard Container
 * Multi-step wizard for importing clients from CSV/Excel files.
 *
 * Features:
 * - Step indicator showing current progress
 * - State management across steps (file, mapping, options)
 * - Render correct step component based on current step
 * - Handle cancel/close
 * - Reset state on close
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { X, FileUp, GitMerge, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadStep, type ParsedFileData } from './UploadStep';
import { MappingStep, type ColumnMapping } from './MappingStep';
import { PreviewStep, type ImportResults } from './PreviewStep';

// ==================== TYPES ====================

type WizardStep = 'upload' | 'mapping' | 'preview';

interface ImportWizardProps {
  /** Whether the wizard is open */
  isOpen: boolean;
  /** Callback when wizard is closed */
  onClose: () => void;
  /** Callback when import is complete */
  onComplete?: (results: ImportResults) => void;
}

interface WizardState {
  fileData: ParsedFileData | null;
  mapping: ColumnMapping[];
}

// ==================== CONSTANTS ====================

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'upload', label: 'Upload', icon: <FileUp className="w-4 h-4" /> },
  { id: 'mapping', label: 'Map Fields', icon: <GitMerge className="w-4 h-4" /> },
  { id: 'preview', label: 'Import', icon: <Upload className="w-4 h-4" /> },
];

// ==================== COMPONENT ====================

export function ImportWizard({ isOpen, onClose, onComplete }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [state, setState] = useState<WizardState>({
    fileData: null,
    mapping: [],
  });
  const [isComplete, setIsComplete] = useState(false);

  // Reset wizard state
  const resetWizard = useCallback(() => {
    setCurrentStep('upload');
    setState({ fileData: null, mapping: [] });
    setIsComplete(false);
  }, []);

  // Handle close with reset
  const handleClose = useCallback(() => {
    onClose();
    // Reset after modal closes to avoid visual glitch
    setTimeout(resetWizard, 300);
  }, [onClose, resetWizard]);

  // Step handlers
  const handleFileReady = useCallback((fileData: ParsedFileData) => {
    setState((prev) => ({ ...prev, fileData }));
  }, []);

  const handleUploadContinue = useCallback(() => {
    setCurrentStep('mapping');
  }, []);

  const handleMappingComplete = useCallback((mapping: ColumnMapping[]) => {
    setState((prev) => ({ ...prev, mapping }));
  }, []);

  const handleMappingContinue = useCallback(() => {
    setCurrentStep('preview');
  }, []);

  const handleMappingBack = useCallback(() => {
    setCurrentStep('upload');
  }, []);

  const handlePreviewBack = useCallback(() => {
    setCurrentStep('mapping');
  }, []);

  const handleImportComplete = useCallback(
    (results: ImportResults) => {
      setIsComplete(true);
      onComplete?.(results);
    },
    [onComplete]
  );

  // Get current step index
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Import Clients</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Step Indicator */}
          {!isComplete && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {STEPS.map((step, idx) => {
                const isActive = step.id === currentStep;
                const isCompleted = idx < currentStepIndex;

                return (
                  <div key={step.id} className="flex items-center">
                    {idx > 0 && (
                      <div
                        className={cn(
                          'w-8 h-0.5 mx-2',
                          isCompleted ? 'bg-brand-500' : 'bg-gray-200'
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-100 text-brand-700'
                          : isCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.icon
                      )}
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogHeader>

        <div className="py-4">
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <UploadStep
              onFileReady={handleFileReady}
              onContinue={handleUploadContinue}
              onCancel={handleClose}
            />
          )}

          {/* Mapping Step */}
          {currentStep === 'mapping' && state.fileData && (
            <MappingStep
              fileData={state.fileData}
              initialMapping={state.mapping.length > 0 ? state.mapping : undefined}
              onMappingComplete={handleMappingComplete}
              onBack={handleMappingBack}
              onContinue={handleMappingContinue}
            />
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && state.fileData && (
            <PreviewStep
              fileData={state.fileData}
              mapping={state.mapping}
              onBack={handlePreviewBack}
              onComplete={handleImportComplete}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ImportWizard;
