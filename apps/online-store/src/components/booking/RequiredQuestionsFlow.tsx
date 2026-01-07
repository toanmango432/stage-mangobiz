import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Question } from '@/lib/services/bookingDataService';
import { ArrowLeft, ArrowRight, SkipForward, CheckCircle } from 'lucide-react';

interface RequiredQuestionsFlowProps {
  questions: Question[];
  answers: Record<string, any>;
  onAnswersChange: (answers: Record<string, any>) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export const RequiredQuestionsFlow = ({
  questions,
  answers,
  onAnswersChange,
  onComplete,
  onSkip,
}: RequiredQuestionsFlowProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const requiredQuestions = questions.filter(q => q.required);
  const currentQuestion = requiredQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / requiredQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === requiredQuestions.length - 1;

  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    onAnswersChange(newAnswers);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    
    const answer = answers[currentQuestion.id];
    if (currentQuestion.required && !answer) return false;
    
    return true;
  };

  const renderQuestionInput = (question: Question) => {
    const value = answers[question.id];
    
    switch (question.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={question.id}>{question.text}</Label>
            <Textarea
              id={question.id}
              value={value || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Please provide details..."
              rows={3}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            <Label>{question.text}</Label>
            <RadioGroup
              value={value || ''}
              onValueChange={(val) => handleAnswerChange(question.id, val)}
              className="space-y-2"
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label 
                    htmlFor={`${question.id}-${index}`}
                    className="flex-1 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'yes_no':
        return (
          <div className="space-y-3">
            <Label className="text-base font-medium">{question.text}</Label>
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`} className="text-lg">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`} className="text-lg">
                  No
                </Label>
              </div>
            </div>
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <Label className="text-base font-medium">{question.text}</Label>
            <div className="px-4">
              <Slider
                value={[value || 5]}
                onValueChange={([val]) => handleAnswerChange(question.id, val)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>1</span>
                <span className="text-lg font-semibold text-primary">
                  {value || 5}
                </span>
                <span>10</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={question.id}>{question.text}</Label>
            <Input
              id={question.id}
              value={value || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Your answer..."
            />
          </div>
        );
    }
  };

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Questions Required</h3>
          <p className="text-muted-foreground mb-4">
            This service doesn't require any additional information.
          </p>
          <Button onClick={onComplete} className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isMobile && !showAllQuestions) {
    // Mobile: One question at a time
    return (
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Question {currentQuestionIndex + 1} of {requiredQuestions.length}</span>
            <span className="text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Question */}
        <Card>
          <CardContent className="p-6">
            {renderQuestionInput(currentQuestion)}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              {isLastQuestion ? 'Complete' : 'Next'}
              {!isLastQuestion && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: All questions at once
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Questions</h3>
          <p className="text-sm text-muted-foreground">
            Please answer these questions to help us provide the best service
          </p>
        </div>
        <Badge variant="outline">
          {requiredQuestions.length} questions
        </Badge>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {requiredQuestions.map((question, index) => (
          <Card key={question.id} className="transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  {renderQuestionInput(question)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="text-muted-foreground"
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Skip Questions
        </Button>
        
        <Button
          onClick={onComplete}
          className="px-8"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Questions
        </Button>
      </div>
    </div>
  );
};



