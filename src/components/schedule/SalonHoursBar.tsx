import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Edit } from "lucide-react";
import { SalonHoursModal, type SalonHours, type SpecialDay } from "./SalonHoursModal";
import { toast } from "@/hooks/use-toast";

interface SalonHoursBarProps {
  onMarkAllStaffOff?: (date: string, reason: string) => void;
}

export function SalonHoursBar({ onMarkAllStaffOff }: SalonHoursBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Mock salon hours data - in a real app this would come from props/context
  const [salonHours, setSalonHours] = useState<SalonHours>({
    MON: { start: "9:30a", end: "7p", closed: false },
    TUE: { start: "9:30a", end: "7p", closed: false },
    WED: { start: "9:30a", end: "7p", closed: false },
    THU: { start: "9:30a", end: "7p", closed: false },
    FRI: { start: "9:30a", end: "7p", closed: false },
    SAT: { start: "9:30a", end: "7p", closed: false },
    SUN: { start: "9:30a", end: "7p", closed: false },
  });
  
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);

  const getSalonHoursDisplay = () => {
    const openDays = Object.keys(salonHours).filter(day => !salonHours[day].closed);
    if (openDays.length === 7) {
      const firstDay = salonHours[openDays[0]];
      const allSameHours = openDays.every(day => 
        salonHours[day]?.start === firstDay?.start && 
        salonHours[day]?.end === firstDay?.end
      );
      if (allSameHours) {
        return `Mon–Sun: ${firstDay?.start}–${firstDay?.end}`;
      }
    }
    return `${openDays.length} days open`;
  };

  const handleSalonHoursUpdate = (newHours: SalonHours) => {
    setSalonHours(newHours);
    // In a real app, save to backend
    toast({
      title: "Salon Hours Updated",
      description: "Operating hours have been saved successfully.",
    });
  };

  const handleSpecialDayUpdate = (newSpecialDays: SpecialDay[]) => {
    setSpecialDays(newSpecialDays);
    // In a real app, save to backend
  };

  const handleMarkAllStaffOff = (date: string, reason: string) => {
    if (onMarkAllStaffOff) {
      onMarkAllStaffOff(date, reason);
    }
  };

  return (
    <>
      <div className="bg-muted/30 border border-border/50 rounded-xl px-3 sm:px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
          <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">Salon Hours:</span>
          <span className="text-xs sm:text-sm text-muted-foreground truncate">{getSalonHoursDisplay()}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 w-7 sm:h-6 sm:w-6 p-0 hover:bg-muted/50 apple-transition rounded-lg flex-shrink-0 ml-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Edit className="w-3 h-3" />
        </Button>
      </div>

      <SalonHoursModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        salonHours={salonHours}
        specialDays={specialDays}
        onSalonHoursUpdate={handleSalonHoursUpdate}
        onSpecialDayUpdate={handleSpecialDayUpdate}
        onMarkAllStaffOff={handleMarkAllStaffOff}
      />
    </>
  );
}