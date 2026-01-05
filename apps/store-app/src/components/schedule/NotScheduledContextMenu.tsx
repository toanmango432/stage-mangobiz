import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Edit } from "lucide-react";

interface NotScheduledContextMenuProps {
  children: React.ReactNode;
  onAddDaySchedule: () => void;
  onEditRegular: () => void;
  staffName: string;
  day: string;
}

export function NotScheduledContextMenu({ 
  children, 
  onAddDaySchedule, 
  onEditRegular, 
  staffName, 
  day 
}: NotScheduledContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onClick={onAddDaySchedule} className="gap-2">
          <Calendar className="w-4 h-4" />
          Add Day Schedule
          <span className="ml-auto text-xs text-muted-foreground">{day}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEditRegular} className="gap-2">
          <Edit className="w-4 h-4" />
          Edit Regular Schedule
          <span className="ml-auto text-xs text-muted-foreground">{staffName}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}