import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { BookingFormData } from '@/types/booking';
import { Badge } from '@/components/ui/badge';

interface RequiredQuestionsSectionProps {
  formData: Partial<BookingFormData>;
  updateFormData: (data: Partial<BookingFormData>) => void;
}

export const RequiredQuestionsSection = ({ formData, updateFormData }: RequiredQuestionsSectionProps) => {
  // GROUP BOOKING FLOW
  if (formData.isGroup && formData.members) {
    return (
      <div className="py-12">
        <div className="container max-w-6xl mx-auto px-4 space-y-8">
          <h2 className="text-3xl font-bold mb-6">Service Details</h2>
          <p className="text-muted-foreground mb-8">
            Please provide details for each person's service
          </p>
          
          {formData.members.map((member, memberIndex) => {
            const service = member.service;
            if (!service) return null;
            
            const questions = (('questions' in service ? service.questions : []) || []) as Array<{
              id: string;
              question: string;
              type: string;
              required: boolean;
              options: Array<{
                label: string;
                value: string;
                priceModifier: number;
              }>;
            }>;
            
            const availableAddOns = (('addOns' in service ? service.addOns : []) || []) as Array<{
              id: string;
              name: string;
              description?: string;
              price: number;
              duration: number;
            }>;
            
            const memberAnswers = member.answers || {};
            const memberAddOns = member.selectedAddOns || [];
            
            const allQuestionsAnswered = questions.length === 0 || 
              questions.filter(q => q.required).every(q => memberAnswers[q.id]);
            
            return (
              <Card key={memberIndex} className="p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {member.name || `Person ${memberIndex + 1}`}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.name}</p>
                  </div>
                  <Badge variant={allQuestionsAnswered ? "default" : "secondary"}>
                    {allQuestionsAnswered ? "Complete" : "In Progress"}
                  </Badge>
                </div>
                
                {/* Questions for this member */}
                {questions.length > 0 && (
                  <div className="space-y-6 mb-6">
                    {questions.map((question) => (
                      <div key={question.id} className="space-y-3">
                        <Label className="text-base font-medium flex items-center gap-2">
                          {question.question}
                          {question.required && <span className="text-destructive">*</span>}
                        </Label>
                        
                        <RadioGroup
                          value={memberAnswers[question.id]?.answer}
                          onValueChange={(value) => {
                            const option = question.options.find(opt => opt.value === value);
                            if (option) {
                              const updatedMembers = [...formData.members!];
                              updatedMembers[memberIndex] = {
                                ...updatedMembers[memberIndex],
                                answers: {
                                  ...memberAnswers,
                                  [question.id]: { answer: value, priceModifier: option.priceModifier }
                                }
                              };
                              updateFormData({ members: updatedMembers });
                            }
                          }}
                        >
                          <div className="space-y-2">
                            {question.options.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`${memberIndex}-${question.id}-${option.value}`} />
                                <Label 
                                  htmlFor={`${memberIndex}-${question.id}-${option.value}`}
                                  className="flex items-center gap-2 cursor-pointer font-normal"
                                >
                                  {option.label}
                                  {option.priceModifier !== 0 && (
                                    <span className="text-sm text-muted-foreground">
                                      ({option.priceModifier > 0 ? '+' : ''}{option.priceModifier > 0 ? `$${option.priceModifier}` : 'Included'})
                                    </span>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add-ons for this member */}
                {allQuestionsAnswered && availableAddOns.length > 0 && (
                  <div className="space-y-4 pt-6 border-t">
                    <h4 className="font-semibold text-lg">Enhance Your Service</h4>
                    <div className="space-y-3">
                      {availableAddOns.map((addon) => {
                        const isSelected = memberAddOns.some(a => a.id === addon.id);
                        
                        return (
                          <div key={addon.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                              id={`${memberIndex}-addon-${addon.id}`}
                              checked={isSelected}
                              onCheckedChange={() => {
                                const updatedMembers = [...formData.members!];
                                updatedMembers[memberIndex] = {
                                  ...updatedMembers[memberIndex],
                                  selectedAddOns: isSelected
                                    ? memberAddOns.filter(a => a.id !== addon.id)
                                    : [...memberAddOns, addon]
                                };
                                updateFormData({ members: updatedMembers });
                              }}
                            />
                            <Label 
                              htmlFor={`${memberIndex}-addon-${addon.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{addon.name}</div>
                                  {addon.description && (
                                    <div className="text-sm text-muted-foreground mt-1">{addon.description}</div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <div className="font-semibold">${addon.price.toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">{addon.duration} min</div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          
          {/* Continue Button - enabled when ALL members answered required questions */}
          {formData.members.every(member => {
            if (!member.service) return true;
            const questions = (('questions' in member.service ? member.service.questions : []) || []) as Array<{
              id: string;
              required: boolean;
            }>;
            const requiredQuestions = questions.filter(q => q.required);
            return requiredQuestions.length === 0 || requiredQuestions.every(q => member.answers?.[q.id]);
          }) && (
            <div className="flex justify-center mt-8">
              <Button 
                size="lg" 
                className="px-12 h-14 text-lg font-semibold"
                onClick={() => updateFormData({ questionsAnswered: true, readyForTechnician: true })}
              >
                Continue to Technician Assignment
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // SOLO BOOKING FLOW
  const relevantService = formData.service;
  
  if (!relevantService) {
    return null;
  }

  const questions = (('questions' in relevantService ? relevantService.questions : []) || []) as Array<{
    id: string;
    question: string;
    type: string;
    required: boolean;
    options: Array<{
      label: string;
      value: string;
      priceModifier: number;
    }>;
  }>;
  
  const allQuestionsAnswered = questions.length === 0 || 
    questions.every(q => formData.serviceQuestions?.[q.id]);

  const handleAnswerChange = (questionId: string, answer: string, priceModifier: number) => {
    updateFormData({
      serviceQuestions: {
        ...formData.serviceQuestions,
        [questionId]: { answer, priceModifier }
      }
    });
  };

  const handleAddOnToggle = (addOn: any) => {
    const currentAddOns = formData.addOns || [];
    const isSelected = currentAddOns.some(a => a.id === addOn.id);
    
    updateFormData({
      addOns: isSelected
        ? currentAddOns.filter(a => a.id !== addOn.id)
        : [...currentAddOns, addOn]
    });
  };

  const availableAddOns = (('addOns' in relevantService ? relevantService.addOns : []) || []) as Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
  }>;

  const selectedAddOns = formData.addOns || [];

  return (
    <div className="py-12" id="questions-section">
      <div className="container max-w-4xl mx-auto px-4">
        <Card className="p-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-8 text-foreground">Service Details</h2>
          
          {/* Questions Section */}
          {questions.length > 0 ? (
            <div className="space-y-6 mb-8">
              {questions.map((question) => (
                <div key={question.id} className="space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    {question.question}
                    {question.required && <span className="text-destructive">*</span>}
                  </Label>
                  
                  <RadioGroup
                    value={formData.serviceQuestions?.[question.id]?.answer}
                    onValueChange={(value) => {
                      const option = question.options.find(opt => opt.value === value);
                      if (option) {
                        handleAnswerChange(question.id, value, option.priceModifier);
                      }
                    }}
                  >
                    <div className="space-y-2">
                      {question.options.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                          <Label 
                            htmlFor={`${question.id}-${option.value}`}
                            className="flex items-center gap-2 cursor-pointer font-normal"
                          >
                            {option.label}
                            {option.priceModifier !== 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({option.priceModifier > 0 ? '+' : ''}{option.priceModifier > 0 ? `$${option.priceModifier}` : 'Included'})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          ) : null}
          
          {/* Add-ons Section */}
          {allQuestionsAnswered && availableAddOns.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-xl font-semibold">Enhance Your Service</h3>
              <p className="text-sm text-muted-foreground">Optional add-ons to make your experience even better</p>
              
              <div className="space-y-3">
                {availableAddOns.map((addon) => {
                  const isSelected = selectedAddOns.some(a => a.id === addon.id);
                  
                  return (
                    <div key={addon.id} className="flex items-start space-x-3 p-4 rounded-lg hover:bg-muted/50 transition-colors border">
                      <Checkbox
                        id={`addon-${addon.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleAddOnToggle(addon)}
                      />
                      <Label 
                        htmlFor={`addon-${addon.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{addon.name}</div>
                            {addon.description && (
                              <div className="text-sm text-muted-foreground mt-1">{addon.description}</div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold text-lg">${addon.price.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">{addon.duration} min</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Continue Button */}
          {allQuestionsAnswered && (
            <div className="mt-8 flex justify-center">
              <Button 
                size="lg" 
                className="px-12 h-14 text-lg font-semibold"
                onClick={() => updateFormData({ questionsAnswered: true, readyForTechnician: true })}
              >
                Continue to Technician Selection
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
