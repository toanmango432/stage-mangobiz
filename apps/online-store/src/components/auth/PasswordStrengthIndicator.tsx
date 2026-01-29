import { validatePasswordStrength } from "@/lib/passwordUtils";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  if (!password) return null;

  const { checks, strength } = validatePasswordStrength(password);

  const strengthColors = {
    weak: 'bg-destructive',
    medium: 'bg-orange-500',
    strong: 'bg-green-500',
  };

  const strengthText = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${strengthColors[strength]}`}
            style={{ width: `${(Object.values(checks).filter(Boolean).length / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium">{strengthText[strength]}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <div className={`flex items-center gap-1 ${checks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>8+ characters</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Uppercase letter</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Lowercase letter</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Number</span>
        </div>
        <div className={`flex items-center gap-1 ${checks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
          {checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          <span>Special character</span>
        </div>
      </div>
    </div>
  );
};
