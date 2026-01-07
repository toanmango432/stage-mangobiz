import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, addDays } from "date-fns";

interface StaffMember {
  id: string;
  name: string;
}

interface StaffScheduleCalendarProps {
  staff: StaffMember[];
}

export function StaffScheduleCalendar({ staff }: StaffScheduleCalendarProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 9 PM

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="font-semibold text-sm">Staff</div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="text-center">
                  <div className="font-semibold text-sm">{format(day, 'EEE')}</div>
                  <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
                </div>
              ))}
            </div>

            {/* Staff Rows */}
            {staff.map((member) => (
              <div key={member.id} className="grid grid-cols-8 gap-2 mb-2">
                <div className="font-medium text-sm flex items-center">{member.name}</div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="border rounded p-2 min-h-[80px] bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">9:00 AM</Badge>
                      <Badge variant="outline" className="text-xs">Available</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Working</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Break</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded"></div>
            <span>Off</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
