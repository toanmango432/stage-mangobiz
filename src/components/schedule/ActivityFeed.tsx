import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity,
  Clock,
  Calendar,
  Users,
  Edit3,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ScheduleActivity {
  id: string;
  type: "schedule_update" | "shift_added" | "shift_removed" | "time_off" | "staff_added";
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    initials: string;
    avatar?: string;
  };
  target?: {
    staff: string;
    day?: string;
    time?: string;
  };
  severity: "info" | "success" | "warning" | "error";
}

interface ActivityFeedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activities: ScheduleActivity[];
}

const activityIcons = {
  schedule_update: Edit3,
  shift_added: Plus,
  shift_removed: Trash2,
  time_off: Calendar,
  staff_added: Users
};

const severityColors = {
  info: "text-blue-500 bg-blue-50 dark:bg-blue-950",
  success: "text-green-500 bg-green-50 dark:bg-green-950", 
  warning: "text-amber-500 bg-amber-50 dark:bg-amber-950",
  error: "text-red-500 bg-red-50 dark:bg-red-950"
};

const activityColors = {
  schedule_update: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  shift_added: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  shift_removed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  time_off: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  staff_added: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300"
};

export function ActivityFeed({ open, onOpenChange, activities }: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredActivities = activities.filter(activity => 
    filter === "all" || activity.type === filter
  );

  const getTimeGroup = (timestamp: Date) => {
    const now = new Date();
    const diffHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return "Today";
    if (diffHours < 48) return "Yesterday";
    if (diffHours < 168) return "This week";
    return "Earlier";
  };

  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const group = getTimeGroup(activity.timestamp);
    if (!groups[group]) groups[group] = [];
    groups[group].push(activity);
    return groups;
  }, {} as Record<string, ScheduleActivity[]>);

  const timeOrder = ["Just now", "Today", "Yesterday", "This week", "Earlier"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-2xl flex flex-col">
        <SheetHeader className="flex-shrink-0 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl font-semibold">
            <Activity className="w-5 h-5" />
            Recent Activity
          </SheetTitle>
        </SheetHeader>

        {/* Filter Buttons */}
        <div className="flex-shrink-0 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("all")}
              className="h-8"
            >
              All
            </Button>
            <Button 
              variant={filter === "schedule_update" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("schedule_update")}
              className="h-8"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              Updates
            </Button>
            <Button 
              variant={filter === "shift_added" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("shift_added")}
              className="h-8"
            >
              <Plus className="w-3 h-3 mr-1" />
              Added
            </Button>
            <Button 
              variant={filter === "time_off" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("time_off")}
              className="h-8"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Time Off
            </Button>
          </div>
        </div>

        {/* Activity Timeline */}
        <ScrollArea className="flex-1 mt-6">
          <div className="space-y-6 pr-4">
            {timeOrder.map(timeGroup => {
              const groupActivities = groupedActivities[timeGroup];
              if (!groupActivities?.length) return null;

              return (
                <div key={timeGroup} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-muted-foreground">{timeGroup}</h3>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {groupActivities.map((activity, index) => {
                      const IconComponent = activityIcons[activity.type];
                      const isLast = index === groupActivities.length - 1;
                      
                      return (
                        <div key={activity.id} className="relative flex gap-4 group">
                          {/* Timeline line */}
                          <div className="relative flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full border-2 border-background flex items-center justify-center ${severityColors[activity.severity]} shrink-0`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            {!isLast && <div className="w-0.5 h-8 bg-border mt-2"></div>}
                          </div>
                          
                          {/* Activity Card */}
                          <div className="flex-1 min-w-0 bg-card border rounded-lg p-4 group-hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{activity.title}</h4>
                                  <Badge variant="secondary" className={`text-xs ${activityColors[activity.type]}`}>
                                    {activity.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                                
                                {/* Target Info */}
                                {activity.target && (
                                  <div className="flex items-center gap-3 mt-2 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span className="font-medium">{activity.target.staff}</span>
                                    </div>
                                    {activity.target.day && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{activity.target.day}</span>
                                      </div>
                                    )}
                                    {activity.target.time && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{activity.target.time}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <time className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                              </time>
                            </div>
                            
                            {/* User Info */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={activity.user.avatar} />
                                <AvatarFallback className="text-xs">{activity.user.initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">by {activity.user.name}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {filteredActivities.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">No Activities</h4>
                <p className="text-sm text-muted-foreground">
                  {filter === "all" 
                    ? "No recent activity to display"
                    : `No ${filter.replace('_', ' ')} activities found`
                  }
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}