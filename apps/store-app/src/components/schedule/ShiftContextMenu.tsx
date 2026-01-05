import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Edit, X } from "lucide-react";

interface ShiftContextMenuProps {
  children: React.ReactNode;
  onEditDay: () => void;
  onEditRegular: () => void;
  onSetOffDay: () => void;
  staffName: string;
  day: string;
}

export function ShiftContextMenu({ 
  children, 
  onEditDay, 
  onEditRegular, 
  onSetOffDay, 
  staffName, 
  day 
}: ShiftContextMenuProps) {
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
        <DropdownMenuItem onClick={onSetOffDay} className="gap-2 text-destructive focus:text-destructive">
          <X className="w-4 h-4" />
          Set Off Day
          <span className="ml-auto text-xs text-muted-foreground opacity-70">{day}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}