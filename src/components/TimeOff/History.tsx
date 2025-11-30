import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarIcon, Clock, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { TimeOffRequest } from "./types";

interface HistoryProps {
  requests: TimeOffRequest[];
  currentUser?: {
    id: string;
    name: string;
    role: "manager" | "staff";
  };
}

export function History({ requests, currentUser }: HistoryProps) {
  const sortedRequests = [...requests].sort((a, b) => 
    new Date(b.reviewedAt || b.submittedAt).getTime() - new Date(a.reviewedAt || a.submittedAt).getTime()
  );

  if (sortedRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No time off history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedRequests.map((request) => (
        <Card key={request.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {request.staffName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{request.staffName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {request.reviewedAt 
                      ? `Reviewed ${format(new Date(request.reviewedAt), "MMM d, yyyy")}`
                      : `Submitted ${format(new Date(request.submittedAt), "MMM d, yyyy")}`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={request.status === "approved" ? "default" : "destructive"}
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
                <Badge variant="secondary">
                  {request.shiftType === "full" ? "Full Day" : "Partial Day"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span>
                {format(new Date(request.date), "EEEE, MMM d, yyyy")}
                {request.endDate && (
                  <span> - {format(new Date(request.endDate), "EEEE, MMM d, yyyy")}</span>
                )}
              </span>
            </div>

            {request.reason && (
              <div className="text-sm">
                <span className="font-medium">Reason: </span>
                <span className="text-muted-foreground">{request.reason}</span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className={request.payrollImpact ? "text-orange-600" : "text-green-600"}>
                  {request.payrollImpact ? "Affects Payroll" : "No Payroll Impact"}
                </span>
              </div>
            </div>

            {request.reviewNotes && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Review Notes:</p>
                    <p className="text-sm text-muted-foreground">{request.reviewNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}