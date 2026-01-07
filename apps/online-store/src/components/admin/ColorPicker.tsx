import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

export const ColorPicker = ({ label, value, onChange, description }: ColorPickerProps) => {
  const [h, s, l] = value.split(" ").map((v) => parseFloat(v.replace("%", "")));
  const hexColor = hslToHex(h, s, l);

  const handleHexChange = (hex: string) => {
    const hsl = hexToHSL(hex);
    onChange(hsl);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-12 h-12 rounded-lg border-2 border-border shadow-sm hover:scale-105 transition-transform"
              style={{ backgroundColor: hexColor }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-4">
              <div>
                <Label>Hex Color</Label>
                <Input
                  type="text"
                  value={hexColor}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#000000"
                />
              </div>
              <div>
                <Label>HSL: {value}</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">H</Label>
                    <Input
                      type="number"
                      min="0"
                      max="360"
                      value={h}
                      onChange={(e) => onChange(`${e.target.value} ${s}% ${l}%`)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">S</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={s}
                      onChange={(e) => onChange(`${h} ${e.target.value}% ${l}%`)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">L</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={l}
                      onChange={(e) => onChange(`${h} ${s}% ${e.target.value}%`)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex-1">
          <Input
            type="text"
            value={hexColor}
            onChange={(e) => handleHexChange(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>
    </div>
  );
};

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
