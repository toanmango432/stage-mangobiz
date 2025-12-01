import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { TimeOffRequest } from "./types";

interface ReviewRequestsProps {
  requests: TimeOffRequest[];
  onUpdateRequest: (id: string, updates: Partial<TimeOffRequest>) => void;
  isManager: boolean;
}

export function ReviewRequests({ requests, onUpdateRequest, isManager }: ReviewRequestsProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const handleApprove = (requestId: string) => {
    onUpdateRequest(requestId, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewedBy: "current-manager-id",
      reviewNotes: reviewNotes.trim() || undefined
    });
    setSelectedRequest(null);
    setReviewNotes("");
  };

  const handleDecline = (requestId: string) => {
    onUpdateRequest(requestId, {
      status: "declined",
      reviewedAt: new Date().toISOString(),
      reviewedBy: "current-manager-id",
      reviewNotes: reviewNotes.trim() || "Request declined"
    });
    setSelectedRequest(null);
    setReviewNotes("");
  };

  if (!isManager) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to review requests.</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No pending requests to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
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
                    Submitted {format(new Date(request.submittedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {request.shiftType === "full" ? "Full Day" : "Partial Day"}
              </Badge>
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

            {selectedRequest === request.id && (
              <div className="mt-4 space-y-3 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor={`notes-${request.id}`}>Review Notes (Optional)</Label>
                  <Textarea
                    id={`notes-${request.id}`}
                    placeholder="Add any notes about this decision..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            {selectedRequest === request.id ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setReviewNotes("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDecline(request.id)}
                  className="flex-1"
                >
                  Decline
                </Button>
                <Button
                  onClick={() => handleApprove(request.id)}
                  className="flex-1"
                >
                  Approve
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(request.id)}
                className="w-full"
              >
                Review Request
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}