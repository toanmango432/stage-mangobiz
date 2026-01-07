import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Service, ServiceQuestion, AddOn } from './types';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  service: Service;
  availableAddOns?: AddOn[];
  onComplete: (answers: Record<string, any>, selectedAddOns: AddOn[]) => void;
}

export const ServiceQuestionsModal: React.FC<ServiceQuestionsModalProps> = ({
  open,
  onClose,
  service,
  availableAddOns = [],
  onComplete,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const questions = service.questions || [];
  const hasQuestions = questions.length > 0;
  const hasAddOns = availableAddOns.length > 0;

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const toggleAddOn = (addOn: AddOn) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.id === addOn.id);
      if (exists) {
        return prev.filter(a => a.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const validateAnswers = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    questions.forEach(question => {
      if (question.required && !answers[question.id]) {
        newErrors[question.id] = 'This field is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateAnswers()) {
      toast.error('Please answer all required questions');
      return;
    }

    onComplete(answers, selectedAddOns);
    onClose();
  };

  const handleSkip = () => {
    if (questions.some(q => q.required)) {
      toast.error('Please answer all required questions');
      return;
    }
    onComplete({}, []);
    onClose();
  };

  const calculateTotalAddOnPrice = () => {
    return selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
  };

  const calculateTotalAddOnDuration = () => {
    return selectedAddOns.reduce((sum, addOn) => sum + addOn.duration, 0);
  };

  const renderQuestion = (question: ServiceQuestion) => {
    const hasError = !!errors[question.id];

    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id}>
              {question.question}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={question.id}
              placeholder={question.placeholder}
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className={hasError ? 'border-destructive' : ''}
            />
            {hasError && <p className="text-sm text-destructive">{errors[question.id]}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id}>
              {question.question}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={answers[question.id]}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              <SelectTrigger className={hasError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {question.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.priceModifier && option.priceModifier > 0 && (
                      <span className="text-muted-foreground ml-2">+${option.priceModifier}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-sm text-destructive">{errors[question.id]}</p>}
          </div>
        );

      case 'boolean':
        return (
          <div key={question.id} className="flex items-center space-x-2">
            <Checkbox
              id={question.id}
              checked={answers[question.id] || false}
              onCheckedChange={(checked) => handleAnswerChange(question.id, checked)}
            />
            <Label htmlFor={question.id} className="cursor-pointer">
              {question.question}
              {question.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Service</DialogTitle>
          <DialogDescription>
            {service.name} - Help us personalize your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Service Questions */}
          {hasQuestions && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Service Details</h3>
              {questions.map(renderQuestion)}
            </div>
          )}

          {/* Add-ons */}
          {hasAddOns && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Enhance Your Service</h3>
              <p className="text-sm text-muted-foreground">
                Add optional enhancements to make your experience even better
              </p>
              
              <div className="grid gap-3">
                {availableAddOns.map(addOn => {
                  const isSelected = selectedAddOns.some(a => a.id === addOn.id);
                  
                  return (
                    <div
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn)}
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-all
                        ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{addOn.name}</h4>
                            {isSelected && (
                              <Badge variant="default" className="text-xs">Selected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {addOn.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="font-semibold text-primary">
                              +${addOn.price}
                            </span>
                            <span className="text-muted-foreground">
                              +{addOn.duration} min
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAddOn(addOn);
                          }}
                        >
                          {isSelected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedAddOns.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Add-ons Total:</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        +{calculateTotalAddOnDuration()} min
                      </span>
                      <span className="font-semibold text-primary">
                        +${calculateTotalAddOnPrice()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No questions or add-ons */}
          {!hasQuestions && !hasAddOns && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No additional customization needed for this service.</p>
              <p className="text-sm mt-2">Click "Add to Cart" to continue.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {!questions.some(q => q.required) && (hasQuestions || hasAddOns) && (
            <Button variant="outline" onClick={handleSkip}>
              Skip
            </Button>
          )}
          <Button onClick={handleSubmit}>
            Add to Cart
            {selectedAddOns.length > 0 && (
              <span className="ml-2 text-xs">
                (+${calculateTotalAddOnPrice()})
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
