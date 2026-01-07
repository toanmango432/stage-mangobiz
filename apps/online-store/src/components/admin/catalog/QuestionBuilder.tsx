import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

interface QuestionOption {
  label: string;
  value: string;
  priceModifier: number;
}

interface Question {
  id: string;
  question: string;
  type: 'yes_no' | 'radio' | 'checkbox';
  required: boolean;
  options: QuestionOption[];
}

interface QuestionBuilderProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onRemove: () => void;
}

export function QuestionBuilder({ question, onUpdate, onRemove }: QuestionBuilderProps) {
  const addOption = () => {
    const newOption: QuestionOption = {
      label: '',
      value: '',
      priceModifier: 0,
    };
    onUpdate({
      ...question,
      options: [...question.options, newOption],
    });
  };

  const updateOption = (index: number, field: keyof QuestionOption, value: string | number) => {
    const updatedOptions = [...question.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value,
    };
    onUpdate({
      ...question,
      options: updatedOptions,
    });
  };

  const removeOption = (index: number) => {
    onUpdate({
      ...question,
      options: question.options.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="mb-4">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div>
              <Label>Question Text</Label>
              <Input
                value={question.question}
                onChange={(e) => onUpdate({ ...question, question: e.target.value })}
                placeholder="e.g., Do you require gel removal?"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={question.type}
                  onValueChange={(value: 'yes_no' | 'radio' | 'checkbox') =>
                    onUpdate({ ...question, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes_no">Yes/No</SelectItem>
                    <SelectItem value="radio">Multiple Choice (Single)</SelectItem>
                    <SelectItem value="checkbox">Multiple Choice (Multiple)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-7">
                <Label>Required</Label>
                <Switch
                  checked={question.required}
                  onCheckedChange={(checked) => onUpdate({ ...question, required: checked })}
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Answer Options</Label>
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Label (e.g., Yes)"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (e.g., yes)"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={option.priceModifier}
                        onChange={(e) => updateOption(index, 'priceModifier', parseFloat(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
