import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface AddOn {
  id: string;
  name: string;
  price: number;
}

interface AddOnBuilderProps {
  addon: AddOn;
  onUpdate: (addon: AddOn) => void;
  onRemove: () => void;
}

export function AddOnBuilder({ addon, onUpdate, onRemove }: AddOnBuilderProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Input
        placeholder="Add-on name (e.g., Paraffin Treatment)"
        value={addon.name}
        onChange={(e) => onUpdate({ ...addon, name: e.target.value })}
        className="flex-1"
      />
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">$</span>
        <Input
          type="number"
          placeholder="Price"
          value={addon.price}
          onChange={(e) => onUpdate({ ...addon, price: parseFloat(e.target.value) || 0 })}
          className="w-28"
        />
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
  );
}
