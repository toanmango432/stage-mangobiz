import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Edit, Trash2 } from "lucide-react";

interface OffCellContextMenuProps {
  children: React.ReactNode;
  onEditDay: () => void;
  onEditRegular: () => void;
  onRemoveOffDay: () => void;
  staffName: string;
  day: string;
  reason?: string;
}

export function OffCellContextMenu({ 
  children, 
  onEditDay, 
  onEditRegular, 
  onRemoveOffDay, 
  staffName, 
  day,
  reason
}: OffCellContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={onEditDay} className="gap-2">
          <Calendar className="w-4 h-4" />
          Edit Day Schedule
          <span className="ml-auto text-xs text-muted-foreground">{day}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEditRegular} className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Regular Schedule
          <span className="ml-auto text-xs text-muted-foreground">{staffName}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onRemoveOffDay} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4" />
          Remove Off Day
          <span className="ml-auto text-xs text-muted-foreground opacity-70">{reason || 'Off'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}