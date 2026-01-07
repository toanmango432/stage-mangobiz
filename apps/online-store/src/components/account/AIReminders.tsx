import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Star, Gift, TrendingUp } from "lucide-react";
import { fetchAIReminders } from "@/lib/api/ai";
import { AIReminder } from "@/types/ai";
import { usePersonalization } from "@/hooks/usePersonalization";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function AIReminders() {
  const [reminders, setReminders] = useState<AIReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = usePersonalization();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadReminders() {
      setIsLoading(true);
      try {
        const results = await fetchAIReminders(profile.userId);
        setReminders(results);
      } catch (error) {
        console.error('Failed to load AI reminders:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReminders();
  }, [profile.userId]);

  const getIcon = (type: AIReminder['type']) => {
    switch (type) {
      case 'rebooking':
        return Calendar;
      case 'anniversary':
        return Star;
      case 'promotion':
        return Gift;
      case 'milestone':
        return TrendingUp;
      default:
        return Calendar;
    }
  };

  const getPriorityColor = (priority: AIReminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => {
        const Icon = getIcon(reminder.type);
        
        return (
          <Card key={reminder.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-start gap-4 p-4">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold">{reminder.title}</h3>
                    <Badge variant={getPriorityColor(reminder.priority)} className="text-xs">
                      {reminder.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    {reminder.message}
                  </p>
                  
                  <Button
                    onClick={() => navigate(reminder.actionUrl)}
                    size="sm"
                  >
                    {reminder.actionLabel}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
