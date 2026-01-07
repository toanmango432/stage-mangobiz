import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { getGiftCardImage } from "@/lib/images";

interface GiftCardDesignSelectorProps {
  value: string;
  onChange: (designId: string) => void;
  designs: Array<{
    id: string;
    name: string;
    previewUrl?: string;
    description?: string;
  }>;
}

export const GiftCardDesignSelector = ({ value, onChange, designs }: GiftCardDesignSelectorProps) => {
  if (!designs || designs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Choose Design</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {designs.map((design) => (
            <label
              key={design.id}
              className={cn(
                "relative cursor-pointer group",
                value === design.id && "ring-2 ring-primary rounded-lg"
              )}
            >
              <Card className="overflow-hidden">
                <img
                  src={getGiftCardImage(design.id)}
                  alt={design.name}
                  className="w-full aspect-video object-cover"
                />
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={design.id} id={design.id} />
                    <span className="text-sm font-medium">{design.name}</span>
                  </div>
                </div>
              </Card>
            </label>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};
